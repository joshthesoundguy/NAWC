let STATE = null;

const viewsEl = document.getElementById('views');
const loadingEl = document.getElementById('loadingState');
const offlineEl = document.getElementById('offlineState');

async function boot() {
  try {
    const res = await fetch('/api/bootstrap');
    if (!res.ok) throw new Error('bad response');
    STATE = await res.json();
    loadingEl.hidden = true;
    offlineEl.hidden = true;
    document.getElementById('dashboardName').textContent = STATE.config.identity.dashboardName;
    document.title = STATE.config.identity.dashboardName;
    applyTheme(localStorage.getItem('nawc-theme') || STATE.config.theme.default);
    renderAll();
    wireNav();
  } catch (e) {
    loadingEl.hidden = true;
    offlineEl.hidden = false;
  }
}

function applyTheme(mode) {
  document.documentElement.setAttribute('data-theme', mode);
  localStorage.setItem('nawc-theme', mode);
}
document.getElementById('themeToggle').addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  applyTheme(current === 'dark' ? 'light' : 'dark');
});

function wireNav() {
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
      document.getElementById('view-' + link.dataset.view).classList.add('active');
      document.getElementById('mainContent').focus();
    });
  });
}

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else node.setAttribute(k, v);
  }
  children.forEach(c => node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c));
  return node;
}

function songMissing(song) {
  const missing = [];
  if (!song.lyrics || !song.lyrics.currentVersion) missing.push('lyrics');
  if (!song.assets || !song.assets.artwork || song.assets.artwork.status === 'unknown' || song.assets.artwork.status === 'missing') missing.push('artwork');
  if (!song.credits || (!song.credits.writers?.length && !song.credits.producers?.length)) missing.push('credits');
  if (!song.isrc) missing.push('ISRC');
  return missing;
}

function renderAll() {
  viewsEl.innerHTML = '';
  viewsEl.appendChild(renderHome());
  viewsEl.appendChild(renderCatalog());
  viewsEl.appendChild(renderSongLab());
  viewsEl.appendChild(renderReleases());
  viewsEl.appendChild(renderCampaigns());
  viewsEl.appendChild(renderContent());
  viewsEl.appendChild(renderAnalytics());
  viewsEl.appendChild(renderCollaborators());
  viewsEl.appendChild(renderOpportunities());
  viewsEl.appendChild(renderImpact());
  viewsEl.appendChild(renderTrophy());
  viewsEl.appendChild(renderSettings());
  document.getElementById('view-home').classList.add('active');
}

function viewWrapper(id, title, subtitle, bodyChildren) {
  const section = el('section', { class: 'view', id: 'view-' + id });
  section.appendChild(el('h1', { class: 'view-title' }, [title]));
  if (subtitle) section.appendChild(el('p', { class: 'view-subtitle' }, [subtitle]));
  bodyChildren.forEach(c => section.appendChild(c));
  return section;
}

function renderHome() {
  const { songs, releases, campaigns, analytics, trophy, config } = STATE;
  const flagshipAlbum = STATE.albums.find(a => a.id === config.flagship.projectId);
  const inProgress = songs.filter(s => s.status && s.status !== 'Released');
  const blocked = songs.filter(s => songMissing(s).length > 0 && s.status === 'Released');

  const grid = el('div', { class: 'grid grid-3' });
  grid.appendChild(el('div', { class: 'card' }, [
    el('h3', {}, ['Active Flagship']),
    el('p', {}, [flagshipAlbum ? flagshipAlbum.title : 'None set']),
    el('span', { class: 'badge badge-accent' }, [flagshipAlbum ? flagshipAlbum.status : ''])
  ]));
  grid.appendChild(el('div', { class: 'card' }, [
    el('h3', {}, ['Songs In Progress']),
    el('p', {}, [String(inProgress.length)]),
    el('span', { class: 'meta' }, [inProgress.length ? inProgress.map(s => s.title).join(', ') : 'Nothing in the pipeline yet — add one in Song Lab.'])
  ]));
  grid.appendChild(el('div', { class: 'card' }, [
    el('h3', {}, ['Released Songs Missing Metadata']),
    el('p', {}, [String(blocked.length)]),
    el('span', { class: 'meta' }, [blocked.length ? blocked.map(s => s.title).join(', ') : 'Catalog is clean.'])
  ]));

  const analyticsCard = el('div', { class: 'card' }, [
    el('h3', {}, ['Streaming / Social Snapshot']),
    el('p', { class: 'meta' }, [analytics.lastImported ? 'Last imported: ' + analytics.lastImported : 'No live data imported yet. See Analytics tab.'])
  ]);

  const recentWins = trophy.slice(-3).reverse();
  const trophyCard = el('div', { class: 'card' }, [
    el('h3', {}, ['Recent Wins']),
    ...(recentWins.length ? recentWins.map(m => el('p', { class: 'meta' }, [m.title])) : [el('p', { class: 'meta' }, ['Nothing logged yet.'])])
  ]);

  const nextAction = el('div', { class: 'card' }, [
    el('h3', {}, ['Recommended Next Action']),
    el('p', {}, [blocked.length
      ? `Finish metadata for "${blocked[0].title}" — missing: ${songMissing(blocked[0]).join(', ')}.`
      : (inProgress.length
        ? `Keep moving "${inProgress[0].title}" through its release stage.`
        : 'Add a new song idea in Song Lab to keep the pipeline full.')])
  ]);

  const body = [grid, el('div', { class: 'grid grid-2', html: '' })];
  const row2 = el('div', { class: 'grid grid-3' });
  row2.appendChild(analyticsCard); row2.appendChild(trophyCard); row2.appendChild(nextAction);
  body.push(row2);

  body.push(el('h3', {}, ['Agent Team']));
  const agentGrid = el('div', { class: 'agent-grid' });
  config.agents.forEach(a => {
    agentGrid.appendChild(el('div', { class: 'agent-card' }, [
      el('h4', {}, [a.name]), el('p', {}, [a.role])
    ]));
  });
  body.push(agentGrid);

  return viewWrapper('home', config.identity.dashboardName, config.identity.tagline, body);
}

function renderCatalog() {
  const table = el('table', {});
  const thead = el('thead', {}, [el('tr', {}, ['Title', 'Album', 'Status', 'Genre', 'Missing'].map(h => el('th', {}, [h])))]);
  const tbody = el('tbody', {});
  STATE.songs.forEach(s => {
    const missing = songMissing(s);
    tbody.appendChild(el('tr', {}, [
      el('td', {}, [s.title]),
      el('td', {}, [(STATE.albums.find(a => a.id === s.albumId) || {}).title || '—']),
      el('td', {}, [el('span', { class: 'badge' }, [s.status || 'Unknown'])]),
      el('td', {}, [s.genre || '—']),
      el('td', {}, [missing.length ? missing.join(', ') : '— none —'])
    ]));
  });
  table.appendChild(thead); table.appendChild(tbody);
  const body = STATE.songs.length ? [table] : [el('div', { class: 'empty-state' }, ['No songs in the catalog yet.'])];
  return viewWrapper('catalog', 'Catalog', 'Every song and release, with stable IDs and full metadata.', body);
}

function renderSongLab() {
  const body = [];
  if (!STATE.ideas.length) {
    body.push(el('div', { class: 'empty-state' }, ['No song ideas logged yet. Use the command box: "add song idea".']));
  } else {
    const grid = el('div', { class: 'grid grid-3' });
    STATE.ideas.forEach(i => grid.appendChild(el('div', { class: 'card' }, [el('h3', {}, [i.title]), el('p', { class: 'meta' }, [i.theme || ''])])));
    body.push(grid);
  }
  return viewWrapper('songlab', 'Song Lab', 'Creative development — ideas, hooks, lyric fragments, Suno prompts.', body);
}

function renderReleases() {
  const table = el('table', {});
  table.appendChild(el('thead', {}, [el('tr', {}, ['Song', 'Stage', 'Open Tasks'].map(h => el('th', {}, [h])))]));
  const tbody = el('tbody', {});
  STATE.releases.forEach(r => {
    const song = STATE.songs.find(s => s.id === r.songId);
    const openTasks = r.tasks.filter(t => !t.done);
    tbody.appendChild(el('tr', {}, [
      el('td', {}, [song ? song.title : r.songId]),
      el('td', {}, [el('span', { class: 'badge badge-accent' }, [r.stage])]),
      el('td', {}, [openTasks.length ? openTasks.map(t => t.task).join('; ') : 'All clear'])
    ]));
  });
  table.appendChild(tbody);
  return viewWrapper('releases', 'Release Center', 'Every release, idea to publication.', [table]);
}

function renderCampaigns() {
  const body = STATE.campaigns.length
    ? [el('p', {}, [STATE.campaigns.length + ' campaign(s) tracked.'])]
    : [el('div', { class: 'empty-state' }, ['No campaigns yet. Try the command box: "build a campaign for Fire on My Lips".'])];
  return viewWrapper('campaigns', 'Promotion Studio', 'Campaigns tied to a clear goal, platform, and release.', body);
}

function renderContent() {
  return viewWrapper('content', 'Content', 'Individual content pieces feeding your campaigns.',
    [el('div', { class: 'empty-state' }, ['No content pieces logged yet.'])]);
}

function renderAnalytics() {
  const a = STATE.analytics;
  const body = [];
  body.push(el('div', { class: 'state-banner' }, [a._note || '']));
  const grid = el('div', { class: 'grid grid-3' });
  grid.appendChild(el('div', { class: 'card' }, [el('h3', {}, ['YouTube']), el('p', { class: 'meta' }, [a.youtube.connected ? String(a.youtube.subscribers) + ' subscribers' : 'Not connected'])]));
  grid.appendChild(el('div', { class: 'card' }, [el('h3', {}, ['Spotify']), el('p', { class: 'meta' }, [a.spotify.note])]));
  grid.appendChild(el('div', { class: 'card' }, [el('h3', {}, ['Instagram / TikTok']), el('p', { class: 'meta' }, ['Not connected'])]));
  body.push(grid);
  return viewWrapper('analytics', 'Analytics', 'Real numbers only — nothing here is estimated or invented.', body);
}

function renderCollaborators() {
  const body = STATE.collaborators.length
    ? [el('p', {}, [STATE.collaborators.length + ' collaborator(s) tracked.'])]
    : [el('div', { class: 'empty-state' }, ['No collaborators logged yet.'])];
  return viewWrapper('collaborators', 'Collaboration Room', 'Artists, vocalists, choirs, producers, and outreach status.', body);
}

function renderOpportunities() {
  const body = STATE.opportunities.length
    ? [el('p', {}, [STATE.opportunities.length + ' opportunit(y/ies) tracked.'])]
    : [el('div', { class: 'empty-state' }, ['No opportunities logged yet.'])];
  return viewWrapper('opportunities', 'Opportunities', 'Playlists, radio, features, festivals, sync, and more.', body);
}

function renderImpact() {
  const body = STATE.impact.length
    ? [el('p', {}, [STATE.impact.length + ' stor(y/ies) logged.'])]
    : [el('div', { class: 'empty-state' }, ['No ministry impact stories logged yet.'])];
  return viewWrapper('impact', 'Ministry Impact', 'Testimonies, church usage, and reach — the mission behind the metrics.', body);
}

function renderTrophy() {
  const table = el('table', {});
  table.appendChild(el('thead', {}, [el('tr', {}, ['Type', 'Title', 'Date'].map(h => el('th', {}, [h])))]));
  const tbody = el('tbody', {});
  STATE.trophy.forEach(m => {
    tbody.appendChild(el('tr', {}, [el('td', {}, [m.type]), el('td', {}, [m.title]), el('td', {}, [m.date || '—'])]));
  });
  table.appendChild(tbody);
  return viewWrapper('trophy', 'Trophy Room', 'Every completed milestone, filterable and exportable.', [table]);
}

function renderSettings() {
  const cfg = STATE.config;
  const body = [
    el('div', { class: 'card' }, [
      el('h3', {}, ['White-Label Identity']),
      el('p', { class: 'meta' }, ['Edit CONFIG/CLAUDE.md and CONFIG/config.json to change any of this. Dashboard name: ' + cfg.identity.dashboardName + ' · Owner: ' + cfg.identity.owner])
    ]),
    el('div', { class: 'card' }, [
      el('h3', {}, ['Feature Toggles']),
      el('p', { class: 'meta' }, ['Live AI: ' + cfg.features.liveAI + ' · Real Connectors: ' + cfg.features.realConnectors + ' · Auto Backup: ' + cfg.features.autoBackup])
    ])
  ];
  return viewWrapper('settings', 'Settings', 'White-label configuration lives in CONFIG/.', body);
}

// --- Command box ---
document.getElementById('commandForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const input = document.getElementById('commandInput');
  const cmd = input.value.trim().toLowerCase();
  const out = document.getElementById('commandOutput');
  if (!cmd) return;

  if (cmd.includes('unfinished song') || cmd.includes('missing artwork') || cmd.includes('missing lyrics') || cmd.includes('missing credits')) {
    const results = STATE.songs.filter(s => songMissing(s).length > 0);
    out.textContent = results.length
      ? results.map(s => `${s.title}: missing ${songMissing(s).join(', ')}`).join('\n')
      : 'Nothing missing — catalog is clean.';
  } else if (cmd.includes('upcoming release')) {
    const upcoming = STATE.releases.filter(r => r.stage !== 'Released' && r.stage !== 'Post-Release' && r.stage !== 'Archived');
    out.textContent = upcoming.length ? upcoming.map(r => r.songId + ' — ' + r.stage).join('\n') : 'No upcoming releases in the pipeline.';
  } else if (cmd.includes('recent win')) {
    out.textContent = STATE.trophy.slice(-5).map(m => m.title).join('\n') || 'Nothing logged yet.';
  } else if (cmd.includes('what should nawc post') || cmd.includes('post today')) {
    out.textContent = 'No active campaign scheduled today. Build one from the Campaigns tab, or ask: "build a campaign for Fire on My Lips".';
  } else if (cmd.includes('stale project')) {
    out.textContent = 'Nothing flagged as stale yet — this needs updatedAt tracking once you have more than one song in motion.';
  } else {
    out.textContent = `Command not recognized yet: "${cmd}". This is a starter command set — more patterns can be added in dashboard/js/app.js as you use it.`;
  }
});

boot();
