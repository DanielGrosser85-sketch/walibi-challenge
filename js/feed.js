/**
 * Live-Feed Modul: Aktivitäten-Timeline, Voting-System,
 * Reaktionen, Kommentare, Freie Posts & Pegel-Tracker mit Promille-Rechner
 */
const FeedModule = {
  currentPhotoModalUrl: null,
  capturedSocialPhotoBase64: null,

  init() {
    this.setupSocialPostModal();
  },

  setupSocialPostModal() {
    const modal = document.getElementById("socialPostModal");
    const openBtn = document.getElementById("btnOpenSocialPost");
    const closeBtn = document.getElementById("closeSocialPostModal");
    const cameraInp = document.getElementById("socialCameraInput");
    const galleryInp = document.getElementById("socialGalleryInput");
    const submitBtn = document.getElementById("btnSubmitSocialPost");

    if (openBtn) {
      openBtn.onclick = () => {
        if (!ProfileModule.requireUser()) return;
        if (window.GameAudio) window.GameAudio.playClick();
        this.capturedSocialPhotoBase64 = null;
        const textInp = document.getElementById("socialPostTextInput");
        if (textInp) textInp.value = "";
        this.removeSocialPhotoPreview();
        if (modal) modal.classList.remove("hidden");
      };
    }

    if (closeBtn && modal) {
      closeBtn.onclick = () => {
        if (window.GameAudio) window.GameAudio.playClick();
        modal.classList.add("hidden");
      };
      modal.onclick = (e) => {
        if (e.target === modal) modal.classList.add("hidden");
      };
    }

    if (cameraInp) {
      cameraInp.onchange = (e) => this.handleSocialPhotoCapture(e);
    }
    if (galleryInp) {
      galleryInp.onchange = (e) => this.handleSocialPhotoCapture(e);
    }

    if (submitBtn) {
      submitBtn.onclick = () => this.submitSocialPost();
    }
  },

  removeSocialPhotoPreview() {
    this.capturedSocialPhotoBase64 = null;
    const preview = document.getElementById("socialPhotoPreview");
    const removeBtn = document.getElementById("btnRemoveSocialPhoto");
    if (preview) {
      preview.classList.add("hidden");
      preview.src = "";
    }
    if (removeBtn) removeBtn.classList.add("hidden");
  },

  handleSocialPhotoCapture(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (window.GameAudio) window.GameAudio.playClick();

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const maxDim = 900;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height *= maxDim / width;
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width *= maxDim / height;
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        const compressed = canvas.toDataURL("image/jpeg", 0.82);
        this.capturedSocialPhotoBase64 = compressed;

        const preview = document.getElementById("socialPhotoPreview");
        const removeBtn = document.getElementById("btnRemoveSocialPhoto");

        if (preview) {
          preview.src = compressed;
          preview.classList.remove("hidden");
        }
        if (removeBtn) removeBtn.classList.remove("hidden");
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  },

  async submitSocialPost() {
    const currentUser = window.store.state.currentUser;
    if (!currentUser) return;

    const textInp = document.getElementById("socialPostTextInput");
    const text = textInp ? textInp.value.trim() : "";

    if (!text && !this.capturedSocialPhotoBase64) {
      alert("Bitte gib einen kurzen Text ein oder wähle ein Foto aus!");
      return;
    }

    const modal = document.getElementById("socialPostModal");
    if (modal) modal.classList.add("hidden");

    if (window.GameAudio) window.GameAudio.playCoin();

    await window.store.createFreePost(currentUser.id, text, this.capturedSocialPhotoBase64);

    if (window.app && window.app.showToast) {
      window.app.showToast(`📸 +10 Punkte für deinen spontanen Schnappschuss!`);
    }

    this.renderFeed();
  },

  renderHeaderStats() {
    const players = (window.store && window.store.state && window.store.state.players) || [];
    const currentUser = window.store ? window.store.state.currentUser : null;
    const sorted = [...players].sort((a, b) => b.points - a.points);
    const leader = sorted[0] || { name: "-", points: 0 };
    const myRank = currentUser ? sorted.findIndex(p => p.id === currentUser.id) + 1 : 1;

    // 1. STATS ROW RENDERN
    const statsContainer = document.getElementById("dashboardStatsRow");
    if (statsContainer) {
      statsContainer.innerHTML = `
        <div class="stat-card">
          <span class="stat-icon">👥</span>
          <div class="stat-content">
            <div class="stat-val" id="totalPlayersCount">${players.length}</div>
            <div class="stat-lbl">Spieler</div>
          </div>
        </div>

        <div class="stat-card leader-card">
          <span class="stat-icon">👑</span>
          <div class="stat-content">
            <div class="stat-val" id="headerLeaderName">${leader.name}</div>
            <div class="stat-lbl" id="headerLeaderPoints">${leader.points} Pkt (Spitze)</div>
          </div>
        </div>

        <div class="stat-card my-stat-card">
          <span class="stat-icon">⭐</span>
          <div class="stat-content">
            <div class="stat-val" id="headerUserPoints">${(currentUser && currentUser.points) || 0} Pkt</div>
            <div class="stat-lbl" id="headerMyRank">Rang #${myRank > 0 ? myRank : 1}</div>
          </div>
        </div>
      `;
    }

    // 2. PERSÖNLICHER GETRÄNKE & PEGEL-TRACKER RENDERN
    this.renderPersonalDrinksTracker();
  },

  renderPersonalDrinksTracker() {
    const container = document.getElementById("dashboardDrinksTrackerRow");
    if (!container) return;

    const currentUser = window.store ? window.store.state.currentUser : null;
    const details = (currentUser && currentUser.drinksDetail) || { beer: 0, shot: 0, longdrink: 0, joint: 0, water: 0 };
    const total = (currentUser && currentUser.drinksCount) || 0;

    // PROMILIE-BERECHNUNG (Widmark-Approximation: Bier ~0.3‰, Shot ~0.15‰, Longdrink ~0.25‰)
    const beerCount = details.beer || 0;
    const shotCount = details.shot || 0;
    const longdrinkCount = details.longdrink || 0;
    const jointCount = details.joint || 0;

    const estimatedPromille = Math.max(0, (beerCount * 0.3) + (shotCount * 0.15) + (longdrinkCount * 0.25)).toFixed(2);
    
    let promilleStatus = "🌱 Nüchtern";
    let promilleClass = "badge-success";

    if (estimatedPromille >= 2.0) {
      promilleStatus = "💀 Reif für die Base";
      promilleClass = "badge-warn";
    } else if (estimatedPromille >= 1.2) {
      promilleStatus = "👑 Gott-Modus";
      promilleClass = "badge-warn";
    } else if (estimatedPromille >= 0.6) {
      promilleStatus = "🔥 Feiertauglich";
      promilleClass = "badge-success";
    } else if (estimatedPromille > 0.0) {
      promilleStatus = "😎 Angeheitert";
      promilleClass = "badge-success";
    }

    let jointBadgeHtml = "";
    if (jointCount > 0) {
      jointBadgeHtml = `<span style="background: rgba(16,185,129,0.3); border: 1.5px solid #10b981; color: #34d399; font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 999px;">🌿 ${jointCount}x Schwerelos</span>`;
    }

    container.innerHTML = `
      <div class="dashboard-drinks-card">
        <div class="drinks-tracker-header">
          <div class="tracker-title">
            <span>🍺</span> Dein Pegel-Tracker
          </div>
          <div style="display: flex; align-items: center; gap: 6px;">
            <span class="drinks-total-badge">${total} Drinks</span>
            <span class="drinks-total-badge" style="background: linear-gradient(135deg, #ffcc00, #ff7700); color: #000; font-weight: 900;">ca. ${estimatedPromille} ‰</span>
          </div>
        </div>

        <!-- PROMILIE STATUS LEISTE -->
        <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.35); padding: 5px 10px; border-radius: 8px; margin-bottom: 8px; font-size: 11px; font-weight: 800;">
          <span style="color: var(--walibi-yellow);">Zustand: <strong>${promilleStatus}</strong></span>
          ${jointBadgeHtml}
        </div>

        <div class="drinks-tracker-grid">
          <div class="tracker-item-pill" onclick="CounterModule.logItem('beer')" title="+1 Bier">
            <span class="tracker-item-icon">🍺</span>
            <div class="tracker-item-info">
              <span class="tracker-item-name">Bier</span>
              <span class="tracker-item-count" id="count_beer">${beerCount}x</span>
            </div>
            <span class="tracker-item-add-btn">+</span>
          </div>

          <div class="tracker-item-pill" onclick="CounterModule.logItem('shot')" title="+1 Shot">
            <span class="tracker-item-icon">🥃</span>
            <div class="tracker-item-info">
              <span class="tracker-item-name">Shot</span>
              <span class="tracker-item-count" id="count_shot">${shotCount}x</span>
            </div>
            <span class="tracker-item-add-btn">+</span>
          </div>

          <div class="tracker-item-pill" onclick="CounterModule.logItem('longdrink')" title="+1 Longdrink">
            <span class="tracker-item-icon">🍹</span>
            <div class="tracker-item-info">
              <span class="tracker-item-name">Longdrink</span>
              <span class="tracker-item-count" id="count_longdrink">${longdrinkCount}x</span>
            </div>
            <span class="tracker-item-add-btn">+</span>
          </div>

          <div class="tracker-item-pill" onclick="CounterModule.logItem('joint')" title="+1 Joint">
            <span class="tracker-item-icon">🌿</span>
            <div class="tracker-item-info">
              <span class="tracker-item-name">Joint</span>
              <span class="tracker-item-count" id="count_joint">${jointCount}x</span>
            </div>
            <span class="tracker-item-add-btn">+</span>
          </div>
        </div>
      </div>
    `;
  },

  renderFeed() {
    this.renderHeaderStats();
    const container = document.getElementById("feedPostsContainer");
    if (!container) return;

    const feed = window.store.state.feed || [];
    const currentUser = window.store.state.currentUser;
    const myId = currentUser ? currentUser.id : null;

    if (feed.length === 0) {
      container.innerHTML = `
        <div class="empty-feed-card" style="text-align: center; padding: 24px; color: var(--text-muted);">
          <div style="font-size: 40px; margin-bottom: 8px;">📸</div>
          <h3>Noch keine Aktivitäten</h3>
          <p>Teile einen Schnappschuss oder meistere deine erste Challenge!</p>
        </div>
      `;
      return;
    }

    container.innerHTML = feed.map(item => {
      const isQuest = item.type === "quest";
      const isSocial = item.type === "social";
      const timeStr = this.formatRelativeTime(item.timestamp);
      const isMyPost = item.userId === myId;

      // Reactions HTML
      const emojis = ["🔥", "🍺", "👑", "💀", "👏"];
      const reactionPills = emojis.map(emo => {
        const userList = (item.reactions && item.reactions[emo]) || [];
        const hasReacted = myId && userList.includes(myId);
        const count = userList.length;
        return `
          <button class="reaction-pill ${hasReacted ? 'active' : ''}" onclick="FeedModule.toggleReaction('${item.id}', '${emo}')">
            ${emo} ${count > 0 ? `<span class="reaction-count">${count}</span>` : ''}
          </button>
        `;
      }).join("");

      // Voting Box HTML falls Quest Voting benötigt
      let votingHtml = "";
      if (isQuest && item.requiresVoting) {
        votingHtml = this.renderVotingCard(item, myId);
      }

      // Kommentare HTML
      const comments = item.comments || [];
      const commentsHtml = `
        <div class="comments-section" id="comments_${item.id}">
          <div class="comments-list">
            ${comments.map(c => `
              <div class="comment-item">
                <img src="${c.userAvatar || ProfileModule.generateDefaultAvatar(c.userName)}" class="comment-avatar" />
                <div class="comment-bubble">
                  <div class="comment-author">${c.userName}</div>
                  <div class="comment-text">${this.escapeHtml(c.text)}</div>
                  <div class="comment-time">${this.formatRelativeTime(c.timestamp)}</div>
                </div>
              </div>
            `).join("")}
          </div>

          <div class="comment-input-row">
            <img src="${(currentUser && currentUser.avatar) || ProfileModule.generateDefaultAvatar(currentUser ? currentUser.name : 'X')}" class="mini-input-avatar" />
            <input type="text" id="input_comment_${item.id}" placeholder="Schreib einen Kommentar..." class="comment-input" onkeydown="if(event.key==='Enter') FeedModule.submitComment('${item.id}')" />
            <button class="btn-send-comment" onclick="FeedModule.submitComment('${item.id}')">💬 Senden</button>
          </div>
        </div>
      `;

      return `
        <div class="feed-card" id="post_${item.id}">
          <div class="feed-header">
            <img src="${item.userAvatar || ProfileModule.generateDefaultAvatar(item.userName)}" class="feed-avatar" />
            <div class="feed-user-meta">
              <div class="feed-user-name">${item.userName} <span class="feed-house-tag">${item.userHouse || 'Haus'}</span></div>
              <div class="feed-timestamp">${timeStr}</div>
            </div>
            ${item.points ? `<div class="feed-points-badge">+${item.actualPointsAwarded || item.points} Pkt</div>` : ''}
          </div>

          <div class="feed-content">
            ${isQuest ? `
              <div class="feed-quest-title">${item.questIcon || '🎯'} ${item.questTitle}</div>
              <div class="feed-quest-desc">${item.questDescription}</div>
              ${item.userComment ? `
                <div class="feed-user-comment-box" style="background: rgba(255,204,0,0.1); border-left: 3px solid var(--walibi-yellow); padding: 6px 10px; border-radius: 6px; margin-bottom: 8px; font-size: 13px; font-style: italic;">
                  💬 "${this.escapeHtml(item.userComment)}"
                </div>
              ` : ''}
              ${item.photo ? `
                <div class="feed-photo-wrapper" onclick="FeedModule.openPhotoModal('${item.photo}')">
                  <img src="${item.photo}" class="feed-proof-photo" loading="lazy" alt="Beweisfoto" />
                  <span class="photo-expand-hint">🔍 Vergrößern</span>
                </div>
              ` : ''}
            ` : isSocial ? `
              <div style="font-size: 14px; font-weight: 700; color: #fff; margin-bottom: 8px; line-height: 1.4;">
                ${this.escapeHtml(item.text)}
              </div>
              ${item.photo ? `
                <div class="feed-photo-wrapper" onclick="FeedModule.openPhotoModal('${item.photo}')">
                  <img src="${item.photo}" class="feed-proof-photo" loading="lazy" alt="Schnappschuss" />
                  <span class="photo-expand-hint">🔍 Vergrößern</span>
                </div>
              ` : ''}
            ` : `
              <div class="feed-drink-row">
                <span class="drink-big-icon">${item.itemIcon || '🍺'}</span>
                <div>
                  <div class="drink-log-title"><strong>${item.userName}</strong> hat sich 1x <strong>${item.itemName}</strong> gegönnt!</div>
                  <div class="drink-points-tag">+${item.points} Punkte auf's Partykonto</div>
                </div>
              </div>
            `}
          </div>

          ${votingHtml}

          <div class="feed-reactions-bar">
            ${reactionPills}
          </div>

          ${commentsHtml}
        </div>
      `;
    }).join("");
  },

  renderVotingCard(item, myId) {
    const players = window.store.state.players;
    const eligibleCount = Math.max(1, players.length - 1);
    const votes = item.votes || {};
    const voteCount = Object.keys(votes).length;
    const isCompleted = item.votingCompleted;
    const requiredVotes = Math.max(1, Math.ceil(eligibleCount * 0.6));
    const progressPercent = Math.min(100, Math.round((voteCount / requiredVotes) * 100));

    let sum = 0;
    Object.values(votes).forEach(val => sum += val);
    const avgRating = voteCount > 0 ? (sum / voteCount).toFixed(1) : 0;

    const myVote = myId ? votes[myId] : null;
    const isOwner = item.userId === myId;

    return `
      <div class="voting-box ${isCompleted ? 'unlocked' : ''}">
        <div class="voting-box-header">
          <span class="voting-title">⭐ Gruppen-Voting</span>
          <span class="voting-status-badge ${isCompleted ? 'badge-success' : 'badge-warn'}">
            ${isCompleted ? `✅ Freigeschaltet (${avgRating} ⭐)` : `⏳ ${voteCount}/${requiredVotes} Stimmen`}
          </span>
        </div>

        <div class="progress-bar-bg">
          <div class="progress-bar-fill" style="width: ${progressPercent}%;"></div>
        </div>

        <div class="voting-progress-text">
          <span>${voteCount} von ${requiredVotes} benötigten Stimmen (60%)</span>
          ${isCompleted ? `<span><strong>+${item.actualPointsAwarded} Pkt</strong> vergeben</span>` : `<span>Wertung: ${avgRating}/5 ⭐</span>`}
        </div>

        ${!isOwner ? `
          <div class="voting-stars-row">
            <span class="vote-prompt">${myVote ? 'Deine Stimme:' : 'Bewerte die Aktion:'}</span>
            <div class="stars-buttons">
              ${[1, 2, 3, 4, 5].map(star => `
                <button class="star-btn ${myVote === star ? 'selected' : ''}" onclick="FeedModule.castVote('${item.id}', ${star})">
                  ${star} ⭐
                </button>
              `).join("")}
            </div>
          </div>
        ` : `
          <div class="voting-own-hint">👥 Deine Freunde stimmen gerade über deinen Post ab!</div>
        `}
      </div>
    `;
  },

  async toggleReaction(feedItemId, emoji) {
    if (!ProfileModule.requireUser()) return;
    const currentUser = window.store.state.currentUser;

    if (window.GameAudio) window.GameAudio.playClick();
    await window.store.toggleReaction(feedItemId, emoji, currentUser.id);
    this.renderFeed();
  },

  async castVote(feedItemId, rating) {
    if (!ProfileModule.requireUser()) return;
    const currentUser = window.store.state.currentUser;

    if (window.GameAudio) window.GameAudio.playCoin();
    await window.store.voteFeedItem(feedItemId, currentUser.id, rating);
    this.renderFeed();
  },

  async submitComment(feedItemId) {
    if (!ProfileModule.requireUser()) return;
    const currentUser = window.store.state.currentUser;
    const input = document.getElementById(`input_comment_${feedItemId}`);
    if (!input) return;

    const text = input.value.trim();
    if (!text) return;

    if (window.GameAudio) window.GameAudio.playClick();
    await window.store.addComment(feedItemId, currentUser.id, text);
    input.value = "";
    this.renderFeed();
  },

  openPhotoModal(photoUrl) {
    if (window.GameAudio) window.GameAudio.playClick();
    this.currentPhotoModalUrl = photoUrl;
    const modal = document.getElementById("photoViewerModal");
    const img = document.getElementById("photoViewerImage");
    if (modal && img) {
      img.src = photoUrl;
      modal.classList.remove("hidden");
    }
  },

  formatRelativeTime(isoString) {
    if (!isoString) return "Gerade eben";
    const date = new Date(isoString);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);

    if (diffSec < 60) return "Gerade eben";
    if (diffSec < 3600) return `Vor ${Math.floor(diffSec / 60)} Min`;
    if (diffSec < 86400) return `Vor ${Math.floor(diffSec / 3600)} Std`;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  },

  escapeHtml(str) {
    if (!str) return "";
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
};

window.FeedModule = FeedModule;
