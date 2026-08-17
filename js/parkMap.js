/**
 * WALIBI HOLLAND INTERACTIVE PARK MAP MODULE (BETA)
 * Multi-Touch Pinch-to-Zoom (bis 6.5x Tiefen-Zoom), Mouse Pan & Drag,
 * Dezente/Kompakte Pin-Marker, Zonen-Filter, Suche und Coaster-Counter.
 */

const ParkMapModule = {
  // Viewer State
  scale: 1.1,
  minScale: 0.65,
  maxScale: 6.5, // Extrem weiter & scharfer Rein-Zoom
  translateX: 0,
  translateY: 0,
  isDragging: false,
  startX: 0,
  startY: 0,
  lastDistance: 0,
  showPins: true,
  
  // Filter & Search State
  activeZone: "all",
  activeCategory: "all",
  searchQuery: "",
  selectedPointId: null,

  init() {
    this.setupStandaloneModal();
  },

  setupStandaloneModal() {
    const modal = document.getElementById("parkMapModal");
    const closeBtn = document.getElementById("closeParkMapModal");
    if (closeBtn && modal) {
      closeBtn.onclick = (e) => {
        e.stopPropagation();
        if (window.GameAudio) window.GameAudio.playClick();
        this.closeModal();
      };
      modal.onclick = (e) => {
        if (e.target === modal) {
          if (window.GameAudio) window.GameAudio.playClick();
          this.closeModal();
        }
      };
    }
  },

  openModal(targetPointId = null) {
    if (window.GameAudio) window.GameAudio.playClick();
    const modal = document.getElementById("parkMapModal");
    if (!modal) return;
    modal.classList.remove("hidden");
    
    // Render Modal Map
    const container = document.getElementById("parkMapModalContainer");
    if (container) {
      this.renderInside(container, "modal");
    }

    if (targetPointId) {
      setTimeout(() => {
        this.focusPoint(targetPointId, "modal");
      }, 300);
    }
  },

  closeModal() {
    const modal = document.getElementById("parkMapModal");
    if (modal) modal.classList.add("hidden");
  },

  // Switch filter from UI
  setZoneFilter(zoneId, context = "tab") {
    if (window.GameAudio) window.GameAudio.playClick();
    this.activeZone = zoneId;
    this.render(context);

    // Auto-focus on zone area if specific zone selected (tief & scharf herangezoomt)
    const zoneFoci = {
      "main_street": { x: 74.3, y: 75.0, scale: 2.8 },
      "exotic": { x: 65.5, y: 54.0, scale: 2.8 },
      "speed_zone": { x: 61.0, y: 40.0, scale: 2.6 },
      "speed_offroad": { x: 59.0, y: 38.0, scale: 3.0 },
      "wilderness": { x: 70.0, y: 35.0, scale: 2.8 },
      "zero_zone": { x: 85.0, y: 53.0, scale: 2.8 },
      "play_land": { x: 86.5, y: 60.0, scale: 3.2 },
      "play_ground": { x: 82.5, y: 70.0, scale: 2.8 },
      "yoy": { x: 57.5, y: 64.0, scale: 3.5 }
    };

    if (zoneFoci[zoneId]) {
      const f = zoneFoci[zoneId];
      this.panToPercent(f.x, f.y, f.scale, context);
    } else if (zoneId === "all") {
      this.resetView(context);
    }
  },

  setCategoryFilter(catId, context = "tab") {
    if (window.GameAudio) window.GameAudio.playClick();
    this.activeCategory = catId;
    this.render(context);
  },

  setSearch(query, context = "tab") {
    this.searchQuery = (query || "").trim().toLowerCase();
    this.renderDirectoryOnly(context);
  },

  togglePins(context = "tab") {
    if (window.GameAudio) window.GameAudio.playClick();
    this.showPins = !this.showPins;
    const pinsWrap = document.getElementById(`${context}_map_pins_wrap`);
    const btn = document.getElementById(`${context}_btn_toggle_pins`);
    if (pinsWrap) {
      pinsWrap.style.display = this.showPins ? "block" : "none";
    }
    if (btn) {
      btn.classList.toggle("active", this.showPins);
      btn.innerHTML = this.showPins ? "📍 Pins: AN" : "📍 Pins: AUS";
    }
  },

  // Main Render inside Tab or Modal
  render(context = "tab") {
    const targetId = context === "modal" ? "parkMapModalContainer" : "view_attractions_content";
    const container = document.getElementById(targetId);
    if (!container) return;
    this.renderInside(container, context);
  },

  renderInside(container, context) {
    const zones = window.WALIBI_MAP_ZONES || [];
    const categories = window.WALIBI_MAP_CATEGORIES || [];
    const allPoints = window.WALIBI_MAP_POINTS || [];

    const isTab = context === "tab";

    const html = `
      <div class="park-map-view-wrapper ${context}-mode">
        ${isTab ? `
          <div class="subtabs-row" style="margin-bottom: 12px;">
            <button class="subtab-btn active" onclick="ParkGuideModule.switchTab('map')">🗺️ Park-Map (BETA)</button>
            <button class="subtab-btn" onclick="ParkGuideModule.switchTab('attractions')">🎢 Alle 25 Attraktionen</button>
            <button class="subtab-btn" onclick="ParkGuideModule.switchTab('sidequests')">⭐ Nebenquests</button>
          </div>
        ` : ''}

        <!-- BETA BADGE & HINWEIS -->
        <div class="map-beta-banner">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="map-beta-pill">🧪 BETA</span>
              <span style="font-size: 13px; font-weight: 800; color: #fff;">Walibi Plattegrond '26</span>
            </div>
            <span style="font-size: 11px; color: var(--walibi-yellow); font-weight: 800;">Zoom: bis 6.5x (Doppeltippen)</span>
          </div>
        </div>

        <!-- ZONE FILTER SCROLL -->
        <div class="map-zones-filter-scroll">
          ${zones.map(z => `
            <button class="map-zone-pill-btn ${this.activeZone === z.id ? 'active' : ''}" 
                    style="--zone-color: ${z.color};"
                    onclick="ParkMapModule.setZoneFilter('${z.id}', '${context}')">
              <span>${z.icon}</span>
              <span>${z.name}</span>
            </button>
          `).join("")}
        </div>

        <!-- KATEGORIE FILTER SCROLL -->
        <div class="map-categories-filter-scroll">
          ${categories.map(c => `
            <button class="map-cat-pill-btn ${this.activeCategory === c.id ? 'active' : ''}" 
                    onclick="ParkMapModule.setCategoryFilter('${c.id}', '${context}')">
              <span>${c.icon}</span>
              <span>${c.name}</span>
            </button>
          `).join("")}
        </div>

        <!-- INTERACTIVE MAP VIEWER CONTAINER -->
        <div class="map-canvas-container" id="${context}_map_container">
          
          <!-- FLOATING CONTROLS -->
          <div class="map-floating-controls">
            <button class="map-ctrl-btn" onclick="ParkMapModule.zoomStep(0.55, '${context}')" title="Zoom Heran (＋)">＋</button>
            <button class="map-ctrl-btn" onclick="ParkMapModule.zoomStep(-0.55, '${context}')" title="Zoom Weg (－)">－</button>
            <button class="map-ctrl-btn" onclick="ParkMapModule.resetView('${context}')" title="Ganzes Park-Layout anzeigen">🎯</button>
            <button class="map-ctrl-btn" id="${context}_btn_toggle_pins" onclick="ParkMapModule.togglePins('${context}')" title="Pins ein-/ausblenden" style="font-size: 10px; width: auto; padding: 0 8px;">
              ${this.showPins ? '📍 Pins: AN' : '📍 Pins: AUS'}
            </button>
          </div>

          <!-- MAP TOUCH VIEWPORT -->
          <div class="map-viewport" id="${context}_map_viewport">
            <div class="map-transform-layer" id="${context}_map_layer">
              <img src="assets/walibi_park_map.jpg" alt="Walibi Holland Park Map 2026" class="map-base-image" draggable="false" />
              
              <!-- PINS OVERLAY -->
              <div class="map-pins-overlay" id="${context}_map_pins_wrap" style="display: ${this.showPins ? 'block' : 'none'};">
                ${this.renderPinsHtml(allPoints, context)}
              </div>
            </div>
          </div>

          <!-- MINI COMPASS & WATERMARK -->
          <div class="map-overlay-badge">
            <span>🗺️ Walibi Holland • Doppeltippen = Schneller Zoom</span>
          </div>
        </div>

        <!-- SEARCH BAR FOR ATTRACTIONS & FOOD -->
        <div class="map-search-bar-wrap">
          <input type="text" 
                 id="${context}_mapSearchInput" 
                 class="map-search-input" 
                 placeholder="🔍 Suche nach Goliath, Pizza, Döner, WC, YOY..." 
                 value="${this.searchQuery}"
                 oninput="ParkMapModule.setSearch(this.value, '${context}')" />
          ${this.searchQuery ? `
            <button class="map-search-clear-btn" onclick="ParkMapModule.setSearch('', '${context}'); document.getElementById('${context}_mapSearchInput').value='';">✕</button>
          ` : ''}
        </div>

        <!-- SELECTED POINT QUICK-INFO POPUP SHEET -->
        <div id="${context}_point_detail_card" class="map-poi-detail-card hidden"></div>

        <!-- NUMBERED DIRECTORY LIST (MATCHING MAP NUMBERS 1-43, A-W, SERVICES) -->
        <div class="map-directory-section">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <h3 style="font-size: 15px; font-weight: 900; color: var(--walibi-yellow); text-transform: uppercase;">
              📑 Park-Verzeichnis & Coaster-Counter
            </h3>
            <span id="${context}_points_count" style="font-size: 12px; color: var(--text-muted); font-weight: 700;"></span>
          </div>

          <div id="${context}_directory_list" class="map-directory-grid">
            <!-- Filled dynamically -->
          </div>
        </div>

        <!-- OFFIZIELLE PARK-LEGENDE (EXPANDABLE) -->
        <div class="map-official-legend-card">
          <div class="legend-header" onclick="this.parentElement.classList.toggle('open')">
            <span style="font-size: 14px; font-weight: 900; color: #fff;">📜 Offizielle Symbole & Park-Legende</span>
            <span class="legend-toggle-icon">▼</span>
          </div>
          <div class="legend-content">
            <div class="legend-grid">
              <div class="legend-item"><span class="legend-icon">⚡</span><span><strong>Fast Lane:</strong> Schneller Zugang ohne Anstehen</span></div>
              <div class="legend-item"><span class="legend-icon">🚻</span><span><strong>Toiletten:</strong> Kostenlose WC-Anlagen & Wickelräume</span></div>
              <div class="legend-item"><span class="legend-icon">➕</span><span><strong>EHBO:</strong> Erste Hilfe Station & Defibrillator (AED)</span></div>
              <div class="legend-item"><span class="legend-icon">🎒</span><span><strong>Bagagekluis:</strong> Elektronische Schließfächer</span></div>
              <div class="legend-item"><span class="legend-icon">🏧</span><span><strong>Pinautomaat:</strong> Geldautomat am Parkeingang</span></div>
              <div class="legend-item"><span class="legend-icon">🥤</span><span><strong>Pfandbecher:</strong> Inleverpunten für Mehrwegbecher</span></div>
              <div class="legend-item"><span class="legend-icon">🚬</span><span><strong>Rookzones:</strong> Ausgewiesene Raucherbereiche</span></div>
              <div class="legend-item"><span class="legend-icon">🎮</span><span><strong>Games:</strong> Skill Games & Gewinnspielstände</span></div>
            </div>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;

    // Attach Gestures & Event Listeners
    this.setupGestureEngine(context);
    this.renderDirectoryOnly(context);

    // Initial positioning: Fit nicely
    setTimeout(() => {
      this.resetView(context);
    }, 50);
  },

  renderPinsHtml(allPoints, context) {
    const filtered = this.filterPoints(allPoints);
    const zonesMap = {};
    (window.WALIBI_MAP_ZONES || []).forEach(z => zonesMap[z.id] = z);

    return filtered.map(p => {
      const zone = zonesMap[p.zone] || { color: "#ffcc00" };

      return `
        <div class="map-pin-marker ${p.id === this.selectedPointId ? 'selected pulse' : ''}" 
             id="${context}_pin_${p.id}"
             style="left: ${p.x}%; top: ${p.y}%; --pin-color: ${zone.color};"
             onclick="event.stopPropagation(); ParkMapModule.onPinClick('${p.id}', '${context}')"
             title="#${p.num} ${p.name}">
          <div class="map-pin-bubble">
            <span class="map-pin-num">${p.num}</span>
            ${p.fastLane ? '<span class="map-pin-fastlane">⚡</span>' : ''}
          </div>
          <div class="map-pin-label">${p.name}</div>
        </div>
      `;
    }).join("");
  },

  filterPoints(points) {
    return (points || []).filter(p => {
      // Zone filter
      if (this.activeZone !== "all" && p.zone !== this.activeZone) return false;
      // Category filter
      if (this.activeCategory !== "all" && p.category !== this.activeCategory) return false;
      // Search filter
      if (this.searchQuery) {
        const str = `${p.num} ${p.name} ${p.type || ''} ${p.desc || ''} ${p.zone || ''}`.toLowerCase();
        if (!str.includes(this.searchQuery)) return false;
      }
      return true;
    });
  },

  renderDirectoryOnly(context) {
    const listEl = document.getElementById(`${context}_directory_list`);
    const countEl = document.getElementById(`${context}_points_count`);
    if (!listEl) return;

    const allPoints = window.WALIBI_MAP_POINTS || [];
    const filtered = this.filterPoints(allPoints);
    const zonesMap = {};
    (window.WALIBI_MAP_ZONES || []).forEach(z => zonesMap[z.id] = z);

    const currentUser = window.store ? window.store.state.currentUser : null;
    const rideCounts = (currentUser && currentUser.rideCounts) || {};

    if (countEl) {
      countEl.textContent = `${filtered.length} von ${allPoints.length} Orten`;
    }

    if (filtered.length === 0) {
      listEl.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 24px; color: var(--text-muted); background: rgba(0,0,0,0.3); border-radius: 12px;">
          <div style="font-size: 32px; margin-bottom: 6px;">🔍</div>
          <div style="font-weight: 800; color: #fff;">Keine Treffer gefunden</div>
          <div style="font-size: 12px; margin-top: 4px;">Versuche einen anderen Suchbegriff oder setze die Filter zurück.</div>
          <button class="btn-primary" style="margin-top: 10px; width: auto; padding: 6px 14px; font-size: 12px;" onclick="ParkMapModule.setZoneFilter('all', '${context}'); ParkMapModule.setCategoryFilter('all', '${context}'); ParkMapModule.setSearch('', '${context}');">Filter zurücksetzen</button>
        </div>
      `;
      return;
    }

    listEl.innerHTML = filtered.map(p => {
      const zone = zonesMap[p.zone] || { color: "#ffcc00", name: "Walibi" };
      const hasCounter = !!p.attrId;
      const count = hasCounter ? (rideCounts[p.attrId] || 0) : 0;

      return `
        <div class="map-dir-card ${p.id === this.selectedPointId ? 'highlighted' : ''}" 
             onclick="ParkMapModule.focusPoint('${p.id}', '${context}')">
          <div class="map-dir-top">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="map-dir-num-badge" style="background: ${zone.color}; color: #000;">#${p.num}</span>
              <div>
                <h4 class="map-dir-title">${p.name}</h4>
                <span class="map-dir-zone-tag" style="color: ${zone.color};">${zone.name} • ${p.type}</span>
              </div>
            </div>
            ${p.fastLane ? '<span class="map-dir-fastlane-badge" title="Fast Lane verfügbar">⚡ Fast Lane</span>' : ''}
          </div>

          <p class="map-dir-desc">${p.desc}</p>

          <div class="map-dir-actions">
            <button type="button" class="map-btn-show-map" onclick="event.stopPropagation(); ParkMapModule.focusPoint('${p.id}', '${context}')">
              🗺️ Auf Karte zeigen
            </button>

            ${hasCounter ? `
              <div class="map-ride-counter-pill" onclick="event.stopPropagation();">
                ${count > 0 ? `
                  <button type="button" class="map-counter-btn" onclick="ParkMapModule.logRideFromMap('${p.attrId}', -1, '${context}')">－</button>
                ` : ''}
                <span class="map-counter-val" onclick="ParkMapModule.logRideFromMap('${p.attrId}', 1, '${context}')">${count}x gefahren</span>
                <button type="button" class="map-counter-btn" onclick="ParkMapModule.logRideFromMap('${p.attrId}', 1, '${context}')">＋1</button>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }).join("");
  },

  onPinClick(pointId, context) {
    if (window.GameAudio) window.GameAudio.playClick();
    this.focusPoint(pointId, context);
  },

  focusPoint(pointId, context) {
    this.selectedPointId = pointId;
    const allPoints = window.WALIBI_MAP_POINTS || [];
    const pt = allPoints.find(p => p.id === pointId);
    if (!pt) return;

    // Pan & Zoom directly to point coordinates with deep crisp zoom (3.2x)
    this.panToPercent(pt.x, pt.y, 3.2, context);

    // Highlight Pin
    document.querySelectorAll(`.${context}-mode .map-pin-marker`).forEach(m => m.classList.remove("selected", "pulse"));
    const targetPin = document.getElementById(`${context}_pin_${pt.id}`);
    if (targetPin) {
      targetPin.classList.add("selected", "pulse");
    }

    // Show Detail Card Popup
    this.showPointDetailCard(pt, context);
  },

  showPointDetailCard(pt, context) {
    const card = document.getElementById(`${context}_point_detail_card`);
    if (!card) return;

    const zonesMap = {};
    (window.WALIBI_MAP_ZONES || []).forEach(z => zonesMap[z.id] = z);
    const zone = zonesMap[pt.zone] || { color: "#ffcc00", name: "Walibi" };

    const currentUser = window.store ? window.store.state.currentUser : null;
    const rideCounts = (currentUser && currentUser.rideCounts) || {};
    const count = pt.attrId ? (rideCounts[pt.attrId] || 0) : 0;

    card.innerHTML = `
      <div class="poi-card-content">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="map-dir-num-badge" style="background: ${zone.color}; color: #000; font-size: 15px; padding: 3px 8px;">#${pt.num}</span>
            <div>
              <h3 style="font-size: 17px; font-weight: 900; color: #fff; line-height: 1.2;">${pt.name}</h3>
              <span style="font-size: 11px; font-weight: 800; color: ${zone.color}; text-transform: uppercase;">${zone.name} • ${pt.type}</span>
            </div>
          </div>
          <button class="btn-close-modal" style="position: static; font-size: 14px; width: 28px; height: 28px;" onclick="document.getElementById('${context}_point_detail_card').classList.add('hidden')">✕</button>
        </div>

        <p style="font-size: 12px; color: var(--text-muted); line-height: 1.4; margin-bottom: 10px;">${pt.desc}</p>

        <!-- SPECS ROW IF COASTER -->
        ${pt.speed || pt.height || pt.minHeight ? `
          <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 10px;">
            ${pt.speed ? `<span class="map-spec-pill">🚀 ${pt.speed}</span>` : ''}
            ${pt.height ? `<span class="map-spec-pill">📏 ${pt.height}</span>` : ''}
            ${pt.minHeight ? `<span class="map-spec-pill">🧍 Min: ${pt.minHeight}</span>` : ''}
            ${pt.fastLane ? `<span class="map-spec-pill" style="border-color: var(--walibi-yellow); color: var(--walibi-yellow);">⚡ Fast Lane</span>` : ''}
          </div>
        ` : ''}

        <!-- ACTIONS ROW -->
        <div style="display: flex; gap: 8px; align-items: center;">
          ${pt.attrId ? `
            <div style="display: flex; gap: 6px; align-items: center; flex: 1;">
              ${count > 0 ? `
                <button type="button" class="btn-primary" style="width: 36px; padding: 8px 0; background: #334155;" onclick="ParkMapModule.logRideFromMap('${pt.attrId}', -1, '${context}')">－</button>
              ` : ''}
              <button type="button" class="btn-primary" style="flex: 1; background: var(--gradient-gold); color: #000; font-weight: 900;" onclick="ParkMapModule.logRideFromMap('${pt.attrId}', 1, '${context}')">
                🎢 +1 Fahrt (${count}x)
              </button>
            </div>
          ` : `
            <button type="button" class="btn-primary" style="flex: 1; padding: 8px; font-size: 12px;" onclick="document.getElementById('${context}_point_detail_card').classList.add('hidden')">
              ✅ Verstanden
            </button>
          `}
        </div>
      </div>
    `;

    card.classList.remove("hidden");
  },

  async logRideFromMap(attrId, delta = 1, context = "tab") {
    if (window.ParkGuideModule) {
      await window.ParkGuideModule.logRide(attrId, delta);
      this.renderDirectoryOnly(context);
      
      const allPoints = window.WALIBI_MAP_POINTS || [];
      const pt = allPoints.find(p => p.attrId === attrId);
      if (pt && this.selectedPointId === pt.id) {
        this.showPointDetailCard(pt, context);
      }
    }
  },

  // ==========================================
  // PAN & ZOOM GESTURE ENGINE (GPU-ACCELERATED)
  // ==========================================
  setupGestureEngine(context) {
    const viewport = document.getElementById(`${context}_map_viewport`);
    const layer = document.getElementById(`${context}_map_layer`);
    if (!viewport || !layer) return;

    let isPointerDown = false;
    let startX = 0;
    let startY = 0;
    let startTransX = 0;
    let startTransY = 0;
    let initialDistance = 0;
    let initialScale = 1;
    let lastTap = 0;

    // --- MOUSE WHEEL ZOOM ---
    viewport.onwheel = (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.2 : 0.82;
      const rect = viewport.getBoundingClientRect();
      const cursorX = e.clientX - rect.left;
      const cursorY = e.clientY - rect.top;

      const newScale = Math.min(this.maxScale, Math.max(this.minScale, this.scale * zoomFactor));
      
      // Zoom centered on cursor
      this.translateX = cursorX - (cursorX - this.translateX) * (newScale / this.scale);
      this.translateY = cursorY - (cursorY - this.translateY) * (newScale / this.scale);
      this.scale = newScale;

      this.applyTransform(layer, viewport);
    };

    // --- DOUBLE-CLICK ZOOM (DESKTOP) ---
    viewport.addEventListener("dblclick", (e) => {
      if (e.target.closest("button") || e.target.closest(".map-pin-marker")) return;
      const rect = viewport.getBoundingClientRect();
      const cursorX = e.clientX - rect.left;
      const cursorY = e.clientY - rect.top;
      const nextScale = this.scale < 2.0 ? 3.4 : (this.scale < 4.0 ? 6.0 : 1.1);
      this.zoomToPoint(cursorX, cursorY, nextScale, context);
    });

    // --- DOUBLE-TAP ZOOM (MOBILE) ---
    viewport.addEventListener("touchend", (e) => {
      if (e.target.closest("button") || e.target.closest(".map-pin-marker")) return;
      const currentTime = Date.now();
      const tapLength = currentTime - lastTap;
      if (tapLength < 320 && tapLength > 0 && e.changedTouches && e.changedTouches.length === 1) {
        e.preventDefault();
        const touch = e.changedTouches[0];
        const rect = viewport.getBoundingClientRect();
        const cursorX = touch.clientX - rect.left;
        const cursorY = touch.clientY - rect.top;
        const nextScale = this.scale < 2.0 ? 3.4 : (this.scale < 4.0 ? 6.0 : 1.1);
        this.zoomToPoint(cursorX, cursorY, nextScale, context);
      }
      lastTap = currentTime;
    });

    // --- TOUCH & POINTER EVENTS (DRAG PAN) ---
    viewport.addEventListener("pointerdown", (e) => {
      // Don't drag if clicking buttons or pins
      if (e.target.closest("button") || e.target.closest(".map-pin-marker")) return;

      isPointerDown = true;
      startX = e.clientX;
      startY = e.clientY;
      startTransX = this.translateX;
      startTransY = this.translateY;
      viewport.setPointerCapture(e.pointerId);
    });

    viewport.addEventListener("pointermove", (e) => {
      if (!isPointerDown) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      this.translateX = startTransX + dx;
      this.translateY = startTransY + dy;
      this.applyTransform(layer, viewport);
    });

    const pointerEnd = (e) => {
      if (isPointerDown) {
        isPointerDown = false;
        try { viewport.releasePointerCapture(e.pointerId); } catch(err) {}
      }
    };
    viewport.addEventListener("pointerup", pointerEnd);
    viewport.addEventListener("pointercancel", pointerEnd);

    // Multi-touch Pinch-to-Zoom
    viewport.addEventListener("touchstart", (e) => {
      if (e.touches.length === 2) {
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        initialDistance = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        initialScale = this.scale;
      }
    }, { passive: true });

    viewport.addEventListener("touchmove", (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const currentDistance = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        if (initialDistance > 0) {
          const ratio = currentDistance / initialDistance;
          this.scale = Math.min(this.maxScale, Math.max(this.minScale, initialScale * ratio));
          this.applyTransform(layer, viewport);
        }
      }
    }, { passive: false });
  },

  zoomToPoint(cursorX, cursorY, newScale, context) {
    const viewport = document.getElementById(`${context}_map_viewport`);
    const layer = document.getElementById(`${context}_map_layer`);
    if (!viewport || !layer) return;

    const oldScale = this.scale;
    this.scale = Math.min(this.maxScale, Math.max(this.minScale, newScale));
    this.translateX = cursorX - (cursorX - this.translateX) * (this.scale / oldScale);
    this.translateY = cursorY - (cursorY - this.translateY) * (this.scale / oldScale);

    layer.style.transition = "transform 0.35s cubic-bezier(0.25, 1, 0.5, 1)";
    this.applyTransform(layer, viewport);
    setTimeout(() => { if (layer) layer.style.transition = ""; }, 400);
  },

  zoomStep(delta, context) {
    if (window.GameAudio) window.GameAudio.playClick();
    const viewport = document.getElementById(`${context}_map_viewport`);
    const layer = document.getElementById(`${context}_map_layer`);
    if (!viewport || !layer) return;

    const oldScale = this.scale;
    this.scale = Math.min(this.maxScale, Math.max(this.minScale, this.scale + delta));
    
    // Zoom toward center
    const rect = viewport.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    this.translateX = cx - (cx - this.translateX) * (this.scale / oldScale);
    this.translateY = cy - (cy - this.translateY) * (this.scale / oldScale);

    layer.style.transition = "transform 0.2s ease-out";
    this.applyTransform(layer, viewport);
    setTimeout(() => { if (layer) layer.style.transition = ""; }, 220);
  },

  resetView(context) {
    const viewport = document.getElementById(`${context}_map_viewport`);
    const layer = document.getElementById(`${context}_map_layer`);
    if (!viewport || !layer) return;

    const rect = viewport.getBoundingClientRect();
    this.scale = 1.15;
    this.translateX = -rect.width * 0.32;
    this.translateY = -rect.height * 0.1;

    layer.style.transition = "transform 0.3s ease-out";
    this.applyTransform(layer, viewport);
    setTimeout(() => { if (layer) layer.style.transition = ""; }, 320);
  },

  panToPercent(xPercent, yPercent, targetScale = 3.0, context = "tab") {
    const viewport = document.getElementById(`${context}_map_viewport`);
    const layer = document.getElementById(`${context}_map_layer`);
    if (!viewport || !layer) return;

    const rect = viewport.getBoundingClientRect();
    this.scale = Math.min(this.maxScale, Math.max(this.minScale, targetScale));

    // Image aspect ratio: 1477 x 842 -> mapped to layer size
    const layerW = rect.width * this.scale;
    const layerH = (rect.width * (842 / 1477)) * this.scale;

    const targetXInLayer = layerW * (xPercent / 100);
    const targetYInLayer = layerH * (yPercent / 100);

    this.translateX = (rect.width / 2) - targetXInLayer;
    this.translateY = (rect.height / 2) - targetYInLayer;

    layer.style.transition = "transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)";
    this.applyTransform(layer, viewport);
    setTimeout(() => {
      if (layer) layer.style.transition = "";
    }, 450);
  },

  applyTransform(layer, viewport) {
    if (!layer || !viewport) return;
    layer.style.transform = `translate3d(${this.translateX}px, ${this.translateY}px, 0) scale(${this.scale})`;
  }
};

window.ParkMapModule = ParkMapModule;
