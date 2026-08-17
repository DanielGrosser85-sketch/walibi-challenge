/**
 * Zentrale Datenspeicherung und Live-Cloud-Synchronisation (SSE & REST API)
 * "Mr. oder Mrs. Walibi - Sauftour '26 Edition"
 */
class AppStore {
  constructor() {
    this.STORAGE_KEY = "walibi_challenge_app_v1";
    this.USER_KEY = "walibi_active_user_id";
    this.listeners = [];
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
          id: "p1",
          name: "Alex",
          house: "Haus 1",
          avatar: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='50' fill='%23e11d48'/><text x='50' y='60' font-size='40' text-anchor='middle' fill='white' font-family='sans-serif'>A</text></svg>",
          points: 0,
          drinksCount: 0,
          completedQuests: []
        },
        {
          id: "p2",
          name: "Stefan",
          house: "Haus 2",
          avatar: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='50' fill='%23ec4899'/><text x='50' y='60' font-size='40' text-anchor='middle' fill='white' font-family='sans-serif'>S</text></svg>",
          points: 0,
          drinksCount: 0,
          completedQuests: []
        },
        {
          id: "p3",
          name: "Felix",
          house: "Haus 1",
          avatar: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='50' fill='%2310b981'/><text x='50' y='60' font-size='40' text-anchor='middle' fill='white' font-family='sans-serif'>F</text></svg>",
          points: 0,
          drinksCount: 0,
          completedQuests: []
        },
        {
          id: "p4",
          name: "Laura",
          house: "Haus 2",
          avatar: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='50' fill='%23f59e0b'/><text x='50' y='60' font-size='40' text-anchor='middle' fill='white' font-family='sans-serif'>L</text></svg>",
          points: 0,
          drinksCount: 0,
          completedQuests: []
        }
      ],
      houses: ["Haus 1", "Haus 2", "Haus 3"],
      feed: [],
      rulesAccepted: false,
      quests: window.DEFAULT_QUESTS || [],
      counterItems: window.COUNTER_ITEMS || []
    };
  }

  loadLocalState() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      const savedUserId = localStorage.getItem(this.USER_KEY);

      if (data) {
        const parsed = JSON.parse(data);
        if (parsed && typeof parsed === "object") {
          parsed.quests = window.DEFAULT_QUESTS || [];
          parsed.counterItems = window.COUNTER_ITEMS || [];
          if (!Array.isArray(parsed.players)) parsed.players = this.getDefaultState().players;
          if (!Array.isArray(parsed.houses)) parsed.houses = ["Haus 1", "Haus 2", "Haus 3"];
          if (!Array.isArray(parsed.feed)) parsed.feed = [];

          // Aktiven Benutzer über User-Key wiederherstellen
          if (savedUserId) {
            const found = parsed.players.find(p => p.id === savedUserId);
            if (found) {
              parsed.currentUser = found;
            } else if (parsed.currentUser && parsed.currentUser.id === savedUserId) {
              // parsed.currentUser beibehalten
            } else {
              parsed.currentUser = null;
            }
          } else if (parsed.currentUser && parsed.currentUser.id) {
            localStorage.setItem(this.USER_KEY, parsed.currentUser.id);
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
    const savedUserId = localStorage.getItem(this.USER_KEY);
    if (savedUserId && defaultState.players) {
      defaultState.currentUser = defaultState.players.find(p => p.id === savedUserId) || null;
    }
    return defaultState;
  }

  saveLocalState() {
    try {
      if (this.state.currentUser && this.state.currentUser.id) {
        localStorage.setItem(this.USER_KEY, this.state.currentUser.id);
      }
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.state));
      this.notifyListeners();
    } catch (e) {
      console.error("Fehler beim Speichern in localStorage", e);
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
    this.fetchServerState();
    this.connectEventSource();

    // Fallback: Regelmäßiges Polling alle 5 Sekunden
    setInterval(() => {
      this.fetchServerState();
    }, 5000);
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
          } else if (data.type === "GAME_ENDED") {
            if (data.state) this.mergeServerState(data.state);
            if (window.AwardsModule) window.AwardsModule.openCelebrationModal();
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

  mergeServerState(serverDb) {
    if (!serverDb) return;

    const savedUserId = localStorage.getItem(this.USER_KEY) || (this.state.currentUser ? this.state.currentUser.id : null);

    if (Array.isArray(serverDb.players)) {
      this.state.players = serverDb.players;
    }
    if (Array.isArray(serverDb.houses)) {
      this.state.houses = serverDb.houses;
    }
    if (Array.isArray(serverDb.feed)) {
      this.state.feed = serverDb.feed;
    }
    if (serverDb.gameStatus) {
      this.state.gameStatus = serverDb.gameStatus;
    }

    // Eigenen aktiven Nutzer sicherstellen
    if (savedUserId) {
      const myUpdated = this.state.players.find(p => p.id === savedUserId);
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
      this.saveLocalState();
      return;
    }
    this.state.currentUser = user;
    localStorage.setItem(this.USER_KEY, user.id);
    this.saveLocalState();
    this.updateProfile(user.id, user);
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
            this.state.players[pIdx] = { ...this.state.players[pIdx], ...json.player };
          }
          if (this.state.currentUser && this.state.currentUser.id === userId) {
            this.state.currentUser = { ...this.state.currentUser, ...json.player };
          }
          this.saveLocalState();
        }
      }
    } catch (e) {}
  }

  addPlayer(name, house, avatar) {
    const newPlayer = {
      id: "p_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
      name: name.trim(),
      house: house.trim(),
      avatar: avatar || null,
      points: 0,
      drinksCount: 0,
      completedQuests: []
    };
    this.state.players.push(newPlayer);
    this.saveLocalState();
    this.updateProfile(newPlayer.id, newPlayer);
    return newPlayer;
  }

  // --- QUEST ABSCHLIESSEN ---
  async completeQuest(userId, questId, photoBase64, customTitle = null, customDesc = null, userComment = "") {
    const player = this.state.players.find(p => p.id === userId);
    const quest = this.state.quests.find(q => q.id === questId);
    if (!player || !quest) return null;

    const payload = {
      userId: userId,
      questId: quest.id,
      questTitle: customTitle || quest.title,
      questDescription: customDesc || quest.description,
      questIcon: quest.icon || "🎯",
      points: quest.points,
      requiresVoting: quest.requiresVoting,
      votingLabel: quest.votingLabel,
      photoBase64: photoBase64 || null,
      userComment: userComment || ""
    };

    const requiresVoting = quest.requiresVoting;
    const initialPoints = requiresVoting ? 0 : quest.points;

    if (!player.completedQuests.includes(questId)) {
      player.completedQuests.push(questId);
    }
    if (!requiresVoting) {
      player.points += initialPoints;
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
      points: quest.points,
      actualPointsAwarded: initialPoints,
      photo: photoBase64 || null,
      userComment: userComment || "",
      timestamp: new Date().toISOString(),
      requiresVoting: requiresVoting,
      votingLabel: quest.votingLabel || "Leistung & Ausführung",
      votes: {},
      votingUnlocked: !requiresVoting,
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

    return localFeedItem;
  }

  // --- FREIEN POST / SCHNAPPSCHUSS ERSTELLEN ---
  async createFreePost(userId, text, photoBase64) {
    const player = this.state.players.find(p => p.id === userId);
    if (!player) return null;

    const points = 10;
    player.points += points;

    const payload = {
      userId: userId,
      text: text,
      photoBase64: photoBase64 || null
    };

    const localFeedItem = {
      id: "feed_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
      type: "social",
      userId: player.id,
      userName: player.name,
      userAvatar: player.avatar,
      userHouse: player.house,
      text: text || "Schnappschuss geteilt 📸",
      photo: photoBase64 || null,
      points: points,
      timestamp: new Date().toISOString(),
      reactions: { "🔥": [], "🍺": [], "👑": [], "💀": [], "👏": [] },
      comments: []
    };

    this.state.feed.unshift(localFeedItem);
    this.saveLocalState();

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
    const player = this.state.players.find(p => p.id === userId);
    const item = (this.state.counterItems || window.COUNTER_ITEMS).find(i => i.id === itemId);
    if (!player || !item) return;

    player.points += item.points;
    player.drinksCount = (player.drinksCount || 0) + 1;

    if (!player.drinksDetail) {
      player.drinksDetail = { beer: 0, shot: 0, longdrink: 0, joint: 0, water: 0 };
    }
    player.drinksDetail[itemId] = (player.drinksDetail[itemId] || 0) + 1;

    if (this.state.currentUser && this.state.currentUser.id === userId) {
      this.state.currentUser.points = player.points;
      this.state.currentUser.drinksCount = player.drinksCount;
      this.state.currentUser.drinksDetail = { ...player.drinksDetail };
    }

    const feedItem = {
      id: "feed_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
      type: "drink",
      userId: player.id,
      userName: player.name,
      userAvatar: player.avatar,
      userHouse: player.house,
      itemId: item.id,
      itemName: item.name,
      itemIcon: item.icon,
      points: item.points,
      timestamp: new Date().toISOString(),
      reactions: { "🍻": [], "🔥": [], "💀": [] },
      comments: []
    };

    this.state.feed.unshift(feedItem);
    this.saveLocalState();

    try {
      await fetch("/api/counter/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId,
          itemId: item.id,
          itemName: item.name,
          itemIcon: item.icon,
          points: item.points
        })
      });
    } catch (e) {}

    return feedItem;
  }

  // --- VOTING ---
  async castVote(feedId, voterId, rating) {
    const feedItem = this.state.feed.find(f => f.id === feedId);
    if (!feedItem || !feedItem.requiresVoting) return;

    if (feedItem.userId === voterId) {
      alert("Du kannst deine eigene Challenge nicht selbst bewerten 😉");
      return;
    }

    feedItem.votes[voterId] = rating;
    const totalPlayers = this.state.players.length;
    const eligibleVoters = Math.max(1, totalPlayers - 1);
    const voteCount = Object.keys(feedItem.votes).length;
    const votePercentage = (voteCount / eligibleVoters) * 100;
    const sumRatings = Object.values(feedItem.votes).reduce((a, b) => a + b, 0);
    const avgRating = sumRatings / voteCount;
    const scoreFactor = avgRating / 5;
    const calculatedPoints = Math.round(feedItem.points * scoreFactor);
    const player = this.state.players.find(p => p.id === feedItem.userId);

    if (votePercentage >= 60) {
      feedItem.votingUnlocked = true;
      const previousAwarded = feedItem.actualPointsAwarded || 0;
      const pointDiff = calculatedPoints - previousAwarded;
      if (player) player.points += pointDiff;
      feedItem.actualPointsAwarded = calculatedPoints;
    }

    feedItem.avgRating = avgRating.toFixed(1);
    feedItem.voteCount = voteCount;
    feedItem.votePercentage = Math.round(votePercentage);

    this.saveLocalState();

    try {
      await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedId, voterId, rating })
      });
    } catch (e) {}
  }

  // --- KOMMENTARE ---
  async addComment(feedId, userId, text) {
    const feedItem = this.state.feed.find(f => f.id === feedId);
    const player = this.state.players.find(p => p.id === userId);
    if (!feedItem || !player || !text.trim()) return;

    const comment = {
      id: "c_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
      userId: player.id,
      userName: player.name,
      userAvatar: player.avatar,
      text: text.trim(),
      timestamp: new Date().toISOString()
    };

    if (!feedItem.comments) feedItem.comments = [];
    feedItem.comments.push(comment);
    this.saveLocalState();

    try {
      await fetch("/api/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedId, userId, text })
      });
    } catch (e) {}
  }

  // --- EMOJI REAKTIONEN ---
  async toggleReaction(feedId, userId, emoji) {
    const feedItem = this.state.feed.find(f => f.id === feedId);
    if (!feedItem) return;

    if (!feedItem.reactions) feedItem.reactions = {};
    if (!feedItem.reactions[emoji]) feedItem.reactions[emoji] = [];

    const userList = feedItem.reactions[emoji];
    const idx = userList.indexOf(userId);
    if (idx >= 0) {
      userList.splice(idx, 1);
    } else {
      userList.push(userId);
    }

    this.saveLocalState();

    try {
      await fetch("/api/reaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedId, userId, emoji })
      });
    } catch (e) {}
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
    if (confirm("Möchtest du wirklich das gesamte Spiel und alle Punkte für alle Spieler zurücksetzen?")) {
      this.state = this.getDefaultState();
      this.saveLocalState();
      try {
        await fetch("/api/reset", { method: "POST" });
      } catch (e) {}
      location.reload();
    }
  }
}

window.store = new AppStore();
