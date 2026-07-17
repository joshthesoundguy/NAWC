#!/usr/bin/env node
/**
 * NAWC Music Command Center — local server
 * Zero external dependencies. Serves the dashboard and a small JSON API
 * that reads/writes the plain JSON files under /catalog, /data, /campaigns, /content.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const DASHBOARD = path.join(ROOT, 'dashboard');
const CONFIG_PATH = path.join(ROOT, 'CONFIG', 'config.json');
const BACKUP_DIR = path.join(ROOT, 'data', 'backups');
const LOG_DIR = path.join(ROOT, 'logs');
const PORT = process.env.PORT || 4477;

// Directories the API is allowed to read/write JSON files in (relative to ROOT).
const ALLOWED_ROOTS = ['catalog', 'campaigns', 'content', 'data'];

function log(line) {
  if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
  const stamp = new Date().toISOString();
  fs.appendFileSync(path.join(LOG_DIR, 'server.log'), `[${stamp}] ${line}\n`);
}

function isAllowedRelPath(relPath) {
  const norm = path.normalize(relPath).replace(/^(\.\.[\/\\])+/, '');
  const top = norm.split(path.sep)[0];
  return ALLOWED_ROOTS.includes(top) && norm.endsWith('.json') && !norm.includes('..');
}

function atomicWriteJSON(absPath, dataObj) {
  // Validate JSON by round-tripping, backup existing file, then atomic rename.
  const json = JSON.stringify(dataObj, null, 2);
  JSON.parse(json); // throws if invalid

  if (fs.existsSync(absPath)) {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const base = path.basename(absPath);
    const backupPath = path.join(BACKUP_DIR, `${base}.${stamp}.bak`);
    if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
    fs.copyFileSync(absPath, backupPath);
  }

  const tmpPath = absPath + '.tmp-' + crypto.randomBytes(4).toString('hex');
  fs.writeFileSync(tmpPath, json, 'utf8');
  fs.renameSync(tmpPath, absPath);
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json', ...headers });
  res.end(JSON.stringify(body));
}

function serveStatic(req, res, urlPath) {
  let filePath = urlPath === '/' ? '/index.html' : urlPath;
  const abs = path.join(DASHBOARD, filePath);
  if (!abs.startsWith(DASHBOARD)) { res.writeHead(403); return res.end('Forbidden'); }

  fs.readFile(abs, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('Not found');
    }
    const ext = path.extname(abs);
    const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
      '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' };
    res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
    res.end(content);
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  // --- Config endpoint ---
  if (url.pathname === '/api/config' && req.method === 'GET') {
    try {
      const cfg = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
      return send(res, 200, cfg);
    } catch (e) { return send(res, 500, { error: e.message }); }
  }

  // --- Generic data read: /api/data/<relative/path.json> ---
  if (url.pathname.startsWith('/api/data/') && req.method === 'GET') {
    const relPath = decodeURIComponent(url.pathname.replace('/api/data/', ''));
    if (!isAllowedRelPath(relPath)) return send(res, 400, { error: 'Path not allowed' });
    const abs = path.join(ROOT, relPath);
    if (!fs.existsSync(abs)) return send(res, 404, { error: 'Not found' });
    try {
      const data = JSON.parse(fs.readFileSync(abs, 'utf8'));
      return send(res, 200, data);
    } catch (e) { return send(res, 500, { error: e.message }); }
  }

  // --- Generic data write (append-safe, validated, backed up): PUT /api/data/<path.json> ---
  if (url.pathname.startsWith('/api/data/') && req.method === 'PUT') {
    const relPath = decodeURIComponent(url.pathname.replace('/api/data/', ''));
    if (!isAllowedRelPath(relPath)) return send(res, 400, { error: 'Path not allowed' });
    const abs = path.join(ROOT, relPath);
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
      try {
        const parsed = JSON.parse(body);
        atomicWriteJSON(abs, parsed);
        log(`WRITE ${relPath}`);
        return send(res, 200, { ok: true });
      } catch (e) {
        log(`ERROR writing ${relPath}: ${e.message}`);
        return send(res, 400, { error: 'Invalid JSON or write failure: ' + e.message });
      }
    });
    return;
  }

  // --- List all song/album/campaign files quickly (used by dashboard on load) ---
  if (url.pathname === '/api/bootstrap' && req.method === 'GET') {
    try {
      const readDirJSON = (relDir) => {
        const abs = path.join(ROOT, relDir);
        if (!fs.existsSync(abs)) return [];
        return fs.readdirSync(abs)
          .filter(f => f.endsWith('.json'))
          .map(f => JSON.parse(fs.readFileSync(path.join(abs, f), 'utf8')));
      };
      const songs = readDirJSON('catalog/songs').filter(s => s.id); // skip _song-ideas.json shape
      const albums = readDirJSON('catalog/albums');
      const ideasFile = path.join(ROOT, 'catalog/songs/_song-ideas.json');
      const ideas = fs.existsSync(ideasFile) ? JSON.parse(fs.readFileSync(ideasFile, 'utf8')).ideas : [];
      const releases = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/releases/releases.json'), 'utf8')).releases;
      const campaigns = JSON.parse(fs.readFileSync(path.join(ROOT, 'campaigns/active/campaigns.json'), 'utf8')).campaigns;
      const analytics = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/analytics/analytics.json'), 'utf8'));
      const collaborators = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/collaborators/collaborators.json'), 'utf8')).collaborators;
      const opportunities = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/opportunities/opportunities.json'), 'utf8')).opportunities;
      const trophy = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/trophy-room/trophy.json'), 'utf8')).milestones;
      const impact = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/ministry-impact/impact.json'), 'utf8')).stories;
      const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
      return send(res, 200, { songs, albums, ideas, releases, campaigns, analytics, collaborators, opportunities, trophy, impact, config });
    } catch (e) {
      log(`ERROR bootstrap: ${e.message}`);
      return send(res, 500, { error: e.message });
    }
  }

  // --- Static dashboard files ---
  if (req.method === 'GET') return serveStatic(req, res, url.pathname);

  send(res, 404, { error: 'Not found' });
});

server.listen(PORT, () => {
  console.log(`NAWC Music Command Center running at http://localhost:${PORT}`);
  log(`Server started on port ${PORT}`);
});
