// --- LUSTIGE THEMEN- & KULT-AVATARE (AUTHENTISCHE WALIBI MASCOT ARTWORKS & KULT-HELDEN) ---
window.WALIBI_AVATAR_PRESETS = [
  // 1. NEUE KULT- & PARTY-HELDEN (MIT DETAIL-LORE)
  { id: "fbeichel", name: "FBeichel", icon: "🐿️", url: "assets/avatar_fbeichel.jpg" },
  { id: "kloetterich", name: "Klötterich", icon: "🐸", url: "assets/avatar_kloetterich.jpg" },
  { id: "prinzessin_huiiii", name: "Prinzessin Huiiii", icon: "👻", url: "assets/avatar_prinzessin_huiiii.jpg" },
  { id: "belaestigungspanda", name: "Belästigungs-Panda", icon: "🐼", url: "assets/avatar_belaestigungspanda.jpg" },
  { id: "captain_planet", name: "Captain Planet", icon: "🌍", url: "assets/avatar_captain_planet.jpg" },
  { id: "elmo", name: "Elmo", icon: "🍪", url: "assets/avatar_elmo.jpg" },
  { id: "towelie", name: "Towelie", icon: "🧖‍♂️", url: "assets/avatar_towelie.jpg" },
  { id: "bierkules", name: "Bierkules", icon: "🏛️", url: "assets/avatar_bierkules.jpg" },
  { id: "kotzfee", name: "Die Kotz-Fee", icon: "🧚‍♀️", url: "assets/avatar_kotzfee.jpg" },
  { id: "zapfhahn_zombie", name: "Zapfhahn-Zombie", icon: "🧟‍♂️", url: "assets/avatar_zapfhahn_zombie.jpg" },
  { id: "bender", name: "Bender", icon: "🤖", url: "assets/avatar_bender.svg" },
  { id: "trichter_thor", name: "Trichter-Thor", icon: "⚡", url: "assets/avatar_trichter_thor.svg" },
  { id: "absturz_mario", name: "Absturz-Mario", icon: "👨🏻‍🔧", url: "assets/avatar_absturz_mario.svg" },
  { id: "achterbahn_papst", name: "Achterbahn-Papst", icon: "⛪", url: "assets/avatar_achterbahn_papst.svg" },
  { id: "schnapsdrossel_susi", name: "Schnapsdrossel Susi", icon: "🦉", url: "assets/avatar_schnapsdrossel_susi.svg" },
  { id: "scooby_doo", name: "Scooby-Doo", icon: "🐕", url: "assets/avatar_scooby_doo.svg" },
  { id: "meister_proper", name: "Meister Proper", icon: "🧽", url: "assets/avatar_meister_proper.svg" },
  { id: "kaeptn_pegel", name: "Käpt'n Pegel", icon: "🏴‍☠️", url: "assets/avatar_kaeptn_pegel.svg" },
  { id: "schluckspecht_schorsch", name: "Schluckspecht Schorsch", icon: "🦅", url: "assets/avatar_schluckspecht_schorsch.svg" },
  { id: "promille_pikachu", name: "Promille-Pikachu", icon: "⚡", url: "assets/avatar_promille_pikachu.svg" },
  { id: "kaeptn_blaubaer", name: "Käpt'n Blaubär", icon: "🐻", url: "assets/avatar_kaeptn_blaubaer.svg" },
  { id: "li_la_launebaer", name: "Li-La-Launebär", icon: "🐻", url: "assets/avatar_li_la_launebaer.svg" },
  { id: "metty_krings", name: "Metty", icon: "🎙️", url: "assets/avatar_metty_krings.svg" },

  // 2. OFFIZIELLES WALIBI TRIO & PARK-MASCOT CREW
  { id: "fred", name: "Freikörper-Fred", icon: "🩱", url: "assets/mascot_hard_gaan.jpg" },
  { id: "walibi", name: "Monsieur Walibi", icon: "🦘", url: "assets/mascot_kangaroo.jpg" },
  { id: "fox", name: "Großer (Captain)", icon: "🧢", url: "assets/mascot_fox.jpg" },
  { id: "baron", name: "Bier-Baron", icon: "🍺", url: "assets/mascot_bier_baron.jpg" },
  { id: "goliath", name: "Goliath-Astronaut", icon: "🚀", url: "assets/mascot_goliath_astronaut.jpg" },
  { id: "untamed", name: "Untamed-Schreihals", icon: "😱", url: "assets/mascot_untamed_beast.jpg" },
  { id: "eddie", name: "Eddie de Clown", icon: "🤡", url: "assets/mascot_eddie_clown.jpg" },
  { id: "zenko", name: "Zenko (Drummer)", icon: "🦍", url: "assets/mascot_zenko_gorilla.jpg" },
  { id: "fibi", name: "Fibi (Lead-Star)", icon: "🎤", url: "assets/mascot_fibi_singer.jpg" },
  { id: "haaz", name: "Haaz (Cheetah DJ)", icon: "🐆", url: "assets/mascot_haaz_cheetah.jpg" },
  { id: "squad", name: "Squad (The SkunX)", icon: "🎸", url: "assets/mascot_squad_skunx.jpg" }
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
      if (codeModal) codeModal.classList.add("hidden");
      this.ensureCurrentUser();
    } else {
      // Noch kein Code eingegeben -> Startmaske erzwingen
      this.isAdmin = false;
      if (codeModal) codeModal.classList.remove("hidden");
      if (window.store && window.store.state) {
        window.store.state.currentUser = null;
      }
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

      // Bei 6969 Login: Vorherigen Admin Grossek IMMER entfernen!
      const savedUserId = localStorage.getItem("walibi_active_user_id") || localStorage.getItem("walibi_current_user_id");
      let activePlayer = (savedUserId && window.store && window.store.state && Array.isArray(window.store.state.players)) 
        ? window.store.state.players.find(p => p.id === savedUserId) 
        : null;

      if (!activePlayer || activePlayer.name.toLowerCase() === "grossek") {
        localStorage.removeItem("walibi_active_user_id");
        localStorage.removeItem("walibi_current_user_id");
        if (window.store && window.store.state) {
          window.store.state.currentUser = null;
          window.store.saveLocalState();
        }
        this.updateHeaderProfile();
        if (window.app && window.app.renderAllViews) window.app.renderAllViews();
        // Öffne direkt die Spielerauswahl-Maske!
        this.openProfileSelectModal();
      } else {
        if (window.store && window.store.state) {
          window.store.state.currentUser = activePlayer;
        }
        this.updateHeaderProfile();
        if (window.app && window.app.renderAllViews) window.app.renderAllViews();
      }

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

  logout() {
    if (window.GameAudio) window.GameAudio.playClick();
    localStorage.removeItem("walibi_access_code");
    localStorage.removeItem("walibi_active_user_id");
    localStorage.removeItem("walibi_current_user_id");
    this.isAdmin = false;

    if (window.store && window.store.state) {
      window.store.state.currentUser = null;
      window.store.saveLocalState();
    }

    // Alle Modale schließen
    document.querySelectorAll(".modal-overlay").forEach(m => m.classList.add("hidden"));

    // Code-Modal anzeigen & Eingabefeld fokussieren
    const codeModal = document.getElementById("accessCodeModal");
    const input = document.getElementById("inputAccessCode");
    const errEl = document.getElementById("accessCodeError");
    if (codeModal) codeModal.classList.remove("hidden");
    if (errEl) errEl.textContent = "";
    if (input) {
      input.value = "";
      setTimeout(() => input.focus(), 150);
    }

    this.updateHeaderProfile();
    if (window.app) window.app.renderAllViews();
    if (window.app && window.app.showToast) {
      window.app.showToast("🚪 Abgemeldet. Bitte Zugangscode eingeben.");
    }
  },

  isAdminUser() {
    const user = window.store && window.store.state ? window.store.state.currentUser : null;
    if (user && user.name) {
      return user.name.toLowerCase() === "grossek";
    }
    const savedCode = localStorage.getItem("walibi_access_code");
    return savedCode === "1008" || this.isAdmin === true;
  },

  activateAdminMode() {
    localStorage.setItem("walibi_access_code", "1008");
    this.isAdmin = true;
    this.ensureAdminUser();
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
      localStorage.setItem("walibi_active_user_id", grossek.id);
    }
  },

  // --- 👑 ADMIN-FUNKTIONEN (NUR FÜR GROSSEK) ---
  openAdminModal() {
    if (!this.isAdminUser()) {
      const code = prompt("👑 Admin-PIN eingeben (grossek):");
      if (code === "1008") {
        this.activateAdminMode();
        localStorage.setItem("walibi_access_code", "1008");
        this.updateHeaderProfile();
        if (window.app && window.app.showToast) {
          window.app.showToast("👑 Admin-Modus für <strong>grossek</strong> freigeschaltet!");
        }
      } else {
        if (code !== null && window.app && window.app.showToast) {
          window.app.showToast("❌ Falscher Admin-PIN!");
        }
        return;
      }
    }
    if (window.GameAudio) window.GameAudio.playClick();
    this.updateAdminHappyHourUI();
    this.renderAdminPlayersList();
    const modal = document.getElementById("adminModal");
    if (modal) modal.classList.remove("hidden");
  },

  renderAdminPlayersList() {
    const listEl = document.getElementById("adminPlayersManageList");
    if (!listEl) return;

    const players = (window.store && window.store.state && window.store.state.players) || [];
    if (players.length === 0) {
      listEl.innerHTML = `<div style="font-size: 12px; color: var(--text-muted); text-align: center; padding: 8px;">Keine Spieler gefunden.</div>`;
      return;
    }

    listEl.innerHTML = players.map(p => {
      const isGrossek = p.name.toLowerCase() === "grossek";
      return `
        <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(0,0,0,0.4); padding: 8px 10px; border-radius: 8px; border: 1px solid ${isGrossek ? 'var(--walibi-yellow)' : 'rgba(255,255,255,0.1)'};">
          <div style="display: flex; align-items: center; gap: 8px;">
            <img src="${p.avatar || this.generateDefaultAvatar(p.name)}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; border: 1.5px solid var(--walibi-yellow);" />
            <div>
              <strong style="color: ${isGrossek ? 'var(--walibi-yellow)' : '#fff'}; font-size: 13px;">${p.name} ${isGrossek ? '👑' : ''}</strong>
              <div style="font-size: 11px; color: var(--text-muted);">${p.house || 'Haus 1'} • ${p.points || 0} Pkt • ${p.drinksCount || 0} Drinks</div>
            </div>
          </div>
          <div>
            ${isGrossek 
              ? `<span style="font-size: 11px; color: var(--walibi-yellow); font-weight: 800; padding: 2px 8px; background: rgba(255,204,0,0.15); border-radius: 4px; border: 1px solid var(--walibi-yellow);">Admin</span>`
              : `<button type="button" onclick="ProfileModule.adminDeletePlayer('${p.id}', '${p.name}')" style="background: rgba(239,68,68,0.2); border: 1.5px solid #ef4444; color: #fca5a5; font-size: 11px; font-weight: 800; border-radius: 6px; padding: 4px 8px; cursor: pointer;">
                  🗑️ Löschen
                </button>`
            }
          </div>
        </div>
      `;
    }).join("");
  },

  async adminDeletePlayer(playerId, playerName) {
    if (!this.isAdminUser()) return;
    if (!confirm(`Möchtest du den Spieler "${playerName}" wirklich löschen? Alle Punkte und Posts dieses Spielers werden entfernt.`)) return;

    if (window.GameAudio) window.GameAudio.playClick();

    try {
      const res = await fetch("/api/admin/delete-player", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: "1008", playerId })
      });
      const data = await res.json();
      if (data.success && window.store) {
        window.store.state.players = data.players;
        window.store.saveLocalState();
        this.renderAdminPlayersList();
        if (window.app) window.app.renderAllViews();
        if (window.app && window.app.showToast) {
          window.app.showToast(`🗑️ Spieler <strong>${playerName}</strong> wurde gelöscht.`);
        }
      }
    } catch (e) {
      console.error("Fehler beim Löschen des Spielers:", e);
    }
  },

  async adminDeleteAllPlayers() {
    if (!this.isAdminUser()) return;
    if (!confirm("⚠️ ACHTUNG: Möchtest du wirklich ALLE Spieler (außer Grossek) löschen und den Feed leeren?")) return;

    if (window.GameAudio) window.GameAudio.playReward();

    try {
      const res = await fetch("/api/admin/delete-all-players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: "1008" })
      });
      const data = await res.json();
      if (data.success && window.store) {
        window.store.state.players = data.players;
        window.store.state.feed = [];
        window.store.saveLocalState();
        this.renderAdminPlayersList();
        if (window.app) window.app.renderAllViews();
        if (window.app && window.app.showToast) {
          window.app.showToast("🗑️ Alle Spieler außer Grossek wurden gelöscht.");
        }
      }
    } catch (e) {
      console.error("Fehler beim Löschen aller Spieler:", e);
    }
  },

  async adminToggleHappyHour() {
    if (window.GameAudio) window.GameAudio.playFanfare();

    const isCurrentlyActive = window.store && window.store.isHappyHourActive();
    const action = isCurrentlyActive ? "stop" : "start";

    let hhObj = {
      active: action === "start",
      endsAt: action === "start" ? new Date(Date.now() + 60 * 60 * 1000).toISOString() : null,
      multiplier: 2
    };

    if (window.store) {
      window.store.state.happyHour = hhObj;
      window.store.saveLocalState();
    }

    this.updateAdminHappyHourUI();
    if (window.app) {
      window.app.updateHappyHourBanner();
      window.app.renderAllViews();
      if (hhObj.active) {
        window.app.fireConfetti();
      }
    }

    if (window.app && window.app.showToast) {
      if (hhObj.active) {
        window.app.showToast("⚡ 🍻 <strong>2X HAPPY HOUR AKTIV!</strong> Alle Punkte zählen für 60 Min doppelt!");
      } else {
        window.app.showToast("⚡ Happy Hour gestoppt.");
      }
    }

    // Server-Sync im Hintergrund (Cloud-Broadcast)
    try {
      const res = await fetch("/api/admin/happy-hour", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: "1008", action, durationMinutes: 60 })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.happyHour && window.store) {
          window.store.state.happyHour = data.happyHour;
          window.store.saveLocalState();
          this.updateAdminHappyHourUI();
          if (window.app) window.app.updateHappyHourBanner();
        }
      }
    } catch (e) {
      console.warn("Happy Hour Server Sync:", e);
    }
  },

  updateAdminHappyHourUI() {
    const statusEl = document.getElementById("adminHappyHourStatus");
    const btnEl = document.getElementById("btnAdminHappyHour");
    if (!statusEl || !btnEl) return;

    const isActive = window.store && window.store.isHappyHourActive();
    if (isActive) {
      const hh = window.store.state.happyHour;
      const remainingMs = Math.max(0, new Date(hh.endsAt).getTime() - Date.now());
      const mins = Math.floor(remainingMs / 60000);
      const secs = Math.floor((remainingMs % 60000) / 1000);
      const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      statusEl.innerHTML = `<span style="color: #ffcc00; font-weight: 900;">🔥 AKTIV (Verbleibend: ${timeStr})</span>`;
      btnEl.textContent = "⏹️ HAPPY HOUR STOPPEN";
      btnEl.style.background = "var(--gradient-red)";
      btnEl.style.color = "#fff";
    } else {
      statusEl.innerHTML = `<span style="color: #94a3b8;">Status: Inaktiv</span>`;
      btnEl.textContent = "🍻 2X HAPPY HOUR STARTEN (60 MIN)";
      btnEl.style.background = "var(--gradient-gold)";
      btnEl.style.color = "#000";
    }
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

        if (window.SympathyModule) {
          window.SympathyModule.openVoteModal();
        } else if (window.AwardsModule) {
          window.AwardsModule.openCelebrationModal();
        }
        if (window.app && window.app.showToast) {
          window.app.showToast("🏆 Spiel beendet! 💖 Eisbrecher- & Sympathie-Voting gestartet!");
        }
      }
    } catch (e) {
      console.error(e);
      if (window.SympathyModule) {
        window.SympathyModule.openVoteModal();
      } else if (window.AwardsModule) {
        window.AwardsModule.openCelebrationModal();
      }
    }
  },

  async adminResetGame() {
    const confirmReset = confirm("⚠️ BIST DU ABSOLUT SICHER?\n\nDadurch werden ALLE Punkte, Fotos, Getränke, Coaster-Counts und Feed-Einträge unwiderruflich auf NULL gesetzt!\n\nAlle Spieler außer grossek werden entfernt.");
    if (!confirmReset) return;

    try {
      const res = await fetch("/api/admin/reset-game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: "1008" })
      });
      const data = await res.json();
      if (data.success) {
        // Lokalen Store komplett zurücksetzen auf nur Grossek mit 0 Punkten
        if (window.store && window.store.state) {
          const grossekExisting = window.store.state.players.find(p => p.name.toLowerCase() === 'grossek');
          window.store.state.players = [
            {
              id: grossekExisting ? grossekExisting.id : "p_1786747056481_o5jo",
              name: "grossek",
              house: "Haus 1",
              avatar: (grossekExisting && grossekExisting.avatar) || "assets/mascot_fox.jpg",
              points: 0,
              drinksCount: 0,
              completedQuests: [],
              completedSideQuests: [],
              rideCounts: {},
              drinksDetail: { beer: 0, shot: 0, longdrink: 0, joint: 0, water: 0 },
              gutGlaubenCount: 0
            }
          ];
          window.store.state.feed = [];
          window.store.state.happyHour = { active: false, endsAt: null, multiplier: 2 };
          if (window.store.state.currentUser) {
            window.store.state.currentUser = window.store.state.players[0];
            localStorage.setItem("walibi_active_user_id", window.store.state.players[0].id);
          }
          window.store.saveLocalState();
        }

        const modal = document.getElementById("adminModal");
        if (modal) modal.classList.add("hidden");

        if (window.GameAudio) window.GameAudio.playReward();
        this.updateHeaderProfile();
        if (window.app) window.app.renderAllViews();
        if (window.ParkGuideModule) window.ParkGuideModule.render();
        if (window.app && window.app.showToast) {
          window.app.showToast(`💥 ALLES AUF NULL GESETZT! Nur grossek aktiv.`);
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
    const state = window.store ? window.store.state : null;
    if (!state) return;

    const isAdmin = this.isAdminUser();

    // 1. Zuerst prüfen, ob bereits ein aktiver Spieler im LocalStorage oder State existiert!
    const savedUserId = localStorage.getItem("walibi_active_user_id") || localStorage.getItem("walibi_current_user_id");
    if (savedUserId && state.players && state.players.length > 0) {
      const found = state.players.find(p => p.id === savedUserId);
      if (found && (isAdmin || found.name.toLowerCase() !== "grossek")) {
        state.currentUser = found;
        return;
      }
    }

    if (state.currentUser && (isAdmin || state.currentUser.name.toLowerCase() !== "grossek")) {
      localStorage.setItem("walibi_active_user_id", state.currentUser.id);
      localStorage.setItem("walibi_current_user_id", state.currentUser.id);
      return;
    }

    // 2. Nur wenn noch KEIN Spieler gewählt wurde und Admin-Code 1008 vorliegt: Grossek als Standard
    if (isAdmin) {
      let grossek = state.players ? state.players.find(p => p.name.toLowerCase() === "grossek") : null;
      if (!grossek && window.store) {
        grossek = window.store.addPlayer("grossek", "Haus 1", "assets/mascot_fox.jpg");
      }
      if (grossek) {
        state.currentUser = grossek;
        localStorage.setItem("walibi_active_user_id", grossek.id);
        localStorage.setItem("walibi_current_user_id", grossek.id);
      }
      return;
    }

    // 3. Wenn noch kein Spieler gewählt ist (für 6969 Mitspieler):
    state.currentUser = null;
    localStorage.removeItem("walibi_active_user_id");
    localStorage.removeItem("walibi_current_user_id");

    if (state.players && state.players.length > 0) {
      this.openProfileSelectModal();
    } else {
      this.openCreatePlayerModal();
    }
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

    // Direkt im Profil des aktiven Spielers mitspeichern
    const user = window.store && window.store.state ? window.store.state.currentUser : null;
    if (user && user.id) {
      user.avatar = avatarUrl;
      if (window.store) {
        const pIdx = window.store.state.players.findIndex(p => p.id === user.id);
        if (pIdx >= 0) window.store.state.players[pIdx].avatar = avatarUrl;
        window.store.saveLocalState();
        if (window.store.updateProfile) {
          window.store.updateProfile(user.id, { avatar: avatarUrl }).catch(() => {});
        }
      }
      this.updateHeaderProfile();
      if (window.app) window.app.renderAllViews();
    }
  },

  renderAvatarPresetGrid(containerId, activeUrl, onSelect) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const presets = window.WALIBI_AVATAR_PRESETS || [];
    container.innerHTML = presets.map(p => {
      const isSelected = activeUrl === p.url;
      const hasLore = (window.WALIBI_CHARACTER_LORE || []).some(l => l.id === p.id);
      return `
        <div class="avatar-preset-item ${isSelected ? 'selected' : ''}" onclick="ProfileModule.selectPresetAvatar('${containerId}', '${p.id}')" title="${p.name}">
          ${hasLore ? `<button type="button" class="preset-info-badge" onclick="event.stopPropagation(); ProfileModule.openCharacterLoreModal('${p.id}')" title="Steckbrief & Lore ansehen">ℹ️</button>` : ''}
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

  // --- 🎭 CHARAKTER- & AVATAR-LEXIKON MODAL ---
  openCharacterLoreModal(targetId = null) {
    if (window.GameAudio) window.GameAudio.playClick();
    const modal = document.getElementById("characterLoreModal");
    if (!modal) return;

    this.renderCharacterLoreList(targetId);
    modal.classList.remove("hidden");

    if (targetId) {
      setTimeout(() => {
        const targetEl = document.getElementById(`lore_card_${targetId}`);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
          targetEl.style.borderColor = "var(--walibi-yellow)";
          targetEl.style.boxShadow = "0 0 20px rgba(255, 204, 0, 0.6)";
        }
      }, 100);
    }
  },

  renderCharacterLoreList(focusId = null) {
    const container = document.getElementById("characterLoreListContainer");
    if (!container) return;

    const loreList = window.WALIBI_CHARACTER_LORE || [];
    if (loreList.length === 0) {
      container.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 20px;">Keine Charaktere geladen.</div>`;
      return;
    }

    // Gruppierung nach Kategorie
    const categories = {};
    loreList.forEach(item => {
      const cat = item.category || "Allgemein";
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(item);
    });

    let html = "";
    for (const [catName, items] of Object.entries(categories)) {
      html += `<div class="lore-category-header">✨ ${catName}</div>`;
      html += items.map(c => `
        <div class="lore-card" id="lore_card_${c.id}">
          <div class="lore-card-header">
            <div class="lore-card-avatar-wrap" onclick="ProfileModule.openAvatarLensModal('${c.id}')" title="🔍 Tippen zum Vergrößern (Lupe)">
              <img src="${c.avatar}" class="lore-card-avatar" alt="${c.name}" />
              <span class="lore-avatar-lens-btn">🔍</span>
            </div>
            <div style="flex: 1;">
              <div class="lore-card-title">${c.icon || '🎭'} ${c.name}</div>
              <div class="lore-card-subtitle">${c.subtitle || ''}</div>
              <div style="font-size: 11px; color: var(--walibi-yellow); font-weight: 700; margin-top: 3px; cursor: pointer;" onclick="ProfileModule.openAvatarLensModal('${c.id}')">🔍 Tippe Bild für Lupe</div>
            </div>
            <button type="button" onclick="ProfileModule.quickPickLoreAvatar('${c.id}')" class="btn-primary" style="padding: 9px 14px; font-size: 13px; width: auto; background: var(--gradient-gold); color: #000; font-weight: 900; border: 2px solid #fff; box-shadow: 0 0 12px rgba(255,204,0,0.5);">
              Wählen 👉
            </button>
          </div>

          <div class="lore-card-quote">💬 "${c.quote || ''}"</div>

          <div class="lore-card-history">
            <strong style="color: #fff;">📖 Historie:</strong> ${c.history || ''}
          </div>

          <div class="lore-card-features">
            <strong style="color: var(--walibi-yellow);">🔍 Merkmale:</strong> ${c.features || ''}
          </div>

          <div class="lore-pills-row">
            <div class="lore-pill lore-pill-strength">
              <strong>💪 Stärke:</strong><br>${c.strengths || ''}
            </div>
            <div class="lore-pill lore-pill-weakness">
              <strong>⚠️ Schwäche:</strong><br>${c.weaknesses || ''}
            </div>
          </div>
        </div>
      `).join("");
    }

    container.innerHTML = html;
  },

  openAvatarLensModal(charId) {
    if (window.GameAudio) window.GameAudio.playClick();
    const modal = document.getElementById("avatarLensLightboxModal");
    if (!modal) return;

    let char = (window.WALIBI_CHARACTER_LORE || []).find(c => c.id === charId);
    if (!char) {
      const preset = (window.WALIBI_AVATAR_PRESETS || []).find(p => p.id === charId);
      if (preset) {
        char = {
          id: preset.id,
          name: preset.name,
          subtitle: "Kult-Avatar",
          avatar: preset.url,
          quote: "Ready for Walibi Holland '26!"
        };
      }
    }
    if (!char) return;

    const imgEl = document.getElementById("lensModalAvatarImg");
    const titleEl = document.getElementById("lensModalAvatarTitle");
    const subEl = document.getElementById("lensModalAvatarSubtitle");
    const quoteEl = document.getElementById("lensModalAvatarQuote");
    const btnPick = document.getElementById("btnLensModalPick");

    if (imgEl) imgEl.src = char.avatar;
    if (titleEl) titleEl.textContent = `${char.icon || '🎭'} ${char.name}`;
    if (subEl) subEl.textContent = char.subtitle || '';
    if (quoteEl) quoteEl.textContent = `💬 "${char.quote || ''}"`;

    if (btnPick) {
      btnPick.onclick = () => {
        this.closeAvatarLensModal();
        this.quickPickLoreAvatar(char.id);
      };
    }

    modal.classList.remove("hidden");
  },

  closeAvatarLensModal() {
    if (window.GameAudio) window.GameAudio.playClick();
    const modal = document.getElementById("avatarLensLightboxModal");
    if (modal) modal.classList.add("hidden");
  },

  async quickPickLoreAvatar(charIdOrUrl, optName = null) {
    try {
      if (window.GameAudio && window.GameAudio.playReward) window.GameAudio.playReward();
    } catch(e) {}
    try {
      if (window.app && window.app.fireConfetti) window.app.fireConfetti();
    } catch(e) {}
    
    let avatarUrl = charIdOrUrl;
    let charName = optName || "Avatar";

    const lore = (window.WALIBI_CHARACTER_LORE || []).find(c => c.id === charIdOrUrl);
    if (lore) {
      avatarUrl = lore.avatar;
      charName = lore.name;
    } else {
      const preset = (window.WALIBI_AVATAR_PRESETS || []).find(p => p.id === charIdOrUrl || p.url === charIdOrUrl);
      if (preset) {
        avatarUrl = preset.url;
        charName = preset.name;
      }
    }

    // 1. Alle Modale schließen
    ["characterLoreModal", "avatarLensLightboxModal", "myProfileModal", "quickMenuModal"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.add("hidden");
    });

    // 2. Falls "Neuer Spieler" Modal offen ist:
    const createModal = document.getElementById("createPlayerModal");
    if (createModal && !createModal.classList.contains("hidden")) {
      this.capturedNewAvatarBase64 = avatarUrl;
      const prev = document.getElementById("newPlayerAvatarPreview");
      if (prev) {
        prev.src = avatarUrl;
        prev.classList.remove("hidden");
      }
      this.renderAvatarPresetGrid("newPlayerAvatarPresetGrid", avatarUrl, null);
      if (window.app && window.app.showToast) {
        window.app.showToast(`✨ Avatar <strong>${charName}</strong> für neuen Spieler gewählt!`);
      }
      return;
    }

    // 3. Aktiven Spieler ermitteln
    let user = window.store && window.store.state ? window.store.state.currentUser : null;
    
    if (!user && window.store && window.store.state && Array.isArray(window.store.state.players)) {
      const activeId = localStorage.getItem("walibi_active_user_id") || localStorage.getItem("walibi_current_user_id");
      if (activeId) {
        user = window.store.state.players.find(p => p.id === activeId);
        if (user) window.store.state.currentUser = user;
      }
      if (!user && this.isAdminUser()) {
        user = window.store.state.players.find(p => p.name.toLowerCase() === "grossek");
        if (user) window.store.state.currentUser = user;
      }
    }

    if (user && user.id) {
      user.avatar = avatarUrl;
      this.capturedEditAvatarBase64 = avatarUrl;

      // Direkt lokal & persistent speichern
      if (window.store) {
        const pIdx = window.store.state.players.findIndex(p => p.id === user.id);
        if (pIdx >= 0) window.store.state.players[pIdx].avatar = avatarUrl;
        window.store.state.currentUser = user;
        window.store.saveLocalState();
        
        // Asynchron an Server senden
        if (window.store.updateProfile) {
          window.store.updateProfile(user.id, { avatar: avatarUrl }).catch(() => {});
        }
      }

      // UI sofort an allen Stellen aktualisieren
      this.updateHeaderProfile();
      const myAvatarPreview = document.getElementById("myProfileAvatarPreview");
      if (myAvatarPreview) myAvatarPreview.src = avatarUrl;
      const headerAvatar = document.getElementById("headerUserAvatar");
      if (headerAvatar) headerAvatar.src = avatarUrl;

      if (window.app) window.app.renderAllViews();

      // Bestätigungs-Meldung
      if (window.app && window.app.showToast) {
        window.app.showToast(`🎉 <strong>Avatar bestätigt!</strong> Du spielst jetzt als <strong>${charName}</strong>!`);
      }
    } else {
      // Wenn noch kein aktiver Spieler existiert: Neuer Spieler Erstellung mit diesem Avatar öffnen!
      this.openCreatePlayerModal(avatarUrl);
      if (window.app && window.app.showToast) {
        window.app.showToast(`✨ Avatar <strong>${charName}</strong> gewählt. Bitte gib noch deinen Spielernamen ein!`);
      }
    }
  },

  // --- 3. ONBOARDING SPIELER-AUSWAHL (NUR BEIM ERSTEN START) ---
  openProfileSelectModal(force = false) {
    const allPlayers = (window.store && window.store.state && window.store.state.players) || [];

    // Falls noch überhaupt keine Spieler existieren, direkt in das Erstellungsformular leiten
    if (allPlayers.length === 0) {
      this.openCreatePlayerModal();
      return;
    }

    const modal = document.getElementById("profileSelectModal");
    if (!modal) return;

    const myModal = document.getElementById("myProfileModal");
    if (myModal) myModal.classList.add("hidden");

    this.renderPlayersList();
    modal.classList.remove("hidden");
  },

  openCreatePlayerModal(preselectedAvatar = null) {
    if (window.GameAudio) window.GameAudio.playClick();
    const selectModal = document.getElementById("profileSelectModal");
    const createModal = document.getElementById("createPlayerModal");
    if (selectModal) selectModal.classList.add("hidden");
    if (createModal) {
      const nameInp = document.getElementById("newPlayerName");
      if (nameInp) nameInp.value = "";
      const houseSelect = document.getElementById("newPlayerHouse");
      if (houseSelect && window.store) {
        houseSelect.innerHTML = (window.store.state.houses || ["Haus 1", "Haus 2", "Haus 3"]).map(h => `<option value="${h}">${h}</option>`).join("");
      }
      this.capturedNewAvatarBase64 = preselectedAvatar || null;
      const prev = document.getElementById("newPlayerAvatarPreview");
      if (prev) {
        if (preselectedAvatar) {
          prev.src = preselectedAvatar;
          prev.classList.remove("hidden");
        } else {
          prev.src = "";
          prev.classList.add("hidden");
        }
      }
      this.renderAvatarPresetGrid("newPlayerAvatarPresetGrid", preselectedAvatar, (url) => {
        this.capturedNewAvatarBase64 = url;
        if (prev) {
          prev.src = url;
          prev.classList.remove("hidden");
        }
      });
      createModal.classList.remove("hidden");
    }
  },

  renderPlayersList() {
    const listContainer = document.getElementById("profilePlayersList");
    const existingSection = document.getElementById("existingPlayersSection");
    if (!listContainer) return;

    const allPlayers = (window.store && window.store.state && window.store.state.players) || [];
    const currentUser = window.store ? window.store.state.currentUser : null;

    if (allPlayers.length === 0) {
      if (existingSection) existingSection.classList.add("hidden");
      listContainer.innerHTML = "";
      return;
    }

    if (existingSection) existingSection.classList.remove("hidden");
    listContainer.innerHTML = allPlayers.map(p => {
      const isMe = currentUser && currentUser.id === p.id;
      const isGrossek = p.name && p.name.toLowerCase() === "grossek";
      return `
        <div class="player-select-card" style="${isMe ? 'border-color: var(--walibi-yellow); background: rgba(255,204,0,0.18);' : ''}">
          <img src="${p.avatar || this.generateDefaultAvatar(p.name)}" class="avatar-img" />
          <div class="player-info">
            <div class="player-name">${p.name} ${isGrossek ? '👑' : ''} ${isMe ? '⭐ (Du)' : ''}</div>
            <div class="player-house-badge">${p.house || 'Haus 1'} • ${p.points || 0} Pkt</div>
          </div>
          <button class="btn-select-player" onclick="ProfileModule.selectPlayer('${p.id}')">
            ${isMe ? 'Aktiv ✅' : 'Wählen 👉'}
          </button>
        </div>
      `;
    }).join("");
  },

  selectPlayer(playerId) {
    const player = window.store.state.players.find(p => p.id === playerId);
    if (!player) return;

    if (window.GameAudio) window.GameAudio.playClick();

    // Wenn der gewählte Spieler nicht Grossek ist -> Admin-Rechte strikt entziehen
    if (player.name.toLowerCase() !== "grossek") {
      this.isAdmin = false;
      localStorage.setItem("walibi_access_code", "6969");
    } else {
      this.isAdmin = true;
      localStorage.setItem("walibi_access_code", "1008");
    }

    window.store.setCurrentUser(player);
    localStorage.setItem("walibi_active_user_id", player.id);
    localStorage.setItem("walibi_current_user_id", player.id);

    const modal = document.getElementById("profileSelectModal");
    if (modal) modal.classList.add("hidden");
    const myModal = document.getElementById("myProfileModal");
    if (myModal) myModal.classList.add("hidden");

    this.updateHeaderProfile();
    if (window.app) window.app.renderAllViews();
    if (window.app && window.app.showToast) {
      window.app.showToast(`👋 Als <strong>${player.name}</strong> aktiv!`);
    }
  },

  setupProfileModals() {
    const editForm = document.getElementById("editProfileForm");
    if (editForm) {
      editForm.onsubmit = async (e) => {
        e.preventDefault();
        const user = window.store ? window.store.state.currentUser : null;

        const nameInp = document.getElementById("editProfileNameInput");
        const houseSelect = document.getElementById("editProfileHouseSelect");
        const newName = nameInp ? nameInp.value.trim() : (user ? user.name : "");
        const newHouse = houseSelect ? houseSelect.value : (user ? user.house : "Haus 1");
        const newAvatar = this.capturedEditAvatarBase64 || (user ? user.avatar : this.generateDefaultAvatar(newName));

        if (!newName) {
          if (window.app && window.app.showToast) {
            window.app.showToast("⚠️ Bitte gib einen gültigen Namen ein!");
          }
          return;
        }

        if (!user) {
          // Falls noch kein Profil aktiv war: Als neuen Spieler anlegen!
          const newPlayer = await window.store.addPlayer(newName, newHouse, newAvatar);
          window.store.setCurrentUser(newPlayer);
          localStorage.setItem("walibi_active_user_id", newPlayer.id);
        } else {
          await window.store.updateProfile(user.id, {
            name: newName,
            house: newHouse,
            avatar: newAvatar
          });
        }

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
        this.openCreatePlayerModal();
      };
    }

    if (btnCloseCreate && createModal) {
      btnCloseCreate.onclick = () => {
        if (window.GameAudio) window.GameAudio.playClick();
        createModal.classList.add("hidden");
        const allPlayers = (window.store && window.store.state && window.store.state.players) || [];
        const regularPlayers = allPlayers.filter(p => p.name.toLowerCase() !== "grossek");
        if (regularPlayers.length > 0 && selectModal) {
          selectModal.classList.remove("hidden");
        }
      };
    }

    if (createForm) {
      createForm.onsubmit = async (e) => {
        e.preventDefault();
        const nameInp = document.getElementById("newPlayerName");
        const houseSelect = document.getElementById("newPlayerHouse");
        const name = nameInp ? nameInp.value.trim() : "";
        const house = houseSelect ? houseSelect.value : "Haus 1";

        if (!name) return;

        const avatar = this.capturedNewAvatarBase64 || this.generateDefaultAvatar(name);
        const newPlayer = await window.store.addPlayer(name, house, avatar);

        const isGrossek = name.toLowerCase() === "grossek";
        this.isAdmin = isGrossek;
        localStorage.setItem("walibi_access_code", isGrossek ? "1008" : "6969");

        window.store.setCurrentUser(newPlayer);
        localStorage.setItem("walibi_active_user_id", newPlayer.id);
        localStorage.setItem("walibi_current_user_id", newPlayer.id);

        if (createModal) createModal.classList.add("hidden");
        if (selectModal) selectModal.classList.add("hidden");

        if (window.GameAudio) window.GameAudio.playReward();
        this.updateHeaderProfile();
        if (window.app) window.app.renderAllViews();
        if (window.app && window.app.showToast) {
          window.app.showToast(`🎉 Spieler <strong>${name}</strong> erfolgreich angelegt!`);
        }
      };
    }

    const camInp = document.getElementById("newPlayerCameraInput");
    const galInp = document.getElementById("newPlayerGalleryInput");
    if (camInp) camInp.onchange = (e) => this.handleNewPlayerPhoto(e);
    if (galInp) galInp.onchange = (e) => this.handleNewPlayerPhoto(e);

    // Klick außerhalb schließt geöffnete Lupen
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".lore-card-avatar-wrap")) {
        document.querySelectorAll(".lore-card-avatar.is-zoomed").forEach(img => img.classList.remove("is-zoomed"));
      }
    });
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
    const statPointsEl = document.getElementById("statMyUserPoints");
    const avatarEl = document.getElementById("headerUserAvatar");
    const adminBtn = document.getElementById("btnAdminPanel");
    const menuAdminBtn = document.getElementById("menuAdminBtn");
    const menuHhBtn = document.getElementById("menuHappyHourBtn");
    const isGrossekAdmin = this.isAdminUser();
    const myProfileAdminBtn = document.getElementById("myProfileAdminBtn");

    // KRONE IM HEADER NUR FÜR ADMIN (GROSSEK) ANZEIGEN
    if (adminBtn) {
      adminBtn.style.display = isGrossekAdmin ? "flex" : "none";
    }
    if (menuAdminBtn) {
      menuAdminBtn.style.display = isGrossekAdmin ? "flex" : "none";
    }
    if (menuHhBtn) {
      menuHhBtn.style.display = isGrossekAdmin ? "flex" : "none";
    }
    if (myProfileAdminBtn) {
      myProfileAdminBtn.style.display = isGrossekAdmin ? "block" : "none";
    }

    // Gast-Aufforderungs-Banner steuern
    const guestBanner = document.getElementById("guestPromptBanner");
    const accessCode = localStorage.getItem("walibi_access_code");
    if (guestBanner) {
      if (!user && !isGrossekAdmin && accessCode === "6969") {
        guestBanner.classList.remove("hidden");
      } else {
        guestBanner.classList.add("hidden");
      }
    }

    if (!user) {
      if (nameEl) nameEl.innerHTML = `<span style="color: var(--walibi-yellow); font-weight: 900;">➕ Name wählen</span>`;
      if (pointsEl) pointsEl.textContent = "0 Pkt";
      if (statPointsEl) statPointsEl.textContent = "0 Pkt";
      if (avatarEl) avatarEl.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='50' fill='%23e11d48'/><text x='50' y='65' font-size='45' text-anchor='middle' fill='%23ffcc00' font-family='sans-serif' font-weight='900'>?</text></svg>";
      return;
    }

    if (nameEl) nameEl.textContent = user.name;
    if (pointsEl) pointsEl.textContent = `${user.points || 0} Pkt`;
    if (statPointsEl) statPointsEl.textContent = `${user.points || 0} Pkt`;
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
    if (!window.store || !window.store.state) return false;

    if (!window.store.state.currentUser) {
      this.ensureCurrentUser();
    }

    if (!window.store.state.currentUser) {
      if (window.app && window.app.showToast) {
        window.app.showToast("⚠️ Bitte erstelle zuerst dein Spieler-Profil oder wähle deinen Namen!");
      }
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
