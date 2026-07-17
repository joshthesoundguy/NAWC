#!/usr/bin/env node
/**
 * Pulls real channel + video stats from the YouTube Data API v3.
 * Requires YOUTUBE_API_KEY and YOUTUBE_CHANNEL_ID in .env (see .env.example).
 *
 * This script makes NO network calls until you provide real credentials —
 * it will exit with a clear message instead of guessing or faking data.
 *
 * Setup:
 *   1. https://console.cloud.google.com/ -> new project -> enable "YouTube Data API v3"
 *   2. Create an API key (restrict it to YouTube Data API v3)
 *   3. Copy .env.example to .env, paste YOUTUBE_API_KEY and your channel's ID
 *   4. Run: npm run import:youtube
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return {};
  const out = {};
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) out[m[1]] = m[2].trim();
  });
  return out;
}

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', c => (data += c));
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function main() {
  const env = loadEnv();
  const KEY = env.YOUTUBE_API_KEY;
  const CHANNEL_ID = env.YOUTUBE_CHANNEL_ID;

  if (!KEY || !CHANNEL_ID) {
    console.log('YOUTUBE_API_KEY or YOUTUBE_CHANNEL_ID missing from .env — nothing to import.');
    console.log('See scripts/import-youtube.js header for setup steps. Exiting without changing any data.');
    process.exit(0);
  }

  console.log('Fetching channel stats from YouTube Data API…');
  const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${CHANNEL_ID}&key=${KEY}`;
  const channelData = await get(channelUrl);

  if (channelData.error) {
    console.error('YouTube API error:', channelData.error.message);
    process.exit(1);
  }
  const item = channelData.items && channelData.items[0];
  if (!item) {
    console.error('No channel found for that ID. Double-check YOUTUBE_CHANNEL_ID.');
    process.exit(1);
  }

  const analyticsPath = path.join(__dirname, '..', 'data', 'analytics', 'analytics.json');
  const analytics = JSON.parse(fs.readFileSync(analyticsPath, 'utf8'));

  analytics.youtube = {
    connected: true,
    subscribers: Number(item.statistics.subscriberCount),
    totalViews: Number(item.statistics.viewCount),
    videoCount: Number(item.statistics.videoCount),
    channelTitle: item.snippet.title,
    fetchedAt: new Date().toISOString()
  };
  analytics.lastImported = new Date().toISOString();

  // backup before write
  const backupDir = path.join(__dirname, '..', 'data', 'backups');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
  fs.copyFileSync(analyticsPath, path.join(backupDir, `analytics.json.${Date.now()}.bak`));

  fs.writeFileSync(analyticsPath, JSON.stringify(analytics, null, 2));
  console.log(`Imported: ${analytics.youtube.subscribers} subscribers, ${analytics.youtube.totalViews} total views.`);
  console.log('Saved to data/analytics/analytics.json (previous version backed up to data/backups/).');
}

main().catch(err => { console.error('Import failed:', err.message); process.exit(1); });
