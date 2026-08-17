/**
 * Aufgaben & Quest-System mit zuverlässigem Modal-Handling,
 * abwechselnden Maskottchen und Audio-Effekten
 */
const QuestsModule = {
  currentCategoryFilter: "all",
  activeQuest: null,
  capturedPhotoBase64: null,

  init() {
    this.setupCategoryFilters();
    this.setupQuestModal();
    this.renderQuests();
  },

  setupCategoryFilters() {
    const filterButtons = document.querySelectorAll(".quest-filter-btn");
    filterButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        if (window.GameAudio) window.GameAudio.playClick();
        filterButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        this.currentCategoryFilter = btn.dataset.category;
        this.renderQuests();
      });
    });
  },

  renderQuests() {
    const container = document.getElementById("questsGridContainer");
    if (!container) return;

    const quests = (window.store && window.store.state && window.store.state.quests) || window.DEFAULT_QUESTS || [];
    const currentUser = window.store ? window.store.state.currentUser : null;
    const completedList = (currentUser && currentUser.completedQuests) || [];

    const filtered = quests.filter(q => {
      if (this.currentCategoryFilter === "all") return true;
      if (this.currentCategoryFilter === "open") return !completedList.includes(q.id);
      if (this.currentCategoryFilter === "completed") return completedList.includes(q.id);
      return q.category === this.currentCategoryFilter;
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="text-align: center; padding: 24px; color: var(--text-muted);">
          <span style="font-size: 36px; display: block; margin-bottom: 8px;">🎯</span>
          <p>Keine Aufgaben in dieser Kategorie gefunden.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map((q, idx) => {
      const isCompletedByMe = completedList.includes(q.id);
      const playersCompleted = (window.store ? window.store.state.players : []).filter(p => p.completedQuests && p.completedQuests.includes(q.id));

      let badgeHtml = `<span class="points-badge">+${q.points} Pkt</span>`;
      if (q.bonusPoints) {
        badgeHtml += ` <span style="background: rgba(255,204,0,0.3); color: #ffcc00; font-size: 10px; font-weight: 900; padding: 2px 6px; border-radius: 999px; border: 1px solid #ffcc00;">🔥 +${q.bonusPoints} Pkt Gruppe</span>`;
      }
      if (q.penaltyPoints) {
        badgeHtml += ` <span style="background: rgba(239,68,68,0.3); color: #fca5a5; font-size: 10px; font-weight: 900; padding: 2px 6px; border-radius: 999px; border: 1px solid #ef4444;">🔴 ${q.penaltyPoints} Malus</span>`;
      }
      if (q.difficultyLabel) {
        badgeHtml = `<span class="difficulty-badge difficulty-${q.difficulty}">${q.difficultyLabel}</span> ` + badgeHtml;
      }
      if (q.requiresVoting) {
        badgeHtml += ` <span class="voting-badge">⭐ Voting</span>`;
      }
      if (q.type === "video") {
        badgeHtml += ` <span style="background: rgba(225,29,72,0.3); color: #fda4af; font-size: 10px; font-weight: 900; padding: 2px 6px; border-radius: 999px; border: 1px solid #e11d48;">🎥 Video Pflicht</span>`;
      } else if (q.requirePhoto) {
        badgeHtml += ` <span style="background: rgba(225,29,72,0.3); color: #fda4af; font-size: 10px; font-weight: 900; padding: 2px 6px; border-radius: 999px; border: 1px solid #e11d48;">📸 Foto Pflicht</span>`;
      }

      return `
        <div class="quest-card ${isCompletedByMe ? 'completed' : ''}" onclick="QuestsModule.openQuestDetails('${q.id}')">
          <div class="quest-card-header">
            <span class="quest-icon">${q.icon || '🎢'}</span>
            <div class="quest-badges">
              ${badgeHtml}
            </div>
          </div>
          <h3 class="quest-title">${q.title}</h3>
          <p class="quest-desc-snippet">${q.description}</p>
          
          <div class="quest-card-footer">
            <div class="completed-avatars">
              ${playersCompleted.slice(0, 3).map(p => `
                <img src="${p.avatar || ProfileModule.generateDefaultAvatar(p.name)}" title="${p.name}" class="mini-avatar" />
              `).join("")}
              ${playersCompleted.length > 3 ? `<span class="more-count">+${playersCompleted.length - 3}</span>` : ''}
              ${playersCompleted.length === 0 ? `<span class="text-muted">Noch unberührt</span>` : ''}
            </div>
            <button class="btn-quest-action">
              ${isCompletedByMe ? '✅ Erledigt' : 'Details & Mission 👉'}
            </button>
          </div>
        </div>
      `;
    }).join("");
  },

  openQuestDetails(questId) {
    if (window.GameAudio) window.GameAudio.playClick();

    const allQuests = (window.store && window.store.state && window.store.state.quests) || window.DEFAULT_QUESTS || [];
    let quest = allQuests.find(q => q.id === questId);
    if (!quest) {
      quest = window.DEFAULT_QUESTS.find(q => q.id === questId);
    }
    if (!quest) return;

    this.activeQuest = quest;
    this.capturedPhotoBase64 = null;

    const modal = document.getElementById("questDetailModal");
    if (!modal) return;

    document.getElementById("modalQuestTitle").textContent = quest.title;
    document.getElementById("modalQuestPoints").textContent = `+${quest.points} XP / PKT`;
    document.getElementById("modalQuestDesc").textContent = quest.description;

    // 1. Maskottchen ABWECHSELND zuweisen (Känguru / Too Hot To Handle / In Extremo Guy)
    const mascots = window.WALIBI_MASCOTS || [];
    const questIndex = window.DEFAULT_QUESTS.findIndex(q => q.id === quest.id);
    
    let assignedMascot = null;
    if (quest.mascotId) {
      assignedMascot = mascots.find(m => m.id === quest.mascotId);
    }
    // Fallback: Verteile gleichmäßig über alle 3 Charaktere
    if (!assignedMascot && mascots.length > 0) {
      const targetIdx = (questIndex >= 0 ? questIndex : 0) % mascots.length;
      assignedMascot = mascots[targetIdx];
    }
    if (!assignedMascot) {
      assignedMascot = mascots[0];
    }

    const mascotAvatarEl = document.getElementById("modalMascotAvatar");
    const mascotNameEl = document.getElementById("modalMascotName");
    const speakerLabelEl = document.getElementById("modalMascotSpeakerLabel");
    const quoteEl = document.getElementById("modalMascotQuote");

    if (mascotAvatarEl) mascotAvatarEl.src = assignedMascot.avatar;
    if (mascotNameEl) mascotNameEl.textContent = assignedMascot.name;
    if (speakerLabelEl) speakerLabelEl.textContent = `💬 ${assignedMascot.name} erklärt:`;
    if (quoteEl) quoteEl.textContent = `"${quest.mascotQuote || assignedMascot.quote}"`;

    // 2. Foto- / Video-Bedingung anzeigen
    const reqBadge = document.getElementById("modalPhotoRequirementBadge");
    const camHeading = document.getElementById("cameraBoxHeading");
    const submitBtn = document.getElementById("btnSubmitQuest");

    if (quest.type === "video" || quest.requirePhoto === true) {
      if (reqBadge) {
        reqBadge.textContent = quest.type === "video" ? "🎥 Video Pflicht" : "📸 Foto Pflicht";
        reqBadge.className = "game-status-pill req-mandatory";
      }
      if (camHeading) camHeading.textContent = quest.type === "video" ? "🎥 Beweis-Video / Foto erforderlich (Pflicht)" : "📸 Beweisfoto erforderlich (Pflicht)";
      if (submitBtn) {
        submitBtn.disabled = true;
        const txt = submitBtn.querySelector(".arcade-btn-text");
        if (txt) txt.textContent = quest.type === "video" ? "🎥 MEDIEN HOCHLADEN ZUM ABSCHLIESSEN" : "📸 FOTO AUFNEHMEN ZUM ABSCHLIESSEN";
      }
    } else {
      if (reqBadge) {
        reqBadge.textContent = "📸 Foto Optional";
        reqBadge.className = "game-status-pill req-optional";
      }
      if (camHeading) camHeading.textContent = "Schnappschuss-Tool (Optional)";
      if (submitBtn) {
        submitBtn.disabled = false;
        const txt = submitBtn.querySelector(".arcade-btn-text");
        if (txt) txt.textContent = "🚀 MISSION ABSCHLIESSEN! 🚀";
      }
    }

    // 3. Voting Hinweis
    const votingNote = document.getElementById("modalVotingNote");
    if (votingNote) {
      if (quest.requiresVoting) {
        votingNote.classList.remove("hidden");
        votingNote.innerHTML = `⭐ <strong>Gruppen-Voting:</strong> Diese Challenge wird von der Gruppe bewertet! Die Punkte werden gutgeschrieben, sobald <strong>60% der Freunde</strong> abgestimmt haben.`;
      } else {
        votingNote.classList.add("hidden");
      }
    }

    // 4. Kommentar-Feld leeren
    const commentInput = document.getElementById("questCommentInput");
    if (commentInput) commentInput.value = "";

    // 5. Wildcard-Felder einblenden, falls eigene kreative Aufgabe
    const wildcardSection = document.getElementById("wildcardCustomSection");
    if (wildcardSection) {
      if (quest.id === "visitor_wildcard_creative") {
        wildcardSection.classList.remove("hidden");
        document.getElementById("wildcardTitleInput").value = "";
        document.getElementById("wildcardDescInput").value = "";
      } else {
        wildcardSection.classList.add("hidden");
      }
    }

    // Reset Camera & Preview
    this.removeCapturedPhoto();

    // 6. Liste der Freunde rendern
    this.renderCompletedFriendsList(quest.id);

    // Modal anzeigen
    modal.classList.remove("hidden");
  },

  closeModal() {
    if (window.GameAudio) window.GameAudio.playClick();
    const modal = document.getElementById("questDetailModal");
    if (modal) {
      modal.classList.add("hidden");
    }
    this.activeQuest = null;
  },

  renderCompletedFriendsList(questId) {
    const container = document.getElementById("questCompletedByContainer");
    if (!container) return;

    const players = (window.store ? window.store.state.players : []).filter(p => p.completedQuests && p.completedQuests.includes(questId));

    if (players.length === 0) {
      container.innerHTML = `<p class="text-muted" style="text-align: center; margin: 4px 0;">Sei der Erste aus deiner Gruppe, der diese Challenge meistert!</p>`;
      return;
    }

    container.innerHTML = `
      <div style="font-size: 11px; font-weight: 800; color: var(--walibi-yellow); margin-bottom: 6px; text-transform: uppercase;">Bereits gemeistert von (${players.length}):</div>
      <div class="completed-players-row">
        ${players.map(p => `
          <div class="completed-player-chip">
            <img src="${p.avatar || ProfileModule.generateDefaultAvatar(p.name)}" class="chip-avatar" />
            <span>${p.name}</span>
          </div>
        `).join("")}
      </div>
    `;
  },

  setupQuestModal() {
    const modal = document.getElementById("questDetailModal");
    const closeBtn = document.getElementById("closeQuestModal");
    const cameraInput = document.getElementById("questCameraInput");
    const galleryInput = document.getElementById("questGalleryInput");
    const submitBtn = document.getElementById("btnSubmitQuest");

    if (closeBtn) {
      closeBtn.onclick = (e) => {
        e.stopPropagation();
        this.closeModal();
      };
    }

    if (modal) {
      modal.onclick = (e) => {
        if (e.target === modal) {
          this.closeModal();
        }
      };
    }

    if (cameraInput) {
      cameraInput.onchange = (e) => this.handlePhotoCapture(e);
    }
    if (galleryInput) {
      galleryInput.onchange = (e) => this.handlePhotoCapture(e);
    }

    if (submitBtn) {
      submitBtn.onclick = () => this.submitQuestCompletion();
    }
  },

  removeCapturedPhoto() {
    this.capturedPhotoBase64 = null;
    const preview = document.getElementById("photoUploadPreview");
    const videoPreview = document.getElementById("videoUploadPreview");
    const placeholder = document.getElementById("cameraPlaceholder");
    const removeBtn = document.getElementById("btnRemovePhoto");

    if (preview) {
      preview.classList.add("hidden");
      preview.src = "";
    }
    if (videoPreview) {
      videoPreview.classList.add("hidden");
      videoPreview.src = "";
    }
    if (placeholder) placeholder.classList.remove("hidden");
    if (removeBtn) removeBtn.classList.add("hidden");

    const submitBtn = document.getElementById("btnSubmitQuest");
    if (submitBtn) {
      const txt = submitBtn.querySelector(".arcade-btn-text");
      if (this.activeQuest && (this.activeQuest.requirePhoto === true || this.activeQuest.type === "video")) {
        submitBtn.disabled = true;
        if (txt) txt.textContent = this.activeQuest.type === "video" ? "🎥 MEDIEN HOCHLADEN ZUM ABSCHLIESSEN" : "📸 FOTO AUFNEHMEN ZUM ABSCHLIESSEN";
      } else {
        submitBtn.disabled = false;
        if (txt) txt.textContent = "🚀 MISSION ABSCHLIESSEN! 🚀";
      }
    }
  },

  handlePhotoCapture(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (window.GameAudio) window.GameAudio.playClick();

    const isVideo = file.type.startsWith('video/');
    const reader = new FileReader();

    if (isVideo) {
      // VIDEO AUFNAHME / AUSWAHL
      reader.onload = (e) => {
        const b64 = e.target.result;
        this.capturedPhotoBase64 = b64;

        const previewImg = document.getElementById("photoUploadPreview");
        const previewVid = document.getElementById("videoUploadPreview");
        const placeholder = document.getElementById("cameraPlaceholder");
        const removeBtn = document.getElementById("btnRemovePhoto");

        if (previewImg) previewImg.classList.add("hidden");
        if (previewVid) {
          previewVid.src = b64;
          previewVid.classList.remove("hidden");
        }
        if (placeholder) placeholder.classList.add("hidden");
        if (removeBtn) removeBtn.classList.remove("hidden");

        const submitBtn = document.getElementById("btnSubmitQuest");
        if (submitBtn) {
          submitBtn.disabled = false;
          const txt = submitBtn.querySelector(".arcade-btn-text");
          if (txt) txt.textContent = "🚀 MISSION ABSCHLIESSEN! 🚀";
        }
      };
      reader.readAsDataURL(file);
    } else {
      // FOTO AUFNAHME / KOMPRIMIERUNG
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
          this.capturedPhotoBase64 = compressed;

          const previewImg = document.getElementById("photoUploadPreview");
          const previewVid = document.getElementById("videoUploadPreview");
          const placeholder = document.getElementById("cameraPlaceholder");
          const removeBtn = document.getElementById("btnRemovePhoto");

          if (previewVid) previewVid.classList.add("hidden");
          if (previewImg) {
            previewImg.src = compressed;
            previewImg.classList.remove("hidden");
          }
          if (placeholder) placeholder.classList.add("hidden");
          if (removeBtn) removeBtn.classList.remove("hidden");

          const submitBtn = document.getElementById("btnSubmitQuest");
          if (submitBtn) {
            submitBtn.disabled = false;
            const txt = submitBtn.querySelector(".arcade-btn-text");
            if (txt) txt.textContent = "🚀 MISSION ABSCHLIESSEN! 🚀";
          }
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  },

  submitQuestCompletion() {
    const currentUser = window.store ? window.store.state.currentUser : null;
    if (!currentUser) {
      alert("Bitte wähle zuerst dein Profil aus!");
      return;
    }
    if (!this.activeQuest) return;

    // Nur prüfen wenn Foto zwingend vorgeschrieben ist
    if (this.activeQuest.requirePhoto === true && !this.capturedPhotoBase64) {
      alert("⚠️ Für diese spezielle Challenge ist ein Beweisfoto erforderlich!");
      return;
    }

    let customTitle = null;
    let customDesc = null;

    // Wildcard Überprüfung
    if (this.activeQuest.id === "visitor_wildcard_creative") {
      const titleInp = document.getElementById("wildcardTitleInput").value.trim();
      const descInp = document.getElementById("wildcardDescInput").value.trim();
      if (!titleInp || !descInp) {
        alert("Bitte gib einen Titel und eine kurze Beschreibung deiner kreativen Aktion ein!");
        return;
      }
      customTitle = `💡 Kreativ-Aktion: ${titleInp}`;
      customDesc = descInp;
    }

    const commentInput = document.getElementById("questCommentInput");
    const userComment = commentInput ? commentInput.value.trim() : "";

    // In den Store speichern & Feed-Eintrag generieren
    window.store.completeQuest(
      currentUser.id,
      this.activeQuest.id,
      this.capturedPhotoBase64,
      customTitle,
      customDesc,
      userComment
    );

    // Modal schließen
    this.closeModal();

    // Game Sound & Konfetti-Animation
    if (window.GameAudio) {
      window.GameAudio.playFanfare();
    }
    if (window.app && window.app.fireConfetti) {
      window.app.fireConfetti();
    }

    // Erfolgsnachricht
    if (this.activeQuest.requiresVoting) {
      alert(`🎉 Challenge eingereicht! '${this.activeQuest.title}' wurde im Feed gepostet. Die Punkte werden freigeschaltet, sobald 60% deiner Freunde abgestimmt haben!`);
    } else {
      alert(`🎉 Glückwunsch! +${this.activeQuest.points} Punkte wurden dir gutgeschrieben!`);
    }

    // Zur Feed-Ansicht wechseln und alles aktualisieren
    ProfileModule.updateHeaderProfile();
    this.renderQuests();
    window.app.switchTab("feed");
    window.FeedModule.renderFeed();
  }
};

window.QuestsModule = QuestsModule;
