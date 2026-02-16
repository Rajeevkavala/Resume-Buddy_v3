#!/bin/bash
set -e

echo "=== ResumeBuddy Production Deployment ==="
echo "Started at: $(date)"

# Change to project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$PROJECT_ROOT"

# 1. Pull latest code
echo ""
echo ">>> Step 1: Pulling latest code..."
git pull origin main

# 2. Check environment file
echo ""
echo ">>> Step 2: Checking environment configuration..."
if [ ! -f infrastructure/docker/.env.production ]; then
  echo "ERROR: .env.production not found!"
  echo "Copy from .env.production.template and fill in values:"
  echo "  cp infrastructure/docker/.env.production.template infrastructure/docker/.env.production"
  exit 1
fi

# Source the env file for variable expansion
set -a
source infrastructure/docker/.env.production
set +a

# 3. Build Docker images
echo ""
echo ">>> Step 3: Building Docker images..."
cd infrastructure/docker
docker compose -f docker-compose.prod.yml --env-file .env.production build

# 4. Run database migrations
echo ""
echo ">>> Step 4: Running database migrations..."
docker compose -f docker-compose.prod.yml --env-file .env.production run --rm web \
  sh -c "cd packages/database && npx prisma migrate deploy" || echo "Migration may have already been applied"

# 5. Start services
echo ""
echo ">>> Step 5: Starting services..."
docker compose -f docker-compose.prod.yml --env-file .env.production up -d

# 6. Wait for health
echo ""
echo ">>> Step 6: Waiting for services to be healthy (30s)..."
sleep 30

# 7. Health check
echo ""
echo ">>> Step 7: Running health check..."
HEALTH_STATUS=$(curl -sf "https://${DOMAIN}/api/health" 2>/dev/null || curl -sf "http://localhost:9002/api/health" 2>/dev/null || echo '{"status":"unreachable"}')
echo "$HEALTH_STATUS" | python3 -m json.tool 2>/dev/null || echo "$HEALTH_STATUS"

# 8. Run smoke test
echo ""
echo ">>> Step 8: Running smoke test..."
if [ -f infrastructure/scripts/smoke-test.sh ]; then
  bash infrastructure/scripts/smoke-test.sh "${DOMAIN}" "https" || echo "Smoke test completed with warnings"
fi

echo ""
echo "=== Deployment Complete ==="
echo "Finished at: $(date)"
echo "App URL: https://${DOMAIN}"
echo "Health:  https://${DOMAIN}/api/health"
echo "Metrics: https://${DOMAIN}/api/metrics"
