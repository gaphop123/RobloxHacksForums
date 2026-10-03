(function () {
  const { loadData, saveData, showToast, escapeHtml, formatDate } = window.RHF;

  const threadList = document.getElementById('thread-list');
  const paginationEl = document.getElementById('pagination');
  const threadDetail = document.getElementById('thread-detail');

  let currentPage = 1;
  let currentCategory = '';
  const PAGE_SIZE = 10;

  const params = new URLSearchParams(window.location.search);
  if (params.get('category')) currentCategory = params.get('category');
  if (params.get('page')) currentPage = parseInt(params.get('page'), 10) || 1;
  const threadId = params.get('id');

  if (threadList) loadThreads();
  if (threadDetail && threadId) loadThreadDetail(parseInt(threadId, 10));

  document.querySelectorAll('[data-category]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      currentCategory = el.dataset.category || '';
      currentPage = 1;
      loadThreads();
      document.querySelectorAll('[data-category]').forEach((a) => a.classList.remove('active'));
      el.classList.add('active');
    });
  });

  function getFilteredThreads() {
    const data = loadData();
    let list = data.threads.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    if (currentCategory) list = list.filter((t) => t.category === currentCategory);
    return list;
  }

  function loadThreads() {
    if (!threadList) return;
    const all = getFilteredThreads();
    const total = all.length;
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    if (currentPage > pages) currentPage = pages;
    const slice = all.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    if (!slice.length) {
      threadList.innerHTML = '<div class="card text-center text-muted">No threads found.</div>';
    } else {
      threadList.innerHTML = slice
        .map(
          (t) => `
        <a href="forum.html?id=${t.id}" class="card thread-card" style="display:grid;text-decoration:none;color:inherit">
          <div>
            <div class="thread-title">${escapeHtml(t.title)}</div>
            <div class="thread-meta">
              <span>${escapeHtml(t.author)}</span>
              <span>${escapeHtml(t.category)}</span>
              <span>${formatDate(t.created_at)}</span>
            </div>
            ${t.tags ? `<div class="tags">${t.tags.split(',').map((tag) => `<span class="tag">${escapeHtml(tag.trim())}</span>`).join('')}</div>` : ''}
          </div>
          <div class="thread-stats">
            <span>${t.views} views</span>
            <span>${t.replies} replies</span>
          </div>
        </a>`
        )
        .join('');
    }
    renderPagination({ page: currentPage, pages, total });
  }

  function renderPagination(pag) {
    if (!paginationEl || pag.pages <= 1) {
      if (paginationEl) paginationEl.innerHTML = '';
      return;
    }
    let html = `<button ${pag.page <= 1 ? 'disabled' : ''} data-page="${pag.page - 1}">‹</button>`;
    for (let i = 1; i <= pag.pages; i++) {
      html += `<button class="${i === pag.page ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }
    html += `<button ${pag.page >= pag.pages ? 'disabled' : ''} data-page="${pag.page + 1}">›</button>`;
    paginationEl.innerHTML = html;
    paginationEl.querySelectorAll('button[data-page]').forEach((btn) => {
      btn.addEventListener('click', () => {
        currentPage = parseInt(btn.dataset.page, 10);
        loadThreads();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
  }

  function loadThreadDetail(id) {
    const data = loadData();
    const t = data.threads.find((x) => x.id === id);
    if (!t) {
      threadDetail.innerHTML = '<div class="card"><p class="text-muted">Thread not found</p></div>';
      return;
    }
    t.views = (t.views || 0) + 1;
    saveData(data);

    threadDetail.innerHTML = `
      <div class="card">
        <h1 style="font-size:1.35rem;margin-bottom:0.5rem">${escapeHtml(t.title)}</h1>
        <div class="thread-meta mb-2">
          <span>${escapeHtml(t.author)}</span>
          <span class="badge badge-demo">${escapeHtml(t.category)}</span>
          <span>${formatDate(t.created_at)}</span>
          <span>${t.views} views • ${t.replies} replies</span>
        </div>
        ${t.tags ? `<div class="tags mb-2">${t.tags.split(',').map((tag) => `<span class="tag">${escapeHtml(tag.trim())}</span>`).join('')}</div>` : ''}
        <div style="white-space:pre-wrap;line-height:1.7">${escapeHtml(t.content)}</div>
      </div>
      <div id="comments-root" data-thread-id="${t.id}"></div>`;

    if (window.loadComments) window.loadComments(t.id);
  }

  const newThreadForm = document.getElementById('new-thread-form');
  if (newThreadForm) {
    newThreadForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = document.getElementById('nt-title').value.trim();
      const content = document.getElementById('nt-content').value.trim();
      const category = document.getElementById('nt-category').value;
      const tags = document.getElementById('nt-tags').value.trim();
      if (!title || !content) {
        showToast('Title and content required', 'error');
        return;
      }
      const data = loadData();
      const id = data.nextThreadId++;
      data.threads.push({
        id,
        title,
        author: '[DEMO] Anonymous',
        content,
        category,
        tags,
        views: 0,
        replies: 0,
        created_at: new Date().toISOString(),
        is_demo: 1,
      });
      saveData(data);
      showToast('Thread created (saved in browser)', 'success');
      window.location.href = `forum.html?id=${id}`;
    });
  }
})();
