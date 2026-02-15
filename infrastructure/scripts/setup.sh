#!/bin/bash
# ============================================================
# ResumeBuddy 2.0 - Local Development Setup Script
# ============================================================
# Usage: bash infrastructure/scripts/setup.sh
# ============================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════╗"
echo "║   ResumeBuddy 2.0 - Infrastructure Setup        ║"
echo "╚══════════════════════════════════════════════════╝"
echo -e "${NC}"

# ---- Check Prerequisites ----
echo -e "${YELLOW}[1/6] Checking prerequisites...${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed.${NC}"
    echo "Install Docker: https://docs.docker.com/get-docker/"
    exit 1
fi
echo -e "  ${GREEN}✓ Docker found: $(docker --version)${NC}"

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}Error: Docker Compose is not installed.${NC}"
    echo "Install Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi
echo -e "  ${GREEN}✓ Docker Compose found${NC}"

# Determine compose command
if docker compose version &> /dev/null 2>&1; then
    COMPOSE_CMD="docker compose"
else
    COMPOSE_CMD="docker-compose"
fi

# ---- Create .env if not exists ----
echo -e "${YELLOW}[2/6] Setting up environment variables...${NC}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
DOCKER_DIR="$ROOT_DIR/infrastructure/docker"

if [ ! -f "$DOCKER_DIR/.env" ]; then
    if [ -f "$ROOT_DIR/.env.template" ]; then
        cp "$ROOT_DIR/.env.template" "$DOCKER_DIR/.env"
        echo -e "  ${GREEN}✓ Created .env from template${NC}"
        echo -e "  ${YELLOW}⚠ Please edit infrastructure/docker/.env with your actual values${NC}"
    else
        # Generate with sensible defaults for local dev
        cat > "$DOCKER_DIR/.env" << 'ENVEOF'
# Database
DB_USER=resumebuddy
DB_PASSWORD=resumebuddy_dev_2024
DB_NAME=resumebuddy
DATABASE_URL=postgresql://resumebuddy:resumebuddy_dev_2024@localhost:5432/resumebuddy

# Redis
REDIS_PASSWORD=redis_dev_2024
REDIS_URL=redis://:redis_dev_2024@localhost:6379

# MinIO
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minio_dev_secret_2024
MINIO_BUCKET=resumebuddy

# Auth
JWT_SECRET=dev_jwt_secret_change_in_production_32chars
JWT_REFRESH_SECRET=dev_refresh_secret_change_in_prod_32c

# App
NEXT_PUBLIC_APP_URL=http://localhost:9002
NODE_ENV=development
ENVEOF
        echo -e "  ${GREEN}✓ Created .env with development defaults${NC}"
    fi
else
    echo -e "  ${GREEN}✓ .env already exists${NC}"
fi

# ---- Start Infrastructure Services ----
echo -e "${YELLOW}[3/6] Starting infrastructure services...${NC}"

cd "$DOCKER_DIR"
$COMPOSE_CMD up -d postgres redis minio

# ---- Wait for Health Checks ----
echo -e "${YELLOW}[4/6] Waiting for services to be healthy...${NC}"

MAX_RETRIES=30
RETRY_INTERVAL=2

# Wait for PostgreSQL
echo -n "  Waiting for PostgreSQL..."
for i in $(seq 1 $MAX_RETRIES); do
    if $COMPOSE_CMD exec -T postgres pg_isready -U "${DB_USER:-resumebuddy}" &> /dev/null; then
        echo -e " ${GREEN}✓ Ready${NC}"
        break
    fi
    if [ $i -eq $MAX_RETRIES ]; then
        echo -e " ${RED}✗ Timeout${NC}"
        echo -e "${RED}PostgreSQL failed to start. Check logs: $COMPOSE_CMD logs postgres${NC}"
        exit 1
    fi
    echo -n "."
    sleep $RETRY_INTERVAL
done

# Wait for Redis
echo -n "  Waiting for Redis..."
for i in $(seq 1 $MAX_RETRIES); do
    if $COMPOSE_CMD exec -T redis redis-cli -a "${REDIS_PASSWORD:-redis_dev_2024}" ping 2>/dev/null | grep -q "PONG"; then
        echo -e " ${GREEN}✓ Ready${NC}"
        break
    fi
    if [ $i -eq $MAX_RETRIES ]; then
        echo -e " ${RED}✗ Timeout${NC}"
        echo -e "${RED}Redis failed to start. Check logs: $COMPOSE_CMD logs redis${NC}"
        exit 1
    fi
    echo -n "."
    sleep $RETRY_INTERVAL
done

# Wait for MinIO
echo -n "  Waiting for MinIO..."
for i in $(seq 1 $MAX_RETRIES); do
    if curl -sf http://localhost:9000/minio/health/live &> /dev/null; then
        echo -e " ${GREEN}✓ Ready${NC}"
        break
    fi
    if [ $i -eq $MAX_RETRIES ]; then
        echo -e " ${RED}✗ Timeout${NC}"
        echo -e "${RED}MinIO failed to start. Check logs: $COMPOSE_CMD logs minio${NC}"
        exit 1
    fi
    echo -n "."
    sleep $RETRY_INTERVAL
done

# ---- Create MinIO Bucket ----
echo -e "${YELLOW}[5/6] Setting up MinIO bucket...${NC}"

# The minio-setup service handles this automatically
$COMPOSE_CMD up -d minio-setup
sleep 3
echo -e "  ${GREEN}✓ MinIO bucket created (or already exists)${NC}"

# ---- Print Summary ----
echo -e "${YELLOW}[6/6] Setup complete!${NC}"

echo ""
echo -e "${GREEN}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║              Infrastructure is Ready!                        ║"
echo "╠══════════════════════════════════════════════════════════════╣"
echo "║                                                              ║"
echo "║  PostgreSQL : localhost:5432                                 ║"
echo "║  Redis      : localhost:6379                                 ║"
echo "║  MinIO API  : http://localhost:9000                          ║"
echo "║  MinIO UI   : http://localhost:9001                          ║"
echo "║                                                              ║"
echo "╠══════════════════════════════════════════════════════════════╣"
echo "║  Next Steps:                                                 ║"
echo "║  1. Edit infrastructure/docker/.env with your secrets        ║"
echo "║  2. Run 'pnpm install' in root directory                     ║"
echo "║  3. Run 'pnpm dev' to start the Next.js app                 ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
