/**
 * Zentrale Datenspeicherung und Live-Cloud-Synchronisation (SSE & REST API)
 * "Mr. oder Mrs. Walibi - Sauftour '26 Edition"
 */
class AppStore {
  constructor() {
    this.STORAGE_KEY = "walibi_challenge_app_v1";
    this.BACKUP_KEY = "walibi_persistent_backup_v1";
    this.RESET_KEY = "walibi_last_admin_reset";
    this.USER_KEY = "walibi_active_user_id";
    this.listeners = [];
    this.isRestoringToServer = false;
    this.state = this.loadLocalState();
    this.apiAvailable = false;
    this.initCloudSync();
  }

  // Alias-Methoden zur Abwärtskompatibilität
  saveState() {
    this.saveLocalState();
  }

  getDefaultState() {
    return {
      currentUser: null,
      players: [
        {
          id: "p_1786747056481_o5jo",
          name: "grossek",
          house: "Haus 1",
          avatar: "assets/mascot_fox.jpg",
          points: 0,
          drinksCount: 0,
          completedQuests: [],
          completedSideQuests: [],
          rideCounts: {},
          drinksDetail: { beer: 0, shot: 0, longdrink: 0, joint: 0, water: 0 },
          gutGlaubenCount: 0,
          sympathyPoints: 0,
          sympathyVotesReceived: []
        }
      ],
      houses: ["Haus 1", "Haus 2", "Haus 3"],
      feed: [],
      happyHour: { active: false, endsAt: null, multiplier: 2 },
      sympathyVotes: {},
      gameStatus: { isRunning: true, isEnded: false, startedAt: new Date().toISOString() },
      deletedPlayerIds: [],
      lastResetTimestamp: null,
      rulesAccepted: false,
      quests: window.DEFAULT_QUESTS || [],
      counterItems: window.COUNTER_ITEMS || []
    };
  }

  isHappyHourActive() {
    const hh = this.state.happyHour;
    if (!hh || !hh.active || !hh.endsAt) return false;
    const ends = new Date(hh.endsAt).getTime();
    if (isNaN(ends) || ends <= Date.now()) {
      hh.active = false;
      return false;
    }
    return true;
  }

  getPointsMultiplier() {
    return this.isHappyHourActive() ? 2 : 1;
  }

  async setHappyHour(active, durationMinutes = 60) {
    try {
      const res = await fetch("/api/admin/happy-hour", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: "1008", action: active ? "start" : "stop", durationMinutes })
      });
      if (res.ok) {
        const data = await res.json();
        this.state.happyHour = data.happyHour;
        this.saveLocalState();
        if (window.app) window.app.renderAllViews();
        return data.happyHour;
      }
    } catch(e) {
      console.warn("Happy Hour offline update", e);
    }
  }

  loadLocalState() {
    try {
      let data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) {
        // Redundantes Backup laden, falls Hauptspeicher geleert wurde
        data = localStorage.getItem(this.BACKUP_KEY);
      }
      const savedUserId = localStorage.getItem(this.USER_KEY) || localStorage.getItem("walibi_active_user_id");
      const savedReset = localStorage.getItem(this.RESET_KEY);

      if (data) {
        const parsed = JSON.parse(data);
        if (parsed && typeof parsed === "object") {
          parsed.quests = window.DEFAULT_QUESTS || [];
          parsed.counterItems = window.COUNTER_ITEMS || [];
          if (!Array.isArray(parsed.players) || parsed.players.length === 0) {
            parsed.players = this.getDefaultState().players;
          }
          if (!Array.isArray(parsed.houses)) parsed.houses = ["Haus 1", "Haus 2", "Haus 3"];
          if (!parsed.sympathyVotes || typeof parsed.sympathyVotes !== "object") parsed.sympathyVotes = {};
          if (!Array.isArray(parsed.deletedPlayerIds)) parsed.deletedPlayerIds = [];
          if (savedReset && !parsed.lastResetTimestamp) parsed.lastResetTimestamp = savedReset;

          if (!Array.isArray(parsed.feed)) {
            parsed.feed = [];
          } else {
            parsed.feed = parsed.feed.filter(item => item && item.type !== "drink");
          }

          // Aktiven Benutzer über User-Key wiederherstellen
          if (savedUserId && Array.isArray(parsed.players)) {
            const found = parsed.players.find(p => p.id === savedUserId);
            if (found) {
              parsed.currentUser = found;
            } else {
              parsed.currentUser = null;
              localStorage.removeItem(this.USER_KEY);
              localStorage.removeItem("walibi_active_user_id");
            }
          } else if (parsed.currentUser && Array.isArray(parsed.players)) {
            const found = parsed.players.find(p => p.id === parsed.currentUser.id);
            if (found) {
              parsed.currentUser = found;
              localStorage.setItem(this.USER_KEY, found.id);
              localStorage.setItem("walibi_active_user_id", found.id);
            } else {
              parsed.currentUser = null;
              localStorage.removeItem(this.USER_KEY);
              localStorage.removeItem("walibi_active_user_id");
            }
          } else {
            parsed.currentUser = null;
          }

          return parsed;
        }
      }
    } catch (e) {
      console.error("Fehler beim Laden aus localStorage", e);
    }

    const defaultState = this.getDefaultState();
    return defaultState;
  }

  saveLocalState() {
    try {
      if (this.state.currentUser && this.state.currentUser.id) {
        localStorage.setItem(this.USER_KEY, this.state.currentUser.id);
      }
      if (this.state.lastResetTimestamp) {
        localStorage.setItem(this.RESET_KEY, this.state.lastResetTimestamp);
      }

      // Sicheres Klonen für localStorage: Große Base64-Strings im Feed niemals im 5MB localStorage speichern
      const safeState = { ...this.state };
      if (Array.isArray(safeState.feed)) {
        safeState.feed = safeState.feed.map(item => {
          if (item && item.photo && item.photo.startsWith("data:")) {
            return { ...item, photo: null };
          }
          return item;
        });
      }

      const serialized = JSON.stringify(safeState);
      localStorage.setItem(this.STORAGE_KEY, serialized);
      localStorage.setItem(this.BACKUP_KEY, serialized);
      this.notifyListeners();
    } catch (e) {
      console.warn("Fehler beim Speichern in localStorage", e);
    }
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notifyListeners() {
    for (const l of this.listeners) {
      try {
        l(this.state);
      } catch (err) {
        console.error("Listener error:", err);
      }
    }
  }

  // --- ECHTZEIT LIVE CLOUD-SYNC (SSE & REST) ---
  initCloudSync() {
    this.lastServerFingerprint = "";
    this.fetchServerState();
    this.connectEventSource();

    // Fallback: Regelmäßiges Polling alle 5 Sekunden
    setInterval(() => {
      this.fetchServerState();
    }, 5000);
  }

  getStateFingerprint(db) {
    if (!db) return "";
    try {
      const playersPart = (db.players || []).map(p => `${p.id}:${p.points}:${p.sympathyPoints || 0}:${p.drinksCount}:${(p.completedQuests||[]).length}:${p.gutGlaubenCount||0}:${p.name}:${p.avatar}`).join("|");
      const feedPart = (db.feed || []).map(f => `${f.id}:${(f.comments||[]).length}:${JSON.stringify(f.votes||{})}:${(f.actualPointsAwarded||0)}:${JSON.stringify(f.reactions||{})}:${JSON.stringify(f.witnesses||[])}`).join("|");
      const gameStatus = db.gameStatus || "running";
      const hhPart = JSON.stringify(db.happyHour || {});
      const sympathyPart = JSON.stringify(db.sympathyVotes || {});
      const delPart = (db.deletedPlayerIds || []).join(",");
      const resetPart = db.lastResetTimestamp || "";
      return `${playersPart}###${feedPart}###${gameStatus}###${hhPart}###${sympathyPart}###${delPart}###${resetPart}`;
    } catch(e) {
      return JSON.stringify(db);
    }
  }

  async fetchServerState() {
    try {
      const res = await fetch("/api/state");
      if (res.ok) {
        this.apiAvailable = true;
        const serverDb = await res.json();
        this.mergeServerState(serverDb);
      }
    } catch (e) {
      this.apiAvailable = false;
    }
  }

  connectEventSource() {
    if (typeof EventSource === "undefined") return;

    try {
      const es = new EventSource("/api/events");
      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "INIT" || data.type === "SYNC_STATE") {
            this.mergeServerState(data.state);
          } else if (data.type === "ADMIN_RESET") {
            this.state.lastResetTimestamp = data.lastResetTimestamp;
            if (data.state) {
              this.state.players = data.state.players || [];
              this.state.feed = data.state.feed || [];
              this.state.sympathyVotes = data.state.sympathyVotes || {};
              this.state.happyHour = data.state.happyHour || { active: false, endsAt: null, multiplier: 2 };
              this.state.gameStatus = data.state.gameStatus || { isRunning: true, isEnded: false };
              this.state.deletedPlayerIds = [];
            }
            this.saveLocalState();
            if (window.app) window.app.renderAllViews();
            if (window.app && window.app.showToast) {
              window.app.showToast("🚨 Admin <strong>grossek</strong> hat das Spiel auf Null zurückgesetzt.");
            }
          } else if (data.type === "PLAYER_DELETED") {
            const delId = data.playerId;
            if (!this.state.deletedPlayerIds) this.state.deletedPlayerIds = [];
            if (!this.state.deletedPlayerIds.includes(delId)) this.state.deletedPlayerIds.push(delId);
            this.state.players = this.state.players.filter(p => p.id !== delId);
            this.state.feed = this.state.feed.filter(f => f.userId !== delId);
            this.saveLocalState();
            if (window.app) window.app.renderAllViews();
          } else if (data.type === "ALL_PLAYERS_DELETED") {
            let grossek = this.state.players.find(p => p.name.toLowerCase() === "grossek");
            if (!grossek) grossek = this.getDefaultState().players[0];
            this.state.players = [grossek];
            this.state.feed = [];
            if (Array.isArray(data.deletedPlayerIds)) this.state.deletedPlayerIds = data.deletedPlayerIds;
            this.saveLocalState();
            if (window.app) window.app.renderAllViews();
          } else if (data.type === "HAPPY_HOUR_UPDATE") {
            if (data.happyHour) this.state.happyHour = data.happyHour;
            if (data.state) this.mergeServerState(data.state);
            if (window.app) {
              window.app.updateHappyHourBanner();
              window.app.renderAllViews();
              if (data.happyHour && data.happyHour.active && window.app.fireConfetti) {
                window.app.fireConfetti();
                if (window.GameAudio) window.GameAudio.playFanfare();
              }
            }
            if (window.app && window.app.showToast) {
              if (data.happyHour && data.happyHour.active) {
                window.app.showToast("⚡ 🍻 <strong>2X HAPPY HOUR AKTIV!</strong> Alle Punkte zählen die nächste Stunde doppelt!");
              } else {
                window.app.showToast("⚡ Happy Hour beendet.");
              }
            }
          } else if (data.type === "GAME_ENDED") {
            if (data.state) this.mergeServerState(data.state);
            if (window.SympathyModule) {
              window.SympathyModule.openVoteModal();
            } else if (window.AwardsModule) {
              window.AwardsModule.openCelebrationModal();
            }
          } else if (data.type === "SYMPATHY_VOTES_UPDATED") {
            if (data.state) this.mergeServerState(data.state);
            if (window.app) window.app.renderAllViews();
          } else if (data.type === "GAME_STARTED") {
            if (data.state) this.mergeServerState(data.state);
            if (window.app && window.app.showToast) {
              window.app.showToast("🚀 Das Spiel wurde gestartet / reaktiviert!");
            }
          }
        } catch (err) {}
      };
      es.onerror = () => {
        es.close();
        setTimeout(() => this.connectEventSource(), 4000);
      };
    } catch (e) {}
  }

  // --- AUTOMATISCHES AUTO-HEALING: WIEDERHERSTELLUNG AUF DEM SERVER BEI RESTART ---
  async syncRestoreToServer(playersToRestore, feedToRestore) {
    if (this.isRestoringToServer) return;
    this.isRestoringToServer = true;
    try {
      await fetch("/api/sync/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          players: playersToRestore,
          feed: feedToRestore
        })
      });
    } catch (e) {
      console.warn("Auto-Healing Sync fehlgeschlagen:", e);
    } finally {
      this.isRestoringToServer = false;
    }
  }

  mergeServerState(serverDb) {
    if (!serverDb) return;

    const newFingerprint = this.getStateFingerprint(serverDb);
    if (newFingerprint && newFingerprint === this.lastServerFingerprint) {
      return;
    }
    this.lastServerFingerprint = newFingerprint;

    // 1. Prüfen auf echten Admin-Reset durch grossek
    const serverResetTime = serverDb.lastResetTimestamp ? new Date(serverDb.lastResetTimestamp).getTime() : 0;
    const localResetTime = this.state.lastResetTimestamp ? new Date(this.state.lastResetTimestamp).getTime() : 0;

    if (serverResetTime > 0 && serverResetTime > localResetTime) {
      // Neuerer Admin-Reset vom Server -> Lokalen State auf Server-Reset-Stand bringen
      this.state.lastResetTimestamp = serverDb.lastResetTimestamp;
      this.state.deletedPlayerIds = Array.isArray(serverDb.deletedPlayerIds) ? serverDb.deletedPlayerIds : [];
      
      const playerMap = new Map();
      (serverDb.players || []).forEach(p => {
        if (p && p.id) {
          playerMap.set(p.id, {
            ...p,
            points: 0,
            drinksCount: 0,
            completedQuests: [],
            completedSideQuests: [],
            rideCounts: {},
            drinksDetail: { beer: 0, shot: 0, longdrink: 0, joint: 0, water: 0 },
            gutGlaubenCount: 0,
            sympathyPoints: 0,
            sympathyVotesReceived: []
          });
        }
      });
      (this.state.players || []).forEach(p => {
        if (p && p.id && !playerMap.has(p.id)) {
          playerMap.set(p.id, {
            ...p,
            points: 0,
            drinksCount: 0,
            completedQuests: [],
            completedSideQuests: [],
            rideCounts: {},
            drinksDetail: { beer: 0, shot: 0, longdrink: 0, joint: 0, water: 0 },
            gutGlaubenCount: 0,
            sympathyPoints: 0,
            sympathyVotesReceived: []
          });
        }
      });

      this.state.players = Array.from(playerMap.values());
      this.state.feed = [];
      this.state.sympathyVotes = serverDb.sympathyVotes || {};
      this.state.happyHour = serverDb.happyHour || { active: false, endsAt: null, multiplier: 2 };
      this.state.gameStatus = serverDb.gameStatus || { isRunning: true, isEnded: false };
      this.saveLocalState();
      if (window.app) window.app.renderAllViews();
      if (window.ProfileModule) window.ProfileModule.updateHeaderProfile();
      return;
    }

    // 2. Tombstones (vom Admin grossek gelöschte Spieler) anwenden
    const deletedIds = Array.isArray(serverDb.deletedPlayerIds) ? serverDb.deletedPlayerIds : (this.state.deletedPlayerIds || []);
    this.state.deletedPlayerIds = deletedIds;

    // 3. Intelligenter 2-Wege Merge für Spieler (Schutz vor Datenverlust bei Server-Schlaf / Neustart)
    const playerMap = new Map();

    // Zuerst lokale Spieler einfügen (falls nicht vom Admin gelöscht)
    (this.state.players || []).forEach(p => {
      if (p && p.id && !deletedIds.includes(p.id)) {
        playerMap.set(p.id, { ...p });
      }
    });

    // Server-Spieler einarbeiten
    const serverPlayers = Array.isArray(serverDb.players) ? serverDb.players : [];
    serverPlayers.forEach(sp => {
      if (!sp || !sp.id || deletedIds.includes(sp.id)) return;

      if (playerMap.has(sp.id)) {
        const localP = playerMap.get(sp.id);
        const merged = {
          ...localP,
          ...sp,
          name: sp.name || localP.name,
          avatar: sp.avatar || localP.avatar,
          house: sp.house || localP.house,
          points: Math.max(Number(localP.points) || 0, Number(sp.points) || 0),
          drinksCount: Math.max(Number(localP.drinksCount) || 0, Number(sp.drinksCount) || 0),
          gutGlaubenCount: Math.max(Number(localP.gutGlaubenCount) || 0, Number(sp.gutGlaubenCount) || 0),
          sympathyPoints: Math.max(Number(localP.sympathyPoints) || 0, Number(sp.sympathyPoints) || 0),
          completedQuests: Array.from(new Set([...(localP.completedQuests || []), ...(sp.completedQuests || [])])),
          completedSideQuests: Array.from(new Set([...(localP.completedSideQuests || []), ...(sp.completedSideQuests || [])]))
        };

        // Achterbahn-Fahrten mergen
        merged.rideCounts = { ...(localP.rideCounts || {}) };
        if (sp.rideCounts && typeof sp.rideCounts === 'object') {
          Object.keys(sp.rideCounts).forEach(attrId => {
            merged.rideCounts[attrId] = Math.max(Number(merged.rideCounts[attrId]) || 0, Number(sp.rideCounts[attrId]) || 0);
          });
        }

        // Getränke-Details mergen
        merged.drinksDetail = { ...(localP.drinksDetail || { beer: 0, shot: 0, longdrink: 0, joint: 0, water: 0 }) };
        if (sp.drinksDetail && typeof sp.drinksDetail === 'object') {
          Object.keys(sp.drinksDetail).forEach(itemId => {
            merged.drinksDetail[itemId] = Math.max(Number(merged.drinksDetail[itemId]) || 0, Number(sp.drinksDetail[itemId]) || 0);
          });
        }

        playerMap.set(sp.id, merged);
      } else {
        playerMap.set(sp.id, { ...sp });
      }
    });

    const mergedPlayers = Array.from(playerMap.values());
    if (mergedPlayers.length > 0) {
      this.state.players = mergedPlayers;
    }

    // 4. Intelligenter 2-Wege Merge für den Live-Feed
    const feedMap = new Map();
    const serverFeed = Array.isArray(serverDb.feed) ? serverDb.feed.filter(f => f && f.type !== "drink") : [];
    const localFeed = Array.isArray(this.state.feed) ? this.state.feed.filter(f => f && f.type !== "drink") : [];

    // Alle lokalen Feed-Einträge sammeln (sofern nicht von gelöschten Spielern)
    localFeed.forEach(item => {
      if (item && item.id && !deletedIds.includes(item.userId)) {
        if (!serverResetTime || !item.timestamp || new Date(item.timestamp).getTime() >= serverResetTime) {
          feedMap.set(item.id, item);
        }
      }
    });

    // Server Feed-Einträge mergen
    serverFeed.forEach(item => {
      if (item && item.id && !deletedIds.includes(item.userId)) {
        if (!serverResetTime || !item.timestamp || new Date(item.timestamp).getTime() >= serverResetTime) {
          feedMap.set(item.id, item);
        }
      }
    });

    const mergedFeed = Array.from(feedMap.values()).sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
    this.state.feed = mergedFeed;

    if (Array.isArray(serverDb.houses)) {
      this.state.houses = serverDb.houses;
    }
    if (serverDb.gameStatus) {
      this.state.gameStatus = serverDb.gameStatus;
    }
    if (serverDb.happyHour) {
      this.state.happyHour = serverDb.happyHour;
    }
    if (serverDb.sympathyVotes) {
      this.state.sympathyVotes = serverDb.sympathyVotes;
    }

    // 5. Automatische Wiederherstellung auf Server anstoßen, falls Server nach Sleep/Restart weniger Daten hat als wir
    const serverPlayerIdSet = new Set(serverPlayers.map(p => p.id));
    const isServerMissingPlayers = mergedPlayers.some(p => !serverPlayerIdSet.has(p.id));
    const isServerMissingFeed = mergedFeed.length > serverFeed.length;

    if (isServerMissingPlayers || isServerMissingFeed) {
      this.syncRestoreToServer(mergedPlayers, mergedFeed);
    }

    const activeUserId = localStorage.getItem(this.USER_KEY) || localStorage.getItem("walibi_active_user_id") || localStorage.getItem("walibi_current_user_id") || (this.state.currentUser ? this.state.currentUser.id : null);
    const isAdmin = (window.ProfileModule && window.ProfileModule.isAdminUser && window.ProfileModule.isAdminUser()) || (localStorage.getItem("walibi_access_code") === "1008");

    if (activeUserId) {
      const myUpdated = this.state.players.find(p => p.id === activeUserId);
      if (myUpdated && (isAdmin || myUpdated.name.toLowerCase() !== "grossek")) {
        this.state.currentUser = { ...myUpdated };
        this.checkAndAutoUnlockSideQuests(activeUserId);
      }
    } else if (isAdmin) {
      let grossek = this.state.players.find(p => p.name.toLowerCase() === "grossek");
      if (grossek) {
        this.state.currentUser = { ...grossek };
        localStorage.setItem(this.USER_KEY, grossek.id);
        localStorage.setItem("walibi_active_user_id", grossek.id);
        this.checkAndAutoUnlockSideQuests(grossek.id);
      }
    } else if (this.state.currentUser && (isAdmin || this.state.currentUser.name.toLowerCase() !== "grossek")) {
      const myUpdated = this.state.players.find(p => p.id === this.state.currentUser.id);
      if (myUpdated) {
        this.state.currentUser = { ...myUpdated };
      }
    }

    this.saveLocalState();
    if (window.app) window.app.renderAllViews();
    if (window.ProfileModule) window.ProfileModule.updateHeaderProfile();
  }

  // --- BENUTZER & PROFIL ---
  async setCurrentUser(user) {
    if (!user) {
      this.state.currentUser = null;
      localStorage.removeItem(this.USER_KEY);
      localStorage.removeItem("walibi_active_user_id");
      localStorage.removeItem("walibi_current_user_id");
      this.saveLocalState();
      return;
    }
    this.state.currentUser = { ...user };
    localStorage.setItem(this.USER_KEY, user.id);
    localStorage.setItem("walibi_active_user_id", user.id);
    localStorage.setItem("walibi_current_user_id", user.id);
    this.saveLocalState();
  }

  async updateProfile(userId, updates) {
    const idx = this.state.players.findIndex(p => p.id === userId);
    if (idx >= 0) {
      this.state.players[idx] = { ...this.state.players[idx], ...updates };
    } else {
      this.state.players.push({
        id: userId,
        name: updates.name || "Spieler",
        house: updates.house || "Haus 1",
        avatar: updates.avatar || null,
        points: 0,
        drinksCount: 0,
        completedQuests: [],
        rideCounts: {},
        drinksDetail: { beer: 0, shot: 0, longdrink: 0, joint: 0, water: 0 }
      });
    }

    if (this.state.currentUser && this.state.currentUser.id === userId) {
      const p = this.state.players.find(x => x.id === userId);
      this.state.currentUser = { ...p };
    }

    if (updates.house && !this.state.houses.includes(updates.house)) {
      this.state.houses.push(updates.house);
    }

    // Name & Avatar auch in lokalen Feed-Posts direkt anpassen
    if (Array.isArray(this.state.feed)) {
      this.state.feed.forEach(post => {
        if (post.userId === userId) {
          if (updates.name) post.userName = updates.name;
          if (updates.avatar) post.userAvatar = updates.avatar;
          if (updates.house) post.userHouse = updates.house;
        }
        if (post.comments) {
          post.comments.forEach(c => {
            if (c.userId === userId) {
              if (updates.name) c.userName = updates.name;
              if (updates.avatar) c.userAvatar = updates.avatar;
            }
          });
        }
      });
    }

    this.saveLocalState();

    try {
      const res = await fetch("/api/player/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, ...updates })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.player) {
          const pIdx = this.state.players.findIndex(p => p.id === userId);
          if (pIdx >= 0) {
            this.state.players[pIdx] = {
              ...this.state.players[pIdx],
              ...json.player,
              rideCounts: { ...(json.player.rideCounts || {}), ...(this.state.players[pIdx].rideCounts || {}) },
              points: Math.max(json.player.points || 0, this.state.players[pIdx].points || 0)
            };
          }
          if (this.state.currentUser && this.state.currentUser.id === userId) {
            this.state.currentUser = { ...this.state.players[pIdx] };
          }
          this.saveLocalState();
        }
      }
    } catch (e) {}
  }

  // --- FAHRTEN-ZÄHLER LOGGEN ---
  async logRide(userId, attrId, delta = 1) {
    const player = this.state.players.find(p => p.id === userId);
    if (!player) return;

    if (!player.rideCounts) player.rideCounts = {};
    const currentCount = Number(player.rideCounts[attrId] || 0);
    const newCount = Math.max(0, currentCount + delta);
    player.rideCounts[attrId] = newCount;

    const multiplier = this.getPointsMultiplier();
    const pointsPerRide = 5 * multiplier;

    if (delta > 0) {
      player.points = Number(player.points || 0) + (pointsPerRide * delta);
    } else if (delta < 0 && currentCount > 0) {
      player.points = Math.max(0, Number(player.points || 0) + (pointsPerRide * delta));
    }

    if (this.state.currentUser && this.state.currentUser.id === userId) {
      this.state.currentUser = { ...player };
    }

    this.saveLocalState();
    if (window.app) window.app.renderAllViews();
    if (window.ParkGuideModule) window.ParkGuideModule.render();
    if (window.ProfileModule) window.ProfileModule.updateHeaderProfile();

    try {
      const res = await fetch("/api/attraction/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, attrId, delta })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.player) {
          const idx = this.state.players.findIndex(p => p.id === userId);
          if (idx >= 0) {
            this.state.players[idx] = {
              ...this.state.players[idx],
              ...json.player,
              rideCounts: json.player.rideCounts || player.rideCounts,
              points: Math.max(json.player.points || 0, player.points || 0)
            };
          }
          if (this.state.currentUser && this.state.currentUser.id === userId) {
            this.state.currentUser = { ...this.state.players[idx] };
          }
          this.saveLocalState();
        }
      }
    } catch (e) {
      // Fallback auf updateProfile falls Endpoint noch nicht neu gestartet wurde
      try {
        await fetch("/api/player/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: userId, rideCounts: player.rideCounts, points: player.points })
        });
      } catch(err) {}
    }

    // Nach jeder Fahrt automatisch prüfen, ob Nebenquests freigeschaltet wurden
    this.checkAndAutoUnlockSideQuests(userId);
  }

  // --- NEBENQUESTS STATUS & AUTOMATISCHE FREISCHALTUNG ---
  getSideQuestStatus(sqId, player) {
    if (!player) return { isCompleted: false, isGoalReached: false, current: 0, target: 1, percent: 0, progressText: "0%" };

    const rideCounts = player.rideCounts || {};
    const drinksDetail = player.drinksDetail || {};
    const completedSideQuests = player.completedSideQuests || [];
    const isCompleted = completedSideQuests.includes(sqId);

    const coasterAttrIds = [
      "attr_yoy_chill", "attr_yoy_thrill", "attr_untamed", "attr_goliath",
      "attr_lost_gravity", "attr_xpress", "attr_speed_of_sound", "attr_condor",
      "attr_eat_my_dust", "attr_drako"
    ];

    let totalCoasterRides = 0;
    coasterAttrIds.forEach(id => {
      totalCoasterRides += Number(rideCounts[id] || 0);
    });

    let current = 0;
    let target = 1;
    let progressText = "";

    switch (sqId) {
      // 1. ACHTERBAHN MARATHONS (5, 10, 15, 20)
      case "side_coaster_marathon_5":
        current = totalCoasterRides;
        target = 5;
        progressText = `${Math.min(target, current)} / ${target} Achterbahn-Fahrten`;
        break;

      case "side_coaster_marathon_10":
        current = totalCoasterRides;
        target = 10;
        progressText = `${Math.min(target, current)} / ${target} Achterbahn-Fahrten`;
        break;

      case "side_coaster_marathon_15":
        current = totalCoasterRides;
        target = 15;
        progressText = `${Math.min(target, current)} / ${target} Achterbahn-Fahrten`;
        break;

      case "side_coaster_marathon_20":
        current = totalCoasterRides;
        target = 20;
        progressText = `${Math.min(target, current)} / ${target} Achterbahn-Fahrten`;
        break;

      // 2. 3x FAHRTEN EINZEL-ATTRAKTIONEN
      case "side_untamed_master":
        current = Number(rideCounts["attr_untamed"] || 0);
        target = 3;
        progressText = `${Math.min(target, current)} / ${target} Fahrten`;
        break;

      case "side_goliath_king":
        current = Number(rideCounts["attr_goliath"] || 0);
        target = 3;
        progressText = `${Math.min(target, current)} / ${target} Fahrten`;
        break;

      case "side_condor_3":
        current = Number(rideCounts["attr_condor"] || 0);
        target = 3;
        progressText = `${Math.min(target, current)} / ${target} Fahrten`;
        break;

      case "side_lost_gravity_3":
        current = Number(rideCounts["attr_lost_gravity"] || 0);
        target = 3;
        progressText = `${Math.min(target, current)} / ${target} Fahrten`;
        break;

      case "side_xpress_3":
        current = Number(rideCounts["attr_xpress"] || 0);
        target = 3;
        progressText = `${Math.min(target, current)} / ${target} Fahrten`;
        break;

      case "side_eat_my_dust_3":
        current = Number(rideCounts["attr_eat_my_dust"] || 0);
        target = 3;
        progressText = `${Math.min(target, current)} / ${target} Fahrten`;
        break;

      case "side_yoy_chill_3":
        current = Number(rideCounts["attr_yoy_chill"] || 0);
        target = 3;
        progressText = `${Math.min(target, current)} / ${target} Fahrten`;
        break;

      case "side_yoy_thrill_3":
        current = Number(rideCounts["attr_yoy_thrill"] || 0);
        target = 3;
        progressText = `${Math.min(target, current)} / ${target} Fahrten`;
        break;

      case "side_space_shot_3":
        current = Number(rideCounts["attr_space_shot"] || 0);
        target = 3;
        progressText = `${Math.min(target, current)} / ${target} Fahrten`;
        break;

      case "side_super_swing_3":
        current = Number(rideCounts["attr_super_swing"] || 0);
        target = 3;
        progressText = `${Math.min(target, current)} / ${target} Fahrten`;
        break;

      // 3. KOMBINATIONEN & SPECIALS
      case "side_yoy_duo": {
        const chill = Number(rideCounts["attr_yoy_chill"] || 0);
        const thrill = Number(rideCounts["attr_yoy_thrill"] || 0);
        current = (chill > 0 ? 1 : 0) + (thrill > 0 ? 1 : 0);
        target = 2;
        progressText = `Chill: ${chill > 0 ? '1/1 ✅' : '0/1 ⏳'} • Thrill: ${thrill > 0 ? '1/1 ✅' : '0/1 ⏳'}`;
        break;
      }

      case "side_water_combo": {
        const river = Number(rideCounts["attr_crazy_river"] || 0);
        const rio = Number(rideCounts["attr_el_rio_grande"] || 0);
        const splash = Number(rideCounts["attr_splash_battle"] || 0);
        current = (river > 0 ? 1 : 0) + (rio > 0 ? 1 : 0) + (splash > 0 ? 1 : 0);
        target = 3;
        progressText = `Crazy River: ${river > 0 ? '1/1 ✅' : '0/1 ⏳'} • El Rio: ${rio > 0 ? '1/1 ✅' : '0/1 ⏳'} • Splash Battle: ${splash > 0 ? '1/1 ✅' : '0/1 ⏳'}`;
        break;
      }

      case "side_water_flat_double": {
        const rio = Number(rideCounts["attr_el_rio_grande"] || 0);
        const river = Number(rideCounts["attr_crazy_river"] || 0);
        const gforce = Number(rideCounts["attr_g_force"] || 0);
        const vibe = Number(rideCounts["attr_spinning_vibe"] || 0);
        const blast = Number(rideCounts["attr_blast"] || 0);
        const tomahawk = Number(rideCounts["attr_tomahawk"] || 0);
        current = (rio >= 2 ? 1 : 0) + (river >= 2 ? 1 : 0) + (gforce >= 2 ? 1 : 0) + (vibe >= 2 ? 1 : 0) + (blast >= 2 ? 1 : 0) + (tomahawk >= 2 ? 1 : 0);
        target = 6;
        progressText = `${current} / 6 Attraktionen 2x bezwungen (${rio}/2, ${river}/2, ${gforce}/2, ${vibe}/2, ${blast}/2, ${tomahawk}/2)`;
        break;
      }

      case "side_space_kidz_5":
        current = Number(rideCounts["attr_space_kidz"] || 0);
        target = 5;
        progressText = `${Math.min(target, current)} / ${target} Fahrten`;
        break;

      case "side_all_attractions": {
        const allAttrs = window.WALIBI_ATTRACTIONS || [];
        target = allAttrs.length;
        current = allAttrs.filter(a => Number(rideCounts[a.id] || 0) >= 1).length;
        progressText = `${current} / ${target} verschiedene Attraktionen bezwungen`;
        break;
      }

      // 4. ERWEITERTE PEGEL-MEILENSTEINE
      case "side_beer_king_5":
        current = Number(drinksDetail.beer || 0);
        target = 5;
        progressText = `${Math.min(target, current)} / ${target} Bier`;
        break;

      case "side_beer_king_10":
        current = Number(drinksDetail.beer || 0);
        target = 10;
        progressText = `${Math.min(target, current)} / ${target} Bier`;
        break;

      case "side_beer_king_15":
        current = Number(drinksDetail.beer || 0);
        target = 15;
        progressText = `${Math.min(target, current)} / ${target} Bier`;
        break;

      case "side_shot_duo":
        current = Number(drinksDetail.shot || 0);
        target = 3;
        progressText = `${Math.min(target, current)} / ${target} Shots`;
        break;

      case "side_shot_king_5":
        current = Number(drinksDetail.shot || 0);
        target = 5;
        progressText = `${Math.min(target, current)} / ${target} Shots`;
        break;

      case "side_shot_king_10":
        current = Number(drinksDetail.shot || 0);
        target = 10;
        progressText = `${Math.min(target, current)} / ${target} Shots`;
        break;

      case "side_longdrink_master_5":
        current = Number(drinksDetail.longdrink || 0);
        target = 5;
        progressText = `${Math.min(target, current)} / ${target} Longdrinks`;
        break;

      case "side_longdrink_master_10":
        current = Number(drinksDetail.longdrink || 0);
        target = 10;
        progressText = `${Math.min(target, current)} / ${target} Longdrinks`;
        break;

      case "side_joint_master_5":
        current = Number(drinksDetail.joint || 0);
        target = 5;
        progressText = `${Math.min(target, current)} / ${target} Joints`;
        break;

      case "side_joint_master_10":
        current = Number(drinksDetail.joint || 0);
        target = 10;
        progressText = `${Math.min(target, current)} / ${target} Joints`;
        break;

      case "side_drink_marathon_10":
        current = Number(player.drinksCount || 0);
        target = 10;
        progressText = `${Math.min(target, current)} / ${target} Drinks`;
        break;

      case "side_drink_marathon_15":
        current = Number(player.drinksCount || 0);
        target = 15;
        progressText = `${Math.min(target, current)} / ${target} Drinks`;
        break;

      case "side_drink_marathon_20":
        current = Number(player.drinksCount || 0);
        target = 20;
        progressText = `${Math.min(target, current)} / ${target} Drinks`;
        break;

      case "side_water_hero_5":
        current = Number(drinksDetail.water || 0);
        target = 5;
        progressText = `${Math.min(target, current)} / ${target} Wasser/Softdrinks`;
        break;

      default:
        current = 0;
        target = 1;
        progressText = "0 / 1";
    }

    const percent = Math.min(100, Math.round((current / target) * 100));
    const isGoalReached = current >= target;

    return {
      isCompleted,
      isGoalReached,
      current,
      target,
      percent,
      progressText
    };
  }

  async checkAndAutoUnlockSideQuests(userId) {
    if (this.isCheckingSideQuests) return;
    this.isCheckingSideQuests = true;

    try {
      const player = this.state.players.find(p => p.id === userId);
      if (!player) return;

      const sideQuests = window.SIDE_QUESTS || [];
      let unlockedAny = false;
      const newlyUnlocked = [];

      if (!player.completedSideQuests) player.completedSideQuests = [];

      for (const sq of sideQuests) {
        if (!player.completedSideQuests.includes(sq.id)) {
          const status = this.getSideQuestStatus(sq.id, player);
          if (status.isGoalReached) {
            // 🎉 Automatische Freischaltung!
            const multiplier = this.getPointsMultiplier();
            const basePts = typeof sq.points === 'number' ? sq.points : 25;
            const earnedPts = basePts * multiplier;

            player.completedSideQuests.push(sq.id);
            player.points = Number(player.points || 0) + earnedPts;
            unlockedAny = true;
            newlyUnlocked.push({ ...sq, earnedPts, basePts, multiplier });

            const isCurrent = this.state.currentUser && this.state.currentUser.id === player.id;
            if (isCurrent) {
              if (window.GameAudio) window.GameAudio.playFanfare();
              if (window.app && window.app.fireConfetti) window.app.fireConfetti();
              if (window.app && window.app.showToast) {
                window.app.showToast(`🏆 <strong>Errungenschaft freigeschaltet!</strong><br>${sq.title} (+${earnedPts} Pkt${multiplier > 1 ? ' ⚡ 2X Happy Hour!' : ''})`);
              }
            }
          }
        }
      }

      if (unlockedAny) {
        if (this.state.currentUser && this.state.currentUser.id === player.id) {
          this.state.currentUser = { ...player };
        }

        // Für jede neue Errungenschaft max. 1 Feed-Item anlegen (Strikte Duplikat-Vermeidung)
        for (const sq of newlyUnlocked) {
          const alreadyInFeed = this.state.feed.some(f => f.type === "achievement" && f.userId === player.id && f.achievementId === sq.id);
          if (!alreadyInFeed) {
            const feedItem = {
              id: `feed_achieve_${player.id}_${sq.id}`,
              type: "achievement",
              userId: player.id,
              userName: player.name,
              userAvatar: player.avatar,
              userHouse: player.house,
              achievementId: sq.id,
              achievementTitle: sq.title,
              achievementDesc: sq.desc,
              achievementIcon: sq.icon || "🏆",
              points: sq.earnedPts,
              basePoints: sq.basePts,
              actualPointsAwarded: sq.earnedPts,
              isHappyHour: sq.multiplier > 1,
              timestamp: new Date().toISOString(),
              reactions: { "🔥": [], "🍺": [], "👑": [], "💀": [], "👏": [] },
              comments: []
            };
            this.state.feed.unshift(feedItem);

            // An Server senden
            try {
              fetch("/api/achievement/unlock", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  userId: player.id,
                  achievement: sq,
                  points: sq.earnedPts,
                  basePoints: sq.basePts,
                  feedItem: feedItem
                })
              }).catch(() => {});
            } catch (e) {}
          }
        }

        this.saveLocalState();
        await this.updateProfile(player.id, {
          completedSideQuests: player.completedSideQuests,
          points: player.points
        });
        if (window.app) window.app.renderAllViews();
        if (window.ProfileModule) window.ProfileModule.updateHeaderProfile();
      }
    } finally {
      this.isCheckingSideQuests = false;
    }
  }

  async addPlayer(name, house, avatar) {
    const newPlayer = {
      id: "p_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
      name: name.trim(),
      house: house.trim(),
      avatar: avatar || null,
      points: 0,
      drinksCount: 0,
      completedQuests: [],
      completedSideQuests: [],
      rideCounts: {},
      drinksDetail: { beer: 0, shot: 0, longdrink: 0, joint: 0, water: 0 },
      gutGlaubenCount: 0
    };
    this.state.players.push(newPlayer);
    this.state.currentUser = newPlayer;
    localStorage.setItem(this.USER_KEY, newPlayer.id);
    localStorage.setItem("walibi_active_user_id", newPlayer.id);
    this.saveLocalState();
    await this.updateProfile(newPlayer.id, newPlayer);
    return newPlayer;
  }

  // --- QUEST ABSCHLIESSEN ---
  async completeQuest(userId, questId, photoBase64, customTitle = null, customDesc = null, userComment = "", options = {}) {
    const player = this.state.players.find(p => p.id === userId);
    const quest = (this.state.quests || []).find(q => q.id === questId) || (window.DEFAULT_QUESTS || []).find(q => q.id === questId);
    if (!player || !quest) return null;

    const {
      selectedOutcome = null,
      outcomePoints = quest.points,
      witnessIds = [],
      isFaithBased = false
    } = options;

    let basePoints = typeof outcomePoints === "number" ? outcomePoints : quest.points;
    let calculatedPoints = basePoints;

    if (isFaithBased && basePoints > 0) {
      calculatedPoints = Math.round(basePoints * 0.8); // 20% Ehren-Abzug
      player.gutGlaubenCount = (player.gutGlaubenCount || 0) + 1;
    }

    const multiplier = this.getPointsMultiplier();
    let actualPoints = calculatedPoints > 0 ? (calculatedPoints * multiplier) : calculatedPoints;

    const requiresVoting = quest.requiresVoting === true;
    const hasWitnesses = Array.isArray(witnessIds) && witnessIds.length > 0;
    const requiresWitnessPending = hasWitnesses && (quest.witnessRequirement === "required" || quest.requiresWitness === true);

    const witnesses = hasWitnesses ? witnessIds.map(wId => {
      const p = this.state.players.find(pl => pl.id === wId);
      return {
        userId: wId,
        userName: p ? p.name : "Mitspieler",
        userAvatar: p ? p.avatar : null,
        confirmed: false,
        confirmedAt: null
      };
    }) : [];

    // Sofortige Punktevergabe:
    // Bei Minuspunkten (Malus): sofort abziehen
    // Bei Voting oder wartenden Zeugen: 0 (pending)
    let initialPoints = 0;
    if (actualPoints < 0) {
      initialPoints = actualPoints;
      player.points = Math.max(0, (player.points || 0) + actualPoints);
    } else if (!requiresVoting && !requiresWitnessPending) {
      initialPoints = actualPoints;
      player.points = (player.points || 0) + actualPoints;
    }

    if (!player.completedQuests.includes(questId)) {
      player.completedQuests.push(questId);
    }

    if (this.state.currentUser && this.state.currentUser.id === userId) {
      this.state.currentUser.points = player.points;
      this.state.currentUser.completedQuests = [...player.completedQuests];
      if (player.gutGlaubenCount) this.state.currentUser.gutGlaubenCount = player.gutGlaubenCount;
    }

    // AUTOMATISCHE ACHTERBAHN-ZÄHLUNG FÜR DEN PARK-GUIDE
    if (!player.rideCounts) player.rideCounts = {};
    const questToAttrMap = {
      "coaster_yoy": ["attr_yoy_thrill", "attr_yoy_chill"],
      "coaster_untamed": ["attr_untamed"],
      "coaster_goliath": ["attr_goliath"],
      "coaster_lost_gravity": ["attr_lost_gravity"],
      "coaster_speed_of_sound": ["attr_speed_of_sound"],
      "coaster_condor": ["attr_condor"],
      "coaster_xpress": ["attr_xpress"],
      "water_crazy_river": ["attr_crazy_river"],
      "water_el_rio": ["attr_el_rio_grande"],
      "coaster_speedrun": ["attr_untamed", "attr_goliath", "attr_lost_gravity"]
    };

    const targetAttrs = questToAttrMap[questId];
    if (targetAttrs) {
      targetAttrs.forEach(attrId => {
        player.rideCounts[attrId] = (player.rideCounts[attrId] || 0) + 1;
      });
    }

    let finalTitle = customTitle || quest.title;
    if (selectedOutcome && !customTitle) {
      finalTitle = `${quest.title} • ${selectedOutcome.label}`;
    }

    const payload = {
      userId: userId,
      questId: quest.id,
      questTitle: finalTitle,
      questDescription: customDesc || quest.description,
      questIcon: quest.icon || "🎯",
      points: actualPoints,
      basePoints: basePoints,
      selectedOutcome: selectedOutcome,
      isFaithBased: isFaithBased,
      witnesses: witnesses,
      requiresWitnessPending: requiresWitnessPending,
      requiresVoting: requiresVoting,
      votingLabel: quest.votingLabel,
      photoBase64: photoBase64 || null,
      userComment: userComment || ""
    };

    const isVideo = Boolean(photoBase64 && (photoBase64.startsWith("data:video") || photoBase64.endsWith(".mp4") || photoBase64.endsWith(".webm") || photoBase64.endsWith(".mov") || photoBase64.endsWith(".m4v")));

    const localFeedItem = {
      id: "feed_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
      type: "quest",
      userId: player.id,
      userName: player.name,
      userAvatar: player.avatar,
      userHouse: player.house,
      questId: quest.id,
      questTitle: payload.questTitle,
      questDescription: payload.questDescription,
      questIcon: quest.icon || "🎯",
      points: actualPoints,
      basePoints: basePoints,
      actualPointsAwarded: initialPoints,
      selectedOutcome: selectedOutcome,
      isFaithBased: isFaithBased,
      isHappyHour: multiplier > 1,
      witnesses: witnesses,
      witnessPending: requiresWitnessPending,
      photo: photoBase64 || null,
      isVideo: isVideo,
      userComment: userComment || "",
      timestamp: new Date().toISOString(),
      requiresVoting: requiresVoting,
      votingLabel: quest.votingLabel || "Leistung & Ausführung",
      votes: {},
      votingUnlocked: !requiresVoting && !requiresWitnessPending,
      reactions: { "🔥": [], "🍺": [], "👑": [], "💀": [], "👏": [] },
      comments: userComment ? [{
        id: "cmt_" + Date.now(),
        userId: player.id,
        userName: player.name,
        userAvatar: player.avatar,
        text: userComment,
        timestamp: new Date().toISOString()
      }] : []
    };

    this.state.feed.unshift(localFeedItem);
    this.saveLocalState();

    try {
      const res = await fetch("/api/quest/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.feedItem) {
          const idx = this.state.feed.findIndex(f => f.id === localFeedItem.id);
          if (idx >= 0) this.state.feed[idx] = json.feedItem;
          this.saveLocalState();
        }
      }
    } catch (e) {
      console.warn("Offline gespeichert. Server nicht erreichbar.", e);
    }

    this.checkAndAutoUnlockSideQuests(userId);
    return localFeedItem;
  }

  // --- ZEUGEN-BESTÄTIGUNG DURCH MITSPIELER ---
  async confirmWitness(feedItemId, witnessUserId) {
    const feedItem = this.state.feed.find(f => f.id === feedItemId);
    if (!feedItem || !feedItem.witnesses) return;

    const witness = feedItem.witnesses.find(w => w.userId === witnessUserId);
    if (!witness || witness.confirmed) return;

    witness.confirmed = true;
    witness.confirmedAt = new Date().toISOString();

    // Zeugen-Bedingung erfüllt: Schalte Punkte frei falls kein Voting mehr ansteht
    if (feedItem.witnessPending && !feedItem.requiresVoting) {
      feedItem.witnessPending = false;
      feedItem.actualPointsAwarded = feedItem.points;
      
      const author = this.state.players.find(p => p.id === feedItem.userId);
      if (author) {
        author.points = (author.points || 0) + feedItem.points;
        if (this.state.currentUser && this.state.currentUser.id === author.id) {
          this.state.currentUser.points = author.points;
        }
      }
    }

    this.saveLocalState();
    if (window.app) window.app.renderAllViews();
    if (window.ProfileModule) window.ProfileModule.updateHeaderProfile();
    if (window.GameAudio) window.GameAudio.playFanfare();
    if (window.app && window.app.showToast) {
      window.app.showToast(`👁️ Zeugen-Bestätigung erfolgreich erteilt!`);
    }

    try {
      await fetch("/api/quest/confirm-witness", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedItemId, witnessUserId })
      });
    } catch (e) {
      console.warn("Witness confirmation offline saved", e);
    }
  }

  // --- FREIEN POST / SCHNAPPSCHUSS ERSTELLEN ---
  async createFreePost(userId, text, photoBase64) {
    const player = this.state.players.find(p => p.id === userId);
    if (!player) return null;

    const multiplier = this.getPointsMultiplier();
    const basePoints = photoBase64 ? 10 : 5;
    const points = basePoints * multiplier;
    player.points = (player.points || 0) + points;

    if (this.state.currentUser && this.state.currentUser.id === userId) {
      this.state.currentUser.points = player.points;
    }

    const payload = {
      userId: userId,
      text: text,
      photoBase64: photoBase64 || null
    };

    const isVideo = Boolean(photoBase64 && (photoBase64.startsWith("data:video") || photoBase64.endsWith(".mp4") || photoBase64.endsWith(".webm") || photoBase64.endsWith(".mov") || photoBase64.endsWith(".m4v")));

    const localFeedItem = {
      id: "feed_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
      type: "social",
      userId: player.id,
      userName: player.name,
      userAvatar: player.avatar,
      userHouse: player.house,
      text: text || (isVideo ? "Video geteilt 🎥" : (photoBase64 ? "Schnappschuss geteilt 📸" : "Status geteilt 📝")),
      photo: photoBase64 || null,
      isVideo: isVideo,
      points: points,
      basePoints: basePoints,
      actualPointsAwarded: points,
      isHappyHour: multiplier > 1,
      timestamp: new Date().toISOString(),
      reactions: { "🔥": [], "🍺": [], "👑": [], "💀": [], "👏": [] },
      comments: []
    };

    this.state.feed.unshift(localFeedItem);
    this.saveLocalState();
    if (window.ProfileModule) window.ProfileModule.updateHeaderProfile();

    try {
      const res = await fetch("/api/feed/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.feedItem) {
          const idx = this.state.feed.findIndex(f => f.id === localFeedItem.id);
          if (idx >= 0) this.state.feed[idx] = json.feedItem;
          this.saveLocalState();
        }
      }
    } catch (e) {}

    return localFeedItem;
  }

  // --- SCHNELLZÄHLER / DRINKS LOGGEN ---
  async logCounterItem(userId, itemId) {
    let player = this.state.players.find(p => p.id === userId);
    if (!player && this.state.currentUser && this.state.currentUser.id === userId) {
      player = this.state.currentUser;
      this.state.players.push(player);
    }
    if (!player && this.state.players.length > 0) {
      player = this.state.players[0];
      userId = player.id;
    }
    if (!player) {
      player = {
        id: "p_" + Date.now(),
        name: "Spieler",
        house: "Haus 1",
        avatar: "assets/mascot_fox.jpg",
        points: 0,
        drinksCount: 0,
        completedQuests: [],
        completedSideQuests: [],
        rideCounts: {},
        drinksDetail: { beer: 0, shot: 0, longdrink: 0, joint: 0, water: 0 },
        gutGlaubenCount: 0
      };
      if (!Array.isArray(this.state.players)) this.state.players = [];
      this.state.players.push(player);
      this.state.currentUser = player;
      userId = player.id;
    }

    const item = (this.state.counterItems || window.COUNTER_ITEMS || []).find(i => i.id === itemId) || { id: itemId, name: itemId, points: 5, icon: "🍺" };

    const basePoints = typeof item.points === "number" ? item.points : 5;
    const points = basePoints * this.getPointsMultiplier();
    player.points = Number(player.points || 0) + points;
    player.drinksCount = Number(player.drinksCount || 0) + 1;

    if (!player.drinksDetail) {
      player.drinksDetail = { beer: 0, shot: 0, longdrink: 0, joint: 0, water: 0 };
    }
    player.drinksDetail[itemId] = Number(player.drinksDetail[itemId] || 0) + 1;

    if (this.state.currentUser && (this.state.currentUser.id === userId || this.state.currentUser.id === player.id)) {
      this.state.currentUser.points = player.points;
      this.state.currentUser.drinksCount = player.drinksCount;
      this.state.currentUser.drinksDetail = { ...player.drinksDetail };
    }

    this.saveLocalState();

    // Async Server Sync im Hintergrund ohne UI zu blockieren
    fetch("/api/counter/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: player.id,
        userName: player.name,
        itemId: item.id,
        itemName: item.name,
        itemIcon: item.icon,
        points: basePoints
      })
    }).catch(() => {});

    try {
      this.checkAndAutoUnlockSideQuests(player.id);
    } catch(e) {}
    return null;
  }

  // --- VOTING ---
  async castVote(feedId, voterId, rating) {
    const feedItem = this.state.feed.find(f => f.id === feedId);
    if (!feedItem || !feedItem.requiresVoting) return;

    if (feedItem.userId === voterId) {
      if (window.app && window.app.showToast) {
        window.app.showToast("😉 Du kannst deine eigene Challenge nicht selbst bewerten!");
      }
      return;
    }

    if (!feedItem.votes) feedItem.votes = {};
    feedItem.votes[voterId] = Number(rating);

    const totalPlayers = (this.state.players || []).length;
    const eligibleVoters = Math.max(1, totalPlayers - 1);
    const voteCount = Object.keys(feedItem.votes).length;
    const votePercentage = (voteCount / eligibleVoters) * 100;
    const sumRatings = Object.values(feedItem.votes).reduce((a, b) => a + Number(b), 0);
    const avgRating = sumRatings / voteCount;
    const scoreFactor = avgRating / 5;
    const calculatedPoints = Math.round((feedItem.points || 0) * scoreFactor);
    const player = this.state.players.find(p => p.id === feedItem.userId);

    if (votePercentage >= 60) {
      feedItem.votingUnlocked = true;
      feedItem.votingCompleted = true;
      const previousAwarded = feedItem.actualPointsAwarded || 0;
      const pointDiff = calculatedPoints - previousAwarded;
      if (player) {
        player.points += pointDiff;
      }
      feedItem.actualPointsAwarded = calculatedPoints;
      if (this.state.currentUser && this.state.currentUser.id === feedItem.userId) {
        this.state.currentUser.points = (player ? player.points : calculatedPoints);
      }
    }

    feedItem.avgRating = avgRating.toFixed(1);
    feedItem.voteCount = voteCount;
    feedItem.votePercentage = Math.round(votePercentage);

    this.saveLocalState();
    if (window.app && window.app.showToast) {
      window.app.showToast(`⭐ ${rating} Sterne für <strong>${feedItem.userName}</strong> gewertet!`);
    }

    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedId, voterId, rating: Number(rating) })
      });
      if (res.ok) {
        const json = await res.json();
        const updatedItem = json.feedItem || json.item;
        if (updatedItem) {
          const idx = this.state.feed.findIndex(f => f.id === feedId);
          if (idx >= 0) this.state.feed[idx] = updatedItem;
          this.saveLocalState();
        }
      }
    } catch (e) {}
  }

  async voteFeedItem(feedId, voterId, rating) {
    return this.castVote(feedId, voterId, rating);
  }

  // --- KOMMENTARE & FOTO-ANTWORTEN ---
  async addComment(feedId, userId, text, photoBase64 = null) {
    const feedItem = this.state.feed.find(f => f.id === feedId);
    const player = this.state.players.find(p => p.id === userId);
    if (!feedItem || !player) return;
    if (!text && !photoBase64) return;

    // 2 Punkte für Text-Kommentar, 5 Punkte für Foto-Antwort (2x bei Happy Hour)
    const baseCommentPoints = photoBase64 ? 5 : 2;
    const commentPoints = baseCommentPoints * this.getPointsMultiplier();
    player.points = (player.points || 0) + commentPoints;

    if (this.state.currentUser && this.state.currentUser.id === userId) {
      this.state.currentUser.points = player.points;
    }

    const comment = {
      id: "c_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
      userId: player.id,
      userName: player.name,
      userAvatar: player.avatar,
      text: (text || "").trim(),
      photo: photoBase64 || null,
      points: commentPoints,
      timestamp: new Date().toISOString()
    };

    if (!feedItem.comments) feedItem.comments = [];
    feedItem.comments.push(comment);
    this.saveLocalState();
    if (window.ProfileModule) window.ProfileModule.updateHeaderProfile();

    if (window.app && window.app.showToast) {
      if (photoBase64) {
        window.app.showToast(`📸 +${commentPoints} Punkte für deine Foto-Antwort!`);
      } else {
        window.app.showToast(`💬 +${commentPoints} Punkte für deinen Kommentar!`);
      }
    }

    try {
      const res = await fetch("/api/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedId, userId, text: comment.text, photoBase64 })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.comment && json.comment.photo) {
          comment.photo = json.comment.photo;
          this.saveLocalState();
        }
      }
    } catch (e) {}
  }

  // --- EMOJI REAKTIONEN (+5 PUNKTE FÜR DEN BEITRAGS-AUTOR, 2X BEI HAPPY HOUR) ---
  async toggleReaction(feedId, arg2, arg3) {
    const feedItem = this.state.feed.find(f => f.id === feedId);
    if (!feedItem) return;

    // Flexible Parametererkennung: (feedId, userId, emoji) oder (feedId, emoji, userId)
    const emojiList = ["🔥", "🍺", "👑", "💀", "👏", "🍻", "🎉", "❤️", "👍"];
    let emoji = "";
    let userId = "";

    if (emojiList.includes(arg2)) {
      emoji = arg2;
      userId = arg3;
    } else if (emojiList.includes(arg3)) {
      emoji = arg3;
      userId = arg2;
    } else {
      userId = arg2;
      emoji = arg3;
    }

    if (!emoji || !userId) return;

    if (!feedItem.reactions) feedItem.reactions = {};
    if (!feedItem.reactions[emoji]) feedItem.reactions[emoji] = [];

    const userList = feedItem.reactions[emoji];
    const idx = userList.indexOf(userId);
    const postAuthor = this.state.players.find(p => p.id === feedItem.userId);
    const reactionPoints = 5 * this.getPointsMultiplier();

    if (idx >= 0) {
      // Reaktion zurückziehen: -5 Punkte für den Beitrags-Ersteller
      userList.splice(idx, 1);
      if (postAuthor) {
        postAuthor.points = Math.max(0, (postAuthor.points || 0) - reactionPoints);
        if (this.state.currentUser && this.state.currentUser.id === postAuthor.id) {
          this.state.currentUser.points = postAuthor.points;
        }
      }
    } else {
      // Neue Reaktion: +5 Punkte für den Beitrags-Ersteller
      userList.push(userId);
      if (postAuthor) {
        postAuthor.points = (postAuthor.points || 0) + reactionPoints;
        if (this.state.currentUser && this.state.currentUser.id === postAuthor.id) {
          this.state.currentUser.points = postAuthor.points;
        }
      }
      if (window.app && window.app.showToast) {
        const hhBadge = this.getPointsMultiplier() > 1 ? ' (⚡ 2X Happy Hour!)' : '';
        if (feedItem.userId === userId) {
          window.app.showToast(`${emoji} +${reactionPoints} Punkte für deinen Beitrag!${hhBadge}`);
        } else {
          window.app.showToast(`${emoji} +${reactionPoints} Punkte an <strong>${feedItem.userName}</strong> vergeben!${hhBadge}`);
        }
      }
    }

    this.saveLocalState();
    if (window.ProfileModule) window.ProfileModule.updateHeaderProfile();

    try {
      await fetch("/api/reaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedId, userId, emoji })
      });
    } catch (e) {}
  }

  // --- 💖 SYMPATHIE- & EISBRECHER-VOTES SPEICHERN ---
  async submitSympathyVotes(voterId, votes) {
    if (!this.state.sympathyVotes) this.state.sympathyVotes = {};
    this.state.sympathyVotes[voterId] = votes;

    // Lokale sofortige Neuberechnung für alle Spieler
    this.state.players.forEach(player => {
      const received = [];
      let totalSympathyPts = 0;

      Object.keys(this.state.sympathyVotes).forEach(vid => {
        if (vid === player.id) return; // Eigene Stimme zählt nicht für sich selbst
        const voterObj = this.state.players.find(p => p.id === vid);
        const voterVotes = this.state.sympathyVotes[vid];
        if (voterVotes && voterVotes[player.id]) {
          const voteItem = voterVotes[player.id];
          const rating = Number(voteItem.rating) || 5;
          const pts = typeof voteItem.points === 'number' ? voteItem.points : Math.min(50, Math.max(10, rating * 10));
          totalSympathyPts += pts;
          received.push({
            voterId: vid,
            voterName: voterObj ? voterObj.name : "Mitspieler",
            voterAvatar: voterObj ? voterObj.avatar : null,
            rating: rating,
            points: pts,
            tag: voteItem.tag || null,
            comment: voteItem.comment || null
          });
        }
      });

      const oldSympathyPts = Number(player.sympathyPoints) || 0;
      const diff = totalSympathyPts - oldSympathyPts;

      player.sympathyVotesReceived = received;
      player.sympathyPoints = totalSympathyPts;
      player.points = Math.max(0, (Number(player.points) || 0) + diff);
    });

    this.saveLocalState();
    if (window.app) window.app.renderAllViews();

    // Server-Cloud-Synchronisation
    try {
      const res = await fetch("/api/sympathy/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voterId, votes })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.players) {
          this.state.players = data.players;
          if (data.sympathyVotes) this.state.sympathyVotes = data.sympathyVotes;
          this.saveLocalState();
        }
      }
    } catch(e) {
      console.warn("Sympathy votes offline fallback:", e);
    }
  }

  // --- HILFSMETHODEN ---
  getSortedPlayers() {
    return [...this.state.players].sort((a, b) => b.points - a.points);
  }

  getHouseLeaderboard() {
    const houseScores = {};
    this.state.houses.forEach(h => {
      houseScores[h] = { name: h, totalPoints: 0, playerCount: 0, members: [] };
    });

    this.state.players.forEach(p => {
      const house = p.house || "Ohne Haus";
      if (!houseScores[house]) {
        houseScores[house] = { name: house, totalPoints: 0, playerCount: 0, members: [] };
      }
      houseScores[house].totalPoints += p.points || 0;
      houseScores[house].playerCount += 1;
      houseScores[house].members.push(p);
    });

    return Object.values(houseScores).sort((a, b) => b.totalPoints - a.totalPoints);
  }

  async resetAllData() {
    const isAdmin = (window.ProfileModule && window.ProfileModule.isAdminUser && window.ProfileModule.isAdminUser()) || (localStorage.getItem("walibi_access_code") === "1008");
    if (!isAdmin) {
      alert("❌ Zugriff verweigert! Nur Admin grossek darf das Spiel auf Null zurücksetzen.");
      return;
    }

    if (confirm("⚠️ BIST DU ABSOLUT SICHER, grossek?\n\nDadurch werden ALLE Punkte, Fotos, Getränke und Feed-Einträge auf NULL gesetzt!\n\nAlle registrierten Mitspieler bleiben erhalten.")) {
      try {
        const res = await fetch("/api/admin/reset-game", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: "1008" })
        });
        const data = await res.json();
        if (data.success && data.state) {
          this.state.lastResetTimestamp = data.state.lastResetTimestamp;
          this.state.players = data.state.players;
          this.state.feed = data.state.feed;
          this.state.deletedPlayerIds = [];
          this.saveLocalState();
        }
      } catch (e) {
        console.error("Admin reset error:", e);
      }
      location.reload();
    }
  }
}

window.store = new AppStore();
