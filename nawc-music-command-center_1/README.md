# NAWC Music Command Center

A local, white-labeled operating system for Nations Arise Worship Collective's
songs, releases, promotion, analytics, collaborators, and ministry impact.
Everything runs on your machine as plain HTML/CSS/JS/JSON — no cloud database,
no required subscription, nothing you can't open and edit yourself.

## 1. Run it (60 seconds)

Requires [Node.js](https://nodejs.org) 18+ (no other dependencies — check with `node -v`).

```bash
cd nawc-music-command-center
npm start
```

Open **http://localhost:4477** in your browser. That's the whole app.

Run `npm test` any time to verify the server, data files, and dashboard are all
working — it's the same smoke test used to build this.

## 2. Where things live

- `CONFIG/CLAUDE.md` — human-readable brand config (name, colors, agents, values). **Edit this first** to rename or restyle anything.
- `CONFIG/config.json` — the machine-readable mirror the app actually reads. Keep both in sync.
- `catalog/` — songs and albums, with lyrics/prompt versioning and metadata.
- `campaigns/`, `content/` — promotion.
- `data/` — releases, analytics, collaborators, opportunities, ministry impact, trophy room, and automatic backups.
- `scripts/` — the server, connectors, backup/restore, launchd automation.
- `dashboard/` — the actual front-end.

## 3. Adding real data

### YouTube (real, working — just needs your key)
1. https://console.cloud.google.com/ → new project → enable **YouTube Data API v3**
2. Create an API key
3. `cp .env.example .env` and fill in `YOUTUBE_API_KEY` and `YOUTUBE_CHANNEL_ID`
4. `npm run import:youtube`

This actually calls the real YouTube API and writes real subscriber/view counts
into `data/analytics/analytics.json`, with a backup of the previous version made
automatically first.

### Spotify / Apple Music (real, via export — not a live API)
Spotify and Apple Music do **not** give independent artists a public API for
their own stream counts. The legitimate paths are:
- Spotify for Artists → Export data (CSV)
- Apple Music for Artists → Reports
- Your distributor's (DistroKid, etc.) royalty/streaming export

Once you have a CSV: `node scripts/import-distributor-csv.js path/to/export.csv`
Each import is appended as a dated batch — nothing is overwritten, so you can
track catalog performance release over release.

### Instagram / Facebook / TikTok
Code hooks exist in `.env.example` for Meta Graph API and TikTok for Developers
tokens. These require you to register a developer app and get your own account
approved for the relevant scopes — I can't do that step for you, but once you
have a token, tell me and I'll wire up the same pattern used for YouTube.

**Update:** once you sent the real Spotify/Apple Music/YouTube links, all 8
tracks from *Volume One* were pulled in live from those pages and are now in
`catalog/songs/` with real Spotify track links, the Apple Music album link,
release date (May 1, 2026), and your confirmed YouTube channel ID
(`UCtsuBpVb6IdMHEUS16WoNOA`) pre-filled in `.env.example`. Stream *counts*
still show "not connected" in Analytics — that requires you to add your own
`YOUTUBE_API_KEY` and run a distributor CSV export, since neither Spotify nor
Apple expose those numbers publicly. Nothing there is invented.

## 4. The command box

Try things like:
- `show unfinished songs`
- `upcoming releases`
- `recent wins`
- `what should NAWC post today`

It runs against your real local data using simple rule-matching — no API key
needed. `dashboard/js/app.js` has the pattern list near the bottom; add more
patterns any time.

## 5. Backups & restore

- Automatic: every write through the dashboard backs up the previous version of that file to `data/backups/` before saving.
- Manual full backup: `npm run backup`
- Restore: `node scripts/restore.js data/backups/full-backup-<timestamp>/` — this itself makes a safety copy of your *current* state first, so a restore is reversible too.
- Old full-backups auto-prune after 30 days; per-write `.bak` files are kept.

## 6. Automating backups (Mac)

`scripts/launchd/com.nawc.dailybackup.plist` is a template for a 3am daily
backup via `launchd`.

1. Edit the two `YOURNAME`/path placeholders inside the plist to match your
   actual project location and `which node` output.
2. `cp scripts/launchd/com.nawc.dailybackup.plist ~/Library/LaunchAgents/`
3. `launchctl load ~/Library/LaunchAgents/com.nawc.dailybackup.plist`
4. Check `logs/launchd-backup.log` the next morning to confirm it ran.

## 7. Proof this actually works end-to-end

Already demonstrated during this build (see conversation): a song idea was
written through the live API, persisted to disk, auto-backed-up on write, a
full project backup was taken, the idea file was wiped to simulate data loss,
and `scripts/restore.js` brought it back byte-for-byte. `npm test` re-runs the
core version of these checks (JSON validity + live server + API responses)
any time you want to confirm the system is healthy.

## 8. What's real vs. what's a placeholder right now

**Real:** the app itself, all 8 *Volume One* tracks with real Spotify/Apple
Music links and the confirmed May 1, 2026 release date, the YouTube channel
ID, the YouTube connector, the distributor CSV importer, backup/restore,
automation template.

**Placeholder, waiting on your input:** ISRC/UPC per track (pull from your
DistroKid dashboard), writer/producer/vocalist credits, artwork/music video
asset files, collaborators, opportunities, and all stream-count analytics
until you add a `YOUTUBE_API_KEY` and/or run a distributor CSV import.

Nothing was invented to make the dashboard look fuller than it is.
