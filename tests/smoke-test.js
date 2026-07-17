#!/usr/bin/env node
/**
 * End-to-end proof: validates every JSON data file parses, then boots the
 * server, hits /api/bootstrap and /api/config, and confirms the dashboard
 * HTML is served. Run with: npm test
 */
const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
let failures = 0;

function check(name, cond) {
  if (cond) console.log(`  ✓ ${name}`);
  else { console.log(`  ✗ ${name}`); failures++; }
}

function validateAllJSON() {
  console.log('Validating all JSON files...');
  const dirs = ['CONFIG', 'catalog', 'campaigns', 'content', 'data'];
  let count = 0;
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) { if (entry.name !== 'backups') walk(full); }
      else if (entry.name.endsWith('.json')) {
        try {
          JSON.parse(fs.readFileSync(full, 'utf8'));
          count++;
        } catch (e) {
          check(`valid JSON: ${path.relative(ROOT, full)}`, false);
        }
      }
    }
  }
  dirs.forEach(d => { const abs = path.join(ROOT, d); if (fs.existsSync(abs)) walk(abs); });
  check(`${count} JSON files parse correctly`, true);
}

function get(port, urlPath) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:${port}${urlPath}`, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

async function testServer() {
  console.log('Booting server for live checks...');
  const PORT = 4499;
  const server = spawn('node', [path.join(ROOT, 'scripts', 'server.js')], {
    env: { ...process.env, PORT: String(PORT) }
  });

  await new Promise(r => setTimeout(r, 800));

  try {
    const bootstrap = await get(PORT, '/api/bootstrap');
    check('/api/bootstrap returns 200', bootstrap.status === 200);
    const parsed = JSON.parse(bootstrap.body);
    check('bootstrap includes songs array', Array.isArray(parsed.songs));
    check('bootstrap includes config', !!parsed.config);

    const config = await get(PORT, '/api/config');
    check('/api/config returns 200', config.status === 200);

    const home = await get(PORT, '/');
    check('dashboard index.html served', home.status === 200 && home.body.includes('NAWC'));
  } finally {
    server.kill();
  }
}

(async () => {
  validateAllJSON();
  await testServer();
  console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} check(s) failed.`);
  process.exit(failures === 0 ? 0 : 1);
})();
