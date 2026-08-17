/**
 * Walibi Holland Park Guide & Coaster-Counter Nebenquests
 * Mit echten Bild-Illustrationen im Arcade-Hero-Format.
 */

const ParkGuideModule = {
  activeTab: "attractions", // "attractions" | "sidequests"
  activeCategory: "all",

  init() {
    this.setupModal();
  },

  setupModal() {
    const modal = document.getElementById("parkGuideModal");
    const closeBtn = document.getElementById("closeParkGuideModal");
    if (closeBtn && modal) {
      closeBtn.onclick = (e) => {
        e.stopPropagation();
        if (window.GameAudio) window.GameAudio.playClick();
        modal.classList.add("hidden");
      };
      modal.onclick = (e) => {
        if (e.target === modal) {
          if (window.GameAudio) window.GameAudio.playClick();
          modal.classList.add("hidden");
        }
      };
    }
  },

  openModal(defaultTab = "attractions") {
    if (window.GameAudio) window.GameAudio.playClick();
    const modal = document.getElementById("parkGuideModal");
    if (!modal) return;
    this.activeTab = defaultTab;
    this.render();
    modal.classList.remove("hidden");
  },

  switchTab(tab) {
    if (window.GameAudio) window.GameAudio.playClick();
    this.activeTab = tab;
    this.render();
  },

  render() {
    const containers = [
      document.getElementById("parkGuideContent"),
      document.getElementById("view_attractions_content")
    ].filter(Boolean);

    if (containers.length === 0) return;

    const attractions = window.WALIBI_ATTRACTIONS || [];
    const sideQuests = window.SIDE_QUESTS || [];
    const currentUser = window.store ? window.store.state.currentUser : null;
    
    if (currentUser && window.store && window.store.checkAndAutoUnlockSideQuests) {
      window.store.checkAndAutoUnlockSideQuests(currentUser.id);
    }

    const rideCounts = (currentUser && currentUser.rideCounts) || {};
    const completedSideQuests = (currentUser && currentUser.completedSideQuests) || [];

    const isAttractions = this.activeTab === "attractions";
    const isSidequests = this.activeTab === "sidequests";

    // Berechne Gesamtfahrten
    let totalRides = 0;
    Object.values(rideCounts).forEach(c => totalRides += Number(c || 0));

    const isHH = window.store && window.store.isHappyHourActive();
    const multiplier = isHH ? 2 : 1;

    const htmlContent = `
      <div class="subtabs-row" style="margin-bottom: 12px;">
        <button class="subtab-btn ${isAttractions ? 'active' : ''}" onclick="ParkGuideModule.switchTab('attractions')">🎢 Alle ${attractions.length} Attraktionen</button>
        <button class="subtab-btn ${isSidequests ? 'active' : ''}" onclick="ParkGuideModule.switchTab('sidequests')">⭐ Nebenquests (${sideQuests.length})</button>
      </div>

      ${isHH ? `
        <div style="background: linear-gradient(135deg, rgba(255,204,0,0.25), rgba(225,29,72,0.25)); border: 2px solid var(--walibi-yellow); padding: 10px 14px; border-radius: 12px; margin-bottom: 12px; display: flex; align-items: center; gap: 10px; box-shadow: 0 0 15px rgba(255,204,0,0.3);">
          <span style="font-size: 24px;">⚡🎢</span>
          <div>
            <div style="font-size: 13px; font-weight: 900; color: #ffcc00; text-transform: uppercase;">2X Happy Hour aktiv!</div>
            <div style="font-size: 11px; color: #fff; font-weight: 700;">Achterbahn-Fahrten geben jetzt <strong>+10 Punkte</strong> & Nebenquests zählen doppelt!</div>
          </div>
        </div>
      ` : ''}

      <!-- COUNTER SUMMARY BANNER -->
      <div style="display: flex; justify-content: space-between; align-items: center; background: linear-gradient(135deg, rgba(255,204,0,0.2), rgba(225,29,72,0.2)); border: 2px solid var(--walibi-yellow); padding: 8px 12px; border-radius: 12px; margin-bottom: 14px;">
        <span style="font-size: 13px; font-weight: 800; color: #fff;">Gesamt-Fahrten von ${currentUser ? currentUser.name : 'dir'}:</span>
        <span class="points-badge" style="font-size: 15px;">${totalRides} Fahrten (+${5 * multiplier} Pkt/Fahrt)</span>
      </div>

      ${isAttractions ? `
        <div class="attractions-list">
          ${attractions.map(attr => {
            const count = rideCounts[attr.id] || 0;
            const illuUrl = attr.illustration || "assets/walibi_festival_poster_bg.jpg";
            return `
              <div class="attraction-card">
                <!-- HERO IMAGE MIT 190PX WRAPPER -->
                <div class="attr-hero-image-wrap">
                  <img src="${illuUrl}" 
                       alt="${attr.name}" 
                       class="attr-hero-img" 
                       loading="lazy" 
                       onerror="this.src='assets/walibi_festival_poster_bg.jpg'" />
                  
                  ${attr.badge ? `
                    <span class="points-badge" style="position: absolute; top: 10px; left: 10px; z-index: 10; font-size: 11px; padding: 3px 8px; background: var(--gradient-gold); color: #000; font-weight: 900;">
                      ${attr.badge}
                    </span>
                  ` : ''}

                  <!-- FLOATING COUNTER PILL ON HERO IMAGE -->
                  <div class="attr-counter-pill">
                    ${count > 0 ? `
                      <button type="button" class="attr-pill-btn minus-btn" onclick="ParkGuideModule.logRide('${attr.id}', -1)" title="Fahrt abziehen">－</button>
                    ` : ''}
                    <span class="attr-pill-count-text" onclick="ParkGuideModule.logRide('${attr.id}', 1)" title="Tippen zum Zählen">
                      ${count > 0 ? `<strong>${count}x</strong> gefahren` : '0 Fahrten'}
                    </span>
                    <button type="button" class="attr-pill-btn plus-btn" onclick="ParkGuideModule.logRide('${attr.id}', 1)" title="+1 Fahrt zählen">＋</button>
                  </div>
                </div>

                <div style="padding: 14px 16px;">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
                    <div>
                      <h3 style="font-size: 18px; font-weight: 900; color: #fff; line-height: 1.2;">${attr.name}</h3>
                      <span style="font-size: 11px; font-weight: 800; color: var(--walibi-yellow); text-transform: uppercase;">${attr.type}</span>
                    </div>
                    <button type="button" class="btn-primary" style="width: auto; padding: 5px 12px; font-size: 11px; display: flex; align-items: center; gap: 4px; border-radius: var(--radius-full);" onclick="ParkGuideModule.showOnMap('${attr.id}')">
                      🗺️ Map
                    </button>
                  </div>

                  <p class="attr-desc-text">${attr.desc}</p>

                  <!-- SPECS GRID (8 BOXES: 2 REIHEN MIT JE 4 DATEN) -->
                  <div class="attr-specs-grid">
                    <div class="spec-box">
                      <span class="spec-lbl">SPEED:</span>
                      <span class="spec-val">${attr.speed || '-'}</span>
                    </div>
                    <div class="spec-box">
                      <span class="spec-lbl">HÖHE:</span>
                      <span class="spec-val">${attr.height || '-'}</span>
                    </div>
                    <div class="spec-box">
                      <span class="spec-lbl">LÄNGE:</span>
                      <span class="spec-val">${attr.length || '-'}</span>
                    </div>
                    <div class="spec-box">
                      <span class="spec-lbl">INVERSIONEN:</span>
                      <span class="spec-val" style="color: ${attr.inversions ? 'var(--walibi-yellow)' : '#fff'};">${attr.inversions !== undefined ? attr.inversions : '-'}</span>
                    </div>
                    <div class="spec-box">
                      <span class="spec-lbl">G-KRAFT:</span>
                      <span class="spec-val">${attr.gForce || '-'}</span>
                    </div>
                    <div class="spec-box">
                      <span class="spec-lbl">DAUER:</span>
                      <span class="spec-val">${attr.duration || '-'}</span>
                    </div>
                    <div class="spec-box">
                      <span class="spec-lbl">BAUJAHR:</span>
                      <span class="spec-val">${attr.opened || '-'}</span>
                    </div>
                    <div class="spec-box">
                      <span class="spec-lbl">KAPAZITÄT:</span>
                      <span class="spec-val">${attr.capacity || '-'}</span>
                    </div>
                  </div>

                  ${attr.history ? `
                    <div class="attr-history-box">
                      <div class="attr-history-title">📜 Hintergrund & Park-Wissen</div>
                      <div class="attr-history-text">${attr.history}</div>
                    </div>
                  ` : ''}
                </div>
              </div>
            `;
          }).join("")}
        </div>
      ` : `
        <div class="sidequests-list">
          ${sideQuests.map(sq => {
            const status = window.store ? window.store.getSideQuestStatus(sq.id, currentUser) : { isCompleted: false, percent: 0, progressText: "" };
            const isDone = status.isCompleted || completedSideQuests.includes(sq.id);
            const basePts = typeof sq.points === 'number' ? sq.points : 25;
            const displayPts = basePts * multiplier;
            return `
              <div class="sidequest-card ${isDone ? 'completed' : ''}">
                <div style="display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 8px; gap: 8px;">
                  <div>
                    <h4 style="font-size: 16px; font-weight: 900; color: #fff; margin-bottom: 2px;">
                      ${isDone ? '🏆' : '🎯'} ${sq.title}
                    </h4>
                    <p style="font-size: 12px; color: var(--text-muted); font-weight: 600; line-height: 1.35;">${sq.desc}</p>
                  </div>
                  <span class="points-badge ${isHH ? 'happy-hour-glow' : ''}" style="white-space: nowrap;">+${displayPts} Pkt${isHH ? ' ⚡ 2X' : ''}</span>
                </div>

                <!-- LIVE FORTSCHRITTSBALKEN -->
                <div class="sidequest-progress-section" style="margin: 8px 0;">
                  <div class="progress-bar-bg" style="height: 9px; margin-bottom: 4px;">
                    <div class="progress-bar-fill" style="width: ${isDone ? 100 : status.percent}%; ${isDone ? 'background: var(--gradient-green);' : ''}"></div>
                  </div>
                  <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--text-muted); font-weight: 800;">
                    <span>Fortschritt: <strong style="color: ${isDone ? '#34d399' : 'var(--walibi-yellow)'};">${isDone ? 'Ziel erreicht! ✅' : status.progressText}</strong></span>
                    <span><strong>${isDone ? '100%' : `${status.percent}%`}</strong></span>
                  </div>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 6px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
                  ${isDone ? `
                    <span style="font-size: 12px; font-weight: 900; color: #34d399; display: flex; align-items: center; gap: 4px;">
                      ✅ <strong>Gemeistert</strong> (+${displayPts} Pkt)
                    </span>
                    <button type="button" class="btn-secondary" style="padding: 4px 8px; font-size: 10px; border-radius: 6px; background: rgba(255,255,255,0.08); color: var(--text-dim); border: 1px solid rgba(255,255,255,0.15);" onclick="ParkGuideModule.toggleSideQuest('${sq.id}')">
                      Rückgängig
                    </button>
                  ` : `
                    <span style="font-size: 11px; font-weight: 700; color: var(--walibi-yellow);">
                      ⚡ Löst sich automatisch beim Erreichen des Ziels aus!
                    </span>
                    <button type="button" class="btn-primary" style="padding: 6px 12px; font-size: 11px; width: auto; text-transform: uppercase;" onclick="ParkGuideModule.toggleSideQuest('${sq.id}')">
                      Manuell erledigen
                    </button>
                  `}
                </div>
              </div>
            `;
          }).join("")}
        </div>
      `}
    `;

    containers.forEach(c => {
      c.innerHTML = htmlContent;
    });
  },

  showOnMap(attrId) {
    if (window.GameAudio) window.GameAudio.playClick();
    if (window.ParkMapModule) {
      const allPoints = window.WALIBI_MAP_POINTS || [];
      const pt = allPoints.find(p => p.attrId === attrId);
      window.ParkMapModule.openModal(pt ? pt.id : null);
    }
  },

  async logRide(attrId, delta = 1) {
    if (!window.ProfileModule || !window.ProfileModule.requireUser()) return;
    const currentUser = window.store.state.currentUser;
    if (!currentUser) return;

    if (window.GameAudio) window.GameAudio.playCoin();

    const currentCount = Number((currentUser.rideCounts && currentUser.rideCounts[attrId]) || 0);
    const newCount = Math.max(0, currentCount + delta);

    const attractions = window.WALIBI_ATTRACTIONS || [];
    const attr = attractions.find(a => a.id === attrId);
    const attrName = attr ? attr.name : "Achterbahn";

    const multiplier = window.store ? window.store.getPointsMultiplier() : 1;
    const pts = 5 * multiplier;

    if (delta > 0 && window.app && window.app.showToast) {
      window.app.showToast(`🎢 +${pts} Punkte${multiplier > 1 ? ' (⚡ 2X Happy Hour!)' : ''} für deine ${newCount}. Fahrt mit <strong>${attrName}</strong>!`);
    } else if (delta < 0 && window.app && window.app.showToast) {
      window.app.showToast(`↩️ Fahrt mit <strong>${attrName}</strong> angepasst (${newCount}x)`);
    }

    await window.store.logRide(currentUser.id, attrId, delta);
    this.render();
    if (window.ProfileModule) window.ProfileModule.updateHeaderProfile();
    if (window.app) window.app.renderAllViews();
  },

  async toggleSideQuest(sideQuestId) {
    if (!window.ProfileModule || !window.ProfileModule.requireUser()) return;
    const currentUser = window.store.state.currentUser;
    if (!currentUser) return;

    if (!currentUser.completedSideQuests) currentUser.completedSideQuests = [];
    const sideQuests = window.SIDE_QUESTS || [];
    const sq = sideQuests.find(s => s.id === sideQuestId);

    const multiplier = window.store ? window.store.getPointsMultiplier() : 1;
    const basePts = (sq ? sq.points : 20);
    const earnedPts = basePts * multiplier;

    if (!currentUser.completedSideQuests.includes(sideQuestId)) {
      currentUser.completedSideQuests.push(sideQuestId);
      currentUser.points += earnedPts;

      if (window.GameAudio) window.GameAudio.playFanfare();
      if (window.app && window.app.fireConfetti) window.app.fireConfetti();
      if (window.app && window.app.showToast) {
        window.app.showToast(`🎉 Nebenquest gemeistert! +${earnedPts} Punkte${multiplier > 1 ? ' (⚡ 2X Happy Hour!)' : ''} gutgeschrieben!`);
      }
    } else {
      // Toggle off
      currentUser.completedSideQuests = currentUser.completedSideQuests.filter(id => id !== sideQuestId);
      currentUser.points = Math.max(0, currentUser.points - earnedPts);
      if (window.app && window.app.showToast) {
        window.app.showToast(`↩️ Nebenquest zurückgesetzt.`);
      }
    }

    await window.store.updateProfile(currentUser.id, {
      completedSideQuests: currentUser.completedSideQuests,
      points: currentUser.points
    });

    this.render();
    if (window.ProfileModule) window.ProfileModule.updateHeaderProfile();
    if (window.app) window.app.renderAllViews();
  }
};

window.ParkGuideModule = ParkGuideModule;
