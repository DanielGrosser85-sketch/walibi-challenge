const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ordner für Daten und Uploads sicherstellen
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// --- STANDARD DATENBANK INITIALISIEREN ---
function getDefaultState() {
  return {
    players: [
      {
        id: "p1",
        name: "Alex",
        house: "Haus 1",
        avatar: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='50' fill='%236366f1'/><text x='50' y='60' font-size='40' text-anchor='middle' fill='white' font-family='sans-serif'>A</text></svg>",
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
    version: 1
  };
}

let db = getDefaultState();
if (fs.existsSync(DB_FILE)) {
  try {
    db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  } catch (e) {
    console.error("Fehler beim Laden von db.json, nutze Standardwerte", e);
  }
} else {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

function saveDb() {
  try {
    db.version = (db.version || 0) + 1;
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
    broadcastSSE({ type: "SYNC_STATE", state: db });
  } catch (e) {
    console.error("Fehler beim Speichern der DB", e);
  }
}

// --- SERVER-SENT EVENTS (SSE) ECHTZEIT BROADCAST ---
let sseClients = [];

function handleSSE(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  const clientId = Date.now() + "_" + Math.random().toString(36).substr(2, 4);
  const newClient = { id: clientId, res };
  sseClients.push(newClient);

  // Initial Sync
  res.write(`data: ${JSON.stringify({ type: "INIT", state: db })}\n\n`);

  req.on('close', () => {
    sseClients = sseClients.filter(c => c.id !== clientId);
  });
}

function broadcastSSE(data) {
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach(c => {
    try {
      c.res.write(payload);
    } catch (e) {}
  });
}

// --- MIME TYPES ---
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// --- HTTP SERVER ---
const server = http.createServer((req, res) => {
  // CORS Headers für alle Anfragen
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // 1. SSE Realtime Stream
  if (pathname === '/api/events') {
    handleSSE(req, res);
    return;
  }

  // 2. REST API Endpunkte
  if (pathname.startsWith('/api/')) {
    handleApiRequest(pathname, req, res);
    return;
  }

  // 3. Uploads Bild-Auslieferung
  if (pathname.startsWith('/uploads/')) {
    const filename = path.basename(pathname);
    const filePath = path.join(UPLOADS_DIR, filename);
    if (fs.existsSync(filePath)) {
      res.writeHead(200, { 'Content-Type': 'image/jpeg' });
      fs.createReadStream(filePath).pipe(res);
      return;
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Bild nicht gefunden');
      return;
    }
  }

  // 4. Statische Webseiten-Dateien ausliefern
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 - Nicht gefunden');
      } else {
        res.writeHead(500);
        res.end(`Serverfehler: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

// --- JSON BODY HELPER ---
function parseJsonBody(req, callback) {
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
    // 15MB Limit für Bild-Uploads
    if (body.length > 15 * 1024 * 1024) {
      req.destroy();
    }
  });
  req.on('end', () => {
    try {
      const parsed = body ? JSON.parse(body) : {};
      callback(null, parsed);
    } catch (e) {
      callback(e, null);
    }
  });
}

// --- API ROUTER ---
function handleApiRequest(pathname, req, res) {
  // GET /api/state
  if (pathname === '/api/state' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(db));
    return;
  }

  // POST /api/player/update
  if (pathname === '/api/player/update' && req.method === 'POST') {
    parseJsonBody(req, (err, data) => {
      if (err || !data.id) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Ungültige Daten' }));
        return;
      }

      let p = db.players.find(x => x.id === data.id);
      if (!p) {
        p = {
          id: data.id,
          name: data.name || "Spieler",
          house: data.house || "Haus 1",
          avatar: data.avatar || null,
          points: 0,
          drinksCount: 0,
          completedQuests: []
        };
        db.players.push(p);
      } else {
        if (data.name) p.name = data.name;
        if (data.house) p.house = data.house;
        if (data.avatar) p.avatar = data.avatar;
      }

      if (data.house && !db.houses.includes(data.house)) {
        db.houses.push(data.house);
      }

      // Aktualisiere Name & Avatar in bisherigen Posts
      db.feed.forEach(post => {
        if (post.userId === p.id) {
          if (data.name) post.userName = data.name;
          if (data.avatar) post.userAvatar = data.avatar;
          if (data.house) post.userHouse = data.house;
        }
        if (post.comments) {
          post.comments.forEach(c => {
            if (c.userId === p.id) {
              if (data.name) c.userName = data.name;
              if (data.avatar) c.userAvatar = data.avatar;
            }
          });
        }
      });

      saveDb();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, player: p }));
    });
    return;
  }

  // POST /api/quest/complete
  if (pathname === '/api/quest/complete' && req.method === 'POST') {
    parseJsonBody(req, (err, data) => {
      if (err || !data.userId || !data.questId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Ungültige Quest-Daten' }));
        return;
      }

      const player = db.players.find(p => p.id === data.userId);
      if (!player) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Spieler nicht gefunden' }));
        return;
      }

      // Bild speichern falls Base64
      let photoUrl = data.photoBase64;
      if (data.photoBase64 && data.photoBase64.startsWith('data:image')) {
        try {
          const match = data.photoBase64.match(/^data:image\/(\w+);base64,(.+)$/);
          if (match) {
            const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
            const buffer = Buffer.from(match[2], 'base64');
            const filename = `quest_${Date.now()}_${Math.random().toString(36).substr(2, 6)}.${ext}`;
            const diskPath = path.join(UPLOADS_DIR, filename);
            fs.writeFileSync(diskPath, buffer);
            photoUrl = `/uploads/${filename}`;
          }
        } catch (e) {
          console.error("Fehler beim Speichern des Upload-Bildes", e);
        }
      }

      const requiresVoting = data.requiresVoting === true;
      const initialPoints = requiresVoting ? 0 : (data.points || 0);

      if (!player.completedQuests.includes(data.questId)) {
        player.completedQuests.push(data.questId);
      }
      if (!requiresVoting) {
        player.points += initialPoints;
      }

      // Automatische Achterbahn-Fahrt-Zählung
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

      const targetAttrs = questToAttrMap[data.questId];
      if (targetAttrs) {
        targetAttrs.forEach(attrId => {
          player.rideCounts[attrId] = (player.rideCounts[attrId] || 0) + 1;
        });
      }

      const feedItem = {
        id: "feed_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
        type: "quest",
        userId: player.id,
        userName: player.name,
        userAvatar: player.avatar,
        userHouse: player.house,
        questId: data.questId,
        questTitle: data.questTitle,
        questDescription: data.questDescription,
        questIcon: data.questIcon || "🎯",
        points: data.points || 0,
        actualPointsAwarded: initialPoints,
        photo: photoUrl || null,
        userComment: data.userComment || "",
        timestamp: new Date().toISOString(),
        requiresVoting: requiresVoting,
        votingLabel: data.votingLabel || "Leistung & Ausführung",
        votes: {},
        votingUnlocked: !requiresVoting,
        reactions: { "🔥": [], "🍺": [], "👑": [], "💀": [], "👏": [] },
        comments: data.userComment ? [{
          id: "cmt_" + Date.now(),
          userId: player.id,
          userName: player.name,
          userAvatar: player.avatar,
          text: data.userComment,
          timestamp: new Date().toISOString()
        }] : []
      };

      db.feed.unshift(feedItem);
      saveDb();

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, feedItem, playerPoints: player.points }));
    });
    return;
  }

  // POST /api/feed/post (Freier Social-Post / Schnappschuss)
  if (pathname === '/api/feed/post' && req.method === 'POST') {
    parseJsonBody(req, (err, data) => {
      if (err || !data.userId || (!data.text && !data.photoBase64)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Ungültige Post-Daten' }));
        return;
      }

      const player = db.players.find(p => p.id === data.userId);
      if (!player) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Spieler nicht gefunden' }));
        return;
      }

      let photoUrl = null;
      if (data.photoBase64 && data.photoBase64.startsWith('data:image')) {
        try {
          const match = data.photoBase64.match(/^data:image\/(\w+);base64,(.+)$/);
          if (match) {
            const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
            const buffer = Buffer.from(match[2], 'base64');
            const filename = `post_${Date.now()}_${Math.random().toString(36).substr(2, 6)}.${ext}`;
            const diskPath = path.join(UPLOADS_DIR, filename);
            fs.writeFileSync(diskPath, buffer);
            photoUrl = `/uploads/${filename}`;
          }
        } catch (e) {
          console.error("Fehler beim Speichern des Post-Bildes", e);
        }
      }

      const points = 10; // 10 Spaß-Punkte für spontane Gruppen-Posts!
      player.points += points;

      const feedItem = {
        id: "feed_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
        type: "social",
        userId: player.id,
        userName: player.name,
        userAvatar: player.avatar,
        userHouse: player.house,
        text: data.text || "Schnappschuss geteilt 📸",
        photo: photoUrl,
        points: points,
        timestamp: new Date().toISOString(),
        reactions: { "🔥": [], "🍺": [], "👑": [], "💀": [], "👏": [] },
        comments: []
      };

      db.feed.unshift(feedItem);
      saveDb();

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, feedItem, playerPoints: player.points }));
    });
    return;
  }

  // POST /api/counter/log
  if (pathname === '/api/counter/log' && req.method === 'POST') {
    parseJsonBody(req, (err, data) => {
      if (err || !data.userId || !data.itemId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Ungültige Counter-Daten' }));
        return;
      }

      const player = db.players.find(p => p.id === data.userId);
      if (!player) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Spieler nicht gefunden' }));
        return;
      }

      const points = data.points || 5;
      player.points += points;
      player.drinksCount = (player.drinksCount || 0) + 1;

      // Detailzählung pro Getränk/Item
      if (!player.drinksDetail) {
        player.drinksDetail = { beer: 0, shot: 0, longdrink: 0, joint: 0, water: 0 };
      }
      player.drinksDetail[data.itemId] = (player.drinksDetail[data.itemId] || 0) + 1;

      const feedItem = {
        id: "feed_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
        type: "drink",
        userId: player.id,
        userName: player.name,
        userAvatar: player.avatar,
        userHouse: player.house,
        itemId: data.itemId,
        itemName: data.itemName,
        itemIcon: data.itemIcon || "🍺",
        points: points,
        timestamp: new Date().toISOString(),
        reactions: { "🍻": [], "🔥": [], "💀": [] },
        comments: []
      };

      db.feed.unshift(feedItem);
      saveDb();

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, feedItem, playerPoints: player.points, drinksDetail: player.drinksDetail }));
    });
    return;
  }

  // POST /api/vote
  if (pathname === '/api/vote' && req.method === 'POST') {
    parseJsonBody(req, (err, data) => {
      if (err || !data.feedId || !data.voterId || !data.rating) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Ungültige Voting-Daten' }));
        return;
      }

      const item = db.feed.find(f => f.id === data.feedId);
      if (!item) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Post nicht gefunden' }));
        return;
      }

      if (!item.votes) item.votes = {};
      item.votes[data.voterId] = Number(data.rating);

      // 60% Regel berechnen
      const totalPlayers = db.players.length;
      const eligibleVoters = Math.max(1, totalPlayers - 1);
      const voteCount = Object.keys(item.votes).length;
      const votePercentage = (voteCount / eligibleVoters) * 100;

      const sumRatings = Object.values(item.votes).reduce((a, b) => a + b, 0);
      const avgRating = sumRatings / voteCount;
      const scoreFactor = avgRating / 5;
      const calculatedPoints = Math.round((item.points || 0) * scoreFactor);

      const player = db.players.find(p => p.id === item.userId);

      if (votePercentage >= 60) {
        item.votingUnlocked = true;
        const previousAwarded = item.actualPointsAwarded || 0;
        const pointDiff = calculatedPoints - previousAwarded;

        if (player) {
          player.points += pointDiff;
        }
        item.actualPointsAwarded = calculatedPoints;
      }

      item.avgRating = avgRating.toFixed(1);
      item.voteCount = voteCount;
      item.votePercentage = Math.round(votePercentage);

      saveDb();

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, item }));
    });
    return;
  }

  // POST /api/comment
  if (pathname === '/api/comment' && req.method === 'POST') {
    parseJsonBody(req, (err, data) => {
      if (err || !data.feedId || !data.userId || !data.text) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Ungültige Kommentar-Daten' }));
        return;
      }

      const item = db.feed.find(f => f.id === data.feedId);
      const player = db.players.find(p => p.id === data.userId);
      if (!item || !player) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Post oder Spieler nicht gefunden' }));
        return;
      }

      if (!item.comments) item.comments = [];
      const newComment = {
        id: "c_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
        userId: player.id,
        userName: player.name,
        userAvatar: player.avatar,
        text: data.text.trim(),
        timestamp: new Date().toISOString()
      };

      item.comments.push(newComment);
      saveDb();

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, comment: newComment }));
    });
    return;
  }

  // POST /api/reaction
  if (pathname === '/api/reaction' && req.method === 'POST') {
    parseJsonBody(req, (err, data) => {
      if (err || !data.feedId || !data.userId || !data.emoji) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Ungültige Reaction-Daten' }));
        return;
      }

      const item = db.feed.find(f => f.id === data.feedId);
      if (!item) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Post nicht gefunden' }));
        return;
      }

      if (!item.reactions) item.reactions = {};
      if (!item.reactions[data.emoji]) item.reactions[data.emoji] = [];

      const userList = item.reactions[data.emoji];
      const idx = userList.indexOf(data.userId);
      if (idx >= 0) {
        userList.splice(idx, 1);
      } else {
        userList.push(data.userId);
      }

      saveDb();

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, reactions: item.reactions }));
    });
    return;
  }

  // POST /api/admin/end-game (Siegerehrung & Spielende auslösen)
  if (pathname === '/api/admin/end-game' && req.method === 'POST') {
    parseJsonBody(req, (err, data) => {
      if (err || data.code !== '1008') {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Admin-Zugang verweigert' }));
        return;
      }

      if (!db.gameStatus) db.gameStatus = { isRunning: true, startedAt: new Date().toISOString() };
      db.gameStatus.isEnded = true;
      db.gameStatus.isRunning = false;
      db.gameStatus.endedAt = new Date().toISOString();
      saveDb();

      broadcastSSE({ type: "GAME_ENDED", endedAt: db.gameStatus.endedAt, state: db });

      console.log("🏆 SPIEL BEENDET: Siegerehrung & Auswertungs-Screen ausgelöst!");
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'Spiel beendet, Siegerehrung gestartet', gameStatus: db.gameStatus }));
    });
    return;
  }

  // POST /api/admin/start-game (Spiel starten / reaktivieren)
  if (pathname === '/api/admin/start-game' && req.method === 'POST') {
    parseJsonBody(req, (err, data) => {
      if (err || data.code !== '1008') {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Admin-Zugang verweigert' }));
        return;
      }

      db.gameStatus = { isRunning: true, isEnded: false, startedAt: new Date().toISOString() };
      saveDb();

      broadcastSSE({ type: "GAME_STARTED", state: db });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'Spiel aktiv', gameStatus: db.gameStatus }));
    });
    return;
  }

  // POST /api/admin/toggle-game
  if (pathname === '/api/admin/toggle-game' && req.method === 'POST') {
    parseJsonBody(req, (err, data) => {
      if (err || data.code !== '1008') {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Admin-Zugang verweigert' }));
        return;
      }

      if (!db.gameStatus) db.gameStatus = { isRunning: true, isEnded: false, startedAt: new Date().toISOString() };
      db.gameStatus.isRunning = !db.gameStatus.isRunning;
      if (db.gameStatus.isRunning) db.gameStatus.isEnded = false;
      saveDb();

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, gameStatus: db.gameStatus }));
    });
    return;
  }

  // POST /api/admin/reset-game (Kompletter Reset auf 0)
  if (pathname === '/api/admin/reset-game' && req.method === 'POST') {
    parseJsonBody(req, (err, data) => {
      if (err || data.code !== '1008') {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Admin-Zugang verweigert' }));
        return;
      }

      // Alle Spieler zurücksetzen auf 0
      db.players.forEach(p => {
        p.points = 0;
        p.drinksCount = 0;
        p.completedQuests = [];
        p.rideCounts = {};
        p.drinksDetail = { beer: 0, shot: 0, longdrink: 0, joint: 0, water: 0 };
      });

      // Feed komplett leeren
      db.feed = [];
      db.gameStatus = { isRunning: true, startedAt: new Date().toISOString() };
      saveDb();

      console.log("🚨 ADMIN RESET DURCHGEFÜHRT: Alle Punkte, Feed & Statistiken auf 0 gesetzt!");
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'Spiel vollständig zurückgesetzt' }));
    });
    return;
  }

  // POST /api/reset
  if (pathname === '/api/reset' && req.method === 'POST') {
    db = getDefaultState();
    saveDb();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('API Endpoint nicht gefunden');
}

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

server.listen(PORT, () => {
  const localIp = getLocalIp();
  console.log(`\n======================================================`);
  console.log(`👑 WALIBI & FROSCHKÖNIG CLOUD-SERVER AKTIV!`);
  console.log(`======================================================`);
  console.log(`🌐 Port:              ${PORT}`);
  console.log(`📱 Lokaler Test:      http://localhost:${PORT}`);
  console.log(`📲 Handy im WLAN:     http://${localIp}:${PORT}`);
  console.log(`☁️ Online / Internet: Bereit für Render.com / Railway`);
  console.log(`======================================================\n`);
});
