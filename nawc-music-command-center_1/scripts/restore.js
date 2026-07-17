#!/usr/bin/env node
/**
 * Restores the project from a full-backup bundle created by scripts/backup.js.
 * Usage:
 *   node scripts/restore.js data/backups/full-backup-2026-07-16T12-00-00-000Z
 *
 * SAFETY: current live data is copied to data/backups/pre-restore-<timestamp>/
 * before anything is overwritten, so a restore is itself reversible.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function walk(dir, base, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, base, out);
    else if (entry.isFile()) out.push(path.relative(base, full));
  }
}

function main() {
  const bundleArg = process.argv[2];
  if (!bundleArg) {
    console.log('Usage: node scripts/restore.js <path-to-backup-bundle>');
    process.exit(0);
  }
  const bundleDir = path.resolve(bundleArg);
  if (!fs.existsSync(bundleDir)) {
    console.error('Backup bundle not found:', bundleDir);
    process.exit(1);
  }

  // Safety copy of current state first
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const preRestoreDir = path.join(ROOT, 'data', 'backups', `pre-restore-${stamp}`);
  const currentFiles = [];
  for (const dir of ['CONFIG', 'catalog', 'campaigns', 'content', 'data']) {
    const abs = path.join(ROOT, dir);
    if (fs.existsSync(abs)) walk(abs, ROOT, currentFiles);
  }
  for (const rel of currentFiles) {
    if (rel.includes(path.join('data', 'backups'))) continue;
    const dest = path.join(preRestoreDir, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(path.join(ROOT, rel), dest);
  }
  console.log(`Safety copy of current state saved to ${path.relative(ROOT, preRestoreDir)}/`);

  // Now restore from bundle
  const bundleFiles = [];
  walk(bundleDir, bundleDir, bundleFiles);
  for (const rel of bundleFiles) {
    const src = path.join(bundleDir, rel);
    const dest = path.join(ROOT, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
  console.log(`Restored ${bundleFiles.length} files from ${path.basename(bundleDir)}.`);
}

main();
