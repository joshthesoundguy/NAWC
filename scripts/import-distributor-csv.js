#!/usr/bin/env node
/**
 * Spotify and Apple Music don't give independent artists a public API for their
 * own stream counts. The real, official way to get that data is:
 *   - Spotify for Artists -> Export data (CSV)
 *   - Apple Music for Artists -> Reports
 *   - Or your distributor's (e.g. DistroKid) royalty/streaming CSV export
 *
 * Usage:
 *   node scripts/import-distributor-csv.js path/to/export.csv
 *
 * Expected minimal columns (case-insensitive, extra columns are ignored):
 *   platform, song_title, streams, period_start, period_end
 *
 * Nothing is deleted — each import is appended as a dated batch so you can
 * track catalog growth release over release.
 */
const fs = require('fs');
const path = require('path');

function parseCSV(text) {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  return lines.slice(1).map(line => {
    const cells = line.split(',');
    const row = {};
    headers.forEach((h, i) => (row[h] = (cells[i] || '').trim()));
    return row;
  });
}

function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.log('Usage: node scripts/import-distributor-csv.js path/to/export.csv');
    console.log('See this file\'s header comment for where to get that export.');
    process.exit(0);
  }
  const abs = path.resolve(filePath);
  if (!fs.existsSync(abs)) {
    console.error('File not found:', abs);
    process.exit(1);
  }

  const rows = parseCSV(fs.readFileSync(abs, 'utf8'));
  const analyticsPath = path.join(__dirname, '..', 'data', 'analytics', 'analytics.json');
  const analytics = JSON.parse(fs.readFileSync(analyticsPath, 'utf8'));

  if (!analytics.distributorImports) analytics.distributorImports = [];
  analytics.distributorImports.push({
    importedAt: new Date().toISOString(),
    sourceFile: path.basename(abs),
    rowCount: rows.length,
    rows
  });
  analytics.spotify.connected = true;
  analytics.lastImported = new Date().toISOString();

  const backupDir = path.join(__dirname, '..', 'data', 'backups');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
  fs.copyFileSync(analyticsPath, path.join(backupDir, `analytics.json.${Date.now()}.bak`));

  fs.writeFileSync(analyticsPath, JSON.stringify(analytics, null, 2));
  console.log(`Imported ${rows.length} rows from ${path.basename(abs)}. Appended as a new batch — nothing overwritten.`);
}

main();
