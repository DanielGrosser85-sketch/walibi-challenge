/**
 * SIEGEREHRUNG & SAUFTOUR-ZEUGNIS '26
 * Spielende und Siegerehrung werden manuell vom Admin im Admin-Panel ausgelöst
 */
const AwardsModule = {
  selectedPlayerId: null,

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
  openCelebrationModal(isAutoEnd = false, targetPlayerId = null) {
    const modal = document.getElementById("gameEndedCelebrationModal");
    if (!modal) return;

    if (targetPlayerId) {
      this.selectedPlayerId = targetPlayerId;
    }

    // Sound & Konfetti
    if (window.GameAudio) {
      window.GameAudio.playFanfare();
    }
    if (window.app && window.app.fireConfetti) {
      window.app.fireConfetti();
      setTimeout(() => window.app.fireConfetti(), 800);
      setTimeout(() => window.app.fireConfetti(), 1600);
    }

    this.renderCelebrationContent(isAutoEnd, this.selectedPlayerId);
    modal.classList.remove("hidden");
  },

  switchPlayerCertificate(playerId) {
    if (window.GameAudio) window.GameAudio.playClick();
    this.selectedPlayerId = playerId;
    this.renderCelebrationContent(false, playerId);
  },

  closeCelebrationModal() {
    if (window.GameAudio) window.GameAudio.playClick();
    const modal = document.getElementById("gameEndedCelebrationModal");
    if (modal) modal.classList.add("hidden");
  },

  renderCelebrationContent(isAutoEnd, targetPlayerId = null) {
    const container = document.getElementById("celebrationModalBody");
    if (!container) return;

    const players = (window.store && window.store.state && window.store.state.players) || [];
    const feed = (window.store && window.store.state && window.store.state.feed) || [];
    const currentUser = window.store ? window.store.state.currentUser : null;

    if (players.length === 0) return;

    // Sortiere Spieler nach Punkten
    const sorted = [...players].sort((a, b) => (b.points || 0) - (a.points || 0));
    const winner = sorted[0];
    
    // Ausgewählter Spieler für das Zeugnis:
    const activePlayerId = targetPlayerId || this.selectedPlayerId || (currentUser ? currentUser.id : winner.id);
    const me = sorted.find(p => p.id === activePlayerId) || winner;
    const myRank = sorted.findIndex(p => p.id === me.id) + 1;
    const isMe = currentUser && currentUser.id === me.id;

    // Konsum-Auswertung für den gewählten Spieler
    const myDrinks = me.drinksDetail || { beer: 0, shot: 0, longdrink: 0, joint: 0, water: 0 };
    const myTotalDrinks = me.drinksCount || 0;
    const myQuestsCount = (me.completedQuests && me.completedQuests.length) || 0;
    
    // Hauptquests & Challenges
    const allQuests = (window.store && window.store.state && window.store.state.quests) || window.INITIAL_QUESTS || [];
    const myQuestIds = me.completedQuests || [];
    const myCompletedQuests = allQuests.filter(q => myQuestIds.includes(q.id));
    const mainQuestBonusPoints = myCompletedQuests.reduce((sum, q) => sum + (q.points || 0), 0);

    // Nebenquests & erworbene Titel
    const allSideQuests = window.SIDE_QUESTS || [];
    const mySideQuestIds = me.completedSideQuests || [];
    const myCompletedSideQuests = allSideQuests.filter(sq => mySideQuestIds.includes(sq.id));
    const sideQuestBonusPoints = myCompletedSideQuests.reduce((sum, sq) => sum + (sq.points || 0), 0);

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

    // Lustigen Titel generieren (inkl. Nebenquest-Titel)
    const titleObj = this.generateFunnyTitle(me, myRank, sorted, myCompletedSideQuests);
    
    // Lustige Organ-Diagnosen generieren
    const liverReport = this.generateLiverReport(myDrinks.beer || 0, myDrinks.shot || 0, myDrinks.longdrink || 0, myCompletedSideQuests);
    const lungReport = this.generateLungReport(myDrinks.joint || 0);
    const stomachReport = this.generateStomachReport(myRidesCount, myTotalDrinks, myCompletedSideQuests);
    const faithReport = this.generateFaithReport(me.gutGlaubenCount || 0);

    // Gruppen-Gesamtstatistik
    let totalGroupBeer = 0, totalGroupShots = 0, totalGroupLongdrinks = 0, totalGroupJoints = 0, totalGroupSideQuests = 0;
    players.forEach(p => {
      const d = p.drinksDetail || {};
      totalGroupBeer += (d.beer || 0);
      totalGroupShots += (d.shot || 0);
      totalGroupLongdrinks += (d.longdrink || 0);
      totalGroupJoints += (d.joint || 0);
      totalGroupSideQuests += ((p.completedSideQuests && p.completedSideQuests.length) || 0);
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
      <div style="background: linear-gradient(135deg, rgba(255,204,0,0.25), rgba(225,29,72,0.25)); border: 2.5px solid var(--walibi-yellow); border-radius: 16px; padding: 16px; text-align: center; margin-bottom: 14px; box-shadow: 0 0 25px rgba(255,204,0,0.3);">
        <div style="font-size: 38px; margin-bottom: 2px;">👑🏆🎉</div>
        <div style="font-size: 11px; font-weight: 900; color: var(--walibi-yellow); letter-spacing: 2px; text-transform: uppercase;">Mr. / Mrs. Walibi '26</div>
        <h2 style="font-size: 26px; color: #fff; margin: 4px 0; font-family: var(--font-headline);">${winner.name}</h2>
        <div style="font-size: 14px; font-weight: 900; color: #34d399;">Mit gigantischen ${winner.points} Punkten auf Platz #1!</div>
        <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Sieger-Haus: <strong>🏰 ${winningHouse}</strong> (${houseScores[winningHouse] || 0} Pkt)</div>
      </div>

      <!-- SPIELER-AUSWAHL FÜR ZEUGNISSE -->
      <div style="background: rgba(0,0,0,0.4); border: 1.5px solid rgba(255,204,0,0.3); border-radius: 12px; padding: 10px; margin-bottom: 14px;">
        <div style="font-size: 11px; font-weight: 800; color: var(--walibi-yellow); text-transform: uppercase; margin-bottom: 6px; text-align: center; letter-spacing: 0.5px;">
          📜 Zeugnisse aller Mitspieler ansehen:
        </div>
        <div style="display: flex; gap: 6px; overflow-x: auto; padding-bottom: 4px; scrollbar-width: none;">
          ${sorted.map((p, idx) => {
            const isSelected = p.id === me.id;
            const rankIcon = idx === 0 ? '👑' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
            return `
              <button type="button" class="subtab-btn ${isSelected ? 'active' : ''}" style="padding: 6px 12px; font-size: 12px; white-space: nowrap; border-radius: 999px; display: flex; align-items: center; gap: 4px; font-weight: 800;" onclick="AwardsModule.switchPlayerCertificate('${p.id}')">
                <span>${rankIcon}</span>
                <span>${p.name}</span>
              </button>
            `;
          }).join("")}
        </div>
      </div>

      <!-- PERSÖNLICHES ZEUGNIS & TITEL -->
      <div style="background: var(--game-panel-light); border: 2px solid rgba(255,255,255,0.15); border-radius: 14px; padding: 14px; margin-bottom: 14px;">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
          <img src="${me.avatar || 'assets/mascot_hard_gaan.jpg'}" style="width: 54px; height: 54px; border-radius: 50%; border: 2.5px solid var(--walibi-yellow);" />
          <div>
            <div style="font-size: 11px; color: var(--text-muted); font-weight: 800;">SAUFTOUR-ZEUGNIS '26 VON:</div>
            <div style="font-size: 18px; font-weight: 900; color: #fff;">${me.name} ${isMe ? '<span class="you-badge">(Du)</span>' : ''} (Rang #${myRank})</div>
            <div style="font-size: 12px; color: var(--walibi-yellow); font-weight: 800;">${me.points} Punkte • ${me.house || 'Haus 1'}</div>
          </div>
        </div>

        <!-- VERLIEHENER HAUPT-TITEL -->
        <div style="background: rgba(0,0,0,0.45); border: 2px solid #ffcc00; border-radius: 12px; padding: 12px; margin-bottom: 12px; text-align: center; box-shadow: 0 0 15px rgba(255, 204, 0, 0.25);">
          <div style="font-size: 10px; color: var(--text-muted); font-weight: 900; text-transform: uppercase; letter-spacing: 1px;">Offiziell verliehener Haupt-Titel:</div>
          <div style="font-size: 17px; font-weight: 900; color: #ffcc00; margin-top: 3px; font-family: var(--font-headline);">${titleObj.badge} ${titleObj.title}</div>
          <div style="font-size: 11px; color: #e2e8f0; margin-top: 4px; font-style: italic;">"${titleObj.reason}"</div>
        </div>

        <!-- 🎯 GEMEISTERTE HAUPT-CHALLENGES -->
        <div style="background: rgba(0, 0, 0, 0.35); border: 2px solid rgba(225, 29, 72, 0.45); border-radius: 12px; padding: 12px; margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 11px; font-weight: 900; color: #fda4af; text-transform: uppercase; letter-spacing: 0.5px;">
              🎯 Gemeisterte Haupt-Challenges (${myCompletedQuests.length}/${allQuests.length}):
            </span>
            <span class="points-badge" style="font-size: 11px; background: var(--gradient-rose); color: #fff;">+${mainQuestBonusPoints} Pkt</span>
          </div>

          ${myCompletedQuests.length > 0 ? `
            <div style="display: flex; flex-direction: column; gap: 6px;">
              ${myCompletedQuests.map(q => `
                <div style="background: linear-gradient(135deg, rgba(225, 29, 72, 0.22), rgba(0, 0, 0, 0.5)); border: 1.5px solid #e11d48; border-radius: 8px; padding: 6px 10px; display: flex; align-items: center; justify-content: space-between;">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 16px;">${q.icon || '🎯'}</span>
                    <div>
                      <div style="font-size: 12px; font-weight: 900; color: #fff;">${q.title}</div>
                      <div style="font-size: 10px; color: #cbd5e1;">${q.description || q.desc || ''}</div>
                    </div>
                  </div>
                  <span style="font-size: 11px; font-weight: 900; color: #fb7185; white-space: nowrap;">+${q.points} P</span>
                </div>
              `).join("")}
            </div>
          ` : `
            <div style="font-size: 12px; color: var(--text-dim); font-style: italic; text-align: center; padding: 8px 0;">
              Noch keine Haupt-Challenges eingereicht – ran an die Mutproben und Achterbahnen!
            </div>
          `}
        </div>

        <!-- 🏅 NEBENQUEST-ORDEN & ERWORBENE TITEL -->
        <div style="background: rgba(0, 0, 0, 0.35); border: 2px solid rgba(255, 204, 0, 0.4); border-radius: 12px; padding: 12px; margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 11px; font-weight: 900; color: var(--walibi-yellow); text-transform: uppercase; letter-spacing: 0.5px;">
              🏅 Deine Nebenquest-Orden (${myCompletedSideQuests.length}/${allSideQuests.length}):
            </span>
            <span class="points-badge" style="font-size: 11px;">+${sideQuestBonusPoints} Pkt</span>
          </div>

          ${myCompletedSideQuests.length > 0 ? `
            <div style="display: flex; flex-direction: column; gap: 6px;">
              ${myCompletedSideQuests.map(sq => `
                <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(0, 0, 0, 0.5)); border: 1.5px solid #10b981; border-radius: 8px; padding: 6px 10px; display: flex; align-items: center; justify-content: space-between;">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 16px;">🏆</span>
                    <div>
                      <div style="font-size: 12px; font-weight: 900; color: #fff;">${sq.title}</div>
                      <div style="font-size: 10px; color: #94a3b8;">${sq.desc}</div>
                    </div>
                  </div>
                  <span style="font-size: 11px; font-weight: 900; color: #34d399; white-space: nowrap;">+${sq.points} P</span>
                </div>
              `).join("")}
            </div>
          ` : `
            <div style="font-size: 12px; color: var(--text-dim); font-style: italic; text-align: center; padding: 8px 0;">
              Noch keine Nebenquest-Titel erworben – nächstes Mal alle 10 Bahnen und Theken bezwingen!
            </div>
          `}
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
            <div style="font-size: 10px; color: var(--text-muted); font-weight: 800;">📸 SOCIAL & VOTING</div>
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

          <!-- EHRLICHKEIT & GLAUBWÜRDIGKEITS-TÜV (GUT GLAUBEN INDEX) -->
          <div style="background: rgba(245, 158, 11, 0.15); border: 1.5px solid rgba(245, 158, 11, 0.5); border-radius: 10px; padding: 10px;">
            <div style="font-size: 12px; font-weight: 900; color: #fcd34d; margin-bottom: 2px;">📜 Ehrlichkeit & Glaubwürdigkeits-TÜV:</div>
            <div style="font-size: 12px; color: #fff; line-height: 1.4;">${faithReport}</div>
          </div>
        </div>
      </div>

      <!-- GRUPPEN-GESAMTBILANZ -->
      <div style="background: rgba(0,0,0,0.5); border: 1.5px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 12px; text-align: center; margin-bottom: 16px;">
        <div style="font-size: 11px; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">🔥 Gesamt-Vernichtung der Gruppe:</div>
        <div style="font-size: 13px; color: #fff; margin-top: 4px; font-weight: 700; line-height: 1.5;">
          🍺 ${totalGroupBeer} Biere • 🥃 ${totalGroupShots} Shots • 🍹 ${totalGroupLongdrinks} Longdrinks • 🌿 ${totalGroupJoints} Joints<br>
          🏅 <strong>${totalGroupSideQuests} Nebenquests</strong> wurden von der Gruppe insgesamt gemeistert!
        </div>
      </div>

      <button type="button" class="btn-primary" onclick="AwardsModule.closeCelebrationModal(); window.app.switchTab('leaderboard');" style="background: var(--gradient-gold); color: #000; font-weight: 900; border: 2.5px solid #fff;">
        🏆 GESAMTE RANGLISTE ANSEHEN
      </button>
    `;
  },

  generateFunnyTitle(player, rank, allPlayers, completedSideQuests = []) {
    const sideQuestIds = completedSideQuests.map(s => s.id || s);

    if (rank === 1) {
      if (sideQuestIds.includes("side_all_attractions")) {
        return {
          badge: "👑🌟",
          title: "Mr. / Mrs. Walibi '26 (Der allmächtige Park-Komplettist)",
          reason: "Unangefochtener Platz #1 und ausnahmslos JEDE Attraktion im gesamten Park bezwungen!"
        };
      }
      if (sideQuestIds.length >= 4) {
        return {
          badge: "👑",
          title: "Mr. / Mrs. Walibi '26 (Der allmächtige Orden-Kaiser)",
          reason: `Unangefochtener Platz #1 und stolze ${sideQuestIds.length} Nebenquest-Orden abgeräumt!`
        };
      }
      return {
        badge: "👑",
        title: "Mr. / Mrs. Walibi '26 (Der unsterbliche Park-König)",
        reason: "Hat alle Gegner deklassiert und den Thron für die Ewigkeit bestiegen!"
      };
    }

    // SPEZIELLE NEBENQUEST-KOMBINATIONSTITEL
    if (sideQuestIds.includes("side_all_attractions")) {
      return {
        badge: "🌟",
        title: "Der Park-Komplettist (Alle Attraktionen bezwungen)",
        reason: "Hat jede einzelne Bahn und Attraktion im Park gefahren – 150 Punkte Legenden-Status!"
      };
    }

    if (sideQuestIds.includes("side_space_kidz_5")) {
      return {
        badge: "👶🚀",
        title: "Kindergarten-Kaiser & Space Kidz Veteran",
        reason: "5 Mal den Kinder-Freifallturm gerockt – +100 Punkte für absoluten Tour-Kult!"
      };
    }

    if (sideQuestIds.includes("side_water_flat_double")) {
      return {
        badge: "🌪️🌊",
        title: "Zentrifugen-Bezwinger & Seebär",
        reason: "El Rio Grande, Crazy River, G-Force, Spinning Vibe, Blast und Tomahawk 2x gemeistert!"
      };
    }

    if (sideQuestIds.includes("side_untamed_master") && sideQuestIds.includes("side_goliath_king")) {
      return {
        badge: "🌲🟣",
        title: "Achterbahn-Titan (Untamed- & Goliath-Bezwinger)",
        reason: "Hat sowohl die 3x Untamed-Dröhnung als auch den Goliath Mega-Master im Zeugnis verewigt!"
      };
    }

    if (sideQuestIds.includes("side_yoy_duo")) {
      return {
        badge: "⚔️",
        title: "Dueling-Champion von YOY (Chill & Thrill Veteran)",
        reason: "Beide Spuren der Single-Rail-Neuheit am selben Tag gemeistert und triumphiert!"
      };
    }

    if (sideQuestIds.includes("side_coaster_marathon_20")) {
      return {
        badge: "👑🎢",
        title: "Schienen-Gott & Looping-Kaiser (20+ Coaster-Ritte)",
        reason: "Sagenhafte 20 Achterbahn-Fahrten überlebt – dein Magen besteht aus gehärtetem Titan!"
      };
    }

    if (sideQuestIds.includes("side_coaster_marathon_15")) {
      return {
        badge: "🚀",
        title: "Achterbahn-Extremist (15+ Coaster-Ritte)",
        reason: "15 Achterbahn-Fahrten überstanden – reiner Rausch auf Schienen!"
      };
    }

    if (sideQuestIds.includes("side_coaster_marathon_10")) {
      return {
        badge: "🔥",
        title: "Iron Butt Rekordhalter (10+ Achterbahn-Ritte)",
        reason: "Hat 10 Achterbahn-Fahrten überlebt – dein Magen besteht aus purem Edelstahl!"
      };
    }

    if (sideQuestIds.includes("side_water_combo")) {
      return {
        badge: "🌊",
        title: "Wasserbahn-Kapitän & Seetauglichkeits-Diplom",
        reason: "Crazy River, El Rio Grande und Splash Battle mit Bravour und nassen Socken bezwungen!"
      };
    }

    if (sideQuestIds.includes("side_drink_marathon_20")) {
      return {
        badge: "👑🍺",
        title: "Unsterbliche Theken-Legende (20+ Drinks Gesamt)",
        reason: "Über 20 Drinks im Pegel-Tracker verbucht – ein Denkmal in der Walibi-Chronik!"
      };
    }

    if (sideQuestIds.includes("side_beer_king_15")) {
      return {
        badge: "🍺👑",
        title: "Der Hopfen-Kaiser (15+ Bier)",
        reason: "15 Bier im Pegel-Tracker verbucht – Brauereibesitzer ehrenhalber!"
      };
    }

    if (sideQuestIds.includes("side_beer_king_10")) {
      return {
        badge: "🍺👑",
        title: "Der Bier-König (10+ Bier)",
        reason: "10 Bier im Pegel-Tracker verbucht – die Zapfhähne glühen für dich!"
      };
    }

    if (sideQuestIds.includes("side_shot_king_10")) {
      return {
        badge: "🥃👑",
        title: "Der Schnaps-Baron & Shot-Vernichter (10+ Shots)",
        reason: "10er-Meilenstein im Pegel-Tracker geknackt – eine lebende Legende an der Shot-Bar!"
      };
    }

    if (sideQuestIds.includes("side_beer_king_5") && sideQuestIds.includes("side_shot_duo")) {
      return {
        badge: "🍻",
        title: "Großmeister des Bieres & Scharfschütze der Shots",
        reason: "Sowohl 5 Bier als auch 3 Shots im Pegel-Tracker verbucht – eine Theken-Legende!"
      };
    }

    if (sideQuestIds.length >= 3) {
      return {
        badge: "🎖️",
        title: `Ordensträger der Walibi-Legion (${sideQuestIds.length} Titel)`,
        reason: `Mit ${sideQuestIds.length} gemeisterten Nebenquests hast du das Zeugnis dominiert!`
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

    if (rides >= 20) {
      return {
        badge: "🎢",
        title: "G-Kraft-Gott & Looping-Legende (20+ Fahrten)",
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
        reason: `Mit ${totalDrinks} Einheiten hast du Medizingeschichte geschrieben!`
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

  generateLiverReport(beer, shots, longdrinks, completedSideQuests = []) {
    const total = beer + shots + longdrinks;
    const sideQuestIds = completedSideQuests.map(s => s.id || s);
    const hasBeerKing15 = sideQuestIds.includes("side_beer_king_15");
    const hasBeerKing10 = sideQuestIds.includes("side_beer_king_10");
    const hasBeerKing5 = sideQuestIds.includes("side_beer_king_5");
    const hasShotKing10 = sideQuestIds.includes("side_shot_king_10");
    const hasShotDuo = sideQuestIds.includes("side_shot_duo");

    let extraNote = "";
    if (hasBeerKing15) {
      extraNote = " 🍺 <strong>Zeugnis-Sondernote:</strong> 'Hopfen-Kaiser' (15 Bier) Ehrenorden verliehen!";
    } else if (hasBeerKing10) {
      extraNote = " 🍺 <strong>Zeugnis-Sondernote:</strong> 'Bier-König' (10 Bier) Orden verliehen!";
    } else if (hasBeerKing5 && hasShotDuo) {
      extraNote = " 🍺🥃 <strong>Zeugnis-Sondernote:</strong> Träger des doppelten Bier- & Shot-Ordens!";
    } else if (hasBeerKing5) {
      extraNote = " 🍺 <strong>Zeugnis-Sondernote:</strong> 'Gerstensaft-Meister' Ehrenorden verliehen!";
    }

    if (total === 0) {
      return "Deine Leber fragt sich, ob ihr versehentlich im Sanatorium gelandet seid. 0 Promille auf Untamed? Respekt vor dem Mut, aber Schande über das Glas!" + extraNote;
    }
    if (total <= 7) {
      return `Mit ${total} Drinks (${beer}B, ${shots}S, ${longdrinks}L) lief deine Leber im gemütlichen Eco-Modus. Solide Grundlage, aber der Turbolader hat noch gefehlt!` + extraNote;
    }
    if (total <= 15) {
      return `Respektable Leistung! ${beer} Biere und ${shots} Shots haben deine Leber auf kernige 8.500 Umdrehungen gebracht. Untamed und Goliath fühlten sich plötzlich erstaunlich geschmeidig an!` + extraNote;
    }
    if (total <= 25) {
      return `Schwerstarbeit im Maschinenraum! ${total} Drinks – deine Leber glüht rot, steht aber wie ein Fels in der Brandung. Chemisch betrachtet bestehst du zu 40% aus Hopfen und zu 60% aus reinem Siegeswillen!` + extraNote;
    }
    return `🚨 MEDIZINISCHES WUNDER! Mit gigantischen ${total} Einheiten hat deine Leber soeben bei der niederländischen Botschaft politisches Asyl beantragt, um nicht mehr mit dir nach Hause fahren zu müssen!` + extraNote;
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

  generateStomachReport(rides, drinks, completedSideQuests = []) {
    const sideQuestIds = completedSideQuests.map(s => s.id || s);
    let extraNote = "";
    if (sideQuestIds.includes("side_all_attractions")) {
      extraNote = " 🌟 <strong>Zeugnis-Sondernote:</strong> 'Walibi-Komplettist' Großkreuz für alle Attraktionen!";
    }
    if (sideQuestIds.includes("side_space_kidz_5")) {
      extraNote += " 👶 'Space Kidz Astronauten-Diplom' (5x);";
    }
    if (sideQuestIds.includes("side_water_flat_double")) {
      extraNote += " 🌪️ 'Magen-Zentrifugen & Wildwasser-Doppel' bestanden;";
    }
    if (sideQuestIds.includes("side_untamed_master")) {
      extraNote += " 🌲 'Untamed Dreifach-Dröhnung' Orden;";
    }
    if (sideQuestIds.includes("side_yoy_duo")) {
      extraNote += " ⚔️ 'YOY Doppel-Duell' Auszeichnung;";
    }
    if (sideQuestIds.includes("side_water_combo")) {
      extraNote += " 🌊 'Wasser-Trio' Seetauglichkeit bestanden;";
    }

    if (rides === 0) {
      return "Parkbank-General! Du hast den Coastern von unten zugeschaut und dafür gesorgt, dass die Bierbecher nicht umkippen." + extraNote;
    }
    if (rides <= 9) {
      return `${rides} Fahrten überstanden! Dein Magen hat die G-Kräfte und das Dosenbier souverän im Zaum gehalten.` + extraNote;
    }
    if (rides <= 17) {
      return `COASTER-JUNKIE! Mit ${rides} Fahrten hast du nahezu alle Bahnen des Parks bezwungen. Magen aus Titan!` + extraNote;
    }
    return `🏆 G-KRAFT-GOTT! Mit unglaublichen ${rides} Fahrten hast du den Looping-Rekord der Sauftour aufgestellt. Fluglizenz mit goldenem Sternchen!` + extraNote;
  },

  generateFaithReport(count = 0) {
    if (count === 0) {
      return "🎖️ <strong>100% Wasserdicht!</strong> Lückenlose Beweise per Foto & Zeugen – Ein echter Ehrenmann, dem kein Schiedsrichter etwas anhaben kann!";
    }
    if (count <= 2) {
      return `🧐 <strong>Leichte Zweifel im Kontrollraum:</strong> ${count}x auf Ehre & gut Glauben durchgemogelt (-20% Abzug). Die Gruppe drückt noch ein Auge zu!`;
    }
    if (count <= 5) {
      return `🕵️‍♂️ <strong>Hochstapler im Anmarsch!</strong> "Vertrau mir Bruder" war deine Lieblingsstrategie (${count}x genutzt). Das Schiedsgericht schüttelt ungläubig den Kopf!`;
    }
    return `🚨 <strong>MÜNCHHAUSEN-DIPLOM '26!</strong> Du hättest auch behauptet, du wärst Untamed rückwärts im Schlaf geflogen (${count}x Gut Glauben eingereicht). Größter Märchenerzähler des Freizeitparks!`;
  }
};

window.AwardsModule = AwardsModule;
