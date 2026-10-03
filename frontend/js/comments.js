/**
 * Anonymous comment system
 */

(function () {
  const { apiFetch, showToast, escapeHtml, formatDate, API } = window.RHF;

  window.loadComments = async function (threadId) {
    const root = document.getElementById('comments-root');
    if (!root) return;

    root.innerHTML = `
      <div class="comment-section">
        <h3 style="margin-bottom:0.75rem">Comments</h3>
        <div id="comments-list"><div class="skeleton skeleton-line"></div></div>
        <div class="comment-form">
          <label>Username: <strong>Anonymous</strong> <span class="text-muted">(forced – cannot be changed)</span></label>
          <textarea id="comment-content" placeholder="Write your comment..." maxlength="2000"></textarea>
          <div class="form-row">
            <span class="form-hint">No login required. Comments are stored persistently.</span>
            <button class="btn btn-primary" id="post-comment-btn">Post Comment</button>
          </div>
        </div>
      </div>
    `;

    const list = document.getElementById('comments-list');
    const btn = document.getElementById('post-comment-btn');
    const textarea = document.getElementById('comment-content');

    async function fetchComments() {
      try {
        const data = await apiFetch(`${API.phpBase}/comments.php?thread_id=${threadId}`);
        const comments = data.comments || [];
        if (!comments.length) {
          list.innerHTML = '<p class="text-muted">No comments yet. Be the first!</p>';
          return;
        }
        list.innerHTML = comments.map(c => `
          <div class="comment-card">
            <div class="comment-avatar">A</div>
            <div class="comment-body">
              <div class="comment-header">
                <strong>${c.username}</strong>
                ${c.is_demo == 1 ? '<span class="badge badge-demo">DEMO</span>' : ''}
                <span class="text-muted"> • ${formatDate(c.created_at)}</span>
              </div>
              <div class="comment-content">${c.content}</div>
            </div>
          </div>
        `).join('');
      } catch (err) {
        list.innerHTML = `<p class="text-muted">Could not load comments.</p>`;
      }
    }

    btn.addEventListener('click', async () => {
      const content = textarea.value.trim();
      if (!content) {
        showToast('Comment cannot be empty', 'error');
        return;
      }
      btn.disabled = true;
      try {
        await apiFetch(`${API.phpBase}/comments.php`, {
          method: 'POST',
          body: { thread_id: threadId, content },
        });
        textarea.value = '';
        showToast('Comment posted', 'success');
        await fetchComments();
      } catch (err) {
        showToast(err.message || 'Failed to post', 'error');
      } finally {
        btn.disabled = false;
      }
    });

    await fetchComments();
  };

  // Auto-init if data-thread-id already present
  document.addEventListener('DOMContentLoaded', () => {
    const root = document.getElementById('comments-root');
    if (root && root.dataset.threadId) {
      window.loadComments(parseInt(root.dataset.threadId, 10));
    }
  });
})();
