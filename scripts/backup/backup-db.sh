#!/bin/bash
# ============================================================
# Plokymarket Database Backup Script
# Run via cron: 0 2 * * * /root/scripts/backup/backup-db.sh
# ============================================================

set -euo pipefail

# --- Config ---
BACKUP_DIR="/var/backups/plokymarket"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30
LOG_FILE="/var/log/backup.log"

# Database connection (from environment or config)
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-}"

# Remote storage (configure for your setup)
REMOTE_ENABLED="${REMOTE_ENABLED:-false}"
REMOTE_TYPE="${REMOTE_TYPE:-rclone}"  # rclone, s3, gcs
REMOTE_DEST="${REMOTE_DEST:-gdrive:backups}"

# --- Functions ---
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

cleanup_old() {
    log "Cleaning up backups older than $RETENTION_DAYS days..."
    find "$BACKUP_DIR" -name "plokymarket_*.dump" -mtime +$RETENTION_DAYS -delete
    find "$BACKUP_DIR" -name "*.bak" -mtime +$RETENTION_DAYS -delete
    log "Cleanup complete."
}

backup_db() {
    log "Starting database backup..."
    
    mkdir -p "$BACKUP_DIR"
    
    if [ -z "$DB_PASSWORD" ]; then
        log "ERROR: DB_PASSWORD not set"
        exit 1
    fi
    
    export PGPASSWORD="$DB_PASSWORD"
    
    pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --format=custom \
        --compress=9 \
        --file="$BACKUP_DIR/plokymarket_${DATE}.dump"
    
    local size=$(du -h "$BACKUP_DIR/plokymarket_${DATE}.dump" | cut -f1)
    log "Database backup complete: plokymarket_${DATE}.dump ($size)"
    
    unset PGPASSWORD
}

backup_configs() {
    log "Backing up configuration files..."
    
    # Backup env files (masked)
    if [ -f "/var/www/plokymarket/.env.local" ]; then
        cp "/var/www/plokymarket/.env.local" "$BACKUP_DIR/env_${DATE}.bak"
        log "Config backed up."
    fi
    
    # Backup nginx config
    if [ -f "/etc/nginx/sites-available/plokymarket" ]; then
        cp "/etc/nginx/sites-available/plokymarket" "$BACKUP_DIR/nginx_conf_${DATE}.bak"
    fi
}

upload_remote() {
    if [ "$REMOTE_ENABLED" != "true" ]; then
        log "Remote backup disabled. Skipping upload."
        return
    fi
    
    log "Uploading backup to remote storage..."
    
    case "$REMOTE_TYPE" in
        rclone)
            rclone copy "$BACKUP_DIR/plokymarket_${DATE}.dump" "$REMOTE_DEST/" \
                --log-file "$LOG_FILE" \
                --transfers 2 \
                --checkers 2
            log "Upload to rclone complete."
            ;;
        s3)
            aws s3 cp "$BACKUP_DIR/plokymarket_${DATE}.dump" "s3://${REMOTE_DEST}/" \
                --storage-class STANDARD
            log "Upload to S3 complete."
            ;;
        *)
            log "Unknown remote type: $REMOTE_TYPE"
            ;;
    esac
}

verify_backup() {
    log "Verifying backup integrity..."
    
    export PGPASSWORD="$DB_PASSWORD"
    
    # List the backup contents
    pg_restore --list "$BACKUP_DIR/plokymarket_${DATE}.dump" > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        log "Backup verification PASSED"
    else
        log "WARNING: Backup verification FAILED"
        return 1
    fi
    
    unset PGPASSWORD
}

# --- Main ---
log "========== Backup Started =========="

backup_db
backup_configs
verify_backup
cleanup_old
upload_remote

log "========== Backup Complete =========="
