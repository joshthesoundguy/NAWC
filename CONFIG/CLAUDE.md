# NAWC Music Command Center — Configuration (Human-Readable Source of Truth)

This file is the single place that controls white-label identity for the dashboard.
`CONFIG/config.json` mirrors this file in machine-readable form — the Node server reads
`config.json` at runtime; whenever you edit this file, update `config.json` to match
(or ask Claude to sync them for you).

## Identity
- Dashboard Name: NAWC Music Command Center
- Tagline: One sound. Every nation. One command center.
- Owner: Josh Thomas
- Brand Name: Nations Arise Worship Collective
- Abbreviation: NAWC
- Primary social handle: @NAWCmusic

## Visual Direction
- Theme: Dark & Premium
- Base surface: near-black (#0B0B0D / #121214)
- Accent: warm gold (#D4A24E) with a secondary warm amber (#E8B96B)
- Light mode: available via toggle, warm off-white base with same gold accent
- Typography: a serif or high-contrast display face for headings (worship/editorial feel),
  clean geometric sans for body and data (tabular numerals for analytics)
- Album-specific accent colors are allowed and stored per-album in data, without changing
  the global gold/near-black identity

## Brand Mission
Nations Arise Worship Collective creates Christ-centered worship music that brings
together sounds, rhythms, voices, and influences from multiple nations — one God, one
faith, one sound of worship, cultural unity, global praise, biblical truth, Spirit-led
creativity, worship beyond borders.

## Musical Identity
Afrobeat worship, Afrogospel, Nigerian worship, Ghanaian highlife, Liberian influences,
contemporary gospel, praise and worship, choir-driven arrangements, call-and-response,
live band arrangements, percussion-heavy worship, cinematic worship, hip-hop/gospel
fusion, R&B worship, soulful worship, global worship textures, congregational melodies,
traditional church influences blended with modern production.

## Audience
Christians, worship leaders, gospel music listeners, Afrobeat/Afrogospel listeners,
global worship communities, churches, choirs, young adults, Christian creatives,
musicians, worship teams, music ministries, diaspora communities.

## Brand Voice
Christ-centered, worshipful, global, uplifting, passionate, joyful, culturally aware,
spiritually grounded, bold, creative, welcoming, collaborative, modern, ministry-focused,
biblically responsible. NEVER corporate, artificial, generic, overly promotional,
celebrity-obsessed, ego-driven, culturally insensitive, or spiritually vague.
Promotion = invitation into worship, not a streams grab.

## Ministry Values (Genius Mode filter — apply to every major recommendation)
1. What would a top 1% independent worship-music operator notice?
2. What promotional, creative, ministry, or collaboration opportunity is being overlooked?
3. What risk, bottleneck, or inconsistency is being ignored?
4. Is this a repeatable release system, or a one-time campaign?
5. What builds long-term catalog value, ministry impact, and audience trust?

## Flagship Project
- Active flagship: Nations Arise Worship Collective: Volume One
- Known track: "Fire on My Lips"

## Content Pillars
1. Worship moments (performance / live clips)
2. Scripture-rooted teaching (the "why" behind a song)
3. Behind-the-scenes / creative process
4. Cultural storytelling (the nations/sounds represented)
5. Testimonies & ministry impact
6. Release-cycle promotion (countdowns, reveals, release day, post-release)
7. Collaboration spotlights

## Release Stages
Idea → Writing → Demo → Production → Vocal Recording → Editing → Mixing → Mastering →
Artwork → Distribution Setup → Campaign Planning → Pre-Save → Scheduled → Released →
Promoting → Post-Release → Archived

## Platforms (toggle per-platform in config.json)
Spotify, Apple Music, YouTube, YouTube Music, Instagram, Facebook, TikTok, Amazon Music,
Audiomack, SoundCloud, Bandcamp, Website, Email, Podcast interviews, Radio, Church/worship
outreach.

## Default CTAs
- "Come worship with the nations — new music from NAWC."
- "Listen now, wherever you stream."
- "Share this with a worship leader who needs it today."

## Scripture Preference
KJV as default translation for on-brand scripture references.

## Agent Team (rename/remove/combine anytime — logic lives in scripts/agents/)
1. Song Seed — concepts, titles, Scripture connections, avoids message repetition
2. Lyric Architect — verses/choruses/bridges/chants, versioned, preserves biblical clarity
3. Sound Designer — keys/BPM/instrumentation, Suno prompts, alt versions
4. Release Director — timelines, dependencies, missing assets, phase management
5. Campaign Builder — promo campaigns tied to a clear goal
6. Content Choreographer — turns one song into a full content ecosystem
7. Audience Analyst — reads real performance data, flags small sample sizes
8. Global Worship Scout — trend awareness filtered through brand fit
9. Collaboration Connector — outreach tracking, relationship status
10. Playlist & Media Scout — legitimate playlist/radio/media opportunities only
11. Visual Worship Director — artwork/video concepts, visual consistency
12. Catalog Keeper — metadata integrity, ISRC/UPC, credits
13. Ministry Impact Keeper — testimonies, church usage, international reach
14. Trophy Room — milestone logging across all time windows

## Feature Toggles (mirrored in config.json → features)
- liveAI: false (enable only after you approve a paid API key in .env)
- realConnectors: true (code is wired; requires your own API credentials — see Step 6 in README)
- autoBackup: true

## Folder Locations
See project root tree in README.md — CONFIG, dashboard, catalog, campaigns, content,
data, scripts, logs, tests.

## Sync Rule
`config.json` is what the app actually reads. If you change something here in plain
English, mirror it in config.json's matching field (or ask Claude to do it) so the two
never drift apart.
