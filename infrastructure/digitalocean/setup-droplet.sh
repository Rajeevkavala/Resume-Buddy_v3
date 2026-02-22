#!/usr/bin/env bash
# ============================================================
# DigitalOcean Droplet — One-time Bootstrap Script
# ResumeBuddy Infrastructure: LaTeX Service + MinIO
# ============================================================
# Run as root (or with sudo) on a fresh Ubuntu 22.04 / 24.04 droplet:
#   curl -fsSL https://raw.githubusercontent.com/YOUR_ORG/Resume-Buddy_v3/main/infrastructure/digitalocean/setup-droplet.sh | bash
# ============================================================
set -euo pipefail
IFS=$'\n\t'

# ── Colors ───────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()    { echo -e "${GREEN}[INFO]${NC} $*"; }
warning() { echo -e "${YELLOW}[WARN]${NC} $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

# ── Require root ─────────────────────────────────────────────
[[ $EUID -ne 0 ]] && error "Run this script as root (sudo)"

# ── System update ────────────────────────────────────────────
info "Updating system packages..."
apt-get update -y -qq
apt-get upgrade -y -qq
apt-get install -y -qq \
  curl git unzip jq ufw fail2ban \
  ca-certificates gnupg lsb-release

# ── Docker ───────────────────────────────────────────────────
info "Installing Docker..."
if ! command -v docker &>/dev/null; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
    | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
    https://download.docker.com/linux/ubuntu \
    $(lsb_release -cs) stable" \
    | tee /etc/apt/sources.list.d/docker.list > /dev/null
  apt-get update -y -qq
  apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  systemctl enable --now docker
  info "Docker installed: $(docker --version)"
else
  info "Docker already installed: $(docker --version)"
fi

# ── doctl (DigitalOcean CLI) ─────────────────────────────────
info "Installing doctl..."
if ! command -v doctl &>/dev/null; then
  DOCTL_VER=$(curl -s https://api.github.com/repos/digitalocean/doctl/releases/latest \
    | jq -r '.tag_name' | sed 's/v//')
  curl -sL "https://github.com/digitalocean/doctl/releases/download/v${DOCTL_VER}/doctl-${DOCTL_VER}-linux-amd64.tar.gz" \
    | tar -xzv -C /usr/local/bin
  chmod +x /usr/local/bin/doctl
  info "doctl installed: $(doctl version)"
fi

# ── Deploy directories ───────────────────────────────────────
info "Creating directories..."
mkdir -p /opt/resumebuddy/{minio-data,logs,backups}
chmod 755 /opt/resumebuddy

# ── UFW firewall rules ────────────────────────────────────────
info "Configuring firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing

# Allow SSH
ufw allow 22/tcp comment 'SSH'

# LaTeX service (restrict to known IPs — add Vercel IPs)
ufw allow 8080/tcp comment 'LaTeX service'

# MinIO API (restrict: only allow from Vercel IPs in production)
ufw allow 9000/tcp comment 'MinIO S3 API'

# MinIO console (restrict to your IP)
# ufw allow from YOUR_IP to any port 9001 comment 'MinIO console'

ufw --force enable
info "UFW status:"
ufw status verbose

# ── fail2ban (SSH brute force protection) ────────────────────
info "Enabling fail2ban..."
systemctl enable --now fail2ban

# ── Automatic security updates ────────────────────────────────
info "Configuring unattended security upgrades..."
apt-get install -y -qq unattended-upgrades
dpkg-reconfigure --priority=low unattended-upgrades <<< $'2\n'

# ── Nginx reverse proxy (optional – adds /health endpoint) ───
#info "Installing Nginx..."
#apt-get install -y -qq nginx certbot python3-certbot-nginx

# ── System tuning for containers ─────────────────────────────
info "Applying kernel tuning..."
cat >> /etc/sysctl.conf <<'EOF'

# ResumeBuddy tuning
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 65535
net.ipv4.ip_local_port_range = 1024 65535
fs.file-max = 1000000
vm.swappiness = 10
EOF
sysctl -p > /dev/null

# Increase file descriptor limits
cat >> /etc/security/limits.conf <<'EOF'
* soft nofile 65535
* hard nofile 65535
EOF

# ── Swap (for 2GB droplets) ──────────────────────────────────
if [ ! -f /swapfile ]; then
  info "Creating 2GB swap..."
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# ── Docker cleanup cron ───────────────────────────────────────
info "Adding Docker cleanup cron job..."
cat > /etc/cron.weekly/docker-cleanup <<'EOF'
#!/bin/bash
docker system prune -af --volumes --filter "until=168h" >> /var/log/docker-cleanup.log 2>&1
EOF
chmod +x /etc/cron.weekly/docker-cleanup

# ── GitHub Actions runner compatibility check ─────────────────
info "Verifying Docker Compose v2..."
docker compose version || error "docker compose v2 not available"

echo ""
info "════════════════════════════════════════════════════"
info "✅  Droplet bootstrap complete!"
info ""
info "Next steps:"
info "  1. Authenticate doctl: doctl auth init"
info "  2. Authenticate docker with DO registry:"
info "       doctl registry login"
info "  3. Start MinIO:"
info "       cd /opt/resumebuddy"
info "       docker compose -f minio-compose.yml up -d"
info "  4. Add your SSH public key to GitHub Secrets:"
info "       DO_SSH_PRIVATE_KEY"
info "════════════════════════════════════════════════════"
