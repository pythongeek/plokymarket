#!/usr/bin/env node
/**
 * File System Backup Script for Plokymarket
 * 
 * Backs up:
 * - Application source code
 * - Environment files
 * - Docker volumes
 * - Uploaded files
 * 
 * Usage:
 *   node backup-files.js --auto                    # Automated backup
 *   node backup-files.js --list                     # List existing backups
 *   node backup-files.js --restore <file>          # Restore from backup
 * 
 * Environment Variables:
 *   BACKUP_DIR        - Directory to store backups (default: ./backups)
 *   PROJECT_ROOT      - Path to project root (default: ../../)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const zlib = require('zlib');

const DEFAULT_BACKUP_DIR = path.join(__dirname, '../../backups');
const PROJECT_ROOT = path.join(__dirname, '../../..');
const RETENTION_DAYS = 14;
const MAX_BACKUPS = 20;

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
  return {
    auto: args.includes('--auto'),
    list: args.includes('--list'),
    restore: args.includes('--restore') ? args[args.indexOf('--restore') + 1] : null
  };
}

function getConfig() {
  return {
    backupDir: process.env.BACKUP_DIR || DEFAULT_BACKUP_DIR,
    projectRoot: process.env.PROJECT_ROOT || PROJECT_ROOT
  };
}

async function sendTelegramNotification(message) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  
  if (!botToken || !chatId) return;
  
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
  } catch (error) {
    log(`Telegram notification failed: ${error.message}`, 'warning');
  }
}

function ensureBackupDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function getBackupFilename() {
  const timestamp = new Date().toISOString()
    .replace(/[:.]/g, '-')
    .replace('T', '_')
    .slice(0, 19);
  const randomSuffix = crypto.randomBytes(4).toString('hex').slice(0, 8);
  return `plokymarket_files_${timestamp}_${randomSuffix}.tar.gz`;
}

function calculateChecksum(filePath) {
  const hash = crypto.createHash('sha256');
  const data = fs.readFileSync(filePath);
  hash.update(data);
  return hash.digest('hex');
}

// Files/directories to include in backup
const INCLUDE_PATTERNS = [
  'apps/web/src',
  'apps/web/public',
  'apps/web/package.json',
  'apps/web/next.config.js',
  'apps/web/tailwind.config.js',
  'supabase/migrations',
  'supabase/seeds',
  'supabase/config.toml',
  'scripts',
  'automation/workflows',
  'infrastructure',
  // Config files (but NOT .env files with secrets)
  'package.json',
  'docker-compose.yml',
  'vercel.json',
  'ADMIN_CREDENTIALS_AND_LAUNCH.md',
  'AGENTS.md',
];

// Files to exclude from backup (sensitive or large generated files)
const EXCLUDE_PATTERNS = [
  'node_modules/**',
  '.git/**',
  '.next/**',
  'out/**',
  'dist/**',
  'build/**',
  '*.log',
  '.env',
  '.env.local',
  '.env.*',
  'supabase/volumes/**',
  'backups/**',
  '**/node_modules/**',
  '**/.next/**',
  '**/dist/**',
  '**/coverage/**',
  '**/.git/**',
  '*.pyc',
  '__pycache__/**',
  '.DS_Store',
  'Thumbs.db',
  // Large files not needed for recovery
  'apps/web/public/sw.js', // Generated PWA file
];

function createExcludeArgs() {
  return EXCLUDE_PATTERNS.flatMap(pattern => ['--exclude', pattern]);
}

async function createBackup(config) {
  log(`Starting files backup for project at: ${config.projectRoot}`, 'info');
  
  const backupDir = config.backupDir;
  ensureBackupDir(backupDir);
  
  const filename = getBackupFilename();
  const backupPath = path.join(backupDir, filename);
  const checksumPath = `${backupPath}.sha256`;
  const manifestPath = path.join(backupDir, `${filename}.manifest.json`);
  
  try {
    // Create tar archive
    log('Creating tar archive...', 'info');
    const startTime = Date.now();
    
    const args = [
      'tar',
      '-czf', backupPath,
      '-C', config.projectRoot,
      ...createExcludeArgs(),
      ...INCLUDE_PATTERNS
    ];
    
    execSync(args.join(' '), { stdio: 'inherit' });
    
    const duration = Date.now() - startTime;
    const fileSize = fs.statSync(backupPath).size;
    const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);
    
    // Calculate checksum
    const checksum = calculateChecksum(backupPath);
    fs.writeFileSync(checksumPath, checksum);
    
    // Create manifest
    const manifest = {
      filename,
      created: new Date().toISOString(),
      size: fileSize,
      sizeMB: parseFloat(fileSizeMB),
      checksum,
      duration,
      projectRoot: config.projectRoot,
      includedPatterns: INCLUDE_PATTERNS,
      excludedPatterns: EXCLUDE_PATTERNS,
      version: '1.0.0'
    };
    
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    
    log(`Files backup completed successfully!`, 'success');
    log(`  File: ${filename}`, 'info');
    log(`  Size: ${fileSizeMB} MB`, 'info');
    log(`  Duration: ${(duration / 1000).toFixed(1)}s`, 'info');
    
    // Clean up old backups
    await cleanupOldBackups(backupDir);
    
    await sendTelegramNotification(
      `📁 <b>Files Backup Completed</b>\n\n` +
      `📦 Size: ${fileSizeMB} MB\n` +
      `⏱ Duration: ${(duration / 1000).toFixed(1)}s\n` +
      `🗄 File: ${filename}`
    );
    
    return { success: true, filename, size: fileSize, checksum, duration };
  } catch (error) {
    log(`Files backup failed: ${error.message}`, 'error');
    throw error;
  }
}

async function cleanupOldBackups(backupDir) {
  if (!fs.existsSync(backupDir)) return;
  
  const files = fs.readdirSync(backupDir)
    .filter(f => f.startsWith('plokymarket_files_') && f.endsWith('.tar.gz'))
    .map(f => {
      const filePath = path.join(backupDir, f);
      const stats = fs.statSync(filePath);
      return { name: f, path: filePath, mtime: stats.mtime, size: stats.size };
    })
    .sort((a, b) => b.mtime - a.mtime);
  
  // Keep only MAX_BACKUPS
  if (files.length > MAX_BACKUPS) {
    const toDelete = files.slice(MAX_BACKUPS);
    for (const file of toDelete) {
      fs.unlinkSync(file.path);
      // Also delete manifest and checksum
      const manifestPath = `${file.path}.manifest.json`;
      const checksumPath = `${file.path}.sha256`;
      if (fs.existsSync(manifestPath)) fs.unlinkSync(manifestPath);
      if (fs.existsSync(checksumPath)) fs.unlinkSync(checksumPath);
      log(`Deleted old backup: ${file.name}`, 'warning');
    }
  }
  
  // Delete backups older than RETENTION_DAYS
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);
  
  for (const file of files.filter(f => f.mtime < cutoffDate)) {
    fs.unlinkSync(file.path);
    const manifestPath = `${file.path}.manifest.json`;
    const checksumPath = `${file.path}.sha256`;
    if (fs.existsSync(manifestPath)) fs.unlinkSync(manifestPath);
    if (fs.existsSync(checksumPath)) fs.unlinkSync(checksumPath);
    log(`Deleted expired backup: ${file.name}`, 'warning');
  }
}

async function listBackups(config) {
  const backupDir = config.backupDir;
  
  if (!fs.existsSync(backupDir)) {
    return [];
  }
  
  return fs.readdirSync(backupDir)
    .filter(f => f.startsWith('plokymarket_files_') && f.endsWith('.tar.gz'))
    .map(f => {
      const filePath = path.join(backupDir, f);
      const stats = fs.statSync(filePath);
      const manifestPath = `${filePath}.manifest.json`;
      const manifest = fs.existsSync(manifestPath) 
        ? JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
        : null;
      
      return {
        name: f,
        size: stats.size,
        sizeMB: (stats.size / (1024 * 1024)).toFixed(2),
        created: stats.mtime,
        age: Math.floor((Date.now() - stats.mtime) / (1000 * 60 * 60 * 24)),
        checksum: manifest?.checksum || 'N/A'
      };
    })
    .sort((a, b) => b.created - a.created);
}

async function restoreBackup(config, backupFile) {
  const backupPath = path.isAbsolute(backupFile)
    ? backupFile
    : path.join(config.backupDir, backupFile);
  
  if (!fs.existsSync(backupPath)) {
    throw new Error(`Backup file not found: ${backupPath}`);
  }
  
  log(`Extracting backup to: ${config.projectRoot}`, 'warning');
  
  try {
    const startTime = Date.now();
    
    // Extract tar archive
    const args = [
      'tar',
      '-xzf', backupPath,
      '-C', config.projectRoot,
      '--strip-components=1' // Remove the first path component
    ];
    
    execSync(args.join(' '), { stdio: 'inherit' });
    
    const duration = Date.now() - startTime;
    
    log(`Files restored successfully in ${(duration / 1000).toFixed(1)}s`, 'success');
    
    await sendTelegramNotification(
      `📂 <b>Files Restore Completed</b>\n\n` +
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
    log('No file backups found', 'warning');
    return;
  }
  
  log(`\nFound ${backups.length} file backup(s):\n`, 'info');
  console.log('─'.repeat(90));
  console.log('Filename'.padEnd(50) + 'Size'.padEnd(12) + 'Age (days)'.padEnd(12) + 'Created');
  console.log('─'.repeat(90));
  
  for (const backup of backups) {
    const created = backup.created.toISOString().replace('T', ' ').slice(0, 19);
    console.log(
      backup.name.padEnd(50) + 
      `${backup.sizeMB} MB`.padEnd(12) + 
      `${backup.age}d`.padEnd(12) + 
      created
    );
  }
  
  console.log('─'.repeat(90));
}

async function main() {
  const options = parseArgs();
  const config = getConfig();
  
  if (options.restore) {
    await restoreBackup(config, options.restore);
  } else if (options.list || (!options.auto && !options.restore)) {
    console.log('\n╔════════════════════════════════════════════════════════════════════╗');
    console.log('║           Plokymarket Files Backup Management                      ║');
    console.log('╠════════════════════════════════════════════════════════════════════╣');
    console.log(`║  Project Root: ${config.projectRoot}`);
    console.log(`║  Backup Dir: ${config.backupDir}`);
    console.log('╚════════════════════════════════════════════════════════════════════╝\n');
    
    await printBackupList(config);
    
    if (!options.list) {
      console.log('\nUsage:');
      console.log('  node backup-files.js --auto       # Create new backup');
      console.log('  node backup-files.js --list      # List existing backups');
      console.log('  node backup-files.js --restore <file>  # Restore from backup');
    }
  } else if (options.auto) {
    await createBackup(config);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
