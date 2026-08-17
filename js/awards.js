/**
 * SIEGEREHRUNG & SAUFTOUR-ZEUGNIS '26
 * Spielende und Siegerehrung werden manuell vom Admin im Admin-Panel ausgelöst
 */
const AwardsModule = {
  init() {
    // Kein automatischer Zwangs-Stop – Das Spiel läuft dauerhaft bis zum manuellen Admin-Abschluss
  },

  // Prüft ob das Spiel aktuell läuft oder beendet ist
  isGameActive() {
    const state = window.store ? window.store.state : null;
    if (state && state.gameStatus) {
      if (state.gameStatus.isEnded) return false;
      if (state.gameStatus.isRunning) return true;
    }
    return true;
  },

  // --- SIEGEREHRUNG & ZEUGNIS ÖFFNEN ---
  openCelebrationModal(isAutoEnd = false) {
    const modal = document.getElementById("gameEndedCelebrationModal");
    if (!modal) return;

    // Sound & Konfetti
    if (window.GameAudio) {
      window.GameAudio.playFanfare();
    }
    if (window.app && window.app.fireConfetti) {
      window.app.fireConfetti();
      setTimeout(() => window.app.fireConfetti(), 800);
      setTimeout(() => window.app.fireConfetti(), 1600);
    }

    this.renderCelebrationContent(isAutoEnd);
    modal.classList.remove("hidden");
  },

  closeCelebrationModal() {
    if (window.GameAudio) window.GameAudio.playClick();
    const modal = document.getElementById("gameEndedCelebrationModal");
    if (modal) modal.classList.add("hidden");
  },

  renderCelebrationContent(isAutoEnd) {
    const container = document.getElementById("celebrationModalBody");
    if (!container) return;

    const players = (window.store && window.store.state && window.store.state.players) || [];
    const feed = (window.store && window.store.state && window.store.state.feed) || [];
    const currentUser = window.store ? window.store.state.currentUser : null;

    if (players.length === 0) return;

    // Sortiere Spieler nach Punkten
    const sorted = [...players].sort((a, b) => (b.points || 0) - (a.points || 0));
    const winner = sorted[0];
    const myRank = currentUser ? sorted.findIndex(p => p.id === currentUser.id) + 1 : 1;
    const me = currentUser ? sorted.find(p => p.id === currentUser.id) || currentUser : sorted[0];

    // Konsum-Auswertung für den aktuellen Spieler
    const myDrinks = me.drinksDetail || { beer: 0, shot: 0, longdrink: 0, joint: 0, water: 0 };
    const myTotalDrinks = me.drinksCount || 0;
    const myQuestsCount = (me.completedQuests && me.completedQuests.length) || 0;
    
    // Coaster-Fahrten
    let myRidesCount = 0;
    if (me.rideCounts) {
      myRidesCount = Object.values(me.rideCounts).reduce((a, b) => a + b, 0);
    }

    // Eigene Posts & Votings
    const myPostsCount = feed.filter(f => f.userId === me.id).length;
    let myVotesGiven = 0;
    feed.forEach(f => {
      if (f.votes && f.votes[me.id]) myVotesGiven++;
    });

    // Lustigen Titel generieren
    const titleObj = this.generateFunnyTitle(me, myRank, sorted);
    
    // Lustige Organ-Diagnosen generieren
    const liverReport = this.generateLiverReport(myDrinks.beer || 0, myDrinks.shot || 0, myDrinks.longdrink || 0);
    const lungReport = this.generateLungReport(myDrinks.joint || 0);
    const stomachReport = this.generateStomachReport(myRidesCount, myTotalDrinks);

    // Gruppen-Gesamtstatistik
    let totalGroupBeer = 0, totalGroupShots = 0, totalGroupLongdrinks = 0, totalGroupJoints = 0;
    players.forEach(p => {
      const d = p.drinksDetail || {};
      totalGroupBeer += (d.beer || 0);
      totalGroupShots += (d.shot || 0);
      totalGroupLongdrinks += (d.longdrink || 0);
      totalGroupJoints += (d.joint || 0);
    });

    // Häuser-Auswertung
    const houseScores = {};
    players.forEach(p => {
      const h = p.house || "Haus 1";
      houseScores[h] = (houseScores[h] || 0) + (p.points || 0);
    });
    const winningHouse = Object.keys(houseScores).sort((a, b) => houseScores[b] - houseScores[a])[0] || "Haus 1";

    container.innerHTML = `
      <!-- TOP WINNER PODIUM -->
      <div style="background: linear-gradient(135deg, rgba(255,204,0,0.25), rgba(225,29,72,0.25)); border: 2.5px solid var(--walibi-yellow); border-radius: 16px; padding: 16px; text-align: center; margin-bottom: 16px; box-shadow: 0 0 25px rgba(255,204,0,0.3);">
        <div style="font-size: 38px; margin-bottom: 2px;">👑🏆🎉</div>
        <div style="font-size: 11px; font-weight: 900; color: var(--walibi-yellow); letter-spacing: 2px; text-transform: uppercase;">Mr. / Mrs. Walibi '26</div>
        <h2 style="font-size: 26px; color: #fff; margin: 4px 0; font-family: var(--font-headline);">${winner.name}</h2>
        <div style="font-size: 14px; font-weight: 900; color: #34d399;">Mit gigantischen ${winner.points} Punkten auf Platz #1!</div>
        <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Sieger-Haus: <strong>🏰 ${winningHouse}</strong> (${houseScores[winningHouse] || 0} Pkt)</div>
      </div>

      <!-- PERSÖNLICHES ZEUGNIS & TITEL -->
      <div style="background: var(--game-panel-light); border: 2px solid rgba(255,255,255,0.15); border-radius: 14px; padding: 14px; margin-bottom: 14px;">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
          <img src="${me.avatar || 'assets/mascot_hard_gaan.jpg'}" style="width: 54px; height: 54px; border-radius: 50%; border: 2.5px solid var(--walibi-yellow);" />
          <div>
            <div style="font-size: 11px; color: var(--text-muted); font-weight: 800;">DEIN SAUFTOUR-ZEUGNIS '26:</div>
            <div style="font-size: 18px; font-weight: 900; color: #fff;">${me.name} (Rang #${myRank})</div>
            <div style="font-size: 12px; color: var(--walibi-yellow); font-weight: 800;">${me.points} Punkte • ${me.house || 'Haus 1'}</div>
          </div>
        </div>

        <!-- VERLIEHENER TITEL -->
        <div style="background: rgba(0,0,0,0.4); border: 1.5px solid #ffcc00; border-radius: 10px; padding: 10px; margin-bottom: 12px; text-align: center;">
          <div style="font-size: 10px; color: var(--text-muted); font-weight: 900; text-transform: uppercase;">Offiziell erworbener Titel:</div>
          <div style="font-size: 15px; font-weight: 900; color: #ffcc00; margin-top: 2px;">${titleObj.badge} ${titleObj.title}</div>
          <div style="font-size: 11px; color: #e2e8f0; margin-top: 4px; font-style: italic;">"${titleObj.reason}"</div>
        </div>

        <!-- 4 STATISTIK KACHELN -->
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-bottom: 12px;">
          <div style="background: rgba(0,0,0,0.3); padding: 8px 10px; border-radius: 8px; border-left: 3.5px solid #f59e0b;">
            <div style="font-size: 10px; color: var(--text-muted); font-weight: 800;">🍺 GETRUNKEN</div>
            <div style="font-size: 15px; font-weight: 900; color: #fff;">${myTotalDrinks} Drinks (${myDrinks.beer || 0}B, ${myDrinks.shot || 0}S)</div>
          </div>
          <div style="background: rgba(0,0,0,0.3); padding: 8px 10px; border-radius: 8px; border-left: 3.5px solid #10b981;">
            <div style="font-size: 10px; color: var(--text-muted); font-weight: 800;">🌿 SCHWERELOS</div>
            <div style="font-size: 15px; font-weight: 900; color: #fff;">${myDrinks.joint || 0}x Kräuter / Joints</div>
          </div>
          <div style="background: rgba(0,0,0,0.3); padding: 8px 10px; border-radius: 8px; border-left: 3.5px solid #3b82f6;">
            <div style="font-size: 10px; color: var(--text-muted); font-weight: 800;">🎢 COASTER-DROPS</div>
            <div style="font-size: 15px; font-weight: 900; color: #fff;">${myRidesCount} Fahrten überlebt</div>
          </div>
          <div style="background: rgba(0,0,0,0.3); padding: 8px 10px; border-radius: 8px; border-left: 3.5px solid #ec4899;">
            <div style="font-size: 10px; color: var(--text-muted); font-weight: 800;">📸 SOCIAL-AKTIVITÄT</div>
            <div style="font-size: 15px; font-weight: 900; color: #fff;">${myPostsCount} Posts, ${myVotesGiven} Votings</div>
          </div>
        </div>

        <!-- 🩺 WITZIGES ORGAN- & KONSUM-GUTACHTEN -->
        <div style="font-size: 12px; font-weight: 900; color: var(--walibi-yellow); margin-bottom: 8px; text-transform: uppercase;">
          🩺 Ärztliches Sauftour-Gutachten:
        </div>

        <div style="display: flex; flex-direction: column; gap: 8px;">
          <!-- LEBER TÜV -->
          <div style="background: rgba(225,29,72,0.15); border: 1.5px solid rgba(225,29,72,0.4); border-radius: 10px; padding: 10px;">
            <div style="font-size: 12px; font-weight: 900; color: #fda4af; margin-bottom: 2px;">🫀 Leber-Zustandsbericht:</div>
            <div style="font-size: 12px; color: #fff; line-height: 1.4;">${liverReport}</div>
          </div>

          <!-- LUNGEN TÜV -->
          <div style="background: rgba(16,185,129,0.15); border: 1.5px solid rgba(16,185,129,0.4); border-radius: 10px; padding: 10px;">
            <div style="font-size: 12px; font-weight: 900; color: #6ee7b7; margin-bottom: 2px;">🫁 Lungen- & Rauch-TÜV:</div>
            <div style="font-size: 12px; color: #fff; line-height: 1.4;">${lungReport}</div>
          </div>

          <!-- MAGEN & COASTER TEST -->
          <div style="background: rgba(59,130,246,0.15); border: 1.5px solid rgba(59,130,246,0.4); border-radius: 10px; padding: 10px;">
            <div style="font-size: 12px; font-weight: 900; color: #93c5fd; margin-bottom: 2px;">🎢 Magen- & Fliehkraft-Stabilität:</div>
            <div style="font-size: 12px; color: #fff; line-height: 1.4;">${stomachReport}</div>
          </div>
        </div>
      </div>

      <!-- GRUPPEN-GESAMTBILANZ -->
      <div style="background: rgba(0,0,0,0.5); border: 1.5px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 12px; text-align: center; margin-bottom: 16px;">
        <div style="font-size: 11px; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">🔥 Gesamt-Vernichtung der Gruppe:</div>
        <div style="font-size: 13px; color: #fff; margin-top: 4px; font-weight: 700;">
          🍺 ${totalGroupBeer} Biere • 🥃 ${totalGroupShots} Shots • 🍹 ${totalGroupLongdrinks} Longdrinks • 🌿 ${totalGroupJoints} Joints
        </div>
      </div>

      <button type="button" class="btn-primary" onclick="AwardsModule.closeCelebrationModal(); window.app.switchTab('leaderboard');" style="background: var(--gradient-gold); color: #000; font-weight: 900; border: 2.5px solid #fff;">
        🏆 GESAMTE RANGLISTE ANSEHEN
      </button>
    `;
  },

  generateFunnyTitle(player, rank, allPlayers) {
    if (rank === 1) {
      return {
        badge: "👑",
        title: "Mr. / Mrs. Walibi '26 (Der unsterbliche Park-König)",
        reason: "Hat alle Gegner deklassiert und den Thron für die Ewigkeit bestiegen!"
      };
    }

    const drinks = player.drinksDetail || {};
    const totalDrinks = player.drinksCount || 0;
    const joints = drinks.joint || 0;
    const quests = (player.completedQuests && player.completedQuests.length) || 0;

    let rides = 0;
    if (player.rideCounts) {
      rides = Object.values(player.rideCounts).reduce((a, b) => a + b, 0);
    }

    if (rides >= 18) {
      return {
        badge: "🎢",
        title: "G-Kraft-Gott & Looping-Legende",
        reason: `Mit gigantischen ${rides} Coaster-Fahrten hast du die Schwerkraft pulverisiert!`
      };
    }

    if (rides >= 10) {
      return {
        badge: "🎢",
        title: "Coaster-Junkie (Alle 10 Bahnen gerockt)",
        reason: `Über 10 Achterbahn-Ritte – keine Schiene im Park war vor dir sicher!`
      };
    }

    if (totalDrinks >= 26) {
      return {
        badge: "🍺",
        title: "Der unsterbliche Promille-Kaiser (Asyl-Stufe)",
        reason: `Mit ${totalDrinks} Einheiten hast du medizingeschichte geschrieben!`
      };
    }

    if (totalDrinks >= 16) {
      return {
        badge: "🍺",
        title: "Ehrendoktor der Hopfenkunde & Durst-Diktator",
        reason: "Flüssige Nahrung ist dein Lebenselixier – die Zapfanlagen im Park laufen heiß!"
      };
    }

    if (joints >= 16) {
      return {
        badge: "🌿",
        title: "Telepathie-Meister mit Monsieur Walibi (Du bist der Park)",
        reason: `Mit ${joints} Kräuter-Einheiten verstehst du die Kängurus fließend!`
      };
    }

    if (joints >= 9) {
      return {
        badge: "🌿",
        title: "Der Astronaut von Lost Gravity (Schwerelosigkeits-Meister)",
        reason: "Hat die Schwerkraft für ungültig erklärt und schwebt entspannt 5 Meter über dem Park."
      };
    }

    if (joints >= 4) {
      return {
        badge: "🌿",
        title: "Bob Marley Tour-Diplom",
        reason: "Entspanntester Typ der Gruppe – die Loopings waren für dich pure Meditation."
      };
    }

    if (quests >= 5) {
      return {
        badge: "🎯",
        title: "Mission-Mastermind & Challenge-Vernichter",
        reason: "Keine Aufgabe war zu peinlich, keine Mutprobe zu wild!"
      };
    }

    if (rank === 2) {
      return {
        badge: "🥈",
        title: "Der Vize-König des Chaos",
        reason: "Haarscharf an der Krone vorbei – beim nächsten Bier holst du ihn ein!"
      };
    }

    return {
      badge: "🔥",
      title: "Ehren-Sauftourer der ersten Stunde",
      reason: "War immer an vorderster Front dabei und hat die Stimmung zum Kochen gebracht!"
    };
  },

  generateLiverReport(beer, shots, longdrinks) {
    const total = beer + shots + longdrinks;
    if (total === 0) {
      return "Deine Leber fragt sich, ob ihr versehentlich im Sanatorium gelandet seid. 0 Promille auf Untamed? Respekt vor dem Mut, aber Schande über das Glas!";
    }
    if (total <= 7) {
      return `Mit ${total} Drinks (${beer}B, ${shots}S, ${longdrinks}L) lief deine Leber im gemütlichen Eco-Modus. Solide Grundlage, aber der Turbolader hat noch gefehlt!`;
    }
    if (total <= 15) {
      return `Respektable Leistung! ${beer} Biere und ${shots} Shots haben deine Leber auf kernige 8.500 Umdrehungen gebracht. Untamed und Goliath fühlten sich plötzlich erstaunlich geschmeidig an!`;
    }
    if (total <= 25) {
      return `Schwerstarbeit im Maschinenraum! ${total} Drinks – deine Leber glüht rot, steht aber wie ein Fels in der Brandung. Chemisch betrachtet bestehst du zu 40% aus Hopfen und zu 60% aus reinem Siegeswillen!`;
    }
    return `🚨 MEDIZINISCHES WUNDER! Mit gigantischen ${total} Einheiten hat deine Leber soeben bei der niederländischen Botschaft politisches Asyl beantragt, um nicht mehr mit dir nach Hause fahren zu müssen!`;
  },

  generateLungReport(joints) {
    if (joints === 0) {
      return "Lungenvolumen wie ein olympischer Freitaucher. Frische holländische Polderluft war dein einziger Treibstoff!";
    }
    if (joints <= 3) {
      return `Feinster Kraut-Nebel (${joints}x). Du hast die Loopings auf Goliath in Zeitlupe genossen und dich gefragt, warum die Schienen so schön leuchten.`;
    }
    if (joints <= 8) {
      return `Bob Marley nickt anerkennend von oben! (${joints}x). Deine Lunge hat die Schwerkraft von Lost Gravity komplett ausgetrickst – du schwebst immer noch 2 Meter über dem Boden!`;
    }
    if (joints <= 15) {
      return `Astronauten-Level (${joints}x)! Du befindest dich in der oberen Erdumlaufbahn und hast den Coastern von der Stratosphäre aus zugeschaut.`;
    }
    return `🌿 DU BIST DER FREIZEITPARK! Bei ${joints} Kräuter-Einheiten hast du mit Freikörper-Fred telepathisch kommuniziert und die Achterbahnen mit Gedanken gesteuert!`;
  },

  generateStomachReport(rides, drinks) {
    if (rides === 0) {
      return "Parkbank-General! Du hast den Coastern von unten zugeschaut und dafür gesorgt, dass die Bierbecher nicht umkippen.";
    }
    if (rides <= 9) {
      return `${rides} Achterbahn-Fahrten überstanden! Dein Magen hat die G-Kräfte und das Dosenbier souverän im Zaum gehalten.`;
    }
    if (rides <= 17) {
      return `COASTER-JUNKIE! Mit ${rides} Fahrten hast du nahezu alle 10 Bahnen des Parks bezwungen. Magen aus Titan!`;
    }
    return `🏆 G-KRAFT-GOTT! Mit unglaublichen ${rides} Fahrten hast du den Looping-Rekord der Sauftour aufgestellt. Fluglizenz mit goldenem Sternchen!`;
  }
};

window.AwardsModule = AwardsModule;
