/**
 * Walibi Holland Park Guide & Coaster-Counter Nebenquests
 * Mit echten Bild-Illustrationen, ohne störende Emoji-Prefixe vor den Namen
 */

const ParkGuideModule = {
  activeTab: "attractions", // "attractions" | "sidequests"

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

  openModal() {
    if (window.GameAudio) window.GameAudio.playClick();
    const modal = document.getElementById("parkGuideModal");
    if (!modal) return;
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
    const rideCounts = (currentUser && currentUser.rideCounts) || {};
    const completedSideQuests = (currentUser && currentUser.completedSideQuests) || [];

    const isAttractions = this.activeTab === "attractions";

    // Berechne Gesamtfahrten
    let totalRides = 0;
    Object.values(rideCounts).forEach(c => totalRides += c);

    const htmlContent = `
      <div class="subtabs-row" style="margin-bottom: 12px;">
        <button class="subtab-btn ${isAttractions ? 'active' : ''}" onclick="ParkGuideModule.switchTab('attractions')">Alle 25 Attraktionen</button>
        <button class="subtab-btn ${!isAttractions ? 'active' : ''}" onclick="ParkGuideModule.switchTab('sidequests')">Nebenquests & Badges</button>
      </div>

      <!-- COUNTER SUMMARY BANNER -->
      <div style="display: flex; justify-content: space-between; align-items: center; background: linear-gradient(135deg, rgba(255,204,0,0.2), rgba(225,29,72,0.2)); border: 2px solid var(--walibi-yellow); padding: 8px 12px; border-radius: 12px; margin-bottom: 12px;">
        <span style="font-size: 13px; font-weight: 800; color: #fff;">Gesamt-Fahrten von ${currentUser ? currentUser.name : 'dir'}:</span>
        <span class="points-badge" style="font-size: 15px;">${totalRides} Fahrten</span>
      </div>

      ${isAttractions ? `
        <div class="attractions-list">
          ${attractions.map(attr => {
            const count = rideCounts[attr.id] || 0;
            const illuUrl = attr.illustration || "assets/walibi_festival_poster_bg.jpg";
            return `
              <div class="attraction-card">
                <!-- BILD-ILLUSTRATION DES FAHRGESCHÄFTS -->
                <div class="attr-hero-image-wrap">
                  <img src="${illuUrl}" alt="${attr.name}" class="attr-hero-img" loading="lazy" />
                  
                  <!-- OVERLAY BADGE & COUNTER BUTTON -->
                  <div style="position: absolute; bottom: 8px; left: 8px; background: rgba(0,0,0,0.85); backdrop-filter: blur(4px); border: 1.5px solid var(--walibi-yellow); color: var(--walibi-yellow); padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 900; text-transform: uppercase;">
                    ${attr.badge}
                  </div>

                  <div class="attr-counter-pill" onclick="ParkGuideModule.logRide('${attr.id}')" title="+1 Fahrt erfassen" style="position: absolute; bottom: 8px; right: 8px;">
                    <span>${count}x Gefahren</span>
                    <span class="attr-add-btn">+</span>
                  </div>
                </div>

                <div style="padding: 14px;">
                  <div style="margin-bottom: 8px;">
                    <h3 class="attr-name" style="font-size: 22px; margin-bottom: 2px;">${attr.name}</h3>
                    <span class="attr-type" style="font-size: 12px; color: var(--text-muted); font-weight: 800; text-transform: uppercase;">${attr.type}</span>
                  </div>

                  <!-- SPECS GRID -->
                  <div class="attr-specs-grid">
                    <div class="spec-box"><span class="spec-lbl">Speed:</span> <span class="spec-val">${attr.speed}</span></div>
                    <div class="spec-box"><span class="spec-lbl">Höhe:</span> <span class="spec-val">${attr.height}</span></div>
                    <div class="spec-box"><span class="spec-lbl">Länge:</span> <span class="spec-val">${attr.length}</span></div>
                    <div class="spec-box"><span class="spec-lbl">Inversionen:</span> <span class="spec-val">${attr.inversions}</span></div>
                    <div class="spec-box"><span class="spec-lbl">G-Kraft:</span> <span class="spec-val">${attr.gForce}</span></div>
                    <div class="spec-box"><span class="spec-lbl">Dauer:</span> <span class="spec-val">${attr.duration}</span></div>
                    <div class="spec-box"><span class="spec-lbl">Baujahr:</span> <span class="spec-val">${attr.opened}</span></div>
                    <div class="spec-box"><span class="spec-lbl">Kapazität:</span> <span class="spec-val">${attr.capacity}</span></div>
                  </div>

                  <!-- HISTORY & DESC -->
                  <div class="attr-history-box">
                    <div class="attr-history-title">History & Besonderheiten:</div>
                    <p class="attr-history-text">${attr.history}</p>
                    <p class="attr-desc-text">${attr.desc}</p>
                  </div>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      ` : `
        <div class="sidequests-list">
          ${sideQuests.map(sq => {
            const isDone = completedSideQuests.includes(sq.id);
            return `
              <div class="sidequest-card ${isDone ? 'completed' : ''}">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                  <h4 style="font-size: 15px; font-weight: 900; color: #fff;">${sq.title}</h4>
                  <span class="points-badge">+${sq.points} Pkt</span>
                </div>
                <p style="font-size: 12px; color: var(--text-muted); font-weight: 600; margin-bottom: 8px;">${sq.desc}</p>
                <button class="btn-primary" style="padding: 8px 12px; font-size: 13px;" onclick="ParkGuideModule.toggleSideQuest('${sq.id}')">
                  ${isDone ? 'Bereits gemeistert' : 'Als erledigt markieren'}
                </button>
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

  async logRide(attrId) {
    if (!window.ProfileModule || !window.ProfileModule.requireUser()) return;
    const currentUser = window.store.state.currentUser;

    if (window.GameAudio) window.GameAudio.playCoin();

    if (!currentUser.rideCounts) currentUser.rideCounts = {};
    currentUser.rideCounts[attrId] = (currentUser.rideCounts[attrId] || 0) + 1;
    currentUser.points += 5; // 5 Bonus-Punkte pro Fahrt!

    const attractions = window.WALIBI_ATTRACTIONS || [];
    const attr = attractions.find(a => a.id === attrId);
    const attrName = attr ? attr.name : "Achterbahn";

    if (window.app && window.app.showToast) {
      window.app.showToast(`+5 Punkte für deine ${currentUser.rideCounts[attrId]}. Fahrt mit <strong>${attrName}</strong>!`);
    }

    await window.store.updateProfile(currentUser.id, {
      rideCounts: currentUser.rideCounts,
      points: currentUser.points
    });

    this.render();
  },

  async toggleSideQuest(sideQuestId) {
    if (!window.ProfileModule || !window.ProfileModule.requireUser()) return;
    const currentUser = window.store.state.currentUser;

    if (!currentUser.completedSideQuests) currentUser.completedSideQuests = [];
    const sideQuests = window.SIDE_QUESTS || [];
    const sq = sideQuests.find(s => s.id === sideQuestId);

    if (!currentUser.completedSideQuests.includes(sideQuestId)) {
      currentUser.completedSideQuests.push(sideQuestId);
      currentUser.points += (sq ? sq.points : 20);

      if (window.GameAudio) window.GameAudio.playFanfare();
      if (window.app && window.app.fireConfetti) window.app.fireConfetti();
      if (window.app && window.app.showToast) {
        window.app.showToast(`Nebenquest gemeistert! +${sq ? sq.points : 20} Punkte gutgeschrieben!`);
      }
    }

    await window.store.updateProfile(currentUser.id, {
      completedSideQuests: currentUser.completedSideQuests,
      points: currentUser.points
    });

    this.render();
  }
};

window.ParkGuideModule = ParkGuideModule;
