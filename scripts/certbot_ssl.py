import subprocess, time, os

ec2_host = os.getenv("PROBE_TARGET_EC2_HOST", os.getenv("EC2_HOST", "13.207.140.19"))
acme_email = os.getenv("ACME_EMAIL", "resumebuddy0@gmail.com")

def run_ssh(cmd):
    p = subprocess.run(
        ['ssh.exe', '-o', 'StrictHostKeyChecking=no', '-i', 'resumebuddy-key.pem', f'ubuntu@{ec2_host}', cmd],
        capture_output=True,
        text=True
    )
    return p.stdout, p.stderr, p.returncode

print(f"Checking Certbot SSL certificate issuance on AWS EC2 ({ec2_host})...")

certbot_cmd = (
    "sudo certbot certonly --nginx -d api.resume-buddy.tech "
    f"--email {acme_email} --agree-tos --non-interactive"
)

stdout, stderr, code = run_ssh(certbot_cmd)
print("Certbot Return Code:", code)
print("STDOUT:\n", stdout)
if stderr:
    print("STDERR:\n", stderr)

if code == 0:
    print("Certificate successfully issued! Configuring HTTPS Nginx...")
    nginx_ssl_conf = """
cat << 'EOF' | sudo tee /etc/nginx/sites-available/resume-buddy-api.conf
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=30r/s;

# 1. HTTP -> HTTPS Redirect
server {
    listen 80;
    listen [::]:80;
    server_name api.resume-buddy.tech;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        return 301 https://api.resume-buddy.tech$request_uri;
    }
}

# 2. Main Production Backend API & WebSocket Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.resume-buddy.tech;

    ssl_certificate /etc/letsencrypt/live/api.resume-buddy.tech/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.resume-buddy.tech/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;

    # CORS Whitelist for Vercel Frontend
    set $cors_origin "";
    if ($http_origin ~* "^https:\\/\\/(www\\.)?resume-buddy\\.tech$|^https:\\/\\/resume-buddy-v3\\.vercel\\.app$") {
        set $cors_origin $http_origin;
    }

    add_header Access-Control-Allow-Origin $cors_origin always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Authorization, Content-Type, Accept, Origin, X-Requested-With" always;
    add_header Access-Control-Allow-Credentials "true" always;

    client_max_body_size 25M;

    # LaTeX PDF Compilation Service (v1 APIs)
    location /v1/ {
        limit_req zone=api_limit burst=15 nodelay;

        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin $cors_origin always;
            add_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always;
            add_header Access-Control-Allow-Headers "Authorization, Content-Type, Accept, Origin, X-Requested-With" always;
            add_header Access-Control-Allow-Credentials "true" always;
            add_header Access-Control-Max-Age 86400;
            add_header Content-Length 0;
            add_header Content-Type text/plain;
            return 204;
        }

        proxy_pass http://127.0.0.1:8080/v1/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
    }

    # Legacy /api/compile alias
    location /api/compile {
        proxy_pass http://127.0.0.1:8080/v1/resume/latex/compile;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
    }

    # Health & Metrics
    location /healthz {
        proxy_pass http://127.0.0.1:8080/healthz;
    }

    location /readyz {
        proxy_pass http://127.0.0.1:8080/readyz;
    }

    location /metrics {
        proxy_pass http://127.0.0.1:8080/metrics;
    }

    # Socket.io Realtime WebSocket
    location /socket.io/ {
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin $cors_origin always;
            add_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always;
            add_header Access-Control-Allow-Headers "Authorization, Content-Type, Accept, Origin, X-Requested-With" always;
            add_header Access-Control-Allow-Credentials "true" always;
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
sudo nginx -t && sudo systemctl reload nginx
"""
    out, err, c = run_ssh(nginx_ssl_conf)
    print("Nginx Reload Output:\n", out)
    if err:
        print("Nginx Reload Error:\n", err)
