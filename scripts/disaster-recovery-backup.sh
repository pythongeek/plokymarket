#!/bin/bash
set -euo pipefail

# =============================================================================
# Plokymarket Disaster Recovery — Automated Backup Script
# PostgreSQL dump + file state, AES-256 encrypted, offsite S3 sync
# Cron: 0 2 * * * /root/plokymarket/scripts/disaster-recovery-backup.sh
# =============================================================================

BACKUP_DIR="/var/backups/plokymarket"
S3_BUCKET="s3://plokymarket-cold-storage/backups"
RETENTION_DAYS=30
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_NAME="polymarket"
DB_USER="postgres"
DB_HOST="127.0.0.1"
DB_PORT="5432"
ENCRYPTION_KEY_FILE="/root/.secrets/backup-aes.key"

echo "[BACKUP] ══════════════════════════════════════════════════════════════════════════════"
echo "[BACKUP] Starting backup: $TIMESTAMP"

# Ensure backup dir exists
mkdir -p "$BACKUP_DIR"

# ── 1. PostgreSQL Dump ────────────────────────────────────────────────────────────────────────────────────────────────────────
echo "[BACKUP] Step 1: pg_dump..."

PGDUMP_FILE="$BACKUP_DIR/db_${DB_NAME}_${TIMESTAMP}.sql"
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
  --no-owner --no-privileges --clean --if-exists \
  > "$PGDUMP_FILE"

echo "[BACKUP] DB dump: $(du -h "$PGDUMP_FILE" | cut -f1)"

# ── 2. File State Backup (configs, n8n workflows) ──────────────────────────────────────────────────────────────────
echo "[BACKUP] Step 2: File state archive..."

FILES_ARCHIVE="$BACKUP_DIR/files_${TIMESTAMP}.tar.gz"
tar -czf "$FILES_ARCHIVE" \
  -C /root/plokymarket \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='standalone' \
  --exclude='*.log' \
  infrastructure/ automation/ workers/ secrets/ 2>/dev/null || true

echo "[BACKUP] Files archive: $(du -h "$FILES_ARCHIVE" | cut -f1)"

# ── 3. AES-256 Encryption ─────────────────────────────────────────────────────────────────────────────────────────────────────
echo "[BACKUP] Step 3: AES-256 encryption..."

if [ ! -f "$ENCRYPTION_KEY_FILE" ]; then
  echo "[BACKUP] WARNING: Encryption key not found at $ENCRYPTION_KEY_FILE"
  echo "[BACKUP] Generate with: openssl rand -base64 32 > $ENCRYPTION_KEY_FILE"
  echo "[BACKUP] Skipping encryption — backups will be unencrypted!"
else
  for file in "$PGDUMP_FILE" "$FILES_ARCHIVE"; do
    openssl enc -aes-256-cbc -salt -pbkdf2 -in "$file" -out "${file}.enc" -pass "file:$ENCRYPTION_KEY_FILE"
    rm -f "$file"
    echo "[BACKUP] Encrypted: ${file}.enc"
  done
fi

# ── 4. Offsite S3 Sync ───────────────────────────────────────────────────────────────────────────────────────────────────────
echo "[BACKUP] Step 4: Syncing to offsite S3..."

if command -v aws &> /dev/null; then
  aws s3 sync "$BACKUP_DIR/" "$S3_BUCKET/$TIMESTAMP/" --storage-class STANDARD_IA
  echo "[BACKUP] S3 sync complete: $S3_BUCKET/$TIMESTAMP/"
else
  echo "[BACKUP] WARNING: AWS CLI not found. Install: apt install awscli"
fi

# ── 5. Local Retention Cleanup ──────────────────────────────────────────────────────────────────────────────────────────────────────
echo "[BACKUP] Step 5: Cleaning old local backups..."

find "$BACKUP_DIR" -type f -mtime +$RETENTION_DAYS -delete
echo "[BACKUP] Retention: keeping last $RETENTION_DAYS days"

# ── 6. Verify Backup Integrity ───────────────────────────────────────────────────────────────────────────────────────────────────────
echo "[BACKUP] Step 6: Verifying backup integrity..."

LATEST_DB=$(ls -t "$BACKUP_DIR"/db_*.enc 2>/dev/null | head -1)
if [ -n "$LATEST_DB" ]; then
  SIZE=$(stat -c%s "$LATEST_DB")
  if [ "$SIZE" -gt 1024 ]; then
    echo "[BACKUP] ✅ DB backup verified: $SIZE bytes"
  else
    echo "[BACKUP] ❌ DB backup suspiciously small: $SIZE bytes"
    exit 1
  fi
fi

echo "[BACKUP] ══════════════════════════════════════════════════════════════════════════════"
echo "[BACKUP] ✅ Backup complete: $TIMESTAMP"
