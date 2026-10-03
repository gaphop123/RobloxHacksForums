/**
 * Core application utilities for RobloxHacksForums
 */

const API = {
  // Prefer PHP endpoints when available; fall back to Python direct
  phpBase: (window.PHP_API_BASE || '/php'),
  pyBase:  (window.PYTHON_API_BASE || 'http://127.0.0.1:5000'),
};

async function apiFetch(url, options = {}) {
  const defaults = {
    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
  };
  const opts = { ...defaults, ...options };
  if (opts.body && typeof opts.body === 'object') {
    opts.body = JSON.stringify(opts.body);
  }
  const res = await fetch(url, opts);
  let data;
  try {
    data = await res.json();
  } catch {
    data = { error: 'Invalid JSON response' };
  }
  if (!res.ok) {
    const err = new Error(data.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

/* ---------- Toast ---------- */
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

/* ---------- Modal ---------- */
function openModal(html) {
  let overlay = document.querySelector('.modal-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `<div class="modal"><div class="modal-header"><h2></h2><button class="modal-close" aria-label="Close">&times;</button></div><div class="modal-body"></div></div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('.modal-close').addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
  }
  overlay.querySelector('.modal-body').innerHTML = html;
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const overlay = document.querySelector('.modal-overlay');
  if (overlay) {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }
}

/* ---------- Status Badge helper ---------- */
function statusBadge(status) {
  if (!status) return '';
  const s = String(status).toUpperCase().replace(/\s+/g, '-');
  const map = {
    'SIMULATED': 'badge-simulated',
    'UNKNOWN': 'badge-unknown',
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
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  } catch {
    return iso;
  }
}

/* ---------- Navbar mobile ---------- */
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.querySelector('.hamburger');
  const links = document.querySelector('.nav-links');
  if (btn && links) {
    btn.addEventListener('click', () => links.classList.toggle('open'));
  }

  // Global search form
  const searchForm = document.getElementById('global-search');
  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = searchForm.querySelector('input').value.trim();
      if (q) {
        window.location.href = `search.html?q=${encodeURIComponent(q)}`;
      }
    });
  }
});

/* Export for other modules */
window.RHF = {
  apiFetch,
  showToast,
  openModal,
  closeModal,
  statusBadge,
  escapeHtml,
  formatDate,
  API,
};
