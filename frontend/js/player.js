/**
 * Player lookup & Compatibility checker
 */

(function () {
  const { apiFetch, showToast, statusBadge, escapeHtml, formatDate, API } = window.RHF;

  const playerForm = document.getElementById('player-lookup-form');
  const playerResult = document.getElementById('player-result');
  const playerSkeleton = document.getElementById('player-skeleton');

  if (playerForm) {
    playerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('lookup-username').value.trim();
      const userId = document.getElementById('lookup-userid').value.trim();

      if (!username && !userId) {
        showToast('Enter a username or User ID', 'error');
        return;
      }

      playerResult.classList.add('hidden');
      playerSkeleton.classList.remove('hidden');

      try {
        // Prefer PHP proxy, fall back to Python direct
        let url;
        const params = new URLSearchParams();
        if (userId) params.set('user_id', userId);
        else params.set('username', username);

        try {
          url = `${API.phpBase}/player.php?${params}`;
          const data = await apiFetch(url);
          renderPlayer(data.player || data);
        } catch (phpErr) {
          // Fallback to Python
          url = `${API.pyBase}/api/player?${params}`;
          const data = await apiFetch(url);
          renderPlayer(data.player || data);
        }
      } catch (err) {
        playerSkeleton.classList.add('hidden');
        playerResult.classList.remove('hidden');
        if (err.status === 404) {
          playerResult.innerHTML = `<div class="card"><p class="text-muted">Player not found</p></div>`;
        } else {
          playerResult.innerHTML = `<div class="card"><p class="text-muted">Roblox API is temporarily unavailable.</p><p class="text-muted" style="font-size:0.85rem">${escapeHtml(err.message)}</p></div>`;
        }
        showToast(err.message || 'Lookup failed', 'error');
      }
    });
  }

  function renderPlayer(p) {
    playerSkeleton.classList.add('hidden');
    playerResult.classList.remove('hidden');
    if (!p || !p.user_id) {
      playerResult.innerHTML = `<div class="card"><p>Player not found</p></div>`;
      return;
    }

    const presenceMap = { 0: 'Offline', 1: 'Online', 2: 'In Game', 3: 'In Studio', 4: 'Invisible' };
    let presenceHtml = '';
    if (p.presence) {
      const type = presenceMap[p.presence.userPresenceType] || 'Unknown';
      presenceHtml = `<p><span class="label">Presence:</span> ${escapeHtml(type)}${p.presence.lastLocation ? ' – ' + escapeHtml(p.presence.lastLocation) : ''}</p>`;
    }

    playerResult.innerHTML = `
      <div class="card player-card">
        <img class="player-avatar" src="${escapeHtml(p.avatar_url || '')}" alt="Avatar"
             onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2280%22 height=%2280%22><rect fill=%22%2321262d%22 width=%2280%22 height=%2280%22/><text x=%2250%%25%22 y=%2250%%25%22 fill=%22%238b949e%22 font-size=%2214%22 text-anchor=%22middle%22 dy=%22.3em%22>?</text></svg>'">
        <div class="player-info">
          <h2>${escapeHtml(p.display_name || p.username)}</h2>
          <p><span class="label">Username:</span> ${escapeHtml(p.username)}</p>
          <p><span class="label">User ID:</span> ${escapeHtml(String(p.user_id))}</p>
          <p><span class="label">Account Created:</span> ${p.created ? formatDate(p.created) : '—'}</p>
          ${presenceHtml}
          <p class="mt-1"><a href="${escapeHtml(p.profile_url)}" target="_blank" rel="noopener">View Roblox Profile ↗</a></p>
          <p class="text-muted" style="font-size:0.75rem;margin-top:0.5rem">Data from public Roblox APIs • Cached briefly</p>
        </div>
      </div>
    `;
  }

  /* ---------- Compatibility Checker ---------- */
  const compatForm = document.getElementById('compat-form');
  const compatResult = document.getElementById('compat-result');

  if (compatForm) {
    compatForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const player = document.getElementById('compat-player').value.trim();
      const exploit = document.getElementById('compat-exploit').value.trim();
      const game = document.getElementById('compat-game').value.trim();
      const version = document.getElementById('compat-version').value.trim() || 'any';

      compatResult.innerHTML = '<div class="skeleton skeleton-line medium"></div>';

      try {
        const data = await apiFetch(`${API.pyBase}/api/compatibility`, {
          method: 'POST',
          body: { player, exploit, game, version },
        });
        compatResult.innerHTML = `
          <div class="compat-result">
            <div class="status-row">
              <strong>Compatibility:</strong> ${escapeHtml(data.compatibility)}
              ${statusBadge(data.status)}
            </div>
            <p><span class="label">Status:</span> ${escapeHtml(data.status)}</p>
            <p><span class="label">Confidence:</span> ${escapeHtml(data.confidence)}</p>
            <p><span class="label">Player:</span> ${escapeHtml(data.player)}</p>
            <p><span class="label">Exploit:</span> ${escapeHtml(data.exploit)}</p>
            <p><span class="label">Game:</span> ${escapeHtml(data.game)}</p>
            <p><span class="label">Version:</span> ${escapeHtml(data.version)}</p>
            <p class="text-muted mt-1" style="font-size:0.85rem">${escapeHtml(data.message)}</p>
            <p class="text-muted" style="font-size:0.75rem;margin-top:0.4rem">${escapeHtml(data.disclaimer)}</p>
          </div>
        `;
        showToast('Simulation complete (demo only)', 'info');
      } catch (err) {
        compatResult.innerHTML = `<p class="text-muted">Error: ${escapeHtml(err.message)}</p>`;
        showToast(err.message, 'error');
      }
    });
  }

  /* ---------- Exploit list ---------- */
  const exploitList = document.getElementById('exploit-list');
  if (exploitList) {
    loadExploits();
  }

  async function loadExploits() {
    try {
      const data = await apiFetch(`${API.pyBase}/api/exploits`);
      const items = data.exploits || [];
      if (!items.length) {
        exploitList.innerHTML = '<p class="text-muted">No demo records.</p>';
        return;
      }
      exploitList.innerHTML = items.map(e => `
        <div class="card">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem">
            <strong>${escapeHtml(e.exploit_name)}</strong>
            ${statusBadge(e.simulated_status)}
          </div>
          <p class="text-muted" style="font-size:0.85rem;margin-top:0.3rem">
            Version: ${escapeHtml(e.version || '—')} • Games: ${escapeHtml(e.supported_games || '—')}
          </p>
          <p class="text-muted" style="font-size:0.8rem">Last simulated: ${escapeHtml(e.last_simulated_test || '—')}</p>
          <p style="font-size:0.85rem;margin-top:0.3rem">${escapeHtml(e.notes || '')}</p>
        </div>
      `).join('');
    } catch (err) {
      exploitList.innerHTML = `<p class="text-muted">Could not load exploit list.</p>`;
    }
  }
})();
