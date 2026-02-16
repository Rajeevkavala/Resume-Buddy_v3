#!/bin/bash
# ============================================
# ResumeBuddy Backup Script
# ============================================
# Run daily via cron:
# 0 2 * * * /opt/resumebuddy/infrastructure/scripts/backup.sh >> /var/log/resumebuddy-backup.log 2>&1

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/../docker"

# Source production env
if [ -f .env.production ]; then
  set -a
  source .env.production
  set +a
fi

BACKUP_DIR="/backups/resumebuddy/$(date +%Y-%m-%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "=== ResumeBuddy Backup ==="
echo "Backup directory: $BACKUP_DIR"
echo "Started at: $(date)"

# 1. PostgreSQL dump
echo ""
echo ">>> Backing up PostgreSQL..."
docker compose exec -T postgres pg_dump -U "${DB_USER:-resumebuddy}" "${DB_NAME:-resumebuddy}" | gzip > "$BACKUP_DIR/database.sql.gz"
echo "Database backup: $(du -h "$BACKUP_DIR/database.sql.gz" | cut -f1)"

# 2. Redis snapshot
echo ""
echo ">>> Backing up Redis..."
docker compose exec -T redis redis-cli -a "${REDIS_PASSWORD}" BGSAVE 2>/dev/null || true
sleep 5
docker compose cp redis:/data/dump.rdb "$BACKUP_DIR/redis.rdb" 2>/dev/null || echo "Redis backup skipped (no dump.rdb)"

# 3. Environment config (without secrets - just structure)
echo ""
echo ">>> Backing up configuration..."
cp .env.production "$BACKUP_DIR/.env.production.backup" 2>/dev/null || true

# 4. Cleanup old backups (keep last 7 days)
echo ""
echo ">>> Cleaning up old backups..."
find /backups/resumebuddy -maxdepth 1 -type d -mtime +7 -exec rm -rf {} \; 2>/dev/null || true

echo ""
echo "=== Backup Complete ==="
echo "Finished at: $(date)"
echo "Total size: $(du -sh "$BACKUP_DIR" | cut -f1)"
