/**
 * Haupt-App-Initialisierung, Sound, Maskottchen-Sprechblasen-Steuerung & Navigation
 * Mr. oder Mrs. Walibi Edition
 */
class MainApp {
  constructor() {
    this.currentTab = "feed";
    this.mascotQuoteIndex = 0;
    this.activeSpeaker = "hard_gaan"; // "hard_gaan" | "kangaroo" | "fox"
  }

  init() {
    this.setupTabNavigation();
    this.setupPhotoViewerModal();
    this.startMascotQuoteRotation();
    this.setSpeakerQuote("hard_gaan", "Freikörper-Fred", "🩱", '"TOO HOT TO HANDLE! Wer Kleidung trägt, hat Angst vor Fahrtwind!"');

    if (window.ProfileModule) window.ProfileModule.init();
    if (window.QuestsModule) window.QuestsModule.init();
    if (window.CounterModule) window.CounterModule.init();
    if (window.FeedModule) window.FeedModule.init();
    if (window.LeaderboardModule) window.LeaderboardModule.init();
    if (window.ParkGuideModule) window.ParkGuideModule.init();
    if (window.AwardsModule) window.AwardsModule.init();

    if (window.store) {
      window.store.subscribe(() => {
        this.renderAllViews();
      });
    }

    console.log("🎢 Mr. oder Mrs. Walibi Challenge App erfolgreich gestartet!");
  }

  setupTabNavigation() {
    const navButtons = document.querySelectorAll(".bottom-nav-btn");
    navButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        if (window.GameAudio) window.GameAudio.playClick();
        const tab = btn.dataset.tab;
        this.switchTab(tab);
      });
    });
  }

  switchTab(tabName) {
    this.currentTab = tabName;

    const navButtons = document.querySelectorAll(".bottom-nav-btn");
    navButtons.forEach(btn => {
      btn.classList.toggle("active", btn.dataset.tab === tabName);
    });

    const views = document.querySelectorAll(".app-view");
    views.forEach(view => {
      view.classList.toggle("active", view.id === `view_${tabName}`);
    });

    if (tabName === "feed" && window.FeedModule) {
      window.FeedModule.renderFeed();
    } else if (tabName === "quests" && window.QuestsModule) {
      window.QuestsModule.renderQuests();
    } else if (tabName === "attractions" && window.ParkGuideModule) {
      window.ParkGuideModule.render();
    } else if (tabName === "leaderboard" && window.LeaderboardModule) {
      window.LeaderboardModule.renderLeaderboard();
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  renderAllViews() {
    if (window.ProfileModule) window.ProfileModule.updateHeaderProfile();
    if (window.FeedModule) {
      window.FeedModule.renderHeaderStats();
      if (this.currentTab === "feed") window.FeedModule.renderFeed();
    }
    if (this.currentTab === "quests" && window.QuestsModule) window.QuestsModule.renderQuests();
    if (this.currentTab === "attractions" && window.ParkGuideModule) window.ParkGuideModule.render();
    if (this.currentTab === "leaderboard" && window.LeaderboardModule) window.LeaderboardModule.renderLeaderboard();
  }

  setupPhotoViewerModal() {
    const modal = document.getElementById("photoViewerModal");
    const closeBtn = document.getElementById("closePhotoViewer");
    if (modal && closeBtn) {
      closeBtn.addEventListener("click", () => modal.classList.add("hidden"));
      modal.addEventListener("click", (e) => {
        if (e.target === modal) modal.classList.add("hidden");
      });
    }
  }

  showToast(message) {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = "toast-message";
    toast.innerHTML = message;
    container.appendChild(toast);

    // Verlängerte Anzeigedauer (6,5 Sekunden) damit Sprüche & Infos bequem gelesen werden können
    setTimeout(() => {
      toast.classList.add("fade-out");
      setTimeout(() => toast.remove(), 300);
    }, 6500);
  }

  // --- STRIKT ABWECHSELNDE MASKOTTCHEN SPRÜCHE ROTATION (1x FRED -> 1x WALIBI -> 1x GROSSER) ---
  startMascotQuoteRotation() {
    const quotes = [
      // RUNDE 1
      { speaker: "hard_gaan", name: "Freikörper-Fred", icon: "🩱", text: '"TOO HOT TO HANDLE! Wer Kleidung trägt, hat Angst vor Fahrtwind!"' },
      { speaker: "kangaroo", name: "Monsieur Walibi", icon: "🦘", text: '"Pics or it didn\'t happen! Erst Untamed First Drop, dann Dosenbier & Grillfleisch!"' },
      { speaker: "fox", name: "Großer (Spaß-Diktator)", icon: "🧢", text: '"Bis zum Delirium und wieder zurück! Samstag im Walibi gehört uns!"' },

      // RUNDE 2
      { speaker: "hard_gaan", name: "Freikörper-Fred", icon: "🩱", text: '"Sonnenbrille bleibt auch im Looping auf! Style vor Sicherheit!"' },
      { speaker: "kangaroo", name: "Monsieur Walibi", icon: "🦘", text: '"Mein Känguru-Beutel ist heute exklusiv reserviert für Dosenbier!"' },
      { speaker: "fox", name: "Großer (Spaß-Diktator)", icon: "🧢", text: '"Fuchsohren aufgestellt: Ich höre ein kühles Bier zischen!"' },

      // RUNDE 3
      { speaker: "hard_gaan", name: "Freikörper-Fred", icon: "🩱", text: '"Wasserpistole mit Sambuca geladen! Wer will einen Treffer?!"' },
      { speaker: "kangaroo", name: "Monsieur Walibi", icon: "🦘", text: '"Wer auf der Achterbahn schreit, muss beim Grillen die Kohle anpusten!"' },
      { speaker: "fox", name: "Großer (Spaß-Diktator)", icon: "🧢", text: '"Als Tour-Captain & Spaß-Diktator befehle ich: Niemand verlässt den Park nüchtern!"' },

      // RUNDE 4
      { speaker: "hard_gaan", name: "Freikörper-Fred", icon: "🩱", text: '"Ich schwitze nicht, mein Körper weint vor geiler Vorfreude auf Goliath!"' },
      { speaker: "kangaroo", name: "Monsieur Walibi", icon: "🦘", text: '"Ein Hüpfer für mich, ein riesiger Shot für die ganze Gruppe!"' },
      { speaker: "fox", name: "Großer (Spaß-Diktator)", icon: "🧢", text: '"In Extremo laut aufdrehen und ab in den Looping!"' },

      // RUNDE 5
      { speaker: "hard_gaan", name: "Freikörper-Fred", icon: "🩱", text: '"Hard Gaan ist keine Option, Hard Gaan ist Pflicht!"' },
      { speaker: "kangaroo", name: "Monsieur Walibi", icon: "🦘", text: '"Wer nicht jubelt, kriegt Karma-Minus auf dem Party-Konto!"' },
      { speaker: "fox", name: "Großer (Spaß-Diktator)", icon: "🧢", text: '"Mein Zeitplan ist Gesetz: Frühstücken, Coaster ballern, Grillen, Abriss!"' }
    ];

    // Angenehme Rotationsdauer (9,0 Sekunden)
    setInterval(() => {
      this.mascotQuoteIndex = (this.mascotQuoteIndex + 1) % quotes.length;
      const q = quotes[this.mascotQuoteIndex];
      this.setSpeakerQuote(q.speaker, q.name, q.icon, q.text);
    }, 9000);
  }

  setSpeakerQuote(speakerType, name, icon, text) {
    this.activeSpeaker = speakerType;
    const bubble = document.getElementById("mascotSpeechBubble");
    const quoteEl = document.getElementById("mascotDynamicQuote");
    
    // Pfeil-Klasse anpassen (arrow-left / arrow-center / arrow-right)
    if (bubble) {
      bubble.classList.remove("arrow-left", "arrow-center", "arrow-right");
      if (speakerType === "hard_gaan") bubble.classList.add("arrow-left");
      else if (speakerType === "kangaroo") bubble.classList.add("arrow-center");
      else if (speakerType === "fox") bubble.classList.add("arrow-right");
    }

    // Aktiven Avatar hervorheben
    document.querySelectorAll(".mascot-interactive-avatar").forEach(av => {
      av.classList.remove("active-speaker");
    });
    const activeAvatar = document.getElementById(`avatar_${speakerType}`);
    if (activeAvatar) activeAvatar.classList.add("active-speaker");

    if (quoteEl) {
      quoteEl.style.opacity = "0";
      setTimeout(() => {
        quoteEl.innerHTML = `<strong>${name} (${icon}):</strong> ${text}`;
        quoteEl.style.opacity = "1";
      }, 150);
    }
  }

  showMascotQuote(mascotType) {
    if (window.GameAudio) window.GameAudio.playClick();

    const mascotMap = {
      "hard_gaan": {
        name: "Freikörper-Fred",
        badge: "🩱",
        quotes: [
          "TOO HOT TO HANDLE! Wer Kleidung trägt, hat Angst vor Fahrtwind!",
          "Sonnenbrille bleibt auch im Looping auf! Style vor Sicherheit!",
          "Wasserpistole mit Sambuca geladen! Wer will einen Treffer?!"
        ]
      },
      "kangaroo": {
        name: "Monsieur Walibi",
        badge: "🦘",
        quotes: [
          "Pics or it didn't happen! Erst Untamed First Drop, dann Bier & Grillfleisch!",
          "Mein Beutel ist heute exklusiv reserviert für Dosenbier!",
          "Ein Hüpfer für mich, ein riesiger Shot für die Gruppe!"
        ]
      },
      "fox": {
        name: "Großer (Spaß-Diktator)",
        badge: "🧢",
        quotes: [
          "Bis zum Delirium und wieder zurück! Samstag im Walibi gehört uns!",
          "Fuchsohren aufgestellt, ich höre ein kühles Bier zischen!",
          "Als Tour-Captain & Spaß-Diktator befehle ich: Niemand verlässt den Park nüchtern!"
        ]
      }
    };

    const target = mascotMap[mascotType] || mascotMap["kangaroo"];
    const randomQuote = target.quotes[Math.floor(Math.random() * target.quotes.length)];

    this.setSpeakerQuote(mascotType, target.name, target.badge, `"${randomQuote}"`);
    this.showToast(`${target.badge} ${target.name}: "${randomQuote}"`);
  }

  // --- MASKOTTCHEN HERO BANNER EIN-/AUSKLAPPEN ---
  toggleMascotHero() {
    if (window.GameAudio) window.GameAudio.playClick();
    const card = document.getElementById("mascotHeroCard");
    const toggleBtn = document.getElementById("mascotToggleBtn");
    if (!card) return;

    const isCollapsed = card.classList.toggle("collapsed");
    if (toggleBtn) {
      toggleBtn.textContent = isCollapsed ? "▼" : "▲";
      toggleBtn.title = isCollapsed ? "Banner aufklappen" : "Banner zuklappen";
    }
    localStorage.setItem("walibi_mascot_collapsed", isCollapsed ? "1" : "0");
  }

  openQuickMenu() {
    if (window.GameAudio) window.GameAudio.playClick();
    const modal = document.getElementById("quickMenuModal");
    if (!modal) return;
    
    // Admin Button im Quick Menu prüfen – NUR für echten Admin grossek
    const adminBtn = document.getElementById("menuAdminBtn");
    if (adminBtn) {
      const isGrossek = window.ProfileModule && window.ProfileModule.isAdminUser && window.ProfileModule.isAdminUser();
      adminBtn.style.display = isGrossek ? "flex" : "none";
    }

    // Sound Status aktualisieren
    const soundLbl = document.getElementById("menuSoundLabel");
    const soundIcon = document.getElementById("menuSoundIcon");
    if (soundLbl && window.GameAudio) {
      soundLbl.textContent = window.GameAudio.enabled ? "Sound: AN" : "Sound: AUS";
      if (soundIcon) soundIcon.textContent = window.GameAudio.enabled ? "🔊" : "🔇";
    }

    modal.classList.remove("hidden");
  }

  closeQuickMenu() {
    const modal = document.getElementById("quickMenuModal");
    if (modal) modal.classList.add("hidden");
  }

  toggleSoundFromMenu() {
    if (window.GameAudio) {
      window.GameAudio.enabled = !window.GameAudio.enabled;
      if (window.GameAudio.enabled) window.GameAudio.playClick();
      const soundLbl = document.getElementById("menuSoundLabel");
      const soundIcon = document.getElementById("menuSoundIcon");
      if (soundLbl) soundLbl.textContent = window.GameAudio.enabled ? "Sound: AN" : "Sound: AUS";
      if (soundIcon) soundIcon.textContent = window.GameAudio.enabled ? "🔊" : "🔇";
      this.showToast(window.GameAudio.enabled ? "🔊 Soundeffekte aktiviert" : "🔇 Sound stummgeschaltet");
    }
  }

  toggleWakeLockFromMenu() {
    if (window.ProfileModule) {
      window.ProfileModule.toggleWakeLock();
      this.closeQuickMenu();
    }
  }

  fireConfetti() {
    const canvas = document.createElement("canvas");
    canvas.id = "confettiCanvas";
    canvas.style.position = "fixed";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.width = "100vw";
    canvas.style.height = "100vh";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = "999999";
    document.body.appendChild(canvas);

    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const pieces = [];
    const colors = ["#e11d48", "#fbbf24", "#f97316", "#10b981", "#8b5cf6", "#ec4899"];

    for (let i = 0; i < 90; i++) {
      pieces.push({
        x: Math.random() * canvas.width,
        y: Math.random() * -canvas.height * 0.5,
        w: Math.random() * 10 + 6,
        h: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: Math.random() * 4 - 2,
        vy: Math.random() * 5 + 3,
        rot: Math.random() * 360,
        rotSpeed: Math.random() * 8 - 4
      });
    }

    let frame = 0;
    function animate() {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      pieces.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.rotSpeed;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });

      if (frame < 120) {
        requestAnimationFrame(animate);
      } else {
        canvas.remove();
      }
    }
    animate();
  }
}

window.app = new MainApp();
document.addEventListener("DOMContentLoaded", () => {
  window.app.init();
  if (localStorage.getItem("walibi_mascot_collapsed") === "1") {
    const card = document.getElementById("mascotHeroCard");
    const toggleBtn = document.getElementById("mascotToggleBtn");
    if (card) card.classList.add("collapsed");
    if (toggleBtn) toggleBtn.textContent = "▼";
  }
});
