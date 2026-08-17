/**
 * Live-Feed Modul: Aktivitäten-Timeline, Voting-System,
 * Reaktionen, Kommentare, Freie Posts & Pegel-Tracker mit Promille-Rechner
 */
const FeedModule = {
  currentPhotoModalUrl: null,
  capturedSocialPhotoBase64: null,
  currentFilter: "all", // "all" | "my_posts" | "my_comments" | "to_vote" | "voted"
  commentDrafts: {},
  commentPhotoDrafts: {},

  init() {
    this.setupSocialPostModal();
  },

  setFilter(filterName) {
    if (window.GameAudio) window.GameAudio.playClick();
    this.currentFilter = filterName;

    document.querySelectorAll(".feed-filter-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.filter === filterName);
    });

    this.renderFeed();
  },

  async confirmAsWitness(feedItemId) {
    if (!ProfileModule.requireUser()) return;
    const currentUser = window.store.state.currentUser;
    if (!currentUser) return;

    if (window.GameAudio) window.GameAudio.playClick();
    await window.store.confirmWitness(feedItemId, currentUser.id);
    this.renderFeed();
  },

  handleCommentInput(itemId, text) {
    this.commentDrafts[itemId] = text;
  },

  openCommentCamera(feedItemId) {
    if (!ProfileModule.requireUser()) return;
    if (window.CameraModule) {
      window.CameraModule.open({
        title: "📸 Foto-Antwort",
        facingMode: "environment",
        onCapture: (b64) => {
          this.commentPhotoDrafts[feedItemId] = b64;
          this.renderFeed();
        }
      });
    }
  },

  handleCommentPhotoCapture(feedItemId, event) {
    const file = event.target.files[0];
    if (!file) return;

    if (window.GameAudio) window.GameAudio.playClick();
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const maxDim = 800;
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
        this.commentPhotoDrafts[feedItemId] = compressed;
        this.renderFeed();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  },

  removeCommentPhotoDraft(feedItemId) {
    delete this.commentPhotoDrafts[feedItemId];
    this.renderFeed();
  },

  setCapturedPhoto(base64, isVideo = false) {
    this.capturedSocialPhotoBase64 = base64;
    const previewImg = document.getElementById("socialPhotoPreview");
    const previewVid = document.getElementById("socialVideoPreview");
    const removeBtn = document.getElementById("btnRemoveSocialPhoto");
    const submitBtn = document.getElementById("btnSubmitSocialPost");

    if (isVideo) {
      if (previewImg) previewImg.classList.add("hidden");
      if (previewVid) {
        previewVid.src = base64;
        previewVid.classList.remove("hidden");
      }
    } else {
      if (previewVid) previewVid.classList.add("hidden");
      if (previewImg) {
        previewImg.src = base64;
        previewImg.classList.remove("hidden");
      }
    }
    if (removeBtn) removeBtn.classList.remove("hidden");
    if (submitBtn) submitBtn.textContent = "🚀 Schnappschuss posten (+10 Pkt)";
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
        if (submitBtn) submitBtn.textContent = "🚀 In den Feed posten (+5 Pkt)";
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
    const videoPreview = document.getElementById("socialVideoPreview");
    const removeBtn = document.getElementById("btnRemoveSocialPhoto");
    const submitBtn = document.getElementById("btnSubmitSocialPost");
    if (preview) {
      preview.classList.add("hidden");
      preview.src = "";
    }
    if (videoPreview) {
      videoPreview.classList.add("hidden");
      videoPreview.src = "";
    }
    if (removeBtn) removeBtn.classList.add("hidden");
    if (submitBtn) submitBtn.textContent = "🚀 In den Feed posten (+5 Pkt)";
  },

  handleSocialPhotoCapture(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (window.GameAudio) window.GameAudio.playClick();

    const isVideo = file.type.startsWith('video/');
    const reader = new FileReader();

    if (isVideo) {
      // VIDEO EINLESEN
      reader.onload = (e) => {
        const b64 = e.target.result;
        this.capturedSocialPhotoBase64 = b64;

        const previewImg = document.getElementById("socialPhotoPreview");
        const previewVid = document.getElementById("socialVideoPreview");
        const removeBtn = document.getElementById("btnRemoveSocialPhoto");

        if (previewImg) previewImg.classList.add("hidden");
        if (previewVid) {
          previewVid.src = b64;
          previewVid.classList.remove("hidden");
        }
        if (removeBtn) removeBtn.classList.remove("hidden");
      };
      reader.readAsDataURL(file);
    } else {
      // FOTO KOMPRIMIEREN
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

          const previewImg = document.getElementById("socialPhotoPreview");
          const previewVid = document.getElementById("socialVideoPreview");
          const removeBtn = document.getElementById("btnRemoveSocialPhoto");

          if (previewVid) previewVid.classList.add("hidden");
          if (previewImg) {
            previewImg.src = compressed;
            previewImg.classList.remove("hidden");
          }
          if (removeBtn) removeBtn.classList.remove("hidden");
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  },

  async submitSocialPost() {
    const currentUser = window.store.state.currentUser;
    if (!currentUser) return;

    const textInp = document.getElementById("socialPostTextInput");
    const text = textInp ? textInp.value.trim() : "";

    if (!text && !this.capturedSocialPhotoBase64) {
      alert("Bitte gib einen kurzen Text ein oder wähle ein Foto/Video aus!");
      return;
    }

    const modal = document.getElementById("socialPostModal");
    if (modal) modal.classList.add("hidden");

    if (window.GameAudio) window.GameAudio.playCoin();

    const isPhoto = !!this.capturedSocialPhotoBase64;
    await window.store.createFreePost(currentUser.id, text, this.capturedSocialPhotoBase64);

    if (window.app && window.app.showToast) {
      if (isPhoto) {
        window.app.showToast(`📸 +10 Punkte für deinen Schnappschuss!`);
      } else {
        window.app.showToast(`📝 +5 Punkte für deine Textnachricht!`);
      }
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
            <div class="stat-val" id="statMyUserPoints">${(currentUser && currentUser.points) || 0} Pkt</div>
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

    let currentUser = window.store && window.store.state ? window.store.state.currentUser : null;
    if (!currentUser) {
      const savedId = localStorage.getItem("walibi_active_user_id") || localStorage.getItem("walibi_current_user_id");
      if (savedId && window.store && window.store.state && Array.isArray(window.store.state.players)) {
        currentUser = window.store.state.players.find(p => p.id === savedId);
      }
    }
    if (!currentUser && window.ProfileModule && window.ProfileModule.isAdminUser && window.ProfileModule.isAdminUser()) {
      currentUser = window.store && window.store.state && window.store.state.players.find(p => p.name.toLowerCase() === "grossek");
    }
    if (!currentUser && window.store && window.store.state && Array.isArray(window.store.state.players) && window.store.state.players.length > 0) {
      currentUser = window.store.state.players[0];
    }
    if (currentUser && window.store && window.store.state) {
      window.store.state.currentUser = currentUser;
    }

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
          <div class="tracker-item-pill" onclick="CounterModule.logItem('beer')" title="+1 Bier / Radler (+5 Pkt)">
            <span class="tracker-item-icon">🍺</span>
            <div class="tracker-item-info">
              <span class="tracker-item-name">Bier</span>
              <span class="tracker-item-count" id="count_beer">${beerCount}x</span>
            </div>
            <span class="tracker-item-add-btn">+</span>
          </div>

          <div class="tracker-item-pill" onclick="CounterModule.logItem('shot')" title="+1 Shot / Schnaps (+15 Pkt)">
            <span class="tracker-item-icon">🥃</span>
            <div class="tracker-item-info">
              <span class="tracker-item-name">Shot</span>
              <span class="tracker-item-count" id="count_shot">${shotCount}x</span>
            </div>
            <span class="tracker-item-add-btn">+</span>
          </div>

          <div class="tracker-item-pill" onclick="CounterModule.logItem('longdrink')" title="+1 Longdrink / Mix (+10 Pkt)">
            <span class="tracker-item-icon">🍹</span>
            <div class="tracker-item-info">
              <span class="tracker-item-name">Longdrink</span>
              <span class="tracker-item-count" id="count_longdrink">${longdrinkCount}x</span>
            </div>
            <span class="tracker-item-add-btn">+</span>
          </div>

          <div class="tracker-item-pill" onclick="CounterModule.logItem('joint')" title="+1 Joint / Kraut (+10 Pkt)">
            <span class="tracker-item-icon">🌿</span>
            <div class="tracker-item-info">
              <span class="tracker-item-name">Joint</span>
              <span class="tracker-item-count" id="count_joint">${jointCount}x</span>
            </div>
            <span class="tracker-item-add-btn">+</span>
          </div>

          <div class="tracker-item-pill" onclick="CounterModule.logItem('water')" title="+1 Wasser / Soft (+2 Pkt)">
            <span class="tracker-item-icon">🥤</span>
            <div class="tracker-item-info">
              <span class="tracker-item-name">Wasser</span>
              <span class="tracker-item-count" id="count_water">${details.water || 0}x</span>
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

    // Aktuelle Entwürfe aus allen vorhandenen Eingabefeldern sichern
    document.querySelectorAll(".comment-input").forEach(inp => {
      if (inp.id && inp.id.startsWith("input_comment_")) {
        const itemId = inp.id.replace("input_comment_", "");
        this.commentDrafts[itemId] = inp.value;
      }
    });

    // Aktiven Fokus und Cursorposition erfassen
    const activeEl = document.activeElement;
    const activeId = activeEl ? activeEl.id : null;
    let selStart = null;
    let selEnd = null;
    if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA")) {
      try {
        selStart = activeEl.selectionStart;
        selEnd = activeEl.selectionEnd;
      } catch (e) {}
    }

    const rawFeed = window.store.state.feed || [];
    // Einzelne Getränkebuchungen aus dem Feed filtern & strikt duplikatfrei halten
    const seenMap = new Set();
    const feed = [];
    rawFeed.forEach(item => {
      if (!item || item.type === "drink") return;
      const key = item.type === "achievement"
        ? `achieve_${item.userId}_${item.achievementId}`
        : item.id;
      if (!seenMap.has(key)) {
        seenMap.add(key);
        feed.push(item);
      }
    });

    const currentUser = window.store.state.currentUser;
    const myId = currentUser ? currentUser.id : null;

    // Filter Buttons Zustand synchronisieren
    document.querySelectorAll(".feed-filter-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.filter === this.currentFilter);
    });

    // Filter anwenden
    let filteredFeed = feed;
    if (this.currentFilter === "my_posts") {
      filteredFeed = feed.filter(item => myId && item.userId === myId);
    } else if (this.currentFilter === "my_comments") {
      filteredFeed = feed.filter(item => myId && Array.isArray(item.comments) && item.comments.some(c => c.userId === myId));
    } else if (this.currentFilter === "to_vote") {
      filteredFeed = feed.filter(item => item.type === "quest" && item.requiresVoting && !item.votingCompleted && item.userId !== myId && (!item.votes || item.votes[myId] === undefined));
    } else if (this.currentFilter === "voted") {
      filteredFeed = feed.filter(item => item.requiresVoting && item.votes && myId && item.votes[myId] !== undefined);
    }

    if (filteredFeed.length === 0) {
      let emptyIcon = "📸";
      let emptyTitle = "Noch keine Quest-Aktivitäten";
      let emptyDesc = "Teile einen Schnappschuss oder meistere deine erste Challenge!";

      if (this.currentFilter === "my_posts") {
        emptyIcon = "👤";
        emptyTitle = "Keine eigenen Posts";
        emptyDesc = "Du hast noch keine eigenen Posts oder Quests geteilt. Tippe oben auf 'Schnappschuss / Status posten'!";
      } else if (this.currentFilter === "my_comments") {
        emptyIcon = "💬";
        emptyTitle = "Keine Kommentare";
        emptyDesc = "Du hast bisher noch keine Beiträge oder Fotos kommentiert.";
      } else if (this.currentFilter === "to_vote") {
        emptyIcon = "🎉";
        emptyTitle = "Alles bewertet!";
        emptyDesc = "Es gibt aktuell keine offenen Aufgaben deiner Freunde, die auf deine Bewertung warten.";
      } else if (this.currentFilter === "voted") {
        emptyIcon = "⭐";
        emptyTitle = "Noch keine Votes abgegeben";
        emptyDesc = "Du hast bisher noch keine Challenges deiner Freunde bewertet.";
      }

      container.innerHTML = `
        <div class="empty-feed-card" style="text-align: center; padding: 28px 16px; color: var(--text-muted); background: var(--game-panel-bg); border-radius: var(--radius-lg); border: 2px dashed rgba(255,255,255,0.15); margin-top: 6px;">
          <div style="font-size: 40px; margin-bottom: 8px;">${emptyIcon}</div>
          <h3 style="color: #fff; font-size: 17px; margin-bottom: 6px;">${emptyTitle}</h3>
          <p style="font-size: 13px; max-width: 320px; margin: 0 auto; line-height: 1.4;">${emptyDesc}</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filteredFeed.map(item => {
      const isQuest = item.type === "quest";
      const isSocial = item.type === "social";
      const isAchievement = item.type === "achievement";
      const timeStr = this.formatRelativeTime(item.timestamp);
      const isMyPost = item.userId === myId;

      // Reactions HTML
      const emojis = ["🔥", "🍺", "👑", "💀", "👏"];
      const reactionPills = emojis.map(emo => {
        const userList = (item.reactions && item.reactions[emo]) || [];
        const hasReacted = myId && userList.includes(myId);
        const count = userList.length;
        return `
          <button class="reaction-pill ${hasReacted ? 'active' : ''}" onclick="FeedModule.toggleReaction('${item.id}', '${emo}')" title="${emo} Reaktion (+5 Pkt für ${item.userName})">
            ${emo} ${count > 0 ? `<span class="reaction-count">${count}</span>` : ''}
          </button>
        `;
      }).join("");

      // Voting Box HTML falls Quest Voting benötigt
      let votingHtml = "";
      if (isQuest && item.requiresVoting) {
        votingHtml = this.renderVotingCard(item, myId);
      }

      // Kommentare HTML & Gespeicherter Draft
      const comments = item.comments || [];
      const draftText = this.commentDrafts[item.id] || "";
      const draftPhoto = this.commentPhotoDrafts[item.id] || null;

      const commentsHtml = `
        <div class="comments-section" id="comments_${item.id}">
          <div class="comments-list">
            ${comments.map(c => `
              <div class="comment-item">
                <img src="${c.userAvatar || ProfileModule.generateDefaultAvatar(c.userName)}" class="comment-avatar" />
                <div class="comment-bubble">
                  <div class="comment-author">${c.userName} ${c.photo ? '<span style="color:var(--walibi-yellow); font-size:10px; font-weight:800;">(+5 Pkt)</span>' : '<span style="color:var(--text-dim); font-size:10px;">(+2 Pkt)</span>'}</div>
                  ${c.text ? `<div class="comment-text">${this.escapeHtml(c.text)}</div>` : ''}
                  ${c.photo ? `
                    <div class="comment-photo-wrap" onclick="FeedModule.openPhotoModal('${c.photo}')" title="Foto vergrößern">
                      <img src="${c.photo}" class="comment-inline-photo" loading="lazy" alt="Kommentar Foto" />
                    </div>
                  ` : ''}
                  <div class="comment-time">${this.formatRelativeTime(c.timestamp)}</div>
                </div>
              </div>
            `).join("")}
          </div>

          ${draftPhoto ? `
            <div class="comment-photo-preview-wrap">
              <img src="${draftPhoto}" class="comment-draft-thumb" alt="Foto-Antwort Vorschau" />
              <button type="button" class="btn-remove-comment-photo" onclick="FeedModule.removeCommentPhotoDraft('${item.id}')" title="Foto entfernen">✕</button>
            </div>
          ` : ''}

          <div class="comment-input-row">
            <img src="${(currentUser && currentUser.avatar) || ProfileModule.generateDefaultAvatar(currentUser ? currentUser.name : 'X')}" class="mini-input-avatar" />
            <input type="text" id="input_comment_${item.id}" value="${this.escapeHtml(draftText)}" placeholder="Kommentar schreiben (+2 Pkt)..." class="comment-input" oninput="FeedModule.handleCommentInput('${item.id}', this.value)" onkeydown="if(event.key==='Enter') FeedModule.submitComment('${item.id}')" />
            <button type="button" class="btn-comment-media" onclick="FeedModule.openCommentCamera('${item.id}')" title="Foto-Antwort per Kamera (+5 Pkt)">📸</button>
            <label class="btn-comment-media" title="Foto-Antwort aus Galerie (+5 Pkt)">
              🖼️
              <input type="file" accept="image/*" style="display:none;" onchange="FeedModule.handleCommentPhotoCapture('${item.id}', event)" />
            </label>
            <button type="button" class="btn-send-comment" onclick="FeedModule.submitComment('${item.id}')">${draftPhoto ? '📸 Senden (+5 Pkt)' : '💬 Senden (+2 Pkt)'}</button>
          </div>
        </div>
      `;

      // Zeugen-Status Banner
      let witnessBannerHtml = "";
      if (Array.isArray(item.witnesses) && item.witnesses.length > 0) {
        const myWitnessEntry = myId ? item.witnesses.find(w => w.userId === myId) : null;
        const canConfirm = myWitnessEntry && !myWitnessEntry.confirmed;
        const anyConfirmed = item.witnesses.some(w => w.confirmed);

        witnessBannerHtml = `
          <div class="feed-witness-banner ${anyConfirmed ? 'confirmed' : ''}">
            <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
              <span style="font-size: 13px;">👁️</span>
              <span style="font-size: 11px; font-weight: 800; color: #93c5fd;">Zeugen:</span>
              ${item.witnesses.map(w => `
                <span style="font-size: 11px; font-weight: 700; color: ${w.confirmed ? '#34d399' : '#f59e0b'};">
                  ${w.userName} ${w.confirmed ? '✅' : '⏳'}
                </span>
              `).join(" • ")}
            </div>
            ${canConfirm ? `
              <button class="btn-confirm-witness" onclick="FeedModule.confirmAsWitness('${item.id}')">
                ✅ Als Zeuge bestätigen ("Ich war dabei!")
              </button>
            ` : ''}
          </div>
        `;
      }

      let pointsBadgeHtml = "";
      if (item.points !== undefined && item.points !== null) {
        if (item.points < 0) {
          pointsBadgeHtml = `<div class="feed-points-badge penalty">${item.points} Pkt</div>`;
        } else {
          const awarded = item.actualPointsAwarded !== undefined ? item.actualPointsAwarded : item.points;
          const hhBadge = item.isHappyHour ? ` <span style="color: #ffcc00; font-size: 10px; font-weight: 900; margin-left: 2px;">⚡ 2X</span>` : '';
          pointsBadgeHtml = `<div class="feed-points-badge ${item.isHappyHour ? 'feed-points-happyhour' : ''}">+${awarded} Pkt${hhBadge}</div>`;
        }
      }

      const faithBadgeHtml = item.isFaithBased ? `
        <div class="feed-faith-badge">📜 Auf gut Glauben (-20% Ehren-Abzug)</div>
      ` : "";

      return `
        <div class="feed-card ${isAchievement ? 'feed-card-achievement' : ''}" id="post_${item.id}">
          <div class="feed-header">
            <img src="${item.userAvatar || ProfileModule.generateDefaultAvatar(item.userName)}" class="feed-avatar" />
            <div class="feed-user-meta">
              <div class="feed-user-name">${item.userName} <span class="feed-house-tag">${item.userHouse || 'Haus'}</span></div>
              <div class="feed-timestamp">${timeStr}</div>
            </div>
            ${pointsBadgeHtml}
          </div>

          <div class="feed-content">
            ${isAchievement ? `
              <div class="feed-achievement-banner">
                <div class="achievement-trophy-glow">
                  <span class="achievement-big-icon">${item.achievementIcon || '🏆'}</span>
                </div>
                <div class="achievement-details">
                  <div class="achievement-super-tag">🏆 MEILENSTEIN FREIGESCHALTET!</div>
                  <div class="achievement-title-text">${item.achievementTitle}</div>
                  <div class="achievement-desc-text">${this.escapeHtml(item.achievementDesc || '')}</div>
                </div>
              </div>
            ` : isQuest ? `
              <div class="feed-quest-title">${item.questIcon || '🎯'} ${item.questTitle}</div>
              <div class="feed-quest-desc">${item.questDescription}</div>
              ${faithBadgeHtml}
              ${witnessBannerHtml}
              ${item.userComment ? `
                <div class="feed-user-comment-box" style="background: rgba(255,204,0,0.1); border-left: 3px solid var(--walibi-yellow); padding: 6px 10px; border-radius: 6px; margin-bottom: 8px; font-size: 13px; font-style: italic;">
                  💬 "${this.escapeHtml(item.userComment)}"
                </div>
              ` : ''}
              ${item.photo ? (
                (item.isVideo || item.photo.endsWith('.mp4') || item.photo.endsWith('.webm') || item.photo.endsWith('.mov') || item.photo.startsWith('data:video')) ? `
                  <div class="feed-video-wrapper">
                    <video src="${item.photo}" controls playsinline preload="metadata" class="feed-proof-video"></video>
                  </div>
                ` : `
                  <div class="feed-photo-wrapper" onclick="FeedModule.openPhotoModal('${item.photo}')">
                    <img src="${item.photo}" class="feed-proof-photo" loading="lazy" alt="Beweisfoto" />
                    <span class="photo-expand-hint">🔍 Vergrößern</span>
                  </div>
                `
              ) : ''}
            ` : isSocial ? `
              <div style="font-size: 14px; font-weight: 700; color: #fff; margin-bottom: 8px; line-height: 1.4;">
                ${this.escapeHtml(item.text)}
              </div>
              ${item.photo ? (
                (item.isVideo || item.photo.endsWith('.mp4') || item.photo.endsWith('.webm') || item.photo.endsWith('.mov') || item.photo.startsWith('data:video')) ? `
                  <div class="feed-video-wrapper">
                    <video src="${item.photo}" controls playsinline preload="metadata" class="feed-proof-video"></video>
                  </div>
                ` : `
                  <div class="feed-photo-wrapper" onclick="FeedModule.openPhotoModal('${item.photo}')">
                    <img src="${item.photo}" class="feed-proof-photo" loading="lazy" alt="Schnappschuss" />
                    <span class="photo-expand-hint">🔍 Vergrößern</span>
                  </div>
                `
              ) : ''}
            ` : `
              <div class="feed-drink-row">
                <span class="drink-big-icon">${item.itemIcon || '🍺'}</span>
                <div>
                  <div class="drink-log-title"><strong>${item.userName}</strong> hat sich 1x <strong>${item.itemName}</strong> gegönnt!</div>
                  <div class="drink-points-tag">+${item.points} Punkte auf's Partykonto${item.isHappyHour ? ' ⚡ (2X HAPPY HOUR!)' : ''}</div>
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

    // Aktiven Fokus & Cursorposition nach dem Rendern nahtlos wiederherstellen
    if (activeId) {
      const elToFocus = document.getElementById(activeId);
      if (elToFocus) {
        elToFocus.focus();
        if (selStart !== null && selEnd !== null) {
          try {
            elToFocus.setSelectionRange(selStart, selEnd);
          } catch (e) {}
        }
      }
    }
  },

  renderVotingCard(item, myId) {
    const players = window.store.state.players;
    const eligibleCount = Math.max(1, players.length - 1);
    const votes = item.votes || {};
    const voteCount = Object.keys(votes).length;
    const isCompleted = !!(item.votingCompleted || item.votingUnlocked);
    const requiredVotes = Math.max(1, Math.ceil(eligibleCount * 0.6));
    const progressPercent = Math.min(100, Math.round((voteCount / requiredVotes) * 100));

    let sum = 0;
    Object.values(votes).forEach(val => sum += Number(val));
    const avgRating = voteCount > 0 ? (sum / voteCount).toFixed(1) : 0;

    const myVote = (myId && votes[myId] !== undefined) ? Number(votes[myId]) : null;
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
            <span class="vote-prompt">${myVote ? `Deine Stimme: ${myVote} ⭐` : 'Bewerte die Aktion:'}</span>
            <div class="stars-buttons">
              ${[1, 2, 3, 4, 5].map(star => `
                <button type="button" class="star-btn ${myVote === star ? 'selected' : ''}" onclick="FeedModule.castVote('${item.id}', ${star})" title="${star} von 5 Sternen vergeben">
                  ${star} ⭐
                </button>
              `).join("")}
            </div>
          </div>
        ` : `
          <div class="voting-own-hint">👥 Deine Freunde stimmen gerade über deinen Post ab! (${voteCount}/${requiredVotes} Stimmen)</div>
        `}
      </div>
    `;
  },

  async toggleReaction(feedItemId, emoji) {
    if (!ProfileModule.requireUser()) return;
    const currentUser = window.store.state.currentUser;
    if (!currentUser) return;

    if (window.GameAudio) window.GameAudio.playClick();
    await window.store.toggleReaction(feedItemId, currentUser.id, emoji);
    this.renderFeed();
  },

  async castVote(feedItemId, rating) {
    if (!ProfileModule.requireUser()) return;
    const currentUser = window.store.state.currentUser;
    if (!currentUser) return;

    if (window.GameAudio) window.GameAudio.playCoin();
    await window.store.castVote(feedItemId, currentUser.id, Number(rating));
    this.renderFeed();
  },

  async submitComment(feedItemId) {
    if (!ProfileModule.requireUser()) return;
    const currentUser = window.store.state.currentUser;
    const input = document.getElementById(`input_comment_${feedItemId}`);
    const text = input ? input.value.trim() : (this.commentDrafts[feedItemId] || "");
    const photoBase64 = this.commentPhotoDrafts[feedItemId] || null;

    if (!text && !photoBase64) return;

    if (window.GameAudio) window.GameAudio.playClick();
    await window.store.addComment(feedItemId, currentUser.id, text, photoBase64);
    delete this.commentDrafts[feedItemId];
    delete this.commentPhotoDrafts[feedItemId];
    if (input) input.value = "";
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
