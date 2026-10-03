/**
 * RobloxHacksForums – Static / GitHub Pages core
 * Forum data + comments in localStorage. Player lookup via public Roblox APIs (CORS proxy fallback).
 */

const STORAGE_KEY = 'rhf_data_v1';

const SEED = {
  threads: [
    {
      id: 1,
      title: 'Welcome to RobloxHacksForums (Demo)',
      author: '[DEMO] Moderator',
      content: 'This is a fictional community/demo project for UI and backend research.\n\nAll exploit compatibility results are SIMULATED.\nDo not treat any data as verified security information.',
      category: 'Announcements',
      tags: 'welcome,demo,important',
      views: 128,
      replies: 2,
      created_at: '2026-09-15T10:00:00Z',
      is_demo: 1,
    },
    {
      id: 2,
      title: 'How does the player lookup work?',
      author: '[SIMULATION] RobloxResearcher',
      content: 'On GitHub Pages the frontend calls public Roblox APIs (with a CORS proxy when needed).\nNo private data is scraped.',
      category: 'Roblox',
      tags: 'api,lookup,public',
      views: 89,
      replies: 1,
      created_at: '2026-09-20T14:30:00Z',
      is_demo: 1,
    },
    {
      id: 3,
      title: 'Simulated Compatibility Checker explained',
      author: '[DEMO] Guest',
      content: 'Select Player / Exploit / Game / Version. The system returns a DEMO status only:\nSIMULATED, UNKNOWN, NOT TESTED, DEMO PASS, DEMO FAIL.\nNo real exploit testing is performed.',
      category: 'Compatibility',
      tags: 'simulation,demo',
      views: 67,
      replies: 0,
      created_at: '2026-09-22T09:00:00Z',
      is_demo: 1,
    },
    {
      id: 4,
      title: 'Example Executor v1.0 notes (demo)',
      author: '[SIMULATION] ScriptDev',
      content: 'This record is purely for demonstration of the Exploit Database UI.\nStatus is always marked SIMULATED.',
      category: 'Exploit Research',
      tags: 'executor,demo',
      views: 45,
      replies: 1,
      created_at: '2026-09-25T16:00:00Z',
      is_demo: 1,
    },
    {
      id: 5,
      title: 'UI feedback and responsive design',
      author: '[DEMO] Anonymous',
      content: 'Dark mode, cards, badges, skeleton loaders, toasts – all pure frontend.\nFeel free to comment anonymously (stored in your browser localStorage on this static demo).',
      category: 'Development',
      tags: 'ui,css,js',
      views: 34,
      replies: 0,
      created_at: '2026-09-28T11:00:00Z',
      is_demo: 1,
    },
    {
      id: 6,
      title: 'Off-topic: best Roblox experiences?',
      author: '[DEMO] Guest',
      content: 'Just chatting – remember this whole site is a simulation.',
      category: 'Off Topic',
      tags: 'chat',
      views: 22,
      replies: 0,
      created_at: '2026-10-01T08:00:00Z',
      is_demo: 1,
    },
    {
      id: 7,
      title: 'Script sharing guidelines (demo)',
      author: '[SIMULATION] RobloxResearcher',
      content: 'No real scripts that claim to bypass security are hosted here.\nEverything is educational / UI demo.',
      category: 'Scripts',
      tags: 'guidelines',
      views: 56,
      replies: 0,
      created_at: '2026-09-18T12:00:00Z',
      is_demo: 1,
    },
    {
      id: 8,
      title: 'Pagination and search test thread',
      author: '[DEMO] Moderator',
      content: 'Used to demonstrate search across threads and pagination.',
      category: 'General',
      tags: 'search,test',
      views: 15,
      replies: 0,
      created_at: '2026-10-02T07:00:00Z',
      is_demo: 1,
    },
  ],
  comments: {
    1: [
      { id: 1, username: 'Anonymous', content: 'Demo comment on welcome thread.', created_at: '2026-09-16T10:00:00Z', is_demo: 1 },
      { id: 2, username: 'Anonymous', content: 'All content is simulated.', created_at: '2026-09-17T11:00:00Z', is_demo: 1 },
    ],
    2: [
      { id: 3, username: 'Anonymous', content: 'Thanks for the explanation!', created_at: '2026-09-21T09:00:00Z', is_demo: 1 },
    ],
    4: [
      { id: 4, username: 'Anonymous', content: 'Demo only – not a real executor.', created_at: '2026-09-26T10:00:00Z', is_demo: 1 },
    ],
  },
  exploits: [
    { exploit_name: 'ExampleExecutor', version: 'v1.0', supported_games: 'Demo Game, Example Place', simulated_status: 'SIMULATED', last_simulated_test: '2026-10-03', notes: 'Demo compatibility record only' },
    { exploit_name: 'DemoScriptHub', version: 'v2.3', supported_games: 'Multiple demo experiences', simulated_status: 'DEMO PASS', last_simulated_test: '2026-09-28', notes: 'Simulated test – not real' },
    { exploit_name: 'TestInjector', version: 'v0.9-beta', supported_games: 'None (demo)', simulated_status: 'NOT TESTED', last_simulated_test: '2026-09-15', notes: 'Placeholder for UI' },
    { exploit_name: 'SimExecutor', version: 'v1.2', supported_games: 'Roblox Studio demo', simulated_status: 'UNKNOWN', last_simulated_test: '2026-10-01', notes: 'No verified data' },
    { exploit_name: 'FakeBypass', version: 'v3.0', supported_games: 'N/A', simulated_status: 'DEMO FAIL', last_simulated_test: '2026-08-20', notes: 'Intentionally fails for demo' },
  ],
  nextCommentId: 10,
  nextThreadId: 10,
};

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  const data = JSON.parse(JSON.stringify(SEED));
  saveData(data);
  return data;
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function showToast(message, type = 'info', duration = 3500) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

function statusBadge(status) {
  if (!status) return '';
  const s = String(status).toUpperCase().replace(/\s+/g, '-');
  const map = {
    SIMULATED: 'badge-simulated',
    UNKNOWN: 'badge-unknown',
    'NOT-TESTED': 'badge-not-tested',
    'DEMO-PASS': 'badge-demo-pass',
    'DEMO-FAIL': 'badge-demo-fail',
  };
  const cls = map[s] || 'badge-demo';
  return `<span class="badge ${cls}">${escapeHtml(status)}</span>`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

/** Fetch with optional CORS proxies for GitHub Pages (Roblox blocks browser CORS). */
async function fetchJson(url, options = {}) {
  const proxies = [
    (u) => u, // direct first
    (u) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
    (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  ];
  let lastErr;
  for (const wrap of proxies) {
    try {
      const res = await fetch(wrap(url), {
        ...options,
        headers: { Accept: 'application/json', ...(options.headers || {}) },
      });
      if (!res.ok) {
        lastErr = new Error(`HTTP ${res.status}`);
        if (res.status === 404) throw Object.assign(new Error('Player not found'), { status: 404 });
        continue;
      }
      return await res.json();
    } catch (e) {
      if (e.status === 404) throw e;
      lastErr = e;
    }
  }
  throw lastErr || new Error('Roblox API is temporarily unavailable.');
}

async function lookupPlayer({ username, user_id }) {
  if (user_id) {
    const uid = parseInt(user_id, 10);
    if (!uid) throw new Error('Invalid User ID');
    const user = await fetchJson(`https://users.roblox.com/v1/users/${uid}`);
    return enrichPlayer(user);
  }
  if (username) {
    const data = await fetchJson('https://users.roblox.com/v1/usernames/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernames: [username], excludeBannedUsers: false }),
    });
    if (!data.data || !data.data.length) {
      const err = new Error('Player not found');
      err.status = 404;
      throw err;
    }
    const basic = data.data[0];
    const user = await fetchJson(`https://users.roblox.com/v1/users/${basic.id}`);
    return enrichPlayer(user);
  }
  throw new Error('Provide username or user_id');
}

async function enrichPlayer(user) {
  const result = {
    user_id: user.id,
    username: user.name,
    display_name: user.displayName || user.name,
    created: user.created || null,
    profile_url: `https://www.roblox.com/users/${user.id}/profile`,
    avatar_url: null,
    presence: null,
  };
  try {
    const thumb = await fetchJson(
      `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${user.id}&size=150x150&format=Png&isCircular=false`
    );
    if (thumb.data && thumb.data[0] && thumb.data[0].imageUrl) {
      result.avatar_url = thumb.data[0].imageUrl;
    }
  } catch (_) {}
  return result;
}

function simulateCompatibility(player, exploit, game, version) {
  const key = `${player}|${exploit}|${game}|${version || 'any'}`.toLowerCase().trim();
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  const statuses = ['SIMULATED', 'UNKNOWN', 'NOT TESTED', 'DEMO PASS', 'DEMO FAIL'];
  const status = statuses[hash % statuses.length];
  return {
    player: player || 'Unknown',
    exploit: exploit || 'Unknown',
    game: game || 'Unknown',
    version: version || 'any',
    compatibility: 'Simulated',
    status,
    confidence: status.includes('DEMO') ? 'Simulated only' : 'Demo',
    message: 'No verified data available. Simulation result only.',
    disclaimer:
      'This is a fictional / demo result. RobloxHacksForums does not verify whether any exploit actually works.',
  };
}

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.querySelector('.hamburger');
  const links = document.querySelector('.nav-links');
  if (btn && links) btn.addEventListener('click', () => links.classList.toggle('open'));

  const searchForm = document.getElementById('global-search');
  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = searchForm.querySelector('input').value.trim();
      if (q) window.location.href = `search.html?q=${encodeURIComponent(q)}`;
    });
  }
});

window.RHF = {
  loadData,
  saveData,
  showToast,
  statusBadge,
  escapeHtml,
  formatDate,
  lookupPlayer,
  simulateCompatibility,
  SEED,
};
