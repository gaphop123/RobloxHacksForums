/**
 * Forum threads listing, detail, pagination
 */

(function () {
  const { apiFetch, showToast, escapeHtml, formatDate, API } = window.RHF;

  const threadList = document.getElementById('thread-list');
  const paginationEl = document.getElementById('pagination');
  const categoryFilter = document.getElementById('category-filter');
  const threadDetail = document.getElementById('thread-detail');

  let currentPage = 1;
  let currentCategory = '';

  // Parse URL params
  const params = new URLSearchParams(window.location.search);
  if (params.get('category')) currentCategory = params.get('category');
  if (params.get('page')) currentPage = parseInt(params.get('page'), 10) || 1;
  const threadId = params.get('id');

  if (threadList) {
    loadThreads();
  }
  if (threadDetail && threadId) {
    loadThreadDetail(threadId);
  }

  // Category sidebar clicks
  document.querySelectorAll('[data-category]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      currentCategory = el.dataset.category;
      currentPage = 1;
      loadThreads();
      // Update active state
      document.querySelectorAll('[data-category]').forEach(a => a.classList.remove('active'));
      el.classList.add('active');
    });
  });

  async function loadThreads() {
    if (!threadList) return;
    threadList.innerHTML = skeletonThreads(5);

    const qs = new URLSearchParams({ page: currentPage, limit: 10 });
    if (currentCategory) qs.set('category', currentCategory);

    try {
      const data = await apiFetch(`${API.phpBase}/threads.php?${qs}`);
      const threads = data.threads || [];
      const pag = data.pagination || {};

      if (!threads.length) {
        threadList.innerHTML = '<div class="card text-center text-muted">No threads found.</div>';
      } else {
        threadList.innerHTML = threads.map(t => `
          <a href="forum.html?id=${t.id}" class="card thread-card" style="display:grid;text-decoration:none;color:inherit">
            <div>
              <div class="thread-title">${t.title}</div>
              <div class="thread-meta">
                <span>${t.author}</span>
                <span>${t.category}</span>
                <span>${formatDate(t.created_at)}</span>
              </div>
              ${t.tags ? `<div class="tags">${t.tags.split(',').map(tag => `<span class="tag">${escapeHtml(tag.trim())}</span>`).join('')}</div>` : ''}
            </div>
            <div class="thread-stats">
              <span>${t.views} views</span>
              <span>${t.replies} replies</span>
            </div>
          </a>
        `).join('');
      }

      renderPagination(pag);
    } catch (err) {
      threadList.innerHTML = `<div class="card"><p class="text-muted">Failed to load threads: ${escapeHtml(err.message)}</p></div>`;
      showToast(err.message, 'error');
    }
  }

  function renderPagination(pag) {
    if (!paginationEl || !pag.pages || pag.pages <= 1) {
      if (paginationEl) paginationEl.innerHTML = '';
      return;
    }
    let html = '';
    html += `<button ${pag.page <= 1 ? 'disabled' : ''} data-page="${pag.page - 1}">‹</button>`;
    for (let i = 1; i <= pag.pages; i++) {
      if (pag.pages > 7 && Math.abs(i - pag.page) > 2 && i !== 1 && i !== pag.pages) {
        if (i === 2 || i === pag.pages - 1) html += `<span>…</span>`;
        continue;
      }
      html += `<button class="${i === pag.page ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }
    html += `<button ${pag.page >= pag.pages ? 'disabled' : ''} data-page="${pag.page + 1}">›</button>`;
    paginationEl.innerHTML = html;
    paginationEl.querySelectorAll('button[data-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        currentPage = parseInt(btn.dataset.page, 10);
        loadThreads();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
  }

  function skeletonThreads(n) {
    return Array(n).fill(0).map(() => `
      <div class="card">
        <div class="skeleton skeleton-line medium"></div>
        <div class="skeleton skeleton-line short"></div>
      </div>
    `).join('');
  }

  async function loadThreadDetail(id) {
    threadDetail.innerHTML = `
      <div class="card">
        <div class="skeleton skeleton-line medium"></div>
        <div class="skeleton skeleton-line"></div>
        <div class="skeleton skeleton-line short"></div>
      </div>
    `;
    try {
      const data = await apiFetch(`${API.phpBase}/threads.php?id=${id}`);
      const t = data.thread;
      if (!t) throw new Error('Thread not found');

      threadDetail.innerHTML = `
        <div class="card">
          <h1 style="font-size:1.35rem;margin-bottom:0.5rem">${t.title}</h1>
          <div class="thread-meta mb-2">
            <span>${t.author}</span>
            <span class="badge badge-demo">${t.category}</span>
            <span>${formatDate(t.created_at)}</span>
            <span>${t.views} views • ${t.replies} replies</span>
          </div>
          ${t.tags ? `<div class="tags mb-2">${t.tags.split(',').map(tag => `<span class="tag">${escapeHtml(tag.trim())}</span>`).join('')}</div>` : ''}
          <div style="white-space:pre-wrap;line-height:1.7">${t.content}</div>
        </div>
        <div id="comments-root" data-thread-id="${t.id}"></div>
      `;

      // Load comments module if present
      if (window.loadComments) {
        window.loadComments(t.id);
      }
    } catch (err) {
      threadDetail.innerHTML = `<div class="card"><p class="text-muted">${escapeHtml(err.message)}</p></div>`;
    }
  }

  // New thread form
  const newThreadForm = document.getElementById('new-thread-form');
  if (newThreadForm) {
    newThreadForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('nt-title').value.trim();
      const content = document.getElementById('nt-content').value.trim();
      const category = document.getElementById('nt-category').value;
      const tags = document.getElementById('nt-tags').value.trim();

      if (!title || !content) {
        showToast('Title and content required', 'error');
        return;
      }

      try {
        const data = await apiFetch(`${API.phpBase}/threads.php`, {
          method: 'POST',
          body: { title, content, category, tags },
        });
        showToast('Thread created (demo)', 'success');
        window.location.href = `forum.html?id=${data.thread.id}`;
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }
})();
