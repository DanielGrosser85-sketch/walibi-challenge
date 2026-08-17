// --- LUSTIGE THEMEN- & KULT-AVATARE (AUTHENTISCHE WALIBI MASCOT ARTWORKS) ---
window.WALIBI_AVATAR_PRESETS = [
  { id: "fred", name: "Freikörper-Fred", icon: "🩱", url: "assets/mascot_hard_gaan.jpg" },
  { id: "walibi", name: "Monsieur Walibi", icon: "🦘", url: "assets/mascot_kangaroo.jpg" },
  { id: "fox", name: "Großer (Captain)", icon: "🧢", url: "assets/mascot_fox.jpg" },
  { id: "eddie", name: "Eddie de Clown", icon: "🤡", url: "assets/mascot_eddie_clown.jpg" },
  { id: "zenko", name: "Zenko (Drummer)", icon: "🦍", url: "assets/mascot_zenko_gorilla.jpg" },
  { id: "fibi", name: "Fibi (Lead-Star)", icon: "🎤", url: "assets/mascot_fibi_singer.jpg" },
  { id: "haaz", name: "Haaz (Cheetah DJ)", icon: "🐆", url: "assets/mascot_haaz_cheetah.jpg" },
  { id: "squad", name: "Squad (The SkunX)", icon: "🎸", url: "assets/mascot_squad_skunx.jpg" },
  { id: "baron", name: "Bier-Baron", icon: "🍺", url: "assets/mascot_bier_baron.jpg" },
  { id: "goliath", name: "Goliath-Astronaut", icon: "🚀", url: "assets/mascot_goliath_astronaut.jpg" },
  { id: "untamed", name: "Untamed-Schreihals", icon: "😱", url: "assets/mascot_untamed_beast.jpg" }
];

const ProfileModule = {
  capturedNewAvatarBase64: null,
  capturedEditAvatarBase64: null,
  wakeLockSentinel: null,
  isAdmin: false,

  init() {
    this.checkAccessCode();
    this.setupProfileTrigger();
    this.setupProfileModals();
    this.setupScheduleModal();
    this.setupRulesModal();
    this.updateHeaderProfile();
  },

  // --- 0. ZUGANGSCODE PRÜFUNG (STARTMASKE) ---
  checkAccessCode() {
    const savedCode = localStorage.getItem("walibi_access_code");
    const codeModal = document.getElementById("accessCodeModal");

    if (savedCode === "1008") {
      this.isAdmin = true;
      this.ensureAdminUser();
      if (codeModal) codeModal.classList.add("hidden");
    } else if (savedCode === "6969") {
      this.isAdmin = false;
      const adminBtn = document.getElementById("btnAdminPanel");
      if (adminBtn) adminBtn.style.display = "none";
      this.ensureCurrentUser();
      if (codeModal) codeModal.classList.add("hidden");
    } else {
      // Noch kein Code eingegeben -> Startmaske erzwingen
      if (codeModal) codeModal.classList.remove("hidden");
    }
  },

  submitAccessCode(e) {
    if (e) e.preventDefault();
    const input = document.getElementById("inputAccessCode");
    const errEl = document.getElementById("accessCodeError");
    const codeModal = document.getElementById("accessCodeModal");
    const code = input ? input.value.trim() : "";

    if (code === "1008") {
      // ADMIN: GROSSEK
      localStorage.setItem("walibi_access_code", "1008");
      this.isAdmin = true;
      this.ensureAdminUser();

      if (codeModal) codeModal.classList.add("hidden");
      if (errEl) errEl.textContent = "";
      if (window.GameAudio) window.GameAudio.playReward();

      this.updateHeaderProfile();
      if (window.app) window.app.renderAllViews();
      if (window.app && window.app.showToast) {
        window.app.showToast(`👑 Willkommen, Admin <strong>grossek</strong>! Spielleiter-Modus aktiv.`);
      }
    } else if (code === "6969") {
      // REGULÄRER TEILNEHMER (KEIN ADMIN)
      localStorage.setItem("walibi_access_code", "6969");
      this.isAdmin = false;
      const adminBtn = document.getElementById("btnAdminPanel");
      if (adminBtn) adminBtn.style.display = "none";

      if (codeModal) codeModal.classList.add("hidden");
      if (errEl) errEl.textContent = "";
      if (window.GameAudio) window.GameAudio.playClick();

      this.ensureCurrentUser();
      this.updateHeaderProfile();
      if (window.app && window.app.showToast) {
        window.app.showToast(`🚀 Zugang freigeschaltet! Willkommen bei der Sauftour '26.`);
      }
    } else {
      if (errEl) errEl.textContent = "❌ Falscher Code! Bitte 6969 (Spieler) oder 1008 (Admin) eingeben.";
      if (input) {
        input.value = "";
        input.focus();
      }
    }
  },

  isAdminUser() {
    const savedCode = localStorage.getItem("walibi_access_code");
    const user = window.store && window.store.state ? window.store.state.currentUser : null;
    return (savedCode === "1008" || this.isAdmin) && user && user.name && user.name.toLowerCase() === "grossek";
  },

  activateAdminMode() {
    this.isAdmin = true;
    this.updateHeaderProfile();
  },

  ensureAdminUser() {
    const savedUserId = localStorage.getItem("walibi_active_user_id");
    let grossek = null;
    if (savedUserId && window.store && window.store.state) {
      grossek = window.store.state.players.find(p => p.id === savedUserId);
    }
    if (!grossek && window.store && window.store.state) {
      grossek = window.store.state.players.find(p => p.name.toLowerCase() === "grossek");
    }
    if (!grossek && window.store) {
      grossek = window.store.addPlayer("grossek", "Haus 1", "assets/mascot_fox.jpg");
    }
    if (grossek && window.store) {
      window.store.setCurrentUser(grossek);
    }
  },

  // --- 👑 ADMIN-FUNKTIONEN (NUR FÜR GROSSEK) ---
  openAdminModal() {
    if (!this.isAdminUser()) {
      if (window.app && window.app.showToast) {
        window.app.showToast("🔒 Admin-Bereich ist ausschließlich für <strong>grossek</strong> zugänglich!");
      }
      return;
    }
    if (window.GameAudio) window.GameAudio.playClick();
    const modal = document.getElementById("adminModal");
    if (modal) modal.classList.remove("hidden");
  },

  async adminEndGame() {
    if (!this.isAdmin) return;
    if (window.GameAudio) window.GameAudio.playFanfare();

    try {
      const res = await fetch("/api/admin/end-game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: "1008" })
      });
      const data = await res.json();
      if (data.success) {
        if (window.store && window.store.state) {
          window.store.state.gameStatus = data.gameStatus;
        }
        const adminModal = document.getElementById("adminModal");
        if (adminModal) adminModal.classList.add("hidden");

        if (window.AwardsModule) {
          window.AwardsModule.openCelebrationModal();
        }
        if (window.app && window.app.showToast) {
          window.app.showToast("🏆 Spiel beendet! Die große Siegerehrung '26 läuft!");
        }
      }
    } catch (e) {
      console.error(e);
      if (window.AwardsModule) {
        window.AwardsModule.openCelebrationModal();
      }
    }
  },

  async adminResetGame() {
    const confirmReset = confirm("⚠️ BIST DU ABSOLUT SICHER?\n\nDadurch werden ALLE Punkte, Fotos, Getränke, Coaster-Counts und Feed-Einträge unwiderruflich auf NULL gesetzt!\n\n(Ideal für die Testphase & Tour-Start)");
    if (!confirmReset) return;

    try {
      const res = await fetch("/api/admin/reset-game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: "1008" })
      });
      const data = await res.json();
      if (data.success) {
        // Lokalen Store komplett leeren
        if (window.store && window.store.state) {
          window.store.state.players.forEach(p => {
            p.points = 0;
            p.drinksCount = 0;
            p.completedQuests = [];
            p.rideCounts = {};
            p.drinksDetail = { beer: 0, shot: 0, longdrink: 0, joint: 0, water: 0 };
          });
          if (window.store.state.currentUser) {
            window.store.state.currentUser.points = 0;
            window.store.state.currentUser.drinksCount = 0;
            window.store.state.currentUser.completedQuests = [];
            window.store.state.currentUser.rideCounts = {};
            window.store.state.currentUser.drinksDetail = { beer: 0, shot: 0, longdrink: 0, joint: 0, water: 0 };
          }
          window.store.state.feed = [];
          window.store.saveLocalState();
        }

        const modal = document.getElementById("adminModal");
        if (modal) modal.classList.add("hidden");

        if (window.GameAudio) window.GameAudio.playReward();
        this.updateHeaderProfile();
        if (window.app) window.app.renderAllViews();
        if (window.app && window.app.showToast) {
          window.app.showToast(`💥 ALLES AUF NULL GESETZT! Bereit für den Tour-Start!`);
        }
      }
    } catch (e) {
      console.error(e);
    }
  },

  // --- ⚡ DISPLAY-WACHHALTEN (SCREEN WAKE LOCK API) ---
  async toggleWakeLock(silent = false) {
    if (!silent && window.GameAudio) window.GameAudio.playClick();
    const btn = document.getElementById("btnToggleWakeLock");

    if ('wakeLock' in navigator) {
      try {
        if (!this.wakeLockSentinel) {
          this.wakeLockSentinel = await navigator.wakeLock.request('screen');
          localStorage.setItem("walibi_wakelock_preferred", "true");
          if (btn) {
            btn.style.background = "rgba(255, 204, 0, 0.35)";
            btn.style.borderColor = "var(--walibi-yellow)";
          }
          if (!silent && window.app && window.app.showToast) {
            window.app.showToast("⚡ Display bleibt jetzt dauerhaft AKTIV (Handy sperrt nicht)!");
          }
          this.wakeLockSentinel.addEventListener('release', () => {
            this.wakeLockSentinel = null;
            if (btn) {
              btn.style.background = "";
              btn.style.borderColor = "";
            }
          });
        } else {
          localStorage.setItem("walibi_wakelock_preferred", "false");
          await this.wakeLockSentinel.release();
          this.wakeLockSentinel = null;
          if (btn) {
            btn.style.background = "";
            btn.style.borderColor = "";
          }
          if (!silent && window.app && window.app.showToast) {
            window.app.showToast("⚡ Display-Wachhalter DEAKTIVIERT (Normaler Standby).");
          }
        }
      } catch (err) {
        if (!silent && window.app && window.app.showToast) {
          window.app.showToast("⚡ Display-Wachhalter aktiv!");
        }
      }
    } else {
      if (!silent && window.app && window.app.showToast) {
        window.app.showToast("💡 Tipp: Füge die App 'Zum Startbildschirm hinzu' für echte App-Funktion!");
      }
    }
  },

  async requestWakeLockSilent() {
    if ('wakeLock' in navigator && !this.wakeLockSentinel) {
      try {
        this.wakeLockSentinel = await navigator.wakeLock.request('screen');
        this.wakeLockSentinel.addEventListener('release', () => {
          this.wakeLockSentinel = null;
        });
      } catch (e) {}
    }
  },

  // --- 📱 VOLLBILD-MODUS (CROSS-BROWSER FULLSCREEN API) ---
  toggleFullscreen() {
    if (window.GameAudio) window.GameAudio.playClick();
    const doc = document;
    const docEl = document.documentElement;

    const isFullscreen = doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement;

    if (!isFullscreen) {
      localStorage.setItem("walibi_fullscreen_preferred", "true");
      this.requestWakeLockSilent();

      if (docEl.requestFullscreen) {
        docEl.requestFullscreen().catch(err => {
          console.warn("Fullscreen nicht erlaubt", err);
          if (window.app && window.app.showToast) window.app.showToast("💡 Tipp: Als PWA zum Homescreen hinzufügen für dauerhaften Vollbildmodus!");
        });
      } else if (docEl.webkitRequestFullscreen) {
        docEl.webkitRequestFullscreen();
      } else if (docEl.mozRequestFullScreen) {
        docEl.mozRequestFullScreen();
      } else if (docEl.msRequestFullscreen) {
        docEl.msRequestFullscreen();
      }
      if (window.app && window.app.showToast) {
        window.app.showToast("⛶ Vollbild-Modus aktiviert!");
      }
    } else {
      localStorage.setItem("walibi_fullscreen_preferred", "false");
      if (doc.exitFullscreen) {
        doc.exitFullscreen().catch(() => {});
      } else if (doc.webkitExitFullscreen) {
        doc.webkitExitFullscreen();
      } else if (doc.mozCancelFullScreen) {
        doc.mozCancelFullScreen();
      } else if (doc.msExitFullscreen) {
        doc.msExitFullscreen();
      }
      if (window.app && window.app.showToast) {
        window.app.showToast("⛶ Vollbild beendet.");
      }
    }
  },

  openSelfieCamera(isEditing = true) {
    if (window.CameraModule) {
      window.CameraModule.open({
        title: "🤳 Eigenes Selfie aufnehmen",
        facingMode: "user",
        onCapture: (b64) => {
          if (isEditing) {
            this.setQuickAvatar(b64);
          } else {
            this.setNewPlayerAvatar(b64);
          }
        }
      });
    }
  },

  setNewPlayerAvatar(b64) {
    this.capturedNewAvatarBase64 = b64;
    const prev = document.getElementById("newPlayerAvatarPreview");
    if (prev) {
      prev.src = b64;
      prev.classList.remove("hidden");
    }
  },

  // --- 1. BENUTZER SICHERSTELLEN ---
  ensureCurrentUser() {
    const savedUserId = localStorage.getItem("walibi_active_user_id");
    const state = window.store ? window.store.state : null;
    if (!state) return;

    if (savedUserId && state.players && state.players.length > 0) {
      const found = state.players.find(p => p.id === savedUserId);
      if (found) {
        state.currentUser = found;
        return;
      }
    }

    if (state.currentUser && state.currentUser.id) {
      localStorage.setItem("walibi_active_user_id", state.currentUser.id);
      return;
    }

    // Wenn noch kein Profil für dieses Handy gewählt wurde -> Profilauswahl öffnen!
    this.openProfileSelectModal();
  },

  setupProfileTrigger() {
    const trigger = document.getElementById("headerProfileTrigger");
    if (trigger) {
      trigger.onclick = () => {
        if (window.GameAudio) window.GameAudio.playClick();
        this.openMyProfileModal();
      };
    }

    const editBtn = document.getElementById("btnEditProfile");
    if (editBtn) {
      editBtn.onclick = () => {
        if (window.GameAudio) window.GameAudio.playClick();
        this.openMyProfileModal();
      };
    }
  },

  // --- 2. EIGENE SPIELER-EIGENSCHAFTEN (ZAHNRAD ⚙️) ---
  openMyProfileModal() {
    const user = window.store ? window.store.state.currentUser : null;
    if (!user) {
      this.openProfileSelectModal();
      return;
    }

    const modal = document.getElementById("myProfileModal");
    if (!modal) return;

    this.capturedEditAvatarBase64 = user.avatar || null;

    const avatarEl = document.getElementById("myProfileAvatarPreview");
    if (avatarEl) {
      avatarEl.src = user.avatar || this.generateDefaultAvatar(user.name);
    }

    const nameInp = document.getElementById("editProfileNameInput");
    if (nameInp) {
      nameInp.value = user.name || "";
    }

    const houseSelect = document.getElementById("editProfileHouseSelect");
    if (houseSelect && window.store) {
      const houses = window.store.state.houses || ["Haus 1", "Haus 2", "Haus 3"];
      houseSelect.innerHTML = houses.map(h => `<option value="${h}" ${h === user.house ? 'selected' : ''}>${h}</option>`).join("");
    }

    // Preset Avatar Galerie rendern
    this.renderAvatarPresetGrid("myProfileAvatarPresetGrid", this.capturedEditAvatarBase64, (url) => {
      this.setQuickAvatar(url);
    });

    const scoreEl = document.getElementById("myProfileScore");
    const questsEl = document.getElementById("myProfileQuestsCount");
    const ridesEl = document.getElementById("myProfileRidesCount");
    const drinksEl = document.getElementById("myProfileDrinksCount");

    if (scoreEl) scoreEl.textContent = `${user.points || 0} Pkt`;
    if (questsEl) questsEl.textContent = `${user.completedQuests ? user.completedQuests.length : 0} Quests`;

    let totalRides = 0;
    if (user.rideCounts) {
      totalRides = Object.values(user.rideCounts).reduce((a, b) => a + b, 0);
    }
    if (ridesEl) ridesEl.textContent = `${totalRides} Fahrten`;

    let beers = 0, shots = 0, longdrinks = 0;
    if (window.store && window.store.state && window.store.state.feed) {
      window.store.state.feed.forEach(item => {
        if (item.type === "drink" && item.userId === user.id) {
          if (item.itemId === "beer") beers++;
          else if (item.itemId === "shot") shots++;
          else if (item.itemId === "longdrink") longdrinks++;
        }
      });
    }
    const promille = (beers * 0.3 + shots * 0.15 + longdrinks * 0.25).toFixed(1);
    if (drinksEl) drinksEl.textContent = `${user.drinksCount || 0} Drinks (~${promille} ‰)`;

    modal.classList.remove("hidden");
  },

  closeMyProfileModal() {
    if (window.GameAudio) window.GameAudio.playClick();
    const modal = document.getElementById("myProfileModal");
    if (modal) modal.classList.add("hidden");
  },

  setQuickAvatar(avatarUrl) {
    if (window.GameAudio) window.GameAudio.playClick();
    this.capturedEditAvatarBase64 = avatarUrl;
    const avatarEl = document.getElementById("myProfileAvatarPreview");
    if (avatarEl) avatarEl.src = avatarUrl;
    this.renderAvatarPresetGrid("myProfileAvatarPresetGrid", avatarUrl, (url) => this.setQuickAvatar(url));
  },

  renderAvatarPresetGrid(containerId, activeUrl, onSelect) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const presets = window.WALIBI_AVATAR_PRESETS || [];
    container.innerHTML = presets.map(p => {
      const isSelected = activeUrl === p.url;
      return `
        <div class="avatar-preset-item ${isSelected ? 'selected' : ''}" onclick="ProfileModule.selectPresetAvatar('${containerId}', '${p.id}')" title="${p.name}">
          <img src="${p.url}" class="preset-avatar-thumb" alt="${p.name}" />
          <span class="preset-avatar-name">${p.name}</span>
        </div>
      `;
    }).join("");
  },

  selectPresetAvatar(containerId, presetId) {
    const preset = (window.WALIBI_AVATAR_PRESETS || []).find(p => p.id === presetId);
    if (!preset) return;

    if (containerId.includes("myProfile")) {
      this.setQuickAvatar(preset.url);
    } else {
      this.capturedNewAvatarBase64 = preset.url;
      const prev = document.getElementById("newPlayerAvatarPreview");
      if (prev) {
        prev.src = preset.url;
        prev.classList.remove("hidden");
      }
      this.renderAvatarPresetGrid(containerId, preset.url, null);
    }
  },

  // --- 3. ONBOARDING SPIELER-AUSWAHL (NUR BEIM ERSTEN START) ---
  openProfileSelectModal(force = false) {
    const modal = document.getElementById("profileSelectModal");
    if (!modal) return;

    const myModal = document.getElementById("myProfileModal");
    if (myModal) myModal.classList.add("hidden");

    this.renderPlayersList();
    modal.classList.remove("hidden");
  },

  renderPlayersList() {
    const listContainer = document.getElementById("profilePlayersList");
    if (!listContainer) return;

    const players = (window.store && window.store.state && window.store.state.players) || [];
    const currentUser = window.store ? window.store.state.currentUser : null;

    listContainer.innerHTML = players.map(p => {
      const isMe = currentUser && currentUser.id === p.id;
      return `
        <div class="player-select-card" style="${isMe ? 'border-color: var(--walibi-yellow); background: rgba(255,204,0,0.18);' : ''}">
          <img src="${p.avatar || this.generateDefaultAvatar(p.name)}" class="avatar-img" />
          <div class="player-info">
            <div class="player-name">${p.name} ${isMe ? '⭐ (Du)' : ''}</div>
            <div class="player-house-badge">${p.house || 'Haus 1'} • ${p.points || 0} Pkt</div>
          </div>
          <button class="btn-select-player" onclick="ProfileModule.selectPlayer('${p.id}')">
            ${isMe ? 'Aktiv' : 'Wählen 👉'}
          </button>
        </div>
      `;
    }).join("");
  },

  selectPlayer(playerId) {
    const player = window.store.state.players.find(p => p.id === playerId);
    if (!player) return;

    if (window.GameAudio) window.GameAudio.playClick();
    window.store.setCurrentUser(player);

    const modal = document.getElementById("profileSelectModal");
    if (modal) modal.classList.add("hidden");

    this.updateHeaderProfile();
    if (window.app) window.app.renderAllViews();
    if (window.app && window.app.showToast) {
      window.app.showToast(`👋 Willkommen zurück, <strong>${player.name}</strong>!`);
    }
  },

  setupProfileModals() {
    const editForm = document.getElementById("editProfileForm");
    if (editForm) {
      editForm.onsubmit = async (e) => {
        e.preventDefault();
        const user = window.store ? window.store.state.currentUser : null;
        if (!user) return;

        const nameInp = document.getElementById("editProfileNameInput");
        const houseSelect = document.getElementById("editProfileHouseSelect");
        const newName = nameInp ? nameInp.value.trim() : user.name;
        const newHouse = houseSelect ? houseSelect.value : user.house;
        const newAvatar = this.capturedEditAvatarBase64 || user.avatar;

        if (!newName) return;

        await window.store.updateProfile(user.id, {
          name: newName,
          house: newHouse,
          avatar: newAvatar
        });

        if (window.GameAudio) window.GameAudio.playReward();
        this.closeMyProfileModal();
        this.updateHeaderProfile();

        if (window.app) window.app.renderAllViews();
        if (window.app && window.app.showToast) {
          window.app.showToast(`✅ Profil von <strong>${newName}</strong> erfolgreich gespeichert!`);
        }
      };
    }

    const editCam = document.getElementById("editProfileCameraInput");
    const editGal = document.getElementById("editProfileGalleryInput");
    if (editCam) editCam.onchange = (e) => this.handleEditProfilePhoto(e);
    if (editGal) editGal.onchange = (e) => this.handleEditProfilePhoto(e);

    const selectModal = document.getElementById("profileSelectModal");
    const createModal = document.getElementById("createPlayerModal");
    const btnOpenCreate = document.getElementById("btnOpenCreatePlayer");
    const btnCloseCreate = document.getElementById("closeCreatePlayerModal");
    const createForm = document.getElementById("createPlayerForm");

    if (btnOpenCreate) {
      btnOpenCreate.onclick = () => {
        if (window.GameAudio) window.GameAudio.playClick();
        if (selectModal) selectModal.classList.add("hidden");
        if (createModal) {
          const houseSelect = document.getElementById("newPlayerHouse");
          if (houseSelect && window.store) {
            houseSelect.innerHTML = (window.store.state.houses || ["Haus 1", "Haus 2", "Haus 3"]).map(h => `<option value="${h}">${h}</option>`).join("");
          }
          this.capturedNewAvatarBase64 = null;
          this.renderAvatarPresetGrid("newPlayerAvatarPresetGrid", null, (url) => {
            this.capturedNewAvatarBase64 = url;
            const prev = document.getElementById("newPlayerAvatarPreview");
            if (prev) {
              prev.src = url;
              prev.classList.remove("hidden");
            }
          });
          createModal.classList.remove("hidden");
        }
      };
    }

    if (btnCloseCreate && createModal) {
      btnCloseCreate.onclick = () => {
        if (window.GameAudio) window.GameAudio.playClick();
        createModal.classList.add("hidden");
        if (selectModal) selectModal.classList.remove("hidden");
      };
    }

    if (createForm) {
      createForm.onsubmit = (e) => {
        e.preventDefault();
        const nameInp = document.getElementById("newPlayerName");
        const houseSelect = document.getElementById("newPlayerHouse");
        const name = nameInp ? nameInp.value.trim() : "";
        const house = houseSelect ? houseSelect.value : "Haus 1";

        if (!name) return;

        const avatar = this.capturedNewAvatarBase64 || this.generateDefaultAvatar(name);
        const newPlayer = window.store.addPlayer(name, house, avatar);
        window.store.setCurrentUser(newPlayer);

        if (createModal) createModal.classList.add("hidden");
        this.updateHeaderProfile();
        if (window.app) window.app.renderAllViews();
        if (window.app && window.app.showToast) {
          window.app.showToast(`🎉 Spieler <strong>${name}</strong> erfolgreich erstellt!`);
        }
      };
    }

    const camInp = document.getElementById("newPlayerCameraInput");
    const galInp = document.getElementById("newPlayerGalleryInput");
    if (camInp) camInp.onchange = (e) => this.handleNewPlayerPhoto(e);
    if (galInp) galInp.onchange = (e) => this.handleNewPlayerPhoto(e);
  },

  handleEditProfilePhoto(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = 180;
        canvas.height = 180;
        ctx.drawImage(img, 0, 0, 180, 180);
        const b64 = canvas.toDataURL("image/jpeg", 0.85);
        this.capturedEditAvatarBase64 = b64;
        const prev = document.getElementById("myProfileAvatarPreview");
        if (prev) {
          prev.src = b64;
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  },

  handleNewPlayerPhoto(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = 180;
        canvas.height = 180;
        ctx.drawImage(img, 0, 0, 180, 180);
        const b64 = canvas.toDataURL("image/jpeg", 0.85);
        this.capturedNewAvatarBase64 = b64;
        const prev = document.getElementById("newPlayerAvatarPreview");
        if (prev) {
          prev.src = b64;
          prev.classList.remove("hidden");
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  },

  updateHeaderProfile() {
    const user = window.store ? window.store.state.currentUser : null;
    const nameEl = document.getElementById("headerUserName");
    const pointsEl = document.getElementById("headerUserPoints");
    const avatarEl = document.getElementById("headerUserAvatar");
    const adminBtn = document.getElementById("btnAdminPanel");
    const menuAdminBtn = document.getElementById("menuAdminBtn");
    const isGrossekAdmin = this.isAdminUser();

    // KRONE & ADMIN BUTTONS NUR FÜR DEN ECHTEN ADMIN GROSSEK ANZEIGEN (NIEMALS FÜR ALEX ODER ANDERE SPIELER)
    if (adminBtn) {
      adminBtn.style.display = isGrossekAdmin ? "flex" : "none";
    }
    if (menuAdminBtn) {
      menuAdminBtn.style.display = isGrossekAdmin ? "flex" : "none";
    }

    if (!user) {
      if (nameEl) nameEl.textContent = "Gast";
      if (pointsEl) pointsEl.textContent = "0 Pkt";
      return;
    }

    if (nameEl) nameEl.textContent = user.name;
    if (pointsEl) pointsEl.textContent = `${user.points || 0} Pkt`;
    if (avatarEl) avatarEl.src = user.avatar || this.generateDefaultAvatar(user.name);
  },

  openScheduleModal() {
    if (window.GameAudio) window.GameAudio.playClick();
    const modal = document.getElementById("scheduleModal");
    const container = document.getElementById("scheduleTimelineContainer");
    if (container) {
      const schedule = window.WALIBI_SCHEDULE || [];
      container.innerHTML = `
        <!-- HERO BANNER -->
        <div class="pop-modal-hero">
          <img src="assets/mascot_hard_gaan.jpg" class="pop-hero-avatar" />
          <div class="pop-hero-text">
            <div style="font-size: 11px; font-weight: 900; color: var(--walibi-yellow); text-transform: uppercase;">TOUR-FAHRPLAN 12.09.2026</div>
            Von Frühstück bis zur Krönung – Alle Stationen der Sauftour auf einen Blick!
          </div>
        </div>

        <!-- TIMELINE CARDS -->
        <div class="pop-timeline-container">
          ${schedule.map(s => `
            <div class="pop-timeline-card" style="border-left: 4.5px solid ${s.color || '#ffcc00'};">
              <div class="pop-time-col">
                <div class="pop-time-badge">${s.time}</div>
                <div class="pop-time-icon">${s.icon || '⏰'}</div>
              </div>
              <div class="pop-timeline-content">
                <span class="pop-timeline-phase" style="color: ${s.color || '#ffcc00'}; background: rgba(0,0,0,0.35);">${s.badge || 'EVENT'}</span>
                <div class="pop-timeline-title">${s.title}</div>
                <div class="pop-timeline-desc">${s.desc}</div>
                ${s.tip ? `<div class="pop-timeline-tip">${s.tip}</div>` : ''}
              </div>
            </div>
          `).join("")}
        </div>
      `;
    }
    if (modal) modal.classList.remove("hidden");
  },

  setupScheduleModal() {
    const btn = document.getElementById("btnOpenSchedule");
    const modal = document.getElementById("scheduleModal");
    const closeBtn = document.getElementById("closeScheduleModal");

    if (btn) {
      btn.onclick = () => this.openScheduleModal();
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
  },

  openRulesModal() {
    if (window.GameAudio) window.GameAudio.playClick();
    const modal = document.getElementById("rulesModal");
    const container = document.getElementById("rulesListContainer");
    if (container) {
      const rules = window.WALIBI_RULES || window.DEFAULT_RULES || [];
      container.innerHTML = `
        <!-- HERO BANNER -->
        <div class="pop-modal-hero">
          <img src="assets/mascot_fox.jpg" class="pop-hero-avatar" />
          <div class="pop-hero-text">
            <div style="font-size: 11px; font-weight: 900; color: var(--walibi-yellow); text-transform: uppercase;">DIE 7 HEILIGEN SAUFTOUR-GEBOTE</div>
            Wer schummelt oder die Stimmung drückt, zahlt die nächste Runde Shots!
          </div>
        </div>

        <!-- RULES LIST -->
        <div class="pop-rules-list">
          ${rules.map((r, i) => `
            <div class="pop-rule-card" style="border-left: 4.5px solid ${r.color || '#ffcc00'};">
              <div class="pop-rule-header">
                <span class="pop-rule-badge" style="color: ${r.color || '#ffcc00'}; background: rgba(0,0,0,0.35);">${r.badge || `REGEL #${r.id || (i+1)}`}</span>
                <span style="font-size: 18px;">${r.icon || '📜'}</span>
              </div>
              <div class="pop-rule-title">#${r.id || (i+1)} ${r.title}</div>
              <div class="pop-rule-desc">${r.desc}</div>
              ${r.penalty ? `<div class="pop-rule-penalty">${r.penalty}</div>` : ''}
            </div>
          `).join("")}
        </div>
      `;
    }
    if (modal) modal.classList.remove("hidden");
  },

  setupRulesModal() {
    const btn = document.getElementById("btnOpenRules");
    const modal = document.getElementById("rulesModal");
    const closeBtn = document.getElementById("closeRulesModal");

    if (btn) {
      btn.onclick = () => this.openRulesModal();
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
  },

  requireUser() {
    if (!window.store || !window.store.state.currentUser) {
      this.openProfileSelectModal();
      return false;
    }
    return true;
  },

  generateDefaultAvatar(name) {
    const initial = (name && name[0]) ? name[0].toUpperCase() : "W";
    return `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='50' fill='%23e11d48'/><text x='50' y='65' font-size='45' text-anchor='middle' fill='%23ffcc00' font-family='sans-serif' font-weight='900'>${initial}</text></svg>`;
  }
};

window.ProfileModule = ProfileModule;
