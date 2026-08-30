#!/bin/bash
set -euxo pipefail

# 1. Update and install packages
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get upgrade -y
apt-get install -y ca-certificates curl gnupg lsb-release nginx certbot python3-certbot-nginx git jq ufw build-essential

# 2. Swap space setup (4GB)
if [ ! -f /swapfile ]; then
    fallocate -l 4G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=4096
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    echo "vm.swappiness=10" >> /etc/sysctl.conf
    sysctl -p
fi

# 3. Docker CE Installation (ARM64)
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
usermod -aG docker ubuntu

# 4. Clone repo in /opt/resumebuddy
mkdir -p /opt/resumebuddy
cd /opt/resumebuddy
if [ ! -d "/opt/resumebuddy/.git" ]; then
    git clone https://github.com/Rajeevkavala/Resume-Buddy_v3.git /opt/resumebuddy
fi
chown -R ubuntu:ubuntu /opt/resumebuddy

# 5. Environment configuration
cat << 'EOF' > /opt/resumebuddy/.env.backend
NODE_ENV=production
PORT=3001
REDIS_URL="rediss://default:YOUR_UPSTASH_REDIS_PASSWORD@YOUR_UPSTASH_HOST:6379"
NEXT_PUBLIC_APP_URL="https://www.resume-buddy.tech"
ALLOWED_ORIGINS="https://www.resume-buddy.tech,https://resume-buddy.tech,https://resume-buddy-v3.vercel.app"
JWT_SECRET="YOUR_STRONG_RANDOM_JWT_SECRET_AT_LEAST_32_CHARS"
EOF

# 6. Docker Compose File
cat << 'EOF' > /opt/resumebuddy/docker-compose.yml
version: '3.9'

services:
  latex:
    build:
      context: ./services/resume-latex-service
      dockerfile: Dockerfile
    container_name: resumebuddy-latex
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - PORT=8080
      - HOST=0.0.0.0
      - NODE_OPTIONS=--max-old-space-size=384
      - ALLOWED_ORIGINS=https://www.resume-buddy.tech,https://resume-buddy.tech,https://resume-buddy-v3.vercel.app
      - LOG_LEVEL=warn
    ports:
      - "127.0.0.1:8080:8080"
    deploy:
      resources:
        limits:
          memory: 500M
          cpus: "1.2"
        reservations:
          memory: 120M
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:8080/healthz || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - resumebuddy-backend

  websocket:
    build:
      context: ./apps/websocket
      dockerfile: Dockerfile
    container_name: resumebuddy-ws
    restart: unless-stopped
    env_file: .env.backend
    environment:
      - NODE_ENV=production
      - PORT=3001
      - NODE_OPTIONS=--max-old-space-size=256
    ports:
      - "127.0.0.1:3001:3001"
    deploy:
      resources:
        limits:
          memory: 300M
          cpus: "0.8"
        reservations:
          memory: 100M
    networks:
      - resumebuddy-backend

networks:
  resumebuddy-backend:
    driver: bridge
EOF

# 7. Nginx Configuration
cat << 'EOF' > /etc/nginx/sites-available/resume-buddy-api.conf
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=30r/s;

server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name api.resume-buddy.tech _;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # LaTeX PDF Compilation Microservice
    location /api/compile {
        limit_req zone=api_limit burst=15 nodelay;

        add_header Access-Control-Allow-Origin * always;
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type, Accept, Origin, X-Requested-With" always;
        add_header Access-Control-Allow-Credentials "true" always;

        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin * always;
            add_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always;
            add_header Access-Control-Allow-Headers "Authorization, Content-Type, Accept, Origin, X-Requested-With" always;
            add_header Access-Control-Max-Age 86400;
            add_header Content-Length 0;
            add_header Content-Type text/plain;
            return 204;
        }

        proxy_pass http://127.0.0.1:8080/compile;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 90s;
    }

    location /healthz {
        proxy_pass http://127.0.0.1:8080/healthz;
    }

    # Socket.io Realtime WebSocket
    location /socket.io/ {
        add_header Access-Control-Allow-Origin * always;
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type, Accept, Origin, X-Requested-With" always;
        add_header Access-Control-Allow-Credentials "true" always;

        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin * always;
            add_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always;
            add_header Access-Control-Allow-Headers "Authorization, Content-Type, Accept, Origin, X-Requested-With" always;
            return 204;
        }

        proxy_pass http://127.0.0.1:3001/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
        proxy_buffering off;
    }

    location / {
        return 200 '{"status":"online","service":"ResumeBuddy AWS Graviton Microservices (LaTeX + WS)"}';
        add_header Content-Type application/json;
    }
}
EOF

ln -sf /etc/nginx/sites-available/resume-buddy-api.conf /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx

# 8. Build & Start Docker containers
cd /opt/resumebuddy
docker compose build --parallel
docker compose up -d

# 9. Create Auto-Healing Systemd Service
cat << 'EOF' > /etc/systemd/system/resumebuddy.service
[Unit]
Description=ResumeBuddy AWS Backend Microservices
Requires=docker.service
After=docker.service network.target

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/resumebuddy
ExecStart=/usr/bin/docker compose -f /opt/resumebuddy/docker-compose.yml up -d
ExecStop=/usr/bin/docker compose -f /opt/resumebuddy/docker-compose.yml down
TimeoutStartSec=0
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable resumebuddy
echo "=== RESUMEBUDDY BOOTSTRAP COMPLETE ==="
