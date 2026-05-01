#!/usr/bin/env node
/**
 * PostgreSQL Database Backup Script for Plokymarket
 * 
 * Usage:
 *   node backup-database.js                    # Interactive mode
 *   node backup-database.js --auto             # Automated mode (uses env vars)
 *   node backup-database.js --restore <file>   # Restore from backup
 * 
 * Environment Variables:
 *   POSTGRES_HOST     - Database host
 *   POSTGRES_PORT     - Database port (default: 5432)
 *   POSTGRES_USER     - Database user
 *   POSTGRES_PASSWORD - Database password
 *   POSTGRES_DB       - Database name
 *   BACKUP_DIR        - Directory to store backups (default: ./backups)
 *   TELEGRAM_BOT_TOKEN - Telegram bot token for notifications
 *   TELEGRAM_CHAT_ID  - Telegram chat ID for notifications
 */

const { execSync, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Configuration
const DEFAULT_BACKUP_DIR = path.join(__dirname, '../../backups');
const RETENTION_DAYS = 7; // Keep backups for 7 days
const MAX_BACKUPS = 50; // Maximum number of backups to keep

// ANSI colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, type = 'info') {
  const color = {
    info: colors.blue,
    success: colors.green,
    warning: colors.yellow,
    error: colors.red
  }[type] || colors.reset;
  
  const timestamp = new Date().toISOString();
  console.log(`${colors.cyan}[${timestamp}]${color} ${message}${colors.reset}`);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    auto: false,
    restore: null
  };
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--auto') {
      options.auto = true;
    } else if (args[i] === '--restore' && args[i + 1]) {
      options.restore = args[i + 1];
      i++;
    }
  }
  
  return options;
}

function getConfig() {
  return {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || '',
    database: process.env.POSTGRES_DB || 'polymarket',
    backupDir: process.env.BACKUP_DIR || DEFAULT_BACKUP_DIR
  };
}

async function sendTelegramNotification(message) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  
  if (!botToken || !chatId) {
    log('Telegram notification skipped (no bot token or chat ID)', 'warning');
    return;
  }
  
  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const body = JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML'
    });
    
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body
    });
    
    log('Telegram notification sent successfully', 'success');
  } catch (error) {
    log(`Failed to send Telegram notification: ${error.message}`, 'error');
  }
}

function ensureBackupDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    log(`Created backup directory: ${dir}`, 'success');
  }
}

function getBackupFilename() {
  const timestamp = new Date().toISOString()
    .replace(/[:.]/g, '-')
    .replace('T', '_')
    .slice(0, 19);
  const randomSuffix = crypto.randomBytes(4).toString('hex').slice(0, 8);
  return `plokymarket_db_${timestamp}_${randomSuffix}.sql.gz`;
}

function calculateChecksum(filePath) {
  const hash = crypto.createHash('sha256');
  const data = fs.readFileSync(filePath);
  hash.update(data);
  return hash.digest('hex');
}

async function createBackup(config) {
  log(`Starting database backup for: ${config.database}@${config.host}:${config.port}`, 'info');
  
  const backupDir = config.backupDir;
  ensureBackupDir(backupDir);
  
  const filename = getBackupFilename();
  const backupPath = path.join(backupDir, filename);
  const checksumPath = `${backupPath}.sha256`;
  
  const env = {
    ...process.env,
    PGPASSWORD: config.password
  };
  
  // Build pg_dump command
  const pgDumpCmd = [
    'pg_dump',
    `-h ${config.host}`,
    `-p ${config.port}`,
    `-U ${config.user}`,
    `-d ${config.database}`,
    '-Fc', // Custom format for compression and flexibility
    '-Z 9', // Maximum compression
    '--no-owner',
    '--no-acl',
    '-f', backupPath
  ].join(' ');
  
  // Add table exclusions if needed (e.g., logs that are not critical)
  // Uncomment below to exclude specific tables
  // const excludeTables = ['error_logs', '访问日志', 'performance_metrics'];
  // excludeTables.forEach(table => {
  //   pgDumpCmd += ` --exclude-table=${table}`;
  // });
  
  try {
    log('Executing pg_dump...', 'info');
    const startTime = Date.now();
    
    execSync(pgDumpCmd, { 
      env,
      stdio: 'inherit'
    });
    
    const duration = Date.now() - startTime;
    const fileSize = fs.statSync(backupPath).size;
    const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);
    
    // Calculate checksum
    const checksum = calculateChecksum(backupPath);
    fs.writeFileSync(checksumPath, checksum);
    
    log(`Backup completed successfully!`, 'success');
    log(`  File: ${filename}`, 'info');
    log(`  Size: ${fileSizeMB} MB`, 'info');
    log(`  Duration: ${(duration / 1000).toFixed(1)}s`, 'info');
    log(`  Checksum: ${checksum.slice(0, 16)}...`, 'info');
    
    // Clean up old backups
    await cleanupOldBackups(backupDir);
    
    // Send notification
    await sendTelegramNotification(
      `✅ <b>Database Backup Completed</b>\n\n` +
      `📦 Size: ${fileSizeMB} MB\n` +
      `⏱ Duration: ${(duration / 1000).toFixed(1)}s\n` +
      `🗄 File: ${filename}`
    );
    
    return {
      success: true,
      filename,
      path: backupPath,
      size: fileSize,
      checksum,
      duration
    };
  } catch (error) {
    log(`Backup failed: ${error.message}`, 'error');
    
    await sendTelegramNotification(
      `❌ <b>Database Backup Failed</b>\n\n` +
      `Error: ${error.message}\n` +
      `Host: ${config.host}:${config.port}`
    );
    
    throw error;
  }
}

async function cleanupOldBackups(backupDir) {
  if (!fs.existsSync(backupDir)) return;
  
  const files = fs.readdirSync(backupDir)
    .filter(f => f.startsWith('plokymarket_db_') && f.endsWith('.sql.gz'))
    .map(f => {
      const filePath = path.join(backupDir, f);
      const stats = fs.statSync(filePath);
      return { name: f, path: filePath, mtime: stats.mtime, size: stats.size };
    })
    .sort((a, b) => b.mtime - a.mtime); // Sort newest first
  
  log(`Found ${files.length} existing backups`, 'info');
  
  // Delete backups beyond MAX_BACKUPS
  if (files.length > MAX_BACKUPS) {
    const toDelete = files.slice(MAX_BACKUPS);
    for (const file of toDelete) {
      fs.unlinkSync(file.path);
      // Also delete checksum file if exists
      const checksumPath = `${file.path}.sha256`;
      if (fs.existsSync(checksumPath)) {
        fs.unlinkSync(checksumPath);
      }
      log(`Deleted old backup: ${file.name}`, 'warning');
    }
  }
  
  // Delete backups older than RETENTION_DAYS
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);
  
  const oldFiles = files.filter(f => f.mtime < cutoffDate);
  for (const file of oldFiles) {
    fs.unlinkSync(file.path);
    const checksumPath = `${file.path}.sha256`;
    if (fs.existsSync(checksumPath)) {
      fs.unlinkSync(checksumPath);
    }
    log(`Deleted expired backup: ${file.name}`, 'warning');
  }
}

async function listBackups(config) {
  const backupDir = config.backupDir;
  
  if (!fs.existsSync(backupDir)) {
    log('No backups found (backup directory does not exist)', 'warning');
    return [];
  }
  
  const files = fs.readdirSync(backupDir)
    .filter(f => f.startsWith('plokymarket_db_') && f.endsWith('.sql.gz'))
    .map(f => {
      const filePath = path.join(backupDir, f);
      const stats = fs.statSync(filePath);
      const checksumPath = `${filePath}.sha256`;
      const checksum = fs.existsSync(checksumPath) 
        ? fs.readFileSync(checksumPath, 'utf8').trim() 
        : 'N/A';
      
      return {
        name: f,
        size: stats.size,
        sizeMB: (stats.size / (1024 * 1024)).toFixed(2),
        created: stats.mtime,
        age: Math.floor((Date.now() - stats.mtime) / (1000 * 60 * 60 * 24)), // days
        checksum
      };
    })
    .sort((a, b) => b.created - a.created);
  
  return files;
}

async function restoreBackup(config, backupFile) {
  const backupPath = path.isAbsolute(backupFile) 
    ? backupFile 
    : path.join(config.backupDir, backupFile);
  
  if (!fs.existsSync(backupPath)) {
    throw new Error(`Backup file not found: ${backupPath}`);
  }
  
  // Verify checksum if available
  const checksumPath = `${backupPath}.sha256`;
  if (fs.existsSync(checksumPath)) {
    const expectedChecksum = fs.readFileSync(checksumPath, 'utf8').trim();
    const actualChecksum = calculateChecksum(backupPath);
    
    if (expectedChecksum !== actualChecksum) {
      throw new Error(`Checksum mismatch! Expected ${expectedChecksum}, got ${actualChecksum}`);
    }
    log('Checksum verified successfully', 'success');
  }
  
  log(`Restoring database from: ${backupPath}`, 'warning');
  log('WARNING: This will overwrite the current database!', 'error');
  
  const env = {
    ...process.env,
    PGPASSWORD: config.password
  };
  
  try {
    // Drop existing connections (except our own)
    const dropConnectionsCmd = `psql -h ${config.host} -p ${config.port} -U ${config.user} -d postgres -c "SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE pg_stat_activity.datname = '${config.database}' AND pid <> pg_backend_pid();"`;
    
    log('Dropping existing connections...', 'info');
    execSync(dropConnectionsCmd, { env, stdio: 'inherit' });
    
    // Drop and recreate database
    const dropDbCmd = `psql -h ${config.host} -p ${config.port} -U ${config.user} -d postgres -c "DROP DATABASE IF EXISTS ${config.database};"`;
    const createDbCmd = `psql -h ${config.host} -p ${config.port} -U ${config.user} -d postgres -c "CREATE DATABASE ${config.database};"`;
    
    log('Dropping existing database...', 'info');
    execSync(dropDbCmd, { env, stdio: 'inherit' });
    
    log('Creating new database...', 'info');
    execSync(createDbCmd, { env, stdio: 'inherit' });
    
    // Restore from backup
    const restoreCmd = `pg_restore -h ${config.host} -p ${config.port} -U ${config.user} -d ${config.database} --no-owner --no-acl ${backupPath}`;
    
    log('Restoring data from backup...', 'info');
    const startTime = Date.now();
    execSync(restoreCmd, { env, stdio: 'inherit' });
    const duration = Date.now() - startTime;
    
    log(`Database restored successfully in ${(duration / 1000).toFixed(1)}s`, 'success');
    
    await sendTelegramNotification(
      `♻️ <b>Database Restore Completed</b>\n\n` +
      `File: ${path.basename(backupPath)}\n` +
      `⏱ Duration: ${(duration / 1000).toFixed(1)}s`
    );
    
    return { success: true, duration };
  } catch (error) {
    log(`Restore failed: ${error.message}`, 'error');
    throw error;
  }
}

async function printBackupList(config) {
  const backups = await listBackups(config);
  
  if (backups.length === 0) {
    log('No backups found', 'warning');
    return;
  }
  
  log(`\nFound ${backups.length} backup(s):\n`, 'info');
  console.log('─'.repeat(100));
  console.log('Filename'.padEnd(60) + 'Size'.padEnd(12) + 'Age (days)'.padEnd(12) + 'Created');
  console.log('─'.repeat(100));
  
  for (const backup of backups) {
    const created = backup.created.toISOString().replace('T', ' ').slice(0, 19);
    console.log(
      backup.name.padEnd(60) + 
      `${backup.sizeMB} MB`.padEnd(12) + 
      `${backup.age}d`.padEnd(12) + 
      created
    );
  }
  
  console.log('─'.repeat(100));
}

// Main execution
async function main() {
  const options = parseArgs();
  const config = getConfig();
  
  if (options.restore) {
    // Restore mode
    await restoreBackup(config, options.restore);
  } else if (options.auto) {
    // Automated backup mode
    const result = await createBackup(config);
    console.log(JSON.stringify(result));
  } else {
    // Interactive mode
    const backups = await listBackups(config);
    
    console.log('\n╔════════════════════════════════════════════════════════════════════╗');
    console.log('║           Plokymarket Database Backup Management                   ║');
    console.log('╠════════════════════════════════════════════════════════════════════╣');
    console.log(`║  Host: ${config.host}:${config.port}`);
    console.log(`║  Database: ${config.database}`);
    console.log(`║  Backup Dir: ${config.backupDir}`);
    console.log('╚════════════════════════════════════════════════════════════════════╝\n');
    
    if (backups.length > 0) {
      await printBackupList(config);
      console.log('');
    }
    
    // In interactive mode, just list backups (don't run backup automatically)
    log('To create a new backup, run with --auto flag', 'info');
    log('To restore a backup, run with --restore <filename>', 'info');
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
