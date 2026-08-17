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
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.m4v': 'video/mp4'
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

  // 3. Uploads Bild- & Video-Auslieferung
  if (pathname.startsWith('/uploads/')) {
    const filename = path.basename(pathname);
    const filePath = path.join(UPLOADS_DIR, filename);
    if (fs.existsSync(filePath)) {
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      fs.createReadStream(filePath).pipe(res);
      return;
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Datei nicht gefunden');
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
    // 35MB Limit für Bild- & Video-Uploads
    if (body.length > 35 * 1024 * 1024) {
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

// Hilfsfunktion: Speichert Base64-Medien (Bilder & Videos) sicher im uploads/ Ordner
function saveMediaBase64(base64Str, prefix = 'media') {
  if (!base64Str || typeof base64Str !== 'string') return null;
  if (!base64Str.startsWith('data:')) return base64Str; // Bereits eine URL

  try {
    const match = base64Str.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9\-\+\.]+);base64,(.+)$/);
    if (!match) return null;

    const mime = match[1].toLowerCase();
    const dataBuffer = Buffer.from(match[2], 'base64');
    let ext = 'jpg';

    if (mime.includes('png')) ext = 'png';
    else if (mime.includes('gif')) ext = 'gif';
    else if (mime.includes('webp')) ext = 'webp';
    else if (mime.includes('svg')) ext = 'svg';
    else if (mime.includes('mp4')) ext = 'mp4';
    else if (mime.includes('webm')) ext = 'webm';
    else if (mime.includes('quicktime') || mime.includes('mov')) ext = 'mov';
    else if (mime.includes('video')) ext = 'mp4';

    const filename = `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}.${ext}`;
    const diskPath = path.join(UPLOADS_DIR, filename);
    fs.writeFileSync(diskPath, dataBuffer);
    return `/uploads/${filename}`;
  } catch (e) {
    console.error("Fehler beim Speichern der Mediendatei:", e);
    return null;
  }
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
          points: data.points !== undefined ? Number(data.points) : 0,
          drinksCount: data.drinksCount !== undefined ? Number(data.drinksCount) : 0,
          completedQuests: Array.isArray(data.completedQuests) ? data.completedQuests : [],
          completedSideQuests: Array.isArray(data.completedSideQuests) ? data.completedSideQuests : [],
          rideCounts: (data.rideCounts && typeof data.rideCounts === 'object') ? data.rideCounts : {},
          drinksDetail: data.drinksDetail || { beer: 0, shot: 0, longdrink: 0, joint: 0, water: 0 }
        };
        db.players.push(p);
      } else {
        if (data.name !== undefined) p.name = data.name;
        if (data.house !== undefined) p.house = data.house;
        if (data.avatar !== undefined) p.avatar = data.avatar;
        if (data.points !== undefined) p.points = Number(data.points);
        if (data.drinksCount !== undefined) p.drinksCount = Number(data.drinksCount);
        if (Array.isArray(data.completedQuests)) p.completedQuests = data.completedQuests;
        if (Array.isArray(data.completedSideQuests)) p.completedSideQuests = data.completedSideQuests;
        if (data.rideCounts && typeof data.rideCounts === 'object') p.rideCounts = data.rideCounts;
        if (data.drinksDetail && typeof data.drinksDetail === 'object') p.drinksDetail = data.drinksDetail;
      }

      // Speichere Avatar-Foto auf Festplatte, falls Base64 Upload
      if (data.avatar && data.avatar.startsWith('data:image')) {
        const savedUrl = saveMediaBase64(data.avatar, `avatar_${p.id}`);
        if (savedUrl) p.avatar = savedUrl;
      }

      if (data.house && !db.houses.includes(data.house)) {
        db.houses.push(data.house);
      }

      // Aktualisiere Name & Avatar in bisherigen Posts und Kommentaren
      db.feed.forEach(post => {
        if (post.userId === p.id) {
          if (p.name) post.userName = p.name;
          if (p.avatar) post.userAvatar = p.avatar;
          if (p.house) post.userHouse = p.house;
        }
        if (post.comments) {
          post.comments.forEach(c => {
            if (c.userId === p.id) {
              if (p.name) c.userName = p.name;
              if (p.avatar) c.userAvatar = p.avatar;
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

  // POST /api/attraction/log (Achterbahn-Fahrt zählen)
  if (pathname === '/api/attraction/log' && req.method === 'POST') {
    parseJsonBody(req, (err, data) => {
      if (err || !data.userId || !data.attrId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Ungültige Daten' }));
        return;
      }

      const player = db.players.find(p => p.id === data.userId);
      if (!player) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Spieler nicht gefunden' }));
        return;
      }

      if (!player.rideCounts) player.rideCounts = {};
      const delta = data.delta !== undefined ? Number(data.delta) : 1;
      const current = player.rideCounts[data.attrId] || 0;
      const newCount = Math.max(0, current + delta);
      player.rideCounts[data.attrId] = newCount;

      if (delta > 0) {
        player.points = (player.points || 0) + (5 * delta);
      } else if (delta < 0 && current > 0) {
        player.points = Math.max(0, (player.points || 0) + (5 * delta));
      }

      saveDb();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        player,
        rideCounts: player.rideCounts,
        points: player.points,
        count: newCount
      }));
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

      // Foto oder Video auf Festplatte speichern falls Base64
      let photoUrl = data.photoBase64;
      if (data.photoBase64 && (data.photoBase64.startsWith('data:image') || data.photoBase64.startsWith('data:video'))) {
        const savedUrl = saveMediaBase64(data.photoBase64, 'quest');
        if (savedUrl) photoUrl = savedUrl;
      }

      const isFaithBased = data.isFaithBased === true;
      if (isFaithBased) {
        player.gutGlaubenCount = (player.gutGlaubenCount || 0) + 1;
      }

      const requiresVoting = data.requiresVoting === true;
      const requiresWitnessPending = data.requiresWitnessPending === true;
      const points = typeof data.points === 'number' ? data.points : 0;

      let initialPoints = 0;
      if (points < 0) {
        // Malus / Minuspunkte sofort abziehen
        initialPoints = points;
        player.points = Math.max(0, (player.points || 0) + points);
      } else if (!requiresVoting && !requiresWitnessPending) {
        initialPoints = points;
        player.points = (player.points || 0) + points;
      }

      if (!player.completedQuests.includes(data.questId)) {
        player.completedQuests.push(data.questId);
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

      const isVideo = photoUrl && (photoUrl.endsWith('.mp4') || photoUrl.endsWith('.webm') || photoUrl.endsWith('.mov'));

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
        points: points,
        basePoints: data.basePoints || points,
        actualPointsAwarded: initialPoints,
        selectedOutcome: data.selectedOutcome || null,
        isFaithBased: isFaithBased,
        witnesses: data.witnesses || [],
        witnessPending: requiresWitnessPending,
        photo: photoUrl || null,
        isVideo: isVideo,
        userComment: data.userComment || "",
        timestamp: new Date().toISOString(),
        requiresVoting: requiresVoting,
        votingLabel: data.votingLabel || "Leistung & Ausführung",
        votes: {},
        votingUnlocked: !requiresVoting && !requiresWitnessPending,
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

  // POST /api/quest/confirm-witness (Zeugen-Bestätigung durch Mitspieler)
  if (pathname === '/api/quest/confirm-witness' && req.method === 'POST') {
    parseJsonBody(req, (err, data) => {
      if (err || !data.feedItemId || !data.witnessUserId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Ungültige Bestätigungs-Daten' }));
        return;
      }

      const item = db.feed.find(f => f.id === data.feedItemId);
      if (!item || !item.witnesses) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Beitrag nicht gefunden' }));
        return;
      }

      const witness = item.witnesses.find(w => w.userId === data.witnessUserId);
      if (!witness) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Zeuge nicht gelistet' }));
        return;
      }

      witness.confirmed = true;
      witness.confirmedAt = new Date().toISOString();

      const author = db.players.find(p => p.id === item.userId);
      if (item.witnessPending && !item.requiresVoting) {
        item.witnessPending = false;
        item.actualPointsAwarded = item.points;
        if (author) {
          author.points = (author.points || 0) + item.points;
        }
      }

      saveDb();

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, feedItem: item, authorPoints: author ? author.points : 0 }));
    });
    return;
  }

  // POST /api/feed/post (Freier Social-Post / Schnappschuss / Video)
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
      if (data.photoBase64 && (data.photoBase64.startsWith('data:image') || data.photoBase64.startsWith('data:video'))) {
        const savedUrl = saveMediaBase64(data.photoBase64, 'post');
        if (savedUrl) photoUrl = savedUrl;
      }

      const isVideo = photoUrl && (photoUrl.endsWith('.mp4') || photoUrl.endsWith('.webm') || photoUrl.endsWith('.mov'));
      // 5 Punkte für einfache Text-Nachricht, 10 Punkte für Bild / Video
      const points = photoUrl ? 10 : 5;
      player.points = (player.points || 0) + points;

      const feedItem = {
        id: "feed_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
        type: "social",
        userId: player.id,
        userName: player.name,
        userAvatar: player.avatar,
        userHouse: player.house,
        text: data.text || (isVideo ? "Video geteilt 🎥" : "Schnappschuss geteilt 📸"),
        photo: photoUrl,
        isVideo: isVideo,
        points: points,
        actualPointsAwarded: points,
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

  // POST /api/counter/log (Getränke / Schnellzähler)
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

      // HINWEIS: Einzelne Drinks werden nicht mehr in den Feed geschoben,
      // damit der Live-Feed übersichtlich für Quests & Schnappschüsse bleibt!
      saveDb();

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        playerPoints: player.points,
        drinksCount: player.drinksCount,
        drinksDetail: player.drinksDetail
      }));
    });
    return;
  }

  // POST /api/achievement/unlock (Meilenstein / Errungenschaft im Live-Feed teilen)
  if (pathname === '/api/achievement/unlock' && req.method === 'POST') {
    parseJsonBody(req, (err, data) => {
      if (err || !data.userId || !data.achievement) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Ungültige Achievement-Daten' }));
        return;
      }

      const player = db.players.find(p => p.id === data.userId);
      if (!player) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Spieler nicht gefunden' }));
        return;
      }

      const sq = data.achievement;
      const feedItem = data.feedItem || {
        id: "feed_achieve_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
        type: "achievement",
        userId: player.id,
        userName: player.name,
        userAvatar: player.avatar,
        userHouse: player.house,
        achievementId: sq.id,
        achievementTitle: sq.title,
        achievementDesc: sq.desc,
        achievementIcon: sq.icon || "🏆",
        points: sq.points || 25,
        actualPointsAwarded: sq.points || 25,
        timestamp: new Date().toISOString(),
        reactions: { "🔥": [], "🍺": [], "👑": [], "💀": [], "👏": [] },
        comments: []
      };

      // Duplikate im Feed vermeiden
      const alreadyExists = db.feed.some(f => f.userId === player.id && f.achievementId === sq.id);
      if (!alreadyExists) {
        db.feed.unshift(feedItem);
        saveDb();
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, feedItem }));
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
        item.votingCompleted = true;
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
      res.end(JSON.stringify({ success: true, item, feedItem: item }));
    });
    return;
  }

  // POST /api/comment (Text & Foto-Antworten)
  if (pathname === '/api/comment' && req.method === 'POST') {
    parseJsonBody(req, (err, data) => {
      if (err || !data.feedId || !data.userId || (!data.text && !data.photoBase64)) {
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

      let photoUrl = null;
      if (data.photoBase64 && (data.photoBase64.startsWith('data:image') || data.photoBase64.startsWith('data:video'))) {
        const savedUrl = saveMediaBase64(data.photoBase64, 'comment');
        if (savedUrl) photoUrl = savedUrl;
      } else if (data.photoBase64 && typeof data.photoBase64 === 'string') {
        photoUrl = data.photoBase64;
      }

      // 2 Punkte für Text-Kommentar, 5 Punkte für Foto-Kommentar
      const commentPoints = photoUrl ? 5 : 2;
      player.points = (player.points || 0) + commentPoints;

      if (!item.comments) item.comments = [];
      const newComment = {
        id: "c_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
        userId: player.id,
        userName: player.name,
        userAvatar: player.avatar,
        text: (data.text || "").trim(),
        photo: photoUrl,
        points: commentPoints,
        timestamp: new Date().toISOString()
      };

      item.comments.push(newComment);
      saveDb();

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, comment: newComment, playerPoints: player.points }));
    });
    return;
  }

  // POST /api/reaction (+5 Punkte für den Beitrags-Autor pro Reaktion)
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
      const postAuthor = db.players.find(p => p.id === item.userId);

      if (idx >= 0) {
        userList.splice(idx, 1);
        if (postAuthor) {
          postAuthor.points = Math.max(0, (postAuthor.points || 0) - 5);
        }
      } else {
        userList.push(data.userId);
        if (postAuthor) {
          postAuthor.points = (postAuthor.points || 0) + 5;
        }
      }

      saveDb();

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, reactions: item.reactions, postAuthorPoints: postAuthor ? postAuthor.points : 0 }));
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

      // Alle Spieler zurücksetzen auf 0 (inkl. Nebenquests & Achterbahn-Zähler)
      db.players.forEach(p => {
        p.points = 0;
        p.drinksCount = 0;
        p.completedQuests = [];
        p.completedSideQuests = [];
        p.rideCounts = {};
        p.drinksDetail = { beer: 0, shot: 0, longdrink: 0, joint: 0, water: 0 };
      });

      // Feed komplett leeren & Spiel reaktivieren
      db.feed = [];
      db.gameStatus = { isRunning: true, startedAt: new Date().toISOString() };
      saveDb();

      broadcastSSE({ type: "SYNC_STATE", state: db });

      console.log("🚨 ADMIN RESET DURCHGEFÜHRT: Alle Punkte, Nebenquests, Feed & Statistiken auf 0 gesetzt!");
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'Spiel vollständig zurückgesetzt', state: db }));
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
