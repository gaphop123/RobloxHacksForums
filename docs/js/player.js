(function () {
  const { lookupPlayer, simulateCompatibility, showToast, statusBadge, escapeHtml, formatDate, loadData } = window.RHF;

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
        const p = await lookupPlayer({ username: username || undefined, user_id: userId || undefined });
        playerSkeleton.classList.add('hidden');
        playerResult.classList.remove('hidden');
        playerResult.innerHTML = `
          <div class="card player-card">
            <img class="player-avatar" src="${escapeHtml(p.avatar_url || '')}" alt="Avatar"
                 onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2280%22 height=%2280%22><rect fill=%22%2321262d%22 width=%2280%22 height=%2280%22/><text x=%2250%%25%22 y=%2250%%25%22 fill=%22%238b949e%22 font-size=%2214%22 text-anchor=%22middle%22 dy=%22.3em%22>?</text></svg>'">
            <div class="player-info">
              <h2>${escapeHtml(p.display_name || p.username)}</h2>
              <p><span class="label">Username:</span> ${escapeHtml(p.username)}</p>
              <p><span class="label">User ID:</span> ${escapeHtml(String(p.user_id))}</p>
              <p><span class="label">Account Created:</span> ${p.created ? formatDate(p.created) : '—'}</p>
              <p class="mt-1"><a href="${escapeHtml(p.profile_url)}" target="_blank" rel="noopener">View Roblox Profile ↗</a></p>
              <p class="text-muted" style="font-size:0.75rem;margin-top:0.5rem">Data from public Roblox APIs (static GitHub Pages build)</p>
            </div>
          </div>`;
      } catch (err) {
        playerSkeleton.classList.add('hidden');
        playerResult.classList.remove('hidden');
        if (err.status === 404 || /not found/i.test(err.message)) {
          playerResult.innerHTML = `<div class="card"><p class="text-muted">Player not found</p></div>`;
        } else {
          playerResult.innerHTML = `<div class="card"><p class="text-muted">Roblox API is temporarily unavailable.</p><p class="text-muted" style="font-size:0.85rem">${escapeHtml(err.message)}</p></div>`;
        }
        showToast(err.message || 'Lookup failed', 'error');
      }
    });
  }

  const compatForm = document.getElementById('compat-form');
  const compatResult = document.getElementById('compat-result');
  if (compatForm) {
    compatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const player = document.getElementById('compat-player').value.trim();
      const exploit = document.getElementById('compat-exploit').value.trim();
      const game = document.getElementById('compat-game').value.trim();
      const version = document.getElementById('compat-version').value.trim() || 'any';
      const data = simulateCompatibility(player, exploit, game, version);
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
          <p class="text-muted mt-1" style="font-size:0.85rem">${escapeHtml(data.message)}</p>
          <p class="text-muted" style="font-size:0.75rem">${escapeHtml(data.disclaimer)}</p>
        </div>`;
      showToast('Simulation complete (demo only)', 'info');
    });
  }

  const exploitList = document.getElementById('exploit-list');
  if (exploitList) {
    const data = loadData();
    exploitList.innerHTML = (data.exploits || []).map((e) => `
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
      </div>`).join('');
  }
})();
