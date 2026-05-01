#!/usr/bin/env node
/**
 * Master Backup Script - Runs all Plokymarket backups
 * 
 * Executes in sequence:
 * 1. Database backup (PostgreSQL)
 * 2. Files backup (source code)
 * 3. Redis backup (Upstash cache)
 * 
 * Usage:
 *   node backup-all.js --auto             # Run all backups
 *   node backup-all.js --db-only          # Database only
 *   node backup-all.js --files-only      # Files only
 *   node backup-all.js --redis-only       # Redis only
 *   node backup-all.js --status           # Show backup status
 * 
 * Environment Variables:
 *   BACKUP_DIR           - Directory to store backups
 *   POSTGRES_HOST        - PostgreSQL host
 *   POSTGRES_PORT        - PostgreSQL port
 *   POSTGRES_USER        - PostgreSQL user
 *   POSTGRES_PASSWORD    - PostgreSQL password
 *   POSTGRES_DB          - Database name
 *   KV_REST_API_URL      - Upstash Redis URL
 *   KV_REST_API_TOKEN    - Upstash Redis token
 *   TELEGRAM_BOT_TOKEN   - Telegram bot for notifications
 *   TELEGRAM_CHAT_ID      - Telegram chat ID
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const BACKUP_SCRIPT_DIR = __dirname;
const DEFAULT_BACKUP_DIR = path.join(__dirname, '../../backups');

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, type = 'info') {
  const color = {
    info: colors.blue,
    success: colors.green,
    warning: colors.yellow,
    error: colors.red,
    header: colors.magenta
  }[type] || colors.reset;
  
  const timestamp = new Date().toISOString();
  console.log(`${colors.cyan}[${timestamp}]${color} ${message}${colors.reset}`);
}

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    auto: args.includes('--auto'),
    dbOnly: args.includes('--db-only'),
    filesOnly: args.includes('--files-only'),
    redisOnly: args.includes('--redis-only'),
    status: args.includes('--status')
  };
}

function getConfig() {
  return {
    backupDir: process.env.BACKUP_DIR || DEFAULT_BACKUP_DIR,
    postgres: {
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      user: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || '',
      database: process.env.POSTGRES_DB || 'polymarket'
    },
    redis: {
      url: process.env.KV_REST_API_URL || process.env.REDIS_URL,
      token: process.env.KV_REST_API_TOKEN
    }
  };
}

async function sendTelegramNotification(message) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  
  if (!botToken || !chatId) {
    log('Telegram notification skipped (no credentials)', 'warning');
    return;
  }
  
  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      })
    });
    log('Telegram notification sent', 'success');
  } catch (error) {
    log(`Telegram notification failed: ${error.message}`, 'warning');
  }
}

function ensureBackupDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function runScript(scriptName, args = []) {
  log(`Running ${scriptName}...`, 'header');
  const scriptPath = path.join(BACKUP_SCRIPT_DIR, scriptName);
  
  try {
    const startTime = Date.now();
    execSync(`node "${scriptPath}" ${args.join(' ')}`, { 
      stdio: 'inherit',
      env: { ...process.env }
    });
    const duration = Date.now() - startTime;
    log(`${scriptName} completed in ${(duration / 1000).toFixed(1)}s`, 'success');
    return { success: true, duration };
  } catch (error) {
    log(`${scriptName} failed: ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
}

function getBackupStatus() {
  const config = getConfig();
  const backupDir = config.backupDir;
  
  if (!fs.existsSync(backupDir)) {
    return { database: [], files: [], redis: [] };
  }
  
  const files = fs.readdirSync(backupDir);
  
  return {
    database: files
      .filter(f => f.startsWith('plokymarket_db_') && f.endsWith('.sql.gz'))
      .map(f => {
        const stats = fs.statSync(path.join(backupDir, f));
        return { name: f, size: stats.size, created: stats.mtime };
      })
      .sort((a, b) => b.created - a.created),
      
    files: files
      .filter(f => f.startsWith('plokymarket_files_') && f.endsWith('.tar.gz'))
      .map(f => {
        const stats = fs.statSync(path.join(backupDir, f));
        return { name: f, size: stats.size, created: stats.mtime };
      })
      .sort((a, b) => b.created - a.created),
      
    redis: files
      .filter(f => f.startsWith('plokymarket_redis_') && f.endsWith('.json.gz'))
      .map(f => {
        const stats = fs.statSync(path.join(backupDir, f));
        return { name: f, size: stats.size, created: stats.mtime };
      })
      .sort((a, b) => b.created - a.created)
  };
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function printStatus() {
  const status = getBackupStatus();
  
  console.log('\n╔════════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                    Plokymarket Backup Status                                ║');
  console.log('╠════════════════════════════════════════════════════════════════════════════════╣');
  
  // Database backups
  console.log('║ Database (PostgreSQL) Backups:');
  if (status.database.length === 0) {
    console.log('║   - No backups found');
  } else {
    status.database.slice(0, 5).forEach(b => {
      const age = Math.floor((Date.now() - b.created) / (1000 * 60 * 60 * 24));
      const date = b.created.toISOString().replace('T', ' ').slice(0, 19);
      console.log(`║   - ${b.name} (${formatSize(b.size)}, ${age}d ago)`);
    });
  }
  
  // Files backups
  console.log('║');
  console.log('║ Files Backups:');
  if (status.files.length === 0) {
    console.log('║   - No backups found');
  } else {
    status.files.slice(0, 5).forEach(b => {
      const age = Math.floor((Date.now() - b.created) / (1000 * 60 * 60 * 24));
      console.log(`║   - ${b.name} (${formatSize(b.size)}, ${age}d ago)`);
    });
  }
  
  // Redis backups
  console.log('║');
  console.log('║ Redis (Upstash) Backups:');
  if (status.redis.length === 0) {
    console.log('║   - No backups found');
  } else {
    status.redis.slice(0, 5).forEach(b => {
      const age = Math.floor((Date.now() - b.created) / (1000 * 60 * 60 * 24));
      console.log(`║   - ${b.name} (${formatSize(b.size)}, ${age}d ago)`);
    });
  }
  
  console.log('╚════════════════════════════════════════════════════════════════════════════════╝\n');
}

async function runAllBackups() {
  const config = getConfig();
  ensureBackupDir(config.backupDir);
  
  const results = {
    database: null,
    files: null,
    redis: null,
    startTime: Date.now()
  };
  
  log('═══════════════════════════════════════════════════════════════', 'header');
  log('       Plokymarket Master Backup Started', 'header');
  log('═══════════════════════════════════════════════════════════════', 'header');
  
  // Run database backup
  results.database = runScript('backup-database.js', ['--auto']);
  
  // Run files backup
  results.files = runScript('backup-files.js', ['--auto']);
  
  // Run redis backup
  results.redis = runScript('backup-redis.js', ['--auto']);
  
  // Summary
  const totalDuration = Date.now() - results.startTime;
  
  console.log('\n' + '═'.repeat(70));
  console.log('                    BACKUP SUMMARY');
  console.log('═'.repeat(70));
  
  const allSuccess = [results.database, results.files, results.redis].every(r => r?.success);
  
  console.log(`║ Database Backup:  ${results.database?.success ? '✅ SUCCESS' : '❌ FAILED'}`.padEnd(50) + '║');
  console.log(`║ Files Backup:     ${results.files?.success ? '✅ SUCCESS' : '❌ FAILED'}`.padEnd(50) + '║');
  console.log(`║ Redis Backup:     ${results.redis?.success ? '✅ SUCCESS' : '❌ FAILED'}`.padEnd(50) + '║');
  console.log('═'.repeat(70));
  console.log(`║ Total Duration:  ${(totalDuration / 1000).toFixed(1)}s`.padEnd(50) + '║');
  console.log('═'.repeat(70));
  
  if (allSuccess) {
    log('All backups completed successfully!', 'success');
    await sendTelegramNotification(
      `✅ <b>All Plokymarket Backups Completed</b>\n\n` +
      `📦 Database: SUCCESS\n` +
      `📁 Files: SUCCESS\n` +
      `🔴 Redis: SUCCESS\n\n` +
      `⏱ Total Duration: ${(totalDuration / 1000).toFixed(1)}s`
    );
  } else {
    log('Some backups failed. Check the logs above.', 'error');
    await sendTelegramNotification(
      `⚠️ <b>Plokymarket Backup Issues</b>\n\n` +
      `Database: ${results.database?.success ? '✅' : '❌'}\n` +
      `Files: ${results.files?.success ? '✅' : '❌'}\n` +
      `Redis: ${results.redis?.success ? '✅' : '❌'}\n\n` +
      `Check server logs for details.`
    );
  }
  
  return results;
}

async function main() {
  const options = parseArgs();
  
  if (options.status) {
    printStatus();
    return;
  }
  
  const config = getConfig();
  
  // Ensure backup directory exists
  ensureBackupDir(config.backupDir);
  
  if (options.dbOnly) {
    runScript('backup-database.js', ['--auto']);
  } else if (options.filesOnly) {
    runScript('backup-files.js', ['--auto']);
  } else if (options.redisOnly) {
    runScript('backup-redis.js', ['--auto']);
  } else if (options.auto) {
    await runAllBackups();
  } else {
    // Interactive mode - show status
    printStatus();
    console.log('Usage:');
    console.log('  node backup-all.js --auto           # Run all backups');
    console.log('  node backup-all.js --status         # Show backup status');
    console.log('  node backup-all.js --db-only        # Database only');
    console.log('  node backup-all.js --files-only     # Files only');
    console.log('  node backup-all.js --redis-only    # Redis only');
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
