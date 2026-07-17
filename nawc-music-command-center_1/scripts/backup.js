#!/usr/bin/env node
/**
 * Creates a timestamped full-project backup (catalog, campaigns, content, data, CONFIG)
 * as a single JSON bundle plus a copy of every raw JSON file. Run manually with
 * `npm run backup`, or wire into launchd/cron for automatic daily backups.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BACKUP_DIR = path.join(ROOT, 'data', 'backups');
const SOURCE_DIRS = ['CONFIG', 'catalog', 'campaigns', 'content', 'data'];

function walk(dir, base, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.name === 'backups') continue; // don't back up the backups
    if (entry.isDirectory()) walk(full, base, out);
    else if (entry.isFile()) out.push(path.relative(base, full));
  }
}

function main() {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const bundleDir = path.join(BACKUP_DIR, `full-backup-${stamp}`);
  fs.mkdirSync(bundleDir, { recursive: true });

  let fileCount = 0;
  for (const dir of SOURCE_DIRS) {
    const abs = path.join(ROOT, dir);
    if (!fs.existsSync(abs)) continue;
    const files = [];
    walk(abs, ROOT, files);
    for (const rel of files) {
      const destPath = path.join(bundleDir, rel);
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.copyFileSync(path.join(ROOT, rel), destPath);
      fileCount++;
    }
  }

  console.log(`Backup complete: ${fileCount} files copied to data/backups/full-backup-${stamp}/`);

  // Prune backups older than 30 days (full-backup-* directories only; leaves per-write .bak alone)
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  for (const entry of fs.readdirSync(BACKUP_DIR)) {
    if (entry.startsWith('full-backup-')) {
      const full = path.join(BACKUP_DIR, entry);
      const stat = fs.statSync(full);
      if (stat.mtimeMs < cutoff) {
        fs.rmSync(full, { recursive: true, force: true });
        console.log(`Pruned old backup: ${entry}`);
      }
    }
  }
}

main();
