(function () {
  const { loadData, saveData, showToast, escapeHtml, formatDate } = window.RHF;

  window.loadComments = function (threadId) {
    const root = document.getElementById('comments-root');
    if (!root) return;

    root.innerHTML = `
      <div class="comment-section">
        <h3 style="margin-bottom:0.75rem">Comments</h3>
        <p class="text-muted" style="font-size:0.8rem;margin-bottom:0.5rem">Stored in your browser (localStorage) on this GitHub Pages demo.</p>
        <div id="comments-list"></div>
        <div class="comment-form">
          <label>Username: <strong>Anonymous</strong> <span class="text-muted">(forced)</span></label>
          <textarea id="comment-content" placeholder="Write your comment..." maxlength="2000"></textarea>
          <div class="form-row">
            <span class="form-hint">No login required.</span>
            <button class="btn btn-primary" id="post-comment-btn">Post Comment</button>
          </div>
        </div>
      </div>`;

    const list = document.getElementById('comments-list');
    const btn = document.getElementById('post-comment-btn');
    const textarea = document.getElementById('comment-content');

    function render() {
      const data = loadData();
      const comments = (data.comments[threadId] || []).slice().sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      if (!comments.length) {
        list.innerHTML = '<p class="text-muted">No comments yet. Be the first!</p>';
        return;
      }
      list.innerHTML = comments
        .map(
          (c) => `
        <div class="comment-card">
          <div class="comment-avatar">A</div>
          <div class="comment-body">
            <div class="comment-header">
              <strong>${escapeHtml(c.username)}</strong>
              ${c.is_demo ? '<span class="badge badge-demo">DEMO</span>' : ''}
              <span class="text-muted"> • ${formatDate(c.created_at)}</span>
            </div>
            <div class="comment-content">${escapeHtml(c.content)}</div>
          </div>
        </div>`
        )
        .join('');
    }

    btn.addEventListener('click', () => {
      const content = textarea.value.trim();
      if (!content) {
        showToast('Comment cannot be empty', 'error');
        return;
      }
      const data = loadData();
      if (!data.comments[threadId]) data.comments[threadId] = [];
      data.comments[threadId].push({
        id: data.nextCommentId++,
        username: 'Anonymous',
        content,
        created_at: new Date().toISOString(),
        is_demo: 0,
      });
      const t = data.threads.find((x) => x.id === threadId);
      if (t) t.replies = (t.replies || 0) + 1;
      saveData(data);
      textarea.value = '';
      showToast('Comment posted', 'success');
      render();
    });

    render();
  };

  document.addEventListener('DOMContentLoaded', () => {
    const root = document.getElementById('comments-root');
    if (root && root.dataset.threadId) window.loadComments(parseInt(root.dataset.threadId, 10));
  });
})();
