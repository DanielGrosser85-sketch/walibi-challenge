/**
 * ❄️🔨 EISBRECHER & SYMPATHIE-VOTING MODULE
 * Ermöglicht vor der Siegerehrung / dem Zeugnis die Vergabe von Sympathie-Punkten & Ehrentiteln
 */
const SympathyModule = {
  currentVotes: {}, // { [playerId]: { rating: 5, points: 50, tag: "🕶️ Chilligste Socke", comment: "" } }
  isEditing: false,

  availableTags: [
    { id: "chill", label: "🕶️ Chilligste Socke" },
    { id: "buddy", label: "🍻 Bester Trink-Buddy" },
    { id: "ramp", label: "🚀 Coaster-Rampensau" },
    { id: "fun", label: "😂 Größter Spaßvogel" },
    { id: "sun", label: "❤️ Gruppen-Sonnenschein" },
    { id: "mvp", label: "👑 Heimlicher MVP" }
  ],

  init() {
    // Re-render wenn sich Store-Daten ändern und das Modal sichtbar ist
    if (window.store) {
      window.store.subscribe(() => {
        const modal = document.getElementById("sympathyVoteModal");
        if (modal && !modal.classList.contains("hidden")) {
          this.renderVoteContent();
        }
      });
    }
  },

  getCurrentUser() {
    let u = window.store ? window.store.state.currentUser : null;
    if (!u) {
      const savedId = localStorage.getItem("walibi_active_user_id") || localStorage.getItem("walibi_current_user_id");
      if (savedId && window.store && window.store.state && window.store.state.players) {
        u = window.store.state.players.find(p => p.id === savedId);
      }
    }
    if (!u && window.ProfileModule && window.ProfileModule.isAdminUser()) {
      u = window.store && window.store.state && window.store.state.players.find(p => p.name.toLowerCase() === "grossek");
    }
    if (!u && window.store && window.store.state && window.store.state.players && window.store.state.players.length > 0) {
      u = window.store.state.players[0];
    }
    if (u && window.store) {
      window.store.state.currentUser = u;
    }
    return u;
  },

  hasCurrentUserVoted() {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return false;
    const sympathyVotes = (window.store && window.store.state && window.store.state.sympathyVotes) || {};
    const myVotes = sympathyVotes[currentUser.id];
    if (myVotes && Object.keys(myVotes).length > 0) return true;
    try {
      const localFlag = localStorage.getItem("walibi_sympathy_submitted_" + currentUser.id);
      if (localFlag === "true") return true;
    } catch (e) {}
    return false;
  },

  openVoteModal(forceEdit = false) {
    if (window.GameAudio) window.GameAudio.playClick();
    const modal = document.getElementById("sympathyVoteModal");
    if (!modal) return;

    if (forceEdit) {
      this.isEditing = true;
    } else {
      // Wenn der Spieler schon abgestimmt hat, zeige den Warte- & Status-Screen
      this.isEditing = !this.hasCurrentUserVoted();
    }

    this.renderVoteContent();
    modal.classList.remove("hidden");
  },

  closeVoteModal() {
    if (window.GameAudio) window.GameAudio.playClick();
    const modal = document.getElementById("sympathyVoteModal");
    if (modal) modal.classList.add("hidden");
  },

  renderVoteContent() {
    const container = document.getElementById("sympathyVoteModalBody");
    if (!container) return;

    const players = (window.store && window.store.state && window.store.state.players) || [];
    const currentUser = this.getCurrentUser();
    const sympathyVotes = (window.store && window.store.state && window.store.state.sympathyVotes) || {};
    const mySavedVotes = currentUser ? (sympathyVotes[currentUser.id] || {}) : {};

    // Andere Spieler filtern (sich selbst nicht bewerten)
    const otherPlayers = players.filter(p => !currentUser || p.id !== currentUser.id);

    // Initialisiere currentVotes
    otherPlayers.forEach(p => {
      if (!this.currentVotes[p.id]) {
        if (mySavedVotes[p.id]) {
          this.currentVotes[p.id] = { ...mySavedVotes[p.id] };
        } else {
          this.currentVotes[p.id] = {
            rating: 5,
            points: 50,
            tag: this.availableTags[0].label,
            comment: ""
          };
        }
      }
    });

    // 1. FALL: Nur 1 Spieler im Spiel
    if (otherPlayers.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 24px 12px;">
          <div style="font-size: 48px; margin-bottom: 8px;">👤🎉</div>
          <h3 style="color: #fff; font-size: 18px; margin-bottom: 6px;">Du bist aktuell der einzige Spieler!</h3>
          <p style="font-size: 13px; color: var(--text-muted); line-height: 1.4; margin-bottom: 16px;">
            Sobald weitere Mitstreiter im Park registriert sind, könnt ihr euch hier gegenseitig Sympathie-Punkte und Ehrentitel verpassen!
          </p>
          <button type="button" class="btn-primary" onclick="SympathyModule.closeVoteModal(); AwardsModule.openCelebrationModal();" style="background: var(--gradient-gold); color: #000; font-weight: 900; border: 2.5px solid #fff; font-size: 15px;">
            📜 DIREKT ZUM SAUFTOUR-ZEUGNIS '26
          </button>
        </div>
      `;
      return;
    }

    // 2. FALL: Benutzer hat bereits abgestimmt und ist NICHT im Bearbeitungs-Modus -> WARTE- & STATUS-SCREEN
    const hasVoted = this.hasCurrentUserVoted();
    if (hasVoted && !this.isEditing) {
      this.renderWaitingScreen(container, players, currentUser, sympathyVotes);
      return;
    }

    // 3. FALL: VOTING-MASKE ZUM ABSTIMMEN / BEARBEITEN
    this.renderVotingForm(container, otherPlayers);
  },

  renderWaitingScreen(container, players, currentUser, sympathyVotes) {
    const totalPlayers = players.length;
    const votedPlayers = players.filter(p => (sympathyVotes[p.id] && Object.keys(sympathyVotes[p.id]).length > 0) || (localStorage.getItem("walibi_sympathy_submitted_" + p.id) === "true"));
    const votedCount = votedPlayers.length;
    const allHaveVoted = votedCount >= totalPlayers;
    const percentage = Math.round((votedCount / totalPlayers) * 100);

    container.innerHTML = `
      <!-- HERO WAITING BANNER -->
      <div style="background: ${allHaveVoted ? 'linear-gradient(135deg, rgba(16,185,129,0.3), rgba(255,204,0,0.25))' : 'linear-gradient(135deg, rgba(236,72,153,0.3), rgba(245,158,11,0.2))'}; border: 2.5px solid ${allHaveVoted ? '#10b981' : '#ec4899'}; border-radius: 14px; padding: 14px; text-align: center; margin-bottom: 14px; box-shadow: 0 0 25px ${allHaveVoted ? 'rgba(16,185,129,0.4)' : 'rgba(236,72,153,0.35)'};">
        <div style="font-size: 36px; margin-bottom: 2px;">${allHaveVoted ? '🏆👑🎉' : '⏳💖✨'}</div>
        <h3 style="font-size: 19px; color: #fff; margin: 2px 0 4px 0; font-family: var(--font-headline);">
          ${allHaveVoted ? 'ALLE HABEN ABGESTIMMT!' : 'WARTE AUF MITSTREITER...'}
        </h3>
        <p style="font-size: 13px; color: ${allHaveVoted ? '#a7f3d0' : '#fbcfe8'}; line-height: 1.4; margin: 0;">
          ${allHaveVoted 
            ? 'Das offizielle Endergebnis \'26 inklusive aller Sympathie-Punkte steht fest!' 
            : 'Deine Sympathie-Punkte wurden erfolgreich bestätigt! Wir warten auf die Stimmen der restlichen Gruppe.'}
        </p>
      </div>

      <!-- FORTSCHRITTS-LEISTE -->
      <div style="background: rgba(0,0,0,0.45); border: 1.5px solid rgba(255,255,255,0.15); border-radius: 12px; padding: 12px; margin-bottom: 14px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <span style="font-size: 12px; font-weight: 800; color: #fff;">Voting-Fortschritt der Gruppe:</span>
          <span style="font-size: 13px; font-weight: 900; color: #ffcc00;">${votedCount} / ${totalPlayers} (${percentage}%)</span>
        </div>
        <div style="width: 100%; height: 12px; background: rgba(255,255,255,0.1); border-radius: 999px; overflow: hidden; border: 1px solid rgba(255,255,255,0.2);">
          <div style="width: ${percentage}%; height: 100%; background: ${allHaveVoted ? 'var(--gradient-emerald, #10b981)' : 'linear-gradient(90deg, #ec4899, #f59e0b)'}; transition: width 0.4s ease; border-radius: 999px;"></div>
        </div>
      </div>

      <!-- STATUS-LISTE ALLER SPIELER -->
      <div style="background: rgba(15, 23, 42, 0.85); border: 2px solid rgba(255,255,255,0.15); border-radius: 14px; padding: 12px; margin-bottom: 16px;">
        <div style="font-size: 11px; font-weight: 900; color: var(--walibi-yellow); text-transform: uppercase; margin-bottom: 10px; letter-spacing: 0.5px;">
          👥 Wer hat schon abgestimmt?
        </div>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          ${players.map(p => {
            const hasP_Voted = Boolean(sympathyVotes[p.id] && Object.keys(sympathyVotes[p.id]).length > 0) || (localStorage.getItem("walibi_sympathy_submitted_" + p.id) === "true");
            const isCurrent = currentUser && currentUser.id === p.id;
            return `
              <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(0,0,0,0.35); padding: 8px 10px; border-radius: 10px; border: 1.5px solid ${hasP_Voted ? '#10b981' : '#f59e0b'};">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <img src="${p.avatar || 'assets/mascot_fox.jpg'}" style="width: 34px; height: 34px; border-radius: 50%; border: 1.5px solid ${hasP_Voted ? '#10b981' : '#f59e0b'}; object-fit: cover;" />
                  <div>
                    <div style="font-size: 13px; font-weight: 900; color: #fff;">
                      ${p.name} ${isCurrent ? '<span class="you-badge">(Du)</span>' : ''}
                    </div>
                    <div style="font-size: 10px; color: var(--text-muted);">${p.house || 'Haus 1'}</div>
                  </div>
                </div>
                <div>
                  ${hasP_Voted 
                    ? `<span style="display: inline-flex; align-items: center; gap: 4px; background: rgba(16,185,129,0.2); color: #34d399; font-size: 11px; font-weight: 900; padding: 3px 8px; border-radius: 999px; border: 1px solid #10b981;">
                        ✅ Abgestimmt
                       </span>`
                    : `<span style="display: inline-flex; align-items: center; gap: 4px; background: rgba(245,158,11,0.2); color: #fbbf24; font-size: 11px; font-weight: 900; padding: 3px 8px; border-radius: 999px; border: 1px solid #f59e0b;">
                        ⏳ Stimmt ab...
                       </span>`
                  }
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>

      <!-- AKTIONEN IM WARTE-SCREEN -->
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <button type="button" class="btn-primary" onclick="SympathyModule.closeVoteModal(); AwardsModule.openCelebrationModal();" style="background: var(--gradient-gold); color: #000; font-weight: 900; border: 2.5px solid #fff; font-size: 15px; padding: 13px; box-shadow: 0 0 20px rgba(255,204,0,0.4);">
          ${allHaveVoted ? '👑 ZUM FINALEN ZEUGNIS & SIEGEREHRUNG 🏆' : '📜 VORLÄUFIGES ZEUGNIS ANSEHEN'}
        </button>

        <button type="button" onclick="SympathyModule.openVoteModal(true);" style="background: rgba(236,72,153,0.15); border: 1.5px solid #ec4899; color: #f472b6; font-size: 13px; font-weight: 800; border-radius: 10px; padding: 9px; cursor: pointer; text-align: center;">
          🔄 Meine Sympathie-Punkte bearbeiten
        </button>
      </div>
    `;
  },

  renderVotingForm(container, otherPlayers) {
    container.innerHTML = `
      <!-- HERO BANNER -->
      <div style="background: linear-gradient(135deg, rgba(236,72,153,0.25), rgba(255,204,0,0.2)); border: 2px solid #ec4899; border-radius: 14px; padding: 12px; text-align: center; margin-bottom: 14px; box-shadow: 0 0 20px rgba(236,72,153,0.3);">
        <div style="font-size: 28px; margin-bottom: 2px;">❄️🔨 ➜ 💖✨</div>
        <h3 style="font-size: 17px; color: #fff; margin: 2px 0 4px 0; font-family: var(--font-headline);">DAS GROSSE EISBRECHER-VOTING</h3>
        <p style="font-size: 12px; color: #fbcfe8; line-height: 1.4; margin: 0;">
          Da viele sich vor heute kaum kannten: <strong>Wie cool fandest du deine Mitstreiter?</strong><br>
          Vergib 1–5 Sterne (+10 bis +50 Punkte) & einen Ehrentitel – jede Stimme fließt ins Zeugnis ein und kann das Klassement noch kippen!
        </p>
      </div>

      <!-- LISTE DER MITSPIELER -->
      <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px;">
        ${otherPlayers.map(p => {
          const vote = this.currentVotes[p.id] || { rating: 5, points: 50, tag: this.availableTags[0].label, comment: "" };
          return `
            <div class="sympathy-player-card" style="background: rgba(15, 23, 42, 0.85); border: 2px solid rgba(236,72,153,0.4); border-radius: 14px; padding: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.3);">
              <!-- SPIELER KOPF -->
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                  <img src="${p.avatar || 'assets/mascot_fox.jpg'}" style="width: 44px; height: 44px; border-radius: 50%; border: 2px solid #ec4899; object-fit: cover;" />
                  <div>
                    <div style="font-size: 16px; font-weight: 900; color: #fff;">${p.name}</div>
                    <div style="font-size: 11px; color: var(--text-muted);">${p.house || 'Haus 1'} • Aktuell: <strong style="color: var(--walibi-yellow);">${p.points || 0} Pkt</strong></div>
                  </div>
                </div>
                <div style="text-align: right;">
                  <span id="sympathyPtsBadge_${p.id}" class="points-badge" style="font-size: 12px; background: linear-gradient(135deg, #ec4899, #be185d); color: #fff; border-color: #fbcfe8;">
                    +${vote.points} Pkt
                  </span>
                </div>
              </div>

              <!-- STERNE BEWERTUNG -->
              <div style="margin-bottom: 10px; background: rgba(0,0,0,0.35); padding: 8px 10px; border-radius: 10px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                  <span style="font-size: 11px; font-weight: 800; color: #f472b6; text-transform: uppercase;">⭐ Coolness & Sympathie:</span>
                  <span id="sympathyRatingLabel_${p.id}" style="font-size: 12px; font-weight: 900; color: #ffcc00;">
                    ${vote.rating === 5 ? '⭐⭐⭐⭐⭐ 5/5 (Mega Kult!)' : vote.rating === 4 ? '⭐⭐⭐⭐ 4/5 (Sehr cool)' : vote.rating === 3 ? '⭐⭐⭐ 3/5 (Guter Typ)' : vote.rating === 2 ? '⭐⭐ 2/5 (Ganz nett)' : '⭐ 1/5 (Solide)'}
                  </span>
                </div>
                <div style="display: flex; gap: 6px; justify-content: space-between;">
                  ${[1, 2, 3, 4, 5].map(starNum => {
                    const isSelected = vote.rating >= starNum;
                    return `
                      <button type="button" onclick="SympathyModule.setRating('${p.id}', ${starNum})" class="sympathy-star-btn ${isSelected ? 'active' : ''}" style="flex: 1; padding: 6px 2px; border-radius: 8px; border: 1.5px solid ${isSelected ? '#ffcc00' : 'rgba(255,255,255,0.15)'}; background: ${isSelected ? 'rgba(255,204,0,0.2)' : 'rgba(0,0,0,0.4)'}; color: ${isSelected ? '#ffcc00' : '#64748b'}; font-size: 16px; cursor: pointer; transition: all 0.2s;">
                        ★
                        <div style="font-size: 9px; font-weight: 800; color: ${isSelected ? '#fff' : '#64748b'};">+${starNum * 10}P</div>
                      </button>
                    `;
                  }).join("")}
                </div>
              </div>

              <!-- EISBRECHER TITEL / TAGS -->
              <div style="margin-bottom: 6px;">
                <div style="font-size: 11px; font-weight: 800; color: #fbcfe8; text-transform: uppercase; margin-bottom: 6px;">🏷️ Wähle einen Eisbrecher-Ehrentitel:</div>
                <div style="display: flex; flex-wrap: wrap; gap: 5px;">
                  ${this.availableTags.map(tagObj => {
                    const isTagActive = vote.tag === tagObj.label;
                    return `
                      <button type="button" onclick="SympathyModule.setTag('${p.id}', '${tagObj.label}')" class="sympathy-tag-btn ${isTagActive ? 'active' : ''}" style="padding: 4px 9px; font-size: 11px; font-weight: 800; border-radius: 999px; border: 1.5px solid ${isTagActive ? '#ec4899' : 'rgba(255,255,255,0.15)'}; background: ${isTagActive ? 'linear-gradient(135deg, #ec4899, #db2777)' : 'rgba(0,0,0,0.4)'}; color: #fff; cursor: pointer; transition: all 0.2s;">
                        ${tagObj.label}
                      </button>
                    `;
                  }).join("")}
                </div>
              </div>
            </div>
          `;
        }).join("")}
      </div>

      <!-- AKTIONEN -->
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <button type="button" class="btn-primary" onclick="SympathyModule.submitVotes()" style="background: linear-gradient(135deg, #ec4899, #f59e0b); color: #fff; font-weight: 900; border: 2.5px solid #fff; font-size: 16px; padding: 14px; box-shadow: 0 0 25px rgba(236,72,153,0.5); cursor: pointer; width: 100%;">
          💖 STIMMEN EINREICHEN & BESTÄTIGEN 🚀
        </button>

        <button type="button" onclick="SympathyModule.openVoteModal(false);" style="background: none; border: none; color: var(--text-muted); font-size: 12px; cursor: pointer; text-decoration: underline; padding: 6px; text-align: center;">
          ${this.hasCurrentUserVoted() ? '↩️ Zurück zum Warte-Screen' : '📜 Zeugnis direkt ansehen (später abstimmen)'}
        </button>
      </div>
    `;
  },

  setRating(playerId, rating) {
    if (window.GameAudio) window.GameAudio.playClick();
    if (!this.currentVotes[playerId]) {
      this.currentVotes[playerId] = { rating: 5, points: 50, tag: this.availableTags[0].label, comment: "" };
    }
    this.currentVotes[playerId].rating = rating;
    this.currentVotes[playerId].points = rating * 10;
    this.renderVoteContent();
  },

  setTag(playerId, tagLabel) {
    if (window.GameAudio) window.GameAudio.playClick();
    if (!this.currentVotes[playerId]) {
      this.currentVotes[playerId] = { rating: 5, points: 50, tag: tagLabel, comment: "" };
    }
    this.currentVotes[playerId].tag = tagLabel;
    this.renderVoteContent();
  },

  async submitVotes() {
    try {
      const currentUser = this.getCurrentUser();
      if (!currentUser) {
        if (window.app && window.app.showToast) {
          window.app.showToast("⚠️ Bitte wähle zuerst dein Spielerprofil oben aus!");
        }
        if (window.ProfileModule) window.ProfileModule.openProfileSelectModal();
        return;
      }

      // Votes zusammenstellen
      const players = (window.store && window.store.state && window.store.state.players) || [];
      const otherPlayers = players.filter(p => p.id !== currentUser.id);

      const votesToSave = {};
      otherPlayers.forEach(p => {
        const cur = this.currentVotes[p.id];
        const rating = cur && cur.rating ? Number(cur.rating) : 5;
        const pts = cur && typeof cur.points === 'number' ? cur.points : rating * 10;
        const tag = cur && cur.tag ? cur.tag : this.availableTags[0].label;
        const comment = cur && cur.comment ? cur.comment : "";
        votesToSave[p.id] = { rating, points: pts, tag, comment };
      });
      this.currentVotes = votesToSave;

      // Status sofort auf "Abgestimmt" setzen
      this.isEditing = false;
      try {
        localStorage.setItem("walibi_sympathy_submitted_" + currentUser.id, "true");
      } catch (e) {}

      if (window.GameAudio) window.GameAudio.playReward();

      if (window.app && window.app.showToast) {
        window.app.showToast("💖 <strong>Sympathie-Punkte erfolgreich bestätigt!</strong>");
      }
      if (window.app && window.app.fireConfetti) {
        window.app.fireConfetti();
      }

      // Sofort Warte-Screen anzeigen
      this.renderVoteContent();

      // Speichern im Store
      if (window.store) {
        await window.store.submitSympathyVotes(currentUser.id, votesToSave);
      }

      // Nach Abschluss nochmals Warte-Screen aktualisieren
      this.renderVoteContent();
    } catch (err) {
      console.error("Fehler beim Bestätigen der Sympathie-Stimmen:", err);
      this.isEditing = false;
      this.renderVoteContent();
    }
  }
};

window.SympathyModule = SympathyModule;

/**
 * SIEGEREHRUNG & SAUFTOUR-ZEUGNIS '26
 * Spielende und Siegerehrung werden manuell vom Admin im Admin-Panel ausgelöst
 */
const AwardsModule = {
  selectedPlayerId: null,

  init() {
    // Kein automatischer Zwangs-Stop – Das Spiel läuft dauerhaft bis zum manuellen Admin-Abschluss
  },

  // Prüft ob das Spiel aktuell läuft oder beendet ist
  isGameActive() {
    const state = window.store ? window.store.state : null;
    if (state && state.gameStatus) {
      if (state.gameStatus.isEnded) return false;
      if (state.gameStatus.isRunning) return true;
    }
    return true;
  },

  // --- SIEGEREHRUNG & ZEUGNIS ÖFFNEN ---
  openCelebrationModal(isAutoEnd = false, targetPlayerId = null) {
    const modal = document.getElementById("gameEndedCelebrationModal");
    if (!modal) return;

    if (targetPlayerId) {
      this.selectedPlayerId = targetPlayerId;
    }

    // Sound & Konfetti
    if (window.GameAudio) {
      window.GameAudio.playFanfare();
    }
    if (window.app && window.app.fireConfetti) {
      window.app.fireConfetti();
      setTimeout(() => window.app.fireConfetti(), 800);
      setTimeout(() => window.app.fireConfetti(), 1600);
    }

    this.renderCelebrationContent(isAutoEnd, this.selectedPlayerId);
    modal.classList.remove("hidden");
  },

  switchPlayerCertificate(playerId) {
    if (window.GameAudio) window.GameAudio.playClick();
    this.selectedPlayerId = playerId;
    this.renderCelebrationContent(false, playerId);
  },

  closeCelebrationModal() {
    if (window.GameAudio) window.GameAudio.playClick();
    const modal = document.getElementById("gameEndedCelebrationModal");
    if (modal) modal.classList.add("hidden");
  },

  renderCelebrationContent(isAutoEnd, targetPlayerId = null) {
    const container = document.getElementById("celebrationModalBody");
    if (!container) return;

    const players = (window.store && window.store.state && window.store.state.players) || [];
    const feed = (window.store && window.store.state && window.store.state.feed) || [];
    const currentUser = window.store ? window.store.state.currentUser : null;

    if (players.length === 0) return;

    // Sortiere Spieler nach Punkten
    const sorted = [...players].sort((a, b) => (b.points || 0) - (a.points || 0));
    const winner = sorted[0];
    
    // Ausgewählter Spieler für das Zeugnis:
    const activePlayerId = targetPlayerId || this.selectedPlayerId || (currentUser ? currentUser.id : winner.id);
    const me = sorted.find(p => p.id === activePlayerId) || winner;
    const myRank = sorted.findIndex(p => p.id === me.id) + 1;
    const isMe = currentUser && currentUser.id === me.id;

    // Konsum-Auswertung für den gewählten Spieler
    const myDrinks = me.drinksDetail || { beer: 0, shot: 0, longdrink: 0, joint: 0, water: 0 };
    const myTotalDrinks = me.drinksCount || 0;
    const myQuestsCount = (me.completedQuests && me.completedQuests.length) || 0;
    
    // Hauptquests & Challenges
    const allQuests = (window.store && window.store.state && window.store.state.quests) || window.INITIAL_QUESTS || [];
    const myQuestIds = me.completedQuests || [];
    const myCompletedQuests = allQuests.filter(q => myQuestIds.includes(q.id));
    const mainQuestBonusPoints = myCompletedQuests.reduce((sum, q) => sum + (q.points || 0), 0);

    // Nebenquests & erworbene Titel
    const allSideQuests = window.SIDE_QUESTS || [];
    const mySideQuestIds = me.completedSideQuests || [];
    const myCompletedSideQuests = allSideQuests.filter(sq => mySideQuestIds.includes(sq.id));
    const sideQuestBonusPoints = myCompletedSideQuests.reduce((sum, sq) => sum + (sq.points || 0), 0);

    // Coaster-Fahrten
    let myRidesCount = 0;
    if (me.rideCounts) {
      myRidesCount = Object.values(me.rideCounts).reduce((a, b) => a + b, 0);
    }

    // Eigene Posts & Votings
    const myPostsCount = feed.filter(f => f.userId === me.id).length;
    let myVotesGiven = 0;
    feed.forEach(f => {
      if (f.votes && f.votes[me.id]) myVotesGiven++;
    });

    // Lustigen Titel generieren (inkl. Nebenquest-Titel)
    const titleObj = this.generateFunnyTitle(me, myRank, sorted, myCompletedSideQuests);
    
    // Lustige Organ-Diagnosen generieren
    const liverReport = this.generateLiverReport(myDrinks.beer || 0, myDrinks.shot || 0, myDrinks.longdrink || 0, myCompletedSideQuests);
    const lungReport = this.generateLungReport(myDrinks.joint || 0);
    const stomachReport = this.generateStomachReport(myRidesCount, myTotalDrinks, myCompletedSideQuests);
    const faithReport = this.generateFaithReport(me.gutGlaubenCount || 0);

    // Sympathie-Punkte & Eisbrecher-Auswertung für den gewählten Spieler
    const sympathyPts = me.sympathyPoints || 0;
    const sympathyVotes = me.sympathyVotesReceived || [];
    const sympathyVotersCount = sympathyVotes.length;
    const avgSympathyRating = sympathyVotersCount > 0 
      ? (sympathyVotes.reduce((sum, v) => sum + (v.rating || 5), 0) / sympathyVotersCount).toFixed(1)
      : "5.0";

    const tagCounts = {};
    sympathyVotes.forEach(v => {
      if (v.tag) {
        tagCounts[v.tag] = (tagCounts[v.tag] || 0) + 1;
      }
    });

    const sympathyReport = this.generateSympathyReport(avgSympathyRating, sympathyPts, sympathyVotersCount, tagCounts, me);

    // Gruppen-Gesamtstatistik
    let totalGroupBeer = 0, totalGroupShots = 0, totalGroupLongdrinks = 0, totalGroupJoints = 0, totalGroupSideQuests = 0;
    players.forEach(p => {
      const d = p.drinksDetail || {};
      totalGroupBeer += (d.beer || 0);
      totalGroupShots += (d.shot || 0);
      totalGroupLongdrinks += (d.longdrink || 0);
      totalGroupJoints += (d.joint || 0);
      totalGroupSideQuests += ((p.completedSideQuests && p.completedSideQuests.length) || 0);
    });

    // Häuser-Auswertung
    const houseScores = {};
    players.forEach(p => {
      const h = p.house || "Haus 1";
      houseScores[h] = (houseScores[h] || 0) + (p.points || 0);
    });
    const winningHouse = Object.keys(houseScores).sort((a, b) => houseScores[b] - houseScores[a])[0] || "Haus 1";

    container.innerHTML = `
      <!-- TOP WINNER PODIUM -->
      <div style="background: linear-gradient(135deg, rgba(255,204,0,0.25), rgba(225,29,72,0.25)); border: 2.5px solid var(--walibi-yellow); border-radius: 16px; padding: 16px; text-align: center; margin-bottom: 14px; box-shadow: 0 0 25px rgba(255,204,0,0.3);">
        <div style="font-size: 38px; margin-bottom: 2px;">👑🏆🎉</div>
        <div style="font-size: 11px; font-weight: 900; color: var(--walibi-yellow); letter-spacing: 2px; text-transform: uppercase;">Mr. / Mrs. Walibi '26</div>
        <h2 style="font-size: 26px; color: #fff; margin: 4px 0; font-family: var(--font-headline);">${winner.name}</h2>
        <div style="font-size: 14px; font-weight: 900; color: #34d399;">Mit gigantischen ${winner.points} Punkten auf Platz #1!</div>
        <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Sieger-Haus: <strong>🏰 ${winningHouse}</strong> (${houseScores[winningHouse] || 0} Pkt)</div>
      </div>

      <!-- SPIELER-AUSWAHL FÜR ZEUGNISSE -->
      <div style="background: rgba(0,0,0,0.4); border: 1.5px solid rgba(255,204,0,0.3); border-radius: 12px; padding: 10px; margin-bottom: 14px;">
        <div style="font-size: 11px; font-weight: 800; color: var(--walibi-yellow); text-transform: uppercase; margin-bottom: 6px; text-align: center; letter-spacing: 0.5px;">
          📜 Zeugnisse aller Mitspieler ansehen:
        </div>
        <div style="display: flex; gap: 6px; overflow-x: auto; padding-bottom: 4px; scrollbar-width: none;">
          ${sorted.map((p, idx) => {
            const isSelected = p.id === me.id;
            const rankIcon = idx === 0 ? '👑' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
            return `
              <button type="button" class="subtab-btn ${isSelected ? 'active' : ''}" style="padding: 6px 12px; font-size: 12px; white-space: nowrap; border-radius: 999px; display: flex; align-items: center; gap: 4px; font-weight: 800;" onclick="AwardsModule.switchPlayerCertificate('${p.id}')">
                <span>${rankIcon}</span>
                <span>${p.name}</span>
              </button>
            `;
          }).join("")}
        </div>
      </div>

      <!-- PERSÖNLICHES ZEUGNIS & TITEL -->
      <div style="background: var(--game-panel-light); border: 2px solid rgba(255,255,255,0.15); border-radius: 14px; padding: 14px; margin-bottom: 14px;">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
          <img src="${me.avatar || 'assets/mascot_hard_gaan.jpg'}" style="width: 54px; height: 54px; border-radius: 50%; border: 2.5px solid var(--walibi-yellow);" />
          <div>
            <div style="font-size: 11px; color: var(--text-muted); font-weight: 800;">SAUFTOUR-ZEUGNIS '26 VON:</div>
            <div style="font-size: 18px; font-weight: 900; color: #fff;">${me.name} ${isMe ? '<span class="you-badge">(Du)</span>' : ''} (Rang #${myRank})</div>
            <div style="font-size: 12px; color: var(--walibi-yellow); font-weight: 800;">${me.points} Punkte • ${me.house || 'Haus 1'}</div>
          </div>
        </div>

        <!-- VERLIEHENER HAUPT-TITEL -->
        <div style="background: rgba(0,0,0,0.45); border: 2px solid #ffcc00; border-radius: 12px; padding: 12px; margin-bottom: 12px; text-align: center; box-shadow: 0 0 15px rgba(255, 204, 0, 0.25);">
          <div style="font-size: 10px; color: var(--text-muted); font-weight: 900; text-transform: uppercase; letter-spacing: 1px;">Offiziell verliehener Haupt-Titel:</div>
          <div style="font-size: 17px; font-weight: 900; color: #ffcc00; margin-top: 3px; font-family: var(--font-headline);">${titleObj.badge} ${titleObj.title}</div>
          <div style="font-size: 11px; color: #e2e8f0; margin-top: 4px; font-style: italic;">"${titleObj.reason}"</div>
        </div>

        <!-- 💖 SYMPATHIE- & EISBRECHER-ZEUGNIS -->
        <div style="background: linear-gradient(135deg, rgba(236, 72, 153, 0.25), rgba(0, 0, 0, 0.55)); border: 2px solid #ec4899; border-radius: 12px; padding: 12px; margin-bottom: 12px; box-shadow: 0 0 20px rgba(236,72,153,0.3);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 11px; font-weight: 900; color: #f472b6; text-transform: uppercase; letter-spacing: 0.5px;">
              💖 Sympathie- & Eisbrecher-Score:
            </span>
            <span class="points-badge" style="font-size: 11px; background: linear-gradient(135deg, #ec4899, #be185d); color: #fff; border-color: #fbcfe8;">
              +${sympathyPts} Sympathie-Pkt
            </span>
          </div>

          <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(0,0,0,0.4); padding: 8px 10px; border-radius: 8px; margin-bottom: 8px; border: 1px solid rgba(236,72,153,0.3);">
            <div>
              <div style="font-size: 10px; color: var(--text-muted); font-weight: 800; text-transform: uppercase;">Gruppen-Coolness</div>
              <div style="font-size: 16px; font-weight: 900; color: #ffcc00; display: flex; align-items: center; gap: 4px;">
                <span>⭐ ${avgSympathyRating} / 5.0</span>
                <span style="font-size: 11px; color: #f472b6; font-weight: 700;">(${sympathyVotersCount} ${sympathyVotersCount === 1 ? 'Stimme' : 'Stimmen'})</span>
              </div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 10px; color: var(--text-muted); font-weight: 800; text-transform: uppercase;">Bonus-Boost</div>
              <div style="font-size: 14px; font-weight: 900; color: #34d399;">+${sympathyPts} Pkt</div>
            </div>
          </div>

          <!-- ERHALTENE EISBRECHER-ORDEN -->
          ${Object.keys(tagCounts).length > 0 ? `
            <div style="margin-bottom: 8px;">
              <div style="font-size: 10px; color: #fbcfe8; font-weight: 800; text-transform: uppercase; margin-bottom: 4px;">Verliehene Gruppen-Titel:</div>
              <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                ${Object.entries(tagCounts).map(([tag, count]) => `
                  <span style="background: rgba(236,72,153,0.25); border: 1px solid #f472b6; color: #fff; font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 999px;">
                    ${tag} ${count > 1 ? `<strong style="color: #ffcc00;">(${count}x)</strong>` : ''}
                  </span>
                `).join("")}
              </div>
            </div>
          ` : ''}

          <!-- GUTACHTEN TEXT -->
          <div style="font-size: 12px; color: #fff; line-height: 1.4; background: rgba(0,0,0,0.3); padding: 8px; border-radius: 8px;">
            ${sympathyReport}
          </div>
        </div>

        <!-- 🎯 GEMEISTERTE HAUPT-CHALLENGES -->
        <div style="background: rgba(0, 0, 0, 0.35); border: 2px solid rgba(225, 29, 72, 0.45); border-radius: 12px; padding: 12px; margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 11px; font-weight: 900; color: #fda4af; text-transform: uppercase; letter-spacing: 0.5px;">
              🎯 Gemeisterte Haupt-Challenges (${myCompletedQuests.length}/${allQuests.length}):
            </span>
            <span class="points-badge" style="font-size: 11px; background: var(--gradient-rose); color: #fff;">+${mainQuestBonusPoints} Pkt</span>
          </div>

          ${myCompletedQuests.length > 0 ? `
            <div style="display: flex; flex-direction: column; gap: 6px;">
              ${myCompletedQuests.map(q => `
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
          ` : `
            <div style="font-size: 12px; color: var(--text-dim); font-style: italic; text-align: center; padding: 8px 0;">
              Noch keine Haupt-Challenges eingereicht – ran an die Mutproben und Achterbahnen!
            </div>
          `}
        </div>

        <!-- 🏅 NEBENQUEST-ORDEN & ERWORBENE TITEL -->
        <div style="background: rgba(0, 0, 0, 0.35); border: 2px solid rgba(255, 204, 0, 0.4); border-radius: 12px; padding: 12px; margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 11px; font-weight: 900; color: var(--walibi-yellow); text-transform: uppercase; letter-spacing: 0.5px;">
              🏅 Deine Nebenquest-Orden (${myCompletedSideQuests.length}/${allSideQuests.length}):
            </span>
            <span class="points-badge" style="font-size: 11px;">+${sideQuestBonusPoints} Pkt</span>
          </div>

          ${myCompletedSideQuests.length > 0 ? `
            <div style="display: flex; flex-direction: column; gap: 6px;">
              ${myCompletedSideQuests.map(sq => `
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
          ` : `
            <div style="font-size: 12px; color: var(--text-dim); font-style: italic; text-align: center; padding: 8px 0;">
              Noch keine Nebenquest-Titel erworben – nächstes Mal alle 10 Bahnen und Theken bezwingen!
            </div>
          `}
        </div>

        <!-- 4 STATISTIK KACHELN -->
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-bottom: 12px;">
          <div style="background: rgba(0,0,0,0.3); padding: 8px 10px; border-radius: 8px; border-left: 3.5px solid #f59e0b;">
            <div style="font-size: 10px; color: var(--text-muted); font-weight: 800;">🍺 GETRUNKEN</div>
            <div style="font-size: 15px; font-weight: 900; color: #fff;">${myTotalDrinks} Drinks (${myDrinks.beer || 0}B, ${myDrinks.shot || 0}S)</div>
          </div>
          <div style="background: rgba(0,0,0,0.3); padding: 8px 10px; border-radius: 8px; border-left: 3.5px solid #10b981;">
            <div style="font-size: 10px; color: var(--text-muted); font-weight: 800;">🌿 SCHWERELOS</div>
            <div style="font-size: 15px; font-weight: 900; color: #fff;">${myDrinks.joint || 0}x Kräuter / Joints</div>
          </div>
          <div style="background: rgba(0,0,0,0.3); padding: 8px 10px; border-radius: 8px; border-left: 3.5px solid #3b82f6;">
            <div style="font-size: 10px; color: var(--text-muted); font-weight: 800;">🎢 COASTER-DROPS</div>
            <div style="font-size: 15px; font-weight: 900; color: #fff;">${myRidesCount} Fahrten überlebt</div>
          </div>
          <div style="background: rgba(0,0,0,0.3); padding: 8px 10px; border-radius: 8px; border-left: 3.5px solid #ec4899;">
            <div style="font-size: 10px; color: var(--text-muted); font-weight: 800;">📸 SOCIAL & VOTING</div>
            <div style="font-size: 15px; font-weight: 900; color: #fff;">${myPostsCount} Posts, ${myVotesGiven} Votings</div>
          </div>
        </div>

        <!-- 🩺 WITZIGES ORGAN- & KONSUM-GUTACHTEN -->
        <div style="font-size: 12px; font-weight: 900; color: var(--walibi-yellow); margin-bottom: 8px; text-transform: uppercase;">
          🩺 Ärztliches Sauftour-Gutachten:
        </div>

        <div style="display: flex; flex-direction: column; gap: 8px;">
          <!-- LEBER TÜV -->
          <div style="background: rgba(225,29,72,0.15); border: 1.5px solid rgba(225,29,72,0.4); border-radius: 10px; padding: 10px;">
            <div style="font-size: 12px; font-weight: 900; color: #fda4af; margin-bottom: 2px;">🫀 Leber-Zustandsbericht:</div>
            <div style="font-size: 12px; color: #fff; line-height: 1.4;">${liverReport}</div>
          </div>

          <!-- LUNGEN TÜV -->
          <div style="background: rgba(16,185,129,0.15); border: 1.5px solid rgba(16,185,129,0.4); border-radius: 10px; padding: 10px;">
            <div style="font-size: 12px; font-weight: 900; color: #6ee7b7; margin-bottom: 2px;">🫁 Lungen- & Rauch-TÜV:</div>
            <div style="font-size: 12px; color: #fff; line-height: 1.4;">${lungReport}</div>
          </div>

          <!-- MAGEN & COASTER TEST -->
          <div style="background: rgba(59,130,246,0.15); border: 1.5px solid rgba(59,130,246,0.4); border-radius: 10px; padding: 10px;">
            <div style="font-size: 12px; font-weight: 900; color: #93c5fd; margin-bottom: 2px;">🎢 Magen- & Fliehkraft-Stabilität:</div>
            <div style="font-size: 12px; color: #fff; line-height: 1.4;">${stomachReport}</div>
          </div>

          <!-- EHRLICHKEIT & GLAUBWÜRDIGKEITS-TÜV (GUT GLAUBEN INDEX) -->
          <div style="background: rgba(245, 158, 11, 0.15); border: 1.5px solid rgba(245, 158, 11, 0.5); border-radius: 10px; padding: 10px;">
            <div style="font-size: 12px; font-weight: 900; color: #fcd34d; margin-bottom: 2px;">📜 Ehrlichkeit & Glaubwürdigkeits-TÜV:</div>
            <div style="font-size: 12px; color: #fff; line-height: 1.4;">${faithReport}</div>
          </div>
        </div>
      </div>

      <!-- GRUPPEN-GESAMTBILANZ -->
      <div style="background: rgba(0,0,0,0.5); border: 1.5px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 12px; text-align: center; margin-bottom: 16px;">
        <div style="font-size: 11px; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">🔥 Gesamt-Vernichtung der Gruppe:</div>
        <div style="font-size: 13px; color: #fff; margin-top: 4px; font-weight: 700; line-height: 1.5;">
          🍺 ${totalGroupBeer} Biere • 🥃 ${totalGroupShots} Shots • 🍹 ${totalGroupLongdrinks} Longdrinks • 🌿 ${totalGroupJoints} Joints<br>
          🏅 <strong>${totalGroupSideQuests} Nebenquests</strong> wurden von der Gruppe insgesamt gemeistert!
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 8px;">
        <button type="button" class="btn-primary" onclick="FeedModule.downloadFeedMediaZip();" style="background: linear-gradient(135deg, #10b981, #059669); color: #fff; font-weight: 900; border: 2px solid #34d399; font-size: 14px; box-shadow: 0 0 16px rgba(16,185,129,0.4);">
          📦 ALLE FOTOS & VIDEOS HERUNTERLADEN (.ZIP)
        </button>

        <button type="button" class="btn-primary" onclick="AwardsModule.closeCelebrationModal(); SympathyModule.openVoteModal();" style="background: linear-gradient(135deg, #ec4899, #f59e0b); color: #fff; font-weight: 900; border: 2px solid #fff; font-size: 14px; box-shadow: 0 0 16px rgba(236,72,153,0.4);">
          💖 SYMPATHIE-PUNKTE VERGEBEN / ANPASSEN
        </button>

        <button type="button" class="btn-primary" onclick="AwardsModule.closeCelebrationModal(); window.app.switchTab('leaderboard');" style="background: var(--gradient-gold); color: #000; font-weight: 900; border: 2.5px solid #fff; font-size: 14px;">
          🏆 GESAMTE RANGLISTE ANSEHEN
        </button>
      </div>
    `;
  },

  generateFunnyTitle(player, rank, allPlayers, completedSideQuests = []) {
    const sideQuestIds = completedSideQuests.map(s => s.id || s);

    if (rank === 1) {
      if (sideQuestIds.includes("side_all_attractions")) {
        return {
          badge: "👑🌟",
          title: "Mr. / Mrs. Walibi '26 (Der allmächtige Park-Komplettist)",
          reason: "Unangefochtener Platz #1 und ausnahmslos JEDE Attraktion im gesamten Park bezwungen!"
        };
      }
      if (sideQuestIds.length >= 4) {
        return {
          badge: "👑",
          title: "Mr. / Mrs. Walibi '26 (Der allmächtige Orden-Kaiser)",
          reason: `Unangefochtener Platz #1 und stolze ${sideQuestIds.length} Nebenquest-Orden abgeräumt!`
        };
      }
      return {
        badge: "👑",
        title: "Mr. / Mrs. Walibi '26 (Der unsterbliche Park-König)",
        reason: "Hat alle Gegner deklassiert und den Thron für die Ewigkeit bestiegen!"
      };
    }

    // SPEZIELLE NEBENQUEST-KOMBINATIONSTITEL
    if (sideQuestIds.includes("side_all_attractions")) {
      return {
        badge: "🌟",
        title: "Der Park-Komplettist (Alle Attraktionen bezwungen)",
        reason: "Hat jede einzelne Bahn und Attraktion im Park gefahren – 150 Punkte Legenden-Status!"
      };
    }

    if (sideQuestIds.includes("side_space_kidz_5")) {
      return {
        badge: "👶🚀",
        title: "Kindergarten-Kaiser & Space Kidz Veteran",
        reason: "5 Mal den Kinder-Freifallturm gerockt – +100 Punkte für absoluten Tour-Kult!"
      };
    }

    if (sideQuestIds.includes("side_water_flat_double")) {
      return {
        badge: "🌪️🌊",
        title: "Zentrifugen-Bezwinger & Seebär",
        reason: "El Rio Grande, Crazy River, G-Force, Spinning Vibe, Blast und Tomahawk 2x gemeistert!"
      };
    }

    if (sideQuestIds.includes("side_untamed_master") && sideQuestIds.includes("side_goliath_king")) {
      return {
        badge: "🌲🟣",
        title: "Achterbahn-Titan (Untamed- & Goliath-Bezwinger)",
        reason: "Hat sowohl die 3x Untamed-Dröhnung als auch den Goliath Mega-Master im Zeugnis verewigt!"
      };
    }

    if (sideQuestIds.includes("side_yoy_duo")) {
      return {
        badge: "⚔️",
        title: "Dueling-Champion von YOY (Chill & Thrill Veteran)",
        reason: "Beide Spuren der Single-Rail-Neuheit am selben Tag gemeistert und triumphiert!"
      };
    }

    if (sideQuestIds.includes("side_coaster_marathon_20")) {
      return {
        badge: "👑🎢",
        title: "Schienen-Gott & Looping-Kaiser (20+ Coaster-Ritte)",
        reason: "Sagenhafte 20 Achterbahn-Fahrten überlebt – dein Magen besteht aus gehärtetem Titan!"
      };
    }

    if (sideQuestIds.includes("side_coaster_marathon_15")) {
      return {
        badge: "🚀",
        title: "Achterbahn-Extremist (15+ Coaster-Ritte)",
        reason: "15 Achterbahn-Fahrten überstanden – reiner Rausch auf Schienen!"
      };
    }

    if (sideQuestIds.includes("side_coaster_marathon_10")) {
      return {
        badge: "🔥",
        title: "Iron Butt Rekordhalter (10+ Achterbahn-Ritte)",
        reason: "Hat 10 Achterbahn-Fahrten überlebt – dein Magen besteht aus purem Edelstahl!"
      };
    }

    if (sideQuestIds.includes("side_water_combo")) {
      return {
        badge: "🌊",
        title: "Wasserbahn-Kapitän & Seetauglichkeits-Diplom",
        reason: "Crazy River, El Rio Grande und Splash Battle mit Bravour und nassen Socken bezwungen!"
      };
    }

    if (sideQuestIds.includes("side_drink_marathon_20")) {
      return {
        badge: "👑🍺",
        title: "Unsterbliche Theken-Legende (20+ Drinks Gesamt)",
        reason: "Über 20 Drinks im Pegel-Tracker verbucht – ein Denkmal in der Walibi-Chronik!"
      };
    }

    if (sideQuestIds.includes("side_beer_king_15")) {
      return {
        badge: "🍺👑",
        title: "Der Hopfen-Kaiser (15+ Bier)",
        reason: "15 Bier im Pegel-Tracker verbucht – Brauereibesitzer ehrenhalber!"
      };
    }

    if (sideQuestIds.includes("side_beer_king_10")) {
      return {
        badge: "🍺👑",
        title: "Der Bier-König (10+ Bier)",
        reason: "10 Bier im Pegel-Tracker verbucht – die Zapfhähne glühen für dich!"
      };
    }

    if (sideQuestIds.includes("side_shot_king_10")) {
      return {
        badge: "🥃👑",
        title: "Der Schnaps-Baron & Shot-Vernichter (10+ Shots)",
        reason: "10er-Meilenstein im Pegel-Tracker geknackt – eine lebende Legende an der Shot-Bar!"
      };
    }

    if (sideQuestIds.includes("side_beer_king_5") && sideQuestIds.includes("side_shot_duo")) {
      return {
        badge: "🍻",
        title: "Großmeister des Bieres & Scharfschütze der Shots",
        reason: "Sowohl 5 Bier als auch 3 Shots im Pegel-Tracker verbucht – eine Theken-Legende!"
      };
    }

    if (sideQuestIds.length >= 3) {
      return {
        badge: "🎖️",
        title: `Ordensträger der Walibi-Legion (${sideQuestIds.length} Titel)`,
        reason: `Mit ${sideQuestIds.length} gemeisterten Nebenquests hast du das Zeugnis dominiert!`
      };
    }

    const drinks = player.drinksDetail || {};
    const totalDrinks = player.drinksCount || 0;
    const joints = drinks.joint || 0;
    const quests = (player.completedQuests && player.completedQuests.length) || 0;

    let rides = 0;
    if (player.rideCounts) {
      rides = Object.values(player.rideCounts).reduce((a, b) => a + b, 0);
    }

    if (rides >= 20) {
      return {
        badge: "🎢",
        title: "G-Kraft-Gott & Looping-Legende (20+ Fahrten)",
        reason: `Mit gigantischen ${rides} Coaster-Fahrten hast du die Schwerkraft pulverisiert!`
      };
    }

    if (rides >= 10) {
      return {
        badge: "🎢",
        title: "Coaster-Junkie (Alle 10 Bahnen gerockt)",
        reason: `Über 10 Achterbahn-Ritte – keine Schiene im Park war vor dir sicher!`
      };
    }

    if (totalDrinks >= 26) {
      return {
        badge: "🍺",
        title: "Der unsterbliche Promille-Kaiser (Asyl-Stufe)",
        reason: `Mit ${totalDrinks} Einheiten hast du Medizingeschichte geschrieben!`
      };
    }

    if (totalDrinks >= 16) {
      return {
        badge: "🍺",
        title: "Ehrendoktor der Hopfenkunde & Durst-Diktator",
        reason: "Flüssige Nahrung ist dein Lebenselixier – die Zapfanlagen im Park laufen heiß!"
      };
    }

    if (joints >= 16) {
      return {
        badge: "🌿",
        title: "Telepathie-Meister mit Monsieur Walibi (Du bist der Park)",
        reason: `Mit ${joints} Kräuter-Einheiten verstehst du die Kängurus fließend!`
      };
    }

    if (joints >= 9) {
      return {
        badge: "🌿",
        title: "Der Astronaut von Lost Gravity (Schwerelosigkeits-Meister)",
        reason: "Hat die Schwerkraft für ungültig erklärt und schwebt entspannt 5 Meter über dem Park."
      };
    }

    if (joints >= 4) {
      return {
        badge: "🌿",
        title: "Bob Marley Tour-Diplom",
        reason: "Entspanntester Typ der Gruppe – die Loopings waren für dich pure Meditation."
      };
    }

    if (quests >= 5) {
      return {
        badge: "🎯",
        title: "Mission-Mastermind & Challenge-Vernichter",
        reason: "Keine Aufgabe war zu peinlich, keine Mutprobe zu wild!"
      };
    }

    if (rank === 2) {
      return {
        badge: "🥈",
        title: "Der Vize-König des Chaos",
        reason: "Haarscharf an der Krone vorbei – beim nächsten Bier holst du ihn ein!"
      };
    }

    return {
      badge: "🔥",
      title: "Ehren-Sauftourer der ersten Stunde",
      reason: "War immer an vorderster Front dabei und hat die Stimmung zum Kochen gebracht!"
    };
  },

  generateLiverReport(beer, shots, longdrinks, completedSideQuests = []) {
    const total = beer + shots + longdrinks;
    const sideQuestIds = completedSideQuests.map(s => s.id || s);
    const hasBeerKing15 = sideQuestIds.includes("side_beer_king_15");
    const hasBeerKing10 = sideQuestIds.includes("side_beer_king_10");
    const hasBeerKing5 = sideQuestIds.includes("side_beer_king_5");
    const hasShotKing10 = sideQuestIds.includes("side_shot_king_10");
    const hasShotDuo = sideQuestIds.includes("side_shot_duo");

    let extraNote = "";
    if (hasBeerKing15) {
      extraNote = " 🍺 <strong>Zeugnis-Sondernote:</strong> 'Hopfen-Kaiser' (15 Bier) Ehrenorden verliehen!";
    } else if (hasBeerKing10) {
      extraNote = " 🍺 <strong>Zeugnis-Sondernote:</strong> 'Bier-König' (10 Bier) Orden verliehen!";
    } else if (hasBeerKing5 && hasShotDuo) {
      extraNote = " 🍺🥃 <strong>Zeugnis-Sondernote:</strong> Träger des doppelten Bier- & Shot-Ordens!";
    } else if (hasBeerKing5) {
      extraNote = " 🍺 <strong>Zeugnis-Sondernote:</strong> 'Gerstensaft-Meister' Ehrenorden verliehen!";
    }

    if (total === 0) {
      return "Deine Leber fragt sich, ob ihr versehentlich im Sanatorium gelandet seid. 0 Promille auf Untamed? Respekt vor dem Mut, aber Schande über das Glas!" + extraNote;
    }
    if (total <= 7) {
      return `Mit ${total} Drinks (${beer}B, ${shots}S, ${longdrinks}L) lief deine Leber im gemütlichen Eco-Modus. Solide Grundlage, aber der Turbolader hat noch gefehlt!` + extraNote;
    }
    if (total <= 15) {
      return `Respektable Leistung! ${beer} Biere und ${shots} Shots haben deine Leber auf kernige 8.500 Umdrehungen gebracht. Untamed und Goliath fühlten sich plötzlich erstaunlich geschmeidig an!` + extraNote;
    }
    if (total <= 25) {
      return `Schwerstarbeit im Maschinenraum! ${total} Drinks – deine Leber glüht rot, steht aber wie ein Fels in der Brandung. Chemisch betrachtet bestehst du zu 40% aus Hopfen und zu 60% aus reinem Siegeswillen!` + extraNote;
    }
    return `🚨 MEDIZINISCHES WUNDER! Mit gigantischen ${total} Einheiten hat deine Leber soeben bei der niederländischen Botschaft politisches Asyl beantragt, um nicht mehr mit dir nach Hause fahren zu müssen!` + extraNote;
  },

  generateLungReport(joints) {
    if (joints === 0) {
      return "Lungenvolumen wie ein olympischer Freitaucher. Frische holländische Polderluft war dein einziger Treibstoff!";
    }
    if (joints <= 3) {
      return `Feinster Kraut-Nebel (${joints}x). Du hast die Loopings auf Goliath in Zeitlupe genossen und dich gefragt, warum die Schienen so schön leuchten.`;
    }
    if (joints <= 8) {
      return `Bob Marley nickt anerkennend von oben! (${joints}x). Deine Lunge hat die Schwerkraft von Lost Gravity komplett ausgetrickst – du schwebst immer noch 2 Meter über dem Boden!`;
    }
    if (joints <= 15) {
      return `Astronauten-Level (${joints}x)! Du befindest dich in der oberen Erdumlaufbahn und hast den Coastern von der Stratosphäre aus zugeschaut.`;
    }
    return `🌿 DU BIST DER FREIZEITPARK! Bei ${joints} Kräuter-Einheiten hast du mit Freikörper-Fred telepathisch kommuniziert und die Achterbahnen mit Gedanken gesteuert!`;
  },

  generateStomachReport(rides, drinks, completedSideQuests = []) {
    const sideQuestIds = completedSideQuests.map(s => s.id || s);
    let extraNote = "";
    if (sideQuestIds.includes("side_all_attractions")) {
      extraNote = " 🌟 <strong>Zeugnis-Sondernote:</strong> 'Walibi-Komplettist' Großkreuz für alle Attraktionen!";
    }
    if (sideQuestIds.includes("side_space_kidz_5")) {
      extraNote += " 👶 'Space Kidz Astronauten-Diplom' (5x);";
    }
    if (sideQuestIds.includes("side_water_flat_double")) {
      extraNote += " 🌪️ 'Magen-Zentrifugen & Wildwasser-Doppel' bestanden;";
    }
    if (sideQuestIds.includes("side_untamed_master")) {
      extraNote += " 🌲 'Untamed Dreifach-Dröhnung' Orden;";
    }
    if (sideQuestIds.includes("side_yoy_duo")) {
      extraNote += " ⚔️ 'YOY Doppel-Duell' Auszeichnung;";
    }
    if (sideQuestIds.includes("side_water_combo")) {
      extraNote += " 🌊 'Wasser-Trio' Seetauglichkeit bestanden;";
    }

    if (rides === 0) {
      return "Parkbank-General! Du hast den Coastern von unten zugeschaut und dafür gesorgt, dass die Bierbecher nicht umkippen." + extraNote;
    }
    if (rides <= 9) {
      return `${rides} Fahrten überstanden! Dein Magen hat die G-Kräfte und das Dosenbier souverän im Zaum gehalten.` + extraNote;
    }
    if (rides <= 17) {
      return `COASTER-JUNKIE! Mit ${rides} Fahrten hast du nahezu alle Bahnen des Parks bezwungen. Magen aus Titan!` + extraNote;
    }
    return `🏆 G-KRAFT-GOTT! Mit unglaublichen ${rides} Fahrten hast du den Looping-Rekord der Sauftour aufgestellt. Fluglizenz mit goldenem Sternchen!` + extraNote;
  },

  generateFaithReport(count = 0) {
    if (count === 0) {
      return "🎖️ <strong>100% Wasserdicht!</strong> Lückenlose Beweise per Foto & Zeugen – Ein echter Ehrenmann, dem kein Schiedsrichter etwas anhaben kann!";
    }
    if (count <= 2) {
      return `🧐 <strong>Leichte Zweifel im Kontrollraum:</strong> ${count}x auf Ehre & gut Glauben durchgemogelt (-20% Abzug). Die Gruppe drückt noch ein Auge zu!`;
    }
    if (count <= 5) {
      return `🕵️‍♂️ <strong>Hochstapler im Anmarsch!</strong> "Vertrau mir Bruder" war deine Lieblingsstrategie (${count}x genutzt). Das Schiedsgericht schüttelt ungläubig den Kopf!`;
    }
    return `🚨 <strong>MÜNCHHAUSEN-DIPLOM '26!</strong> Du hättest auch behauptet, du wärst Untamed rückwärts im Schlaf geflogen (${count}x Gut Glauben eingereicht). Größter Märchenerzähler des Freizeitparks!`;
  },

  generateSympathyReport(avgRating, points, count, tagCounts, player) {
    const numRating = parseFloat(avgRating) || 5.0;
    const tagsList = Object.keys(tagCounts);

    if (count === 0) {
      return "❤️ <strong>Frisch im Rennen!</strong> Noch keine Sympathie-Stimmen verbucht – klicke unten auf 'Sympathie-Punkte vergeben', um Mitstreiter zu bewerten und Punkte ins Rollen zu bringen!";
    }

    let topTagText = "";
    if (tagsList.length > 0) {
      topTagText = ` Die Gruppe hat dich vor allem als <em>${tagsList.slice(0, 2).join(" & ")}</em> gefeiert!`;
    }

    if (numRating >= 4.8) {
      return `👑 <strong>ABSOLUTER PUBLIKUMS-LIEBLING!</strong> Mit spektakulären ${points} Sympathie-Punkten (Ø ${numRating} ⭐) bist du der unangefochtene Sympathieträger der Tour.${topTagText} Alle wollten mit dir im Looping sitzen und anstoßen!`;
    }
    if (numRating >= 4.0) {
      return `🔥 <strong>MEGA COOLE SOCKE!</strong> Starke ${points} Sympathie-Punkte (Ø ${numRating} ⭐).${topTagText} Das Eis ist komplett geschmolzen – eine absolute Bereicherung für jede künftige Walibi-Sauftour!`;
    }
    if (numRating >= 3.0) {
      return `🍻 <strong>SOLIDER TOUR-KAMERAD!</strong> Tapfere ${points} Sympathie-Punkte verbucht (Ø ${numRating} ⭐).${topTagText} Hat die Gruppe zusammengehalten und für ordentlich Stimmung gesorgt!`;
    }
    return `⚡ <strong>DER GEHEIMNISVOLLE WILD-CARD-CHARAKTER!</strong> Mit ${points} Sympathie-Punkten bist du der unberechenbarste Typ der Gruppe. Nächstes Mal noch mehr mitmischen!`;
  }
};

window.AwardsModule = AwardsModule;
