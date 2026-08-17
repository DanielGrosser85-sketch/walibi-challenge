/**
 * Schnellzähler-Modul für Getränke, Shots, Joints & Pegel-Tracking
 * Mit 250+ zufälligen Trinksprüchen & Meilenstein-Belohnungen
 */
const CounterModule = {
  init() {
    this.setupCounterFab();
    this.renderCounterModal();
  },

  setupCounterFab() {
    const fab = document.getElementById("quickCounterFab");
    const modal = document.getElementById("counterModal");
    const closeBtn = document.getElementById("closeCounterModal");

    if (fab) {
      fab.addEventListener("click", () => {
        if (window.GameAudio) window.GameAudio.playClick();
        if (modal) modal.classList.remove("hidden");
        this.renderCounterModal();
      });
    }

    if (closeBtn && modal) {
      closeBtn.addEventListener("click", () => {
        if (window.GameAudio) window.GameAudio.playClick();
        modal.classList.add("hidden");
      });
      modal.addEventListener("click", (e) => {
        if (e.target === modal) modal.classList.add("hidden");
      });
    }
  },

  renderCounterModal() {
    const container = document.getElementById("counterGridContainer");
    const summary = document.getElementById("counterUserSummary");
    if (!container) return;

    const items = (window.store && window.store.state && window.store.state.counterItems) || window.COUNTER_ITEMS || [];
    const currentUser = (window.store && window.store.state) ? window.store.state.currentUser : null;
    const details = (currentUser && currentUser.drinksDetail) || { beer: 0, shot: 0, longdrink: 0, joint: 0, water: 0 };
    const total = (currentUser && currentUser.drinksCount) || 0;

    if (summary) {
      summary.innerHTML = currentUser 
        ? `Aktueller Pegelstand für <strong>${currentUser.name}</strong> (${total} gesamt):` 
        : `Wähle ein Getränk zum Buchen:`;
    }

    container.innerHTML = items.map(item => {
      const count = details[item.id] || 0;
      return `
        <div class="counter-item-card" onclick="CounterModule.logItem('${item.id}')" style="border-left-color: ${item.color}; cursor: pointer;">
          <span class="counter-icon">${item.icon}</span>
          <div class="counter-info">
            <div class="counter-name">${item.name}</div>
            <div class="counter-points">+${item.points} Party-Punkte</div>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="drink-count-pill">${count}x</span>
            <button type="button" class="btn-counter-add" style="background: ${item.color}; pointer-events: none;">+1</button>
          </div>
        </div>
      `;
    }).join("");
  },

  async logItem(itemId) {
    if (!window.ProfileModule || !window.ProfileModule.requireUser()) return;

    // Soundeffekte abspielen
    if (window.GameAudio) {
      if (itemId === "water") {
        window.GameAudio.playClick();
      } else {
        window.GameAudio.playDrink();
        setTimeout(() => window.GameAudio.playCoin(), 120);
      }
    }

    const currentUser = window.store && window.store.state ? window.store.state.currentUser : null;
    if (!currentUser) return;

    await window.store.logCounterItem(currentUser.id, itemId);

    // Haptisches Feedback
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    const updatedUser = window.store.state.players.find(p => p.id === currentUser.id) || window.store.state.currentUser;
    const count = (updatedUser && updatedUser.drinksDetail && updatedUser.drinksDetail[itemId]) || 1;

    // Zufälligen Trinkspruch oder Meilenstein ermitteln
    let quote = "";
    if (window.getRandomPartyQuote) {
      quote = window.getRandomPartyQuote(itemId);
    }

    const item = (window.store.state.counterItems || window.COUNTER_ITEMS || []).find(i => i.id === itemId);
    const itemName = item ? item.name.split("/")[0].trim() : "Getränk";

    // Meilenstein-Trigger (z. B. 5., 10., 15. Drink)
    if (count === 5 || count === 10 || count === 15 || count === 20) {
      if (window.GameAudio) window.GameAudio.playFanfare();
      if (window.app && window.app.fireConfetti) window.app.fireConfetti();
      if (window.app && window.app.showToast) {
        window.app.showToast(`🏆 <strong>${count}. ${itemName}!</strong> ${quote}`);
      }
    } else {
      if (window.app && window.app.showToast) {
        window.app.showToast(`${item ? item.icon : '🍺'} <strong>+1 ${itemName}</strong> (#${count}): <em>${quote}</em>`);
      }
    }

    // Ansichten sofort aktualisieren
    this.renderCounterModal();
    if (window.ProfileModule && window.ProfileModule.updateHeaderProfile) {
      window.ProfileModule.updateHeaderProfile();
    }
    if (window.FeedModule) {
      if (window.FeedModule.renderHeaderStats) window.FeedModule.renderHeaderStats();
      if (window.FeedModule.renderPersonalDrinksTracker) window.FeedModule.renderPersonalDrinksTracker();
      if (window.app && window.app.currentTab === "feed") {
        window.FeedModule.renderFeed();
      }
    }
    if (window.app && window.app.renderAllViews) {
      window.app.renderAllViews();
    }
  }
};

window.CounterModule = CounterModule;
