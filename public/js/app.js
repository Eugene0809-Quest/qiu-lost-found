// public/js/app.js — Shared utilities used by all pages

// ─── TOKEN / AUTH HELPERS ───────────────────────────────────
const Auth = {
  getToken() { return localStorage.getItem('lf_token'); },
  getUser()  { const u = localStorage.getItem('lf_user'); return u ? JSON.parse(u) : null; },
  save(token, user) {
    localStorage.setItem('lf_token', token);
    localStorage.setItem('lf_user', JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem('lf_token');
    localStorage.removeItem('lf_user');
  },
  isLoggedIn() { return !!this.getToken(); },
  redirectIfLoggedOut() {
    if (!this.isLoggedIn()) { window.location.href = '/login.html'; }
  },
  redirectIfLoggedIn() {
    if (this.isLoggedIn()) { window.location.href = '/home.html'; }
  }
};

// ─── API HELPER ─────────────────────────────────────────────
const API = {
  base: '/api',

  async request(method, path, data = null) {
    const opts = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(Auth.getToken() ? { 'Authorization': `Bearer ${Auth.getToken()}` } : {})
      }
    };
    if (data) opts.body = JSON.stringify(data);

    const res  = await fetch(this.base + path, opts);
    const json = await res.json();

    // If 401/403 — token expired → back to login
    if (res.status === 401 || res.status === 403) {
      Auth.clear();
      window.location.href = '/login.html';
    }

    return { ok: res.ok, status: res.status, data: json };
  },

  get(path)          { return this.request('GET',    path); },
  post(path, data)   { return this.request('POST',   path, data); },
  put(path, data)    { return this.request('PUT',    path, data); },
  patch(path, data)  { return this.request('PATCH',  path, data); },
  delete(path)       { return this.request('DELETE', path); },
};

// ─── TOAST NOTIFICATIONS ────────────────────────────────────
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = { success: '✓', error: '✗', info: 'ℹ', warning: '⚠' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type] || 'ℹ'}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity .3s';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ─── MODAL HELPERS ──────────────────────────────────────────
function openModal(id) {
  const el = document.getElementById(id);
  if (el) { el.classList.add('open'); document.body.style.overflow = 'hidden'; }
}
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) { el.classList.remove('open'); document.body.style.overflow = ''; }
}

// Close modal when clicking overlay background
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
    document.body.style.overflow = '';
  }
});

// ─── DATE FORMAT HELPER ──────────────────────────────────────
function fmtDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── ESCAPE HTML (XSS prevention in frontend) ───────────────
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;')
    .replace(/'/g,'&#x27;');
}

// ─── NAVBAR ACTIVE LINK ──────────────────────────────────────
function setActiveNav() {
  const path = window.location.pathname.replace('/', '') || 'home.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href') || '';
    if (href.includes(path) || (path === 'home.html' && href.includes('home'))) {
      a.classList.add('active');
    }
  });
}

// ─── RENDER NAVBAR USER INFO ─────────────────────────────────
function initNavbar() {
  const user = Auth.getUser();
  const nameEl = document.getElementById('nav-user-name');
  if (nameEl && user) nameEl.textContent = user.name;

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      Auth.clear();
      window.location.href = '/login.html';
    });
  }

  // Hamburger menu
  const hamburger = document.querySelector('.hamburger');
  const navLinks  = document.querySelector('.nav-links');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => navLinks.classList.toggle('open'));
  }

  setActiveNav();
}

// ─── STATUS BADGE HTML ───────────────────────────────────────
function statusBadge(status) {
  const labels = { active: 'Active', claimed: 'Claimed', resolved: 'Resolved' };
  return `<span class="badge badge-${status}">${labels[status] || status}</span>`;
}

function typeBadge(type) {
  return `<span class="badge badge-${type}">${type === 'lost' ? '🔍 Lost' : '📦 Found'}</span>`;
}
