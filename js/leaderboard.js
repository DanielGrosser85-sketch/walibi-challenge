/**
 * Dynamische Rangliste für Mr. oder Mrs. Walibi & Häuser-Battle
 */
const LeaderboardModule = {
  currentView: "players",

  init() {
    this.setupSubtabs();
    this.renderLeaderboard();
  },

  setupSubtabs() {
    const btnPlayers = document.getElementById("btnRankPlayers");
    const btnHouses = document.getElementById("btnRankHouses");

    if (btnPlayers) {
      btnPlayers.addEventListener("click", () => {
        btnPlayers.classList.add("active");
        if (btnHouses) btnHouses.classList.remove("active");
        this.currentView = "players";
        this.renderLeaderboard();
      });
    }

    if (btnHouses) {
      btnHouses.addEventListener("click", () => {
        btnHouses.classList.add("active");
        if (btnPlayers) btnPlayers.classList.remove("active");
        this.currentView = "houses";
        this.renderLeaderboard();
      });
    }
  },

  renderLeaderboard() {
    const container = document.getElementById("leaderboardListContainer");
    if (!container) return;

    if (this.currentView === "players") {
      this.renderPlayerRankings(container);
    } else {
      this.renderHouseRankings(container);
    }
  },

  renderPlayerRankings(container) {
    const sorted = window.store.getSortedPlayers();
    const currentUser = window.store.state.currentUser;

    if (sorted.length === 0) {
      container.innerHTML = `<p class="text-muted">Noch keine Spieler registriert.</p>`;
      return;
    }

    container.innerHTML = sorted.map((player, index) => {
      const rank = index + 1;
      let rankBadge = `<span class="rank-num">#${rank}</span>`;
      let cardClass = "rank-card";
      let titleTag = "";

      if (rank === 1) {
        rankBadge = `<span class="rank-crown">👑 1.</span>`;
        cardClass += " rank-first";
        titleTag = `<span class="feed-house-tag" style="background: rgba(251, 191, 36, 0.2); color: #fbbf24; border-color: #fbbf24;">👑 Mr./Mrs. Walibi</span>`;
      } else if (rank === 2) {
        rankBadge = `<span class="rank-medal">🥈 2.</span>`;
        cardClass += " rank-second";
      } else if (rank === 3) {
        rankBadge = `<span class="rank-medal">🥉 3.</span>`;
        cardClass += " rank-third";
      } else if (index === sorted.length - 1 && sorted.length > 3) {
        rankBadge = `<span class="rank-jester">🤡 #${rank}</span>`;
        cardClass += " rank-jester-card";
        titleTag = `<span class="feed-house-tag" style="background: rgba(239, 68, 68, 0.15); color: #f87171;">🤡 Hofnarr</span>`;
      }

      const isMe = currentUser && currentUser.id === player.id;
      if (isMe) cardClass += " rank-me";

      const completedQuestsCount = (player.completedQuests || []).length;
      const completedSideQuestsCount = (player.completedSideQuests || []).length;
      const drinksCount = player.drinksCount || 0;

      return `
        <div class="${cardClass}" onclick="LeaderboardModule.openPlayerDetailModal('${player.id}')">
          <div class="rank-position-col">
            ${rankBadge}
          </div>
          
          <img src="${player.avatar || ProfileModule.generateDefaultAvatar(player.name)}" class="rank-avatar" />

          <div class="rank-info-col">
            <div class="rank-player-name">
              ${player.name} ${isMe ? '<span class="you-badge">(Du)</span>' : ''}
              ${titleTag}
            </div>
            <div class="rank-sub-meta">
              <span class="rank-house-badge">${player.house || 'Haus'}</span>
              <span class="rank-stats-mini">🎯 ${completedQuestsCount} Quests • ${completedSideQuestsCount > 0 ? `🏅 ${completedSideQuestsCount} Orden • ` : ''}🍺 ${drinksCount} Drinks</span>
            </div>
          </div>

          <div class="rank-score-col">
            <div class="rank-points-val">${player.points}</div>
            <div class="rank-points-lbl">Punkte</div>
          </div>
        </div>
      `;
    }).join("");
  },

  renderHouseRankings(container) {
    const houseStats = window.store.getHouseLeaderboard();

    if (houseStats.length === 0) {
      container.innerHTML = `<p class="text-muted">Keine Häuser vorhanden.</p>`;
      return;
    }

    container.innerHTML = houseStats.map((h, index) => {
      const rank = index + 1;
      const avg = h.playerCount > 0 ? (h.totalPoints / h.playerCount).toFixed(1) : "0";

      return `
        <div class="rank-card house-rank-card ${rank === 1 ? 'rank-first' : ''}">
          <div class="rank-position-col">
            <span class="rank-num">#${rank}</span>
          </div>

          <div class="house-shield-icon" style="font-size: 26px;">🏰</div>

          <div class="rank-info-col">
            <div class="rank-player-name">${h.name}</div>
            <div class="rank-sub-meta">
              <span>👥 ${h.playerCount} Mitglieder • Ø ${avg} Pkt / Spieler</span>
            </div>
            <div class="house-members-avatars" style="display: flex; gap: 4px; margin-top: 4px;">
              ${h.members.map(m => `
                <img src="${m.avatar || ProfileModule.generateDefaultAvatar(m.name)}" title="${m.name} (${m.points} Pkt)" class="mini-avatar" />
              `).join("")}
            </div>
          </div>

          <div class="rank-score-col">
            <div class="rank-points-val">${h.totalPoints}</div>
            <div class="rank-points-lbl">Gesamt</div>
          </div>
        </div>
      `;
    }).join("");
  },

  openPlayerDetailModal(playerId) {
    const player = window.store.state.players.find(p => p.id === playerId);
    if (!player) return;

    const modal = document.getElementById("playerDetailModal");
    if (!modal) return;

    document.getElementById("modalPlayerName").textContent = player.name;
    document.getElementById("modalPlayerHouse").textContent = player.house;
    document.getElementById("modalPlayerAvatar").src = player.avatar || ProfileModule.generateDefaultAvatar(player.name);
    document.getElementById("modalPlayerPoints").textContent = `${player.points} Punkte`;

    // Getränke-Übersicht des Spielers
    const drinksDetail = player.drinksDetail || { beer: 0, shot: 0, longdrink: 0, joint: 0, water: 0 };
    const items = window.store.state.counterItems || window.COUNTER_ITEMS;
    const drinksHtml = `
      <div style="margin-bottom: 12px; padding: 10px; background: var(--bg-comic-card-light); border-radius: var(--radius-md); border: 1.5px solid rgba(255,255,255,0.1);">
        <div style="font-size: 12px; font-weight: 800; color: var(--comic-yellow); margin-bottom: 6px; text-transform: uppercase;">🍺 Getränke-Konto (${player.drinksCount || 0} Gesamt):</div>
        <div style="display: flex; flex-wrap: wrap; gap: 6px;">
          ${items.map(it => `
            <div style="background: rgba(0,0,0,0.3); padding: 4px 8px; border-radius: 8px; font-size: 11px; font-weight: 700; display: flex; align-items: center; gap: 4px;">
              <span>${it.icon}</span>
              <span>${it.name.split("/")[0]}:</span>
              <span style="color: var(--comic-yellow); font-weight: 800;">${drinksDetail[it.id] || 0}x</span>
            </div>
          `).join("")}
        </div>
      </div>
    `;

    // Nebenquests des Spielers
    const allSideQuests = window.SIDE_QUESTS || [];
    const playerSideQuestIds = player.completedSideQuests || [];
    const playerSideQuests = allSideQuests.filter(sq => playerSideQuestIds.includes(sq.id));
    const sideQuestPoints = playerSideQuests.reduce((sum, s) => sum + (s.points || 0), 0);

    let sideQuestsHtml = "";
    if (playerSideQuests.length > 0) {
      sideQuestsHtml = `
        <div style="margin-bottom: 12px; padding: 10px; background: rgba(0, 0, 0, 0.35); border: 2px solid rgba(255, 204, 0, 0.4); border-radius: var(--radius-md);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 11px; font-weight: 900; color: var(--walibi-yellow); text-transform: uppercase;">🏅 Nebenquest-Orden (${playerSideQuests.length}/${allSideQuests.length}):</span>
            <span class="points-badge" style="font-size: 10px;">+${sideQuestPoints} Pkt</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 6px;">
            ${playerSideQuests.map(sq => `
              <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(0, 0, 0, 0.5)); border: 1.5px solid #10b981; border-radius: 8px; padding: 6px 10px; display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="font-size: 16px;">🏆</span>
                  <div>
                    <div style="font-size: 12px; font-weight: 900; color: #fff;">${sq.title}</div>
                    <div style="font-size: 10px; color: #94a3b8;">${sq.desc}</div>
                  </div>
                </div>
                <span style="font-size: 11px; font-weight: 900; color: #34d399; white-space: nowrap;">+${sq.points} P</span>
              </div>
            `).join("")}
          </div>
        </div>
      `;
    }

    // Haupt-Challenges des Spielers
    const completedIds = player.completedQuests || [];
    const allQuests = window.store.state.quests || [];
    const myQuests = allQuests.filter(q => completedIds.includes(q.id));
    const mainQuestPoints = myQuests.reduce((sum, q) => sum + (q.points || 0), 0);

    let mainQuestsHtml = "";
    if (myQuests.length > 0) {
      mainQuestsHtml = `
        <div style="margin-bottom: 12px; padding: 10px; background: rgba(0, 0, 0, 0.35); border: 2px solid rgba(225, 29, 72, 0.45); border-radius: var(--radius-md);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 11px; font-weight: 900; color: #fda4af; text-transform: uppercase;">🎯 Gemeisterte Haupt-Challenges (${myQuests.length}/${allQuests.length}):</span>
            <span class="points-badge" style="font-size: 10px; background: var(--gradient-rose); color: #fff;">+${mainQuestPoints} Pkt</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 6px;">
            ${myQuests.map(q => `
              <div style="background: linear-gradient(135deg, rgba(225, 29, 72, 0.22), rgba(0, 0, 0, 0.5)); border: 1.5px solid #e11d48; border-radius: 8px; padding: 6px 10px; display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="font-size: 16px;">${q.icon || '🎯'}</span>
                  <div>
                    <div style="font-size: 12px; font-weight: 900; color: #fff;">${q.title}</div>
                    <div style="font-size: 10px; color: #cbd5e1;">${q.description || q.desc || ''}</div>
                  </div>
                </div>
                <span style="font-size: 11px; font-weight: 900; color: #fb7185; white-space: nowrap;">+${q.points} P</span>
              </div>
            `).join("")}
          </div>
        </div>
      `;
    } else {
      mainQuestsHtml = `
        <div style="margin-bottom: 12px; padding: 10px; background: rgba(255,255,255,0.03); border-radius: var(--radius-md); text-align: center; font-size: 12px; color: var(--text-dim);">
          Noch keine Haupt-Challenges eingereicht.
        </div>
      `;
    }

    const questsList = document.getElementById("modalPlayerQuestsList");
    questsList.innerHTML = drinksHtml + mainQuestsHtml + sideQuestsHtml + `
      <button type="button" class="btn-primary" style="margin-top: 10px; font-size: 13px; font-weight: 900; background: var(--gradient-gold); color: #000;" onclick="LeaderboardModule.openFullCertificate('${player.id}')">
        📜 VOLLSTÄNDIGES ZEUGNIS ÖFFNEN
      </button>
    `;

    modal.classList.remove("hidden");

    const closeBtn = document.getElementById("closePlayerDetailModal");
    if (closeBtn) {
      closeBtn.onclick = () => modal.classList.add("hidden");
    }
  },

  openFullCertificate(playerId) {
    const modal = document.getElementById("playerDetailModal");
    if (modal) modal.classList.add("hidden");
    if (window.AwardsModule) {
      window.AwardsModule.openCelebrationModal(false, playerId);
    }
  }
};

window.LeaderboardModule = LeaderboardModule;
