const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const zlib = require('zlib');

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
        id: "p_1786747056481_o5jo",
        name: "grossek",
        house: "Haus 1",
        avatar: "assets/mascot_fox.jpg",
        points: 0,
        drinksCount: 0,
        completedQuests: [],
        completedSideQuests: [],
        rideCounts: {},
        drinksDetail: { beer: 0, shot: 0, longdrink: 0, joint: 0, water: 0 },
        gutGlaubenCount: 0,
        sympathyPoints: 0,
        sympathyVotesReceived: []
      }
    ],
    houses: ["Haus 1", "Haus 2", "Haus 3"],
    feed: [],
    happyHour: { active: false, endsAt: null, multiplier: 2 },
    sympathyVotes: {},
    gameStatus: { isRunning: true, isEnded: false, startedAt: new Date().toISOString() },
    deletedPlayerIds: [],
    lastResetTimestamp: null,
    version: 1
  };
}

function isHappyHourActive() {
  if (!db.happyHour || !db.happyHour.active || !db.happyHour.endsAt) return false;
  if (new Date(db.happyHour.endsAt) <= new Date()) {
    db.happyHour.active = false;
    return false;
  }
  return true;
}

function getPointsMultiplier() {
  return isHappyHourActive() ? 2 : 1;
}

let db = getDefaultState();
if (fs.existsSync(DB_FILE)) {
  try {
    db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    if (!Array.isArray(db.deletedPlayerIds)) db.deletedPlayerIds = [];
    if (db.lastResetTimestamp === undefined) db.lastResetTimestamp = null;
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
    // 80MB Limit für hochauflösende Video-Uploads
    if (body.length > 80 * 1024 * 1024) {
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
    const marker = ';base64,';
    const markerIndex = base64Str.indexOf(marker);
    if (markerIndex === -1) return null;

    const mimePart = base64Str.substring(5, markerIndex).toLowerCase();
    const rawData = base64Str.substring(markerIndex + marker.length);
    const dataBuffer = Buffer.from(rawData, 'base64');
    let ext = 'jpg';

    if (mimePart.includes('png')) ext = 'png';
    else if (mimePart.includes('gif')) ext = 'gif';
    else if (mimePart.includes('webp')) ext = 'webp';
    else if (mimePart.includes('svg')) ext = 'svg';
    else if (mimePart.includes('mp4') || mimePart.includes('m4v')) ext = 'mp4';
    else if (mimePart.includes('webm')) ext = 'webm';
    else if (mimePart.includes('quicktime') || mimePart.includes('mov')) ext = 'mov';
    else if (mimePart.includes('video')) ext = 'mp4';

    const filename = `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}.${ext}`;
    const diskPath = path.join(UPLOADS_DIR, filename);
    fs.writeFileSync(diskPath, dataBuffer);
    console.log(`[Media] Saved ${ext} (${(dataBuffer.length / 1024).toFixed(1)} KB) -> /uploads/${filename}`);
    return `/uploads/${filename}`;
  } catch (e) {
    console.error("Fehler beim Speichern der Mediendatei:", e);
    return null;
  }
}

// --- FAST CRC32 & ZERO-DEPENDENCY ZIP GENERATOR ---
const crc32Table = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
  }
  crc32Table[i] = c >>> 0;
}

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crc32Table[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function createZipBuffer(files) {
  const localHeaders = [];
  const centralHeaders = [];
  let offset = 0;

  files.forEach(file => {
    const nameBuffer = Buffer.from(file.name, 'utf-8');
    const rawData = Buffer.isBuffer(file.data) ? file.data : Buffer.from(file.data || '', 'utf-8');
    const crc = crc32(rawData);
    
    let compressedData = zlib.deflateRawSync(rawData);
    let compressionMethod = 8; // DEFLATE
    if (compressedData.length >= rawData.length) {
      compressedData = rawData;
      compressionMethod = 0; // STORE
    }

    const uncompressedSize = rawData.length;
    const compressedSize = compressedData.length;

    const now = new Date();
    const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
    const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();

    // Local Header (30 Bytes + filename length)
    const localHeader = Buffer.alloc(30 + nameBuffer.length);
    localHeader.writeUInt32LE(0x04034b50, 0); // PK\x03\x04
    localHeader.writeUInt16LE(20, 4); // version needed
    localHeader.writeUInt16LE(0x0800, 6); // UTF-8 filename flag
    localHeader.writeUInt16LE(compressionMethod, 8);
    localHeader.writeUInt16LE(dosTime, 10);
    localHeader.writeUInt16LE(dosDate, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(compressedSize, 18);
    localHeader.writeUInt32LE(uncompressedSize, 22);
    localHeader.writeUInt16LE(nameBuffer.length, 26);
    localHeader.writeUInt16LE(0, 28); // extra field len
    nameBuffer.copy(localHeader, 30);

    // Central Directory Header (46 Bytes + filename length)
    const centralHeader = Buffer.alloc(46 + nameBuffer.length);
    centralHeader.writeUInt32LE(0x02014b50, 0); // PK\x01\x02
    centralHeader.writeUInt16LE(20, 4); // version made by
    centralHeader.writeUInt16LE(20, 6); // version needed
    centralHeader.writeUInt16LE(0x0800, 8); // UTF-8 filename flag
    centralHeader.writeUInt16LE(compressionMethod, 10);
    centralHeader.writeUInt16LE(dosTime, 12);
    centralHeader.writeUInt16LE(dosDate, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(compressedSize, 20);
    centralHeader.writeUInt32LE(uncompressedSize, 24);
    centralHeader.writeUInt16LE(nameBuffer.length, 28);
    centralHeader.writeUInt16LE(0, 30); // extra len
    centralHeader.writeUInt16LE(0, 32); // comment len
    centralHeader.writeUInt16LE(0, 34); // disk start
    centralHeader.writeUInt16LE(0, 36); // internal attr
    centralHeader.writeUInt32LE(0, 38); // external attr
    centralHeader.writeUInt32LE(offset, 42); // relative offset of local header
    nameBuffer.copy(centralHeader, 46);

    localHeaders.push(localHeader, compressedData);
    centralHeaders.push(centralHeader);

    offset += localHeader.length + compressedData.length;
  });

  const centralDirOffset = offset;
  let centralDirSize = 0;
  centralHeaders.forEach(ch => centralDirSize += ch.length);

  // End of Central Directory (22 Bytes)
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); // PK\x05\x06
  eocd.writeUInt16LE(0, 4); // disk number
  eocd.writeUInt16LE(0, 6); // start disk
  eocd.writeUInt16LE(files.length, 8); // entries on this disk
  eocd.writeUInt16LE(files.length, 10); // total entries
  eocd.writeUInt32LE(centralDirSize, 12);
  eocd.writeUInt32LE(centralDirOffset, 16);
  eocd.writeUInt16LE(0, 20); // comment len

  return Buffer.concat([...localHeaders, ...centralHeaders, eocd]);
}

function sanitizeFilename(str) {
  return (str || '')
    .replace(/[äÄ]/g, 'ae')
    .replace(/[öÖ]/g, 'oe')
    .replace(/[üÜ]/g, 'ue')
    .replace(/[ß]/g, 'ss')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .substring(0, 35);
}

// --- API ROUTER ---
function handleApiRequest(pathname, req, res) {
  // GET /api/feed/download-zip (Alle Fotos, Videos und Chronik als ZIP herunterladen)
  if (pathname === '/api/feed/download-zip' && req.method === 'GET') {
    try {
      const filesToZip = [];
      const usedFilenames = new Set();

      function getUniqueName(baseName, ext) {
        let candidate = `${baseName}.${ext}`;
        let counter = 1;
        while (usedFilenames.has(candidate)) {
          candidate = `${baseName}_${counter}.${ext}`;
          counter++;
        }
        usedFilenames.add(candidate);
        return candidate;
      }

      // 1. Text-Chronik & Siegerliste zusammenstellen
      const sortedPlayers = [...db.players].sort((a, b) => (b.points || 0) - (a.points || 0));
      let reportText = `======================================================\n`;
      reportText += `👑 WALIBI & FROSCHKÖNIG SAUFTOUR '26 - CHRONIK & MEDIEN\n`;
      reportText += `======================================================\n\n`;
      reportText += `📅 Erstellt am: ${new Date().toLocaleString('de-DE')}\n`;
      reportText += `👥 Teilnehmer:  ${sortedPlayers.length}\n`;
      reportText += `📸 Feed-Posts:  ${db.feed.length}\n\n`;
      reportText += `🏆 RANGLISTE & PUNKTE:\n`;
      reportText += `------------------------------------------------------\n`;
      sortedPlayers.forEach((p, idx) => {
        reportText += `${idx + 1}. ${p.name.padEnd(16)} | ${String(p.points).padStart(4)} Pkt | ${p.drinksCount || 0} Drinks | ${p.house || 'Haus 1'}\n`;
      });
      reportText += `\n------------------------------------------------------\n`;
      reportText += `📜 CHRONOLOGISCHER FEED-VERLAUF:\n`;
      reportText += `------------------------------------------------------\n`;

      db.feed.forEach((item, idx) => {
        const timeStr = item.timestamp ? new Date(item.timestamp).toLocaleTimeString('de-DE') : 'Unbekannt';
        reportText += `[#${idx + 1} | ${timeStr}] ${item.userName} (${item.userHouse || 'Haus 1'}): `;
        if (item.questTitle) reportText += `🎯 ${item.questTitle} (+${item.actualPointsAwarded || item.points || 0} Pkt)\n`;
        if (item.text) reportText += `"${item.text}"\n`;
        if (item.userComment) reportText += `Kommentar: "${item.userComment}"\n`;
        if (item.comments && item.comments.length > 0) {
          item.comments.forEach(c => {
            reportText += `   ↳ 💬 ${c.userName}: "${c.text || ''}"\n`;
          });
        }
        reportText += `\n`;
      });

      filesToZip.push({
        name: `00_Sauftour_2026_Chronik_und_Rangliste.txt`,
        data: Buffer.from(reportText, 'utf-8')
      });

      // 2. Alle Fotos & Videos aus dem Feed sammeln
      let mediaIndex = 1;
      db.feed.forEach(item => {
        const uName = sanitizeFilename(item.userName || 'Spieler');
        const qTitle = sanitizeFilename(item.questTitle || item.text || 'Post');

        // Haupt-Medium (Foto oder Video)
        if (item.photo) {
          let mediaBuffer = null;
          let ext = item.isVideo ? 'mp4' : 'jpg';

          if (item.photo.startsWith('/uploads/')) {
            const diskPath = path.join(UPLOADS_DIR, path.basename(item.photo));
            if (fs.existsSync(diskPath)) {
              mediaBuffer = fs.readFileSync(diskPath);
              ext = path.extname(diskPath).replace('.', '').toLowerCase() || ext;
            }
          } else if (item.photo.startsWith('data:')) {
            const marker = ';base64,';
            const idx = item.photo.indexOf(marker);
            if (idx !== -1) {
              const mime = item.photo.substring(5, idx);
              if (mime.includes('png')) ext = 'png';
              else if (mime.includes('mp4')) ext = 'mp4';
              else if (mime.includes('webm')) ext = 'webm';
              else if (mime.includes('mov')) ext = 'mov';
              mediaBuffer = Buffer.from(item.photo.substring(idx + marker.length), 'base64');
            }
          }

          if (mediaBuffer) {
            const fileName = getUniqueName(`${String(mediaIndex).padStart(2, '0')}_${uName}_${qTitle}`, ext);
            filesToZip.push({ name: `Fotos_und_Videos/${fileName}`, data: mediaBuffer });
            mediaIndex++;
          }
        }

        // Fotos in Kommentaren
        if (Array.isArray(item.comments)) {
          item.comments.forEach(cmt => {
            if (cmt.photo) {
              let cBuffer = null;
              let cExt = 'jpg';
              if (cmt.photo.startsWith('/uploads/')) {
                const diskPath = path.join(UPLOADS_DIR, path.basename(cmt.photo));
                if (fs.existsSync(diskPath)) {
                  cBuffer = fs.readFileSync(diskPath);
                  cExt = path.extname(diskPath).replace('.', '').toLowerCase() || 'jpg';
                }
              } else if (cmt.photo.startsWith('data:')) {
                const marker = ';base64,';
                const idx = cmt.photo.indexOf(marker);
                if (idx !== -1) {
                  cBuffer = Buffer.from(cmt.photo.substring(idx + marker.length), 'base64');
                }
              }
              if (cBuffer) {
                const cName = sanitizeFilename(cmt.userName || 'Antwort');
                const cFileName = getUniqueName(`Kommentar_${String(mediaIndex).padStart(2, '0')}_${cName}`, cExt);
                filesToZip.push({ name: `Fotos_und_Videos/${cFileName}`, data: cBuffer });
                mediaIndex++;
              }
            }
          });
        }
      });

      const zipBuffer = createZipBuffer(filesToZip);
      res.writeHead(200, {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="Walibi_Sauftour_2026_Fotos_Videos.zip"',
        'Content-Length': zipBuffer.length
      });
      res.end(zipBuffer);
      console.log(`📦 [ZIP-Download] ${filesToZip.length} Dateien gepackt (${(zipBuffer.length / 1024 / 1024).toFixed(2)} MB) ausgeliefert!`);
    } catch (e) {
      console.error('Fehler beim Erstellen der ZIP-Datei:', e);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Fehler beim Erstellen des ZIP-Archivs' }));
    }
    return;
  }

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

  // POST /api/attraction/log (Achterbahn-Fahrt zählen - 2x bei Happy Hour)
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

      const multiplier = getPointsMultiplier();
      const pointsPerRide = 5 * multiplier;

      if (delta > 0) {
        player.points = (player.points || 0) + (pointsPerRide * delta);
      } else if (delta < 0 && current > 0) {
        player.points = Math.max(0, (player.points || 0) + (pointsPerRide * delta));
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
      const multiplier = getPointsMultiplier();
      let basePoints = typeof data.basePoints === 'number' ? data.basePoints : (typeof data.points === 'number' ? data.points : 0);
      let calculatedPoints = basePoints;
      if (isFaithBased && basePoints > 0) {
        calculatedPoints = Math.round(basePoints * 0.8);
      }
      const points = calculatedPoints > 0 ? (calculatedPoints * multiplier) : calculatedPoints;

      let initialPoints = 0;
      if (points < 0) {
        // Malus / Minuspunkte sofort abziehen (nicht multiplizieren)
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

      const isVideo = Boolean(photoUrl && (photoUrl.endsWith('.mp4') || photoUrl.endsWith('.webm') || photoUrl.endsWith('.mov') || photoUrl.endsWith('.m4v') || (data.photoBase64 && data.photoBase64.startsWith('data:video'))));

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
        basePoints: basePoints,
        actualPointsAwarded: initialPoints,
        selectedOutcome: data.selectedOutcome || null,
        isFaithBased: isFaithBased,
        isHappyHour: multiplier > 1,
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

      const isVideo = Boolean(photoUrl && (photoUrl.endsWith('.mp4') || photoUrl.endsWith('.webm') || photoUrl.endsWith('.mov') || photoUrl.endsWith('.m4v') || (data.photoBase64 && data.photoBase64.startsWith('data:video'))));
      // 5 Punkte für einfache Text-Nachricht, 10 Punkte für Bild / Video (2x bei Happy Hour)
      const multiplier = getPointsMultiplier();
      const basePoints = photoUrl ? 10 : 5;
      const points = basePoints * multiplier;
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
        basePoints: basePoints,
        actualPointsAwarded: points,
        isHappyHour: multiplier > 1,
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

      let player = db.players.find(p => p.id === data.userId || (data.userName && p.name.toLowerCase() === String(data.userName).toLowerCase()));
      if (!player) {
        if (db.players.length > 0) {
          player = db.players[0];
        } else {
          player = {
            id: data.userId,
            name: data.userName || "Spieler",
            house: "Haus 1",
            avatar: null,
            points: 0,
            drinksCount: 0,
            completedQuests: [],
            completedSideQuests: [],
            rideCounts: {},
            drinksDetail: { beer: 0, shot: 0, longdrink: 0, joint: 0, water: 0 },
            gutGlaubenCount: 0
          };
          db.players.push(player);
        }
      }

      const basePoints = typeof data.points === 'number' ? data.points : 5;
      const points = basePoints * getPointsMultiplier();
      player.points = Number(player.points || 0) + points;
      player.drinksCount = Number(player.drinksCount || 0) + 1;

      // Detailzählung pro Getränk/Item
      if (!player.drinksDetail) {
        player.drinksDetail = { beer: 0, shot: 0, longdrink: 0, joint: 0, water: 0 };
      }
      player.drinksDetail[data.itemId] = Number(player.drinksDetail[data.itemId] || 0) + 1;

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
      const multiplier = getPointsMultiplier();
      const basePoints = typeof data.basePoints === 'number' ? data.basePoints : (sq.points || 25);
      const points = typeof data.points === 'number' ? data.points : (basePoints * multiplier);

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
        points: points,
        basePoints: basePoints,
        actualPointsAwarded: points,
        isHappyHour: multiplier > 1,
        timestamp: new Date().toISOString(),
        reactions: { "🔥": [], "🍺": [], "👑": [], "💀": [], "👏": [] },
        comments: []
      };
      feedItem.points = points;
      feedItem.actualPointsAwarded = points;
      feedItem.isHappyHour = multiplier > 1;

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

      // 2 Punkte für Text-Kommentar, 5 Punkte für Foto-Kommentar (2x bei Happy Hour)
      const baseCommentPoints = photoUrl ? 5 : 2;
      const commentPoints = baseCommentPoints * getPointsMultiplier();
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

  // POST /api/reaction (+5 Punkte für den Beitrags-Autor pro Reaktion, 2x bei Happy Hour)
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
      const reactionPoints = 5 * getPointsMultiplier();

      if (idx >= 0) {
        userList.splice(idx, 1);
        if (postAuthor) {
          postAuthor.points = Math.max(0, (postAuthor.points || 0) - reactionPoints);
        }
      } else {
        userList.push(data.userId);
        if (postAuthor) {
          postAuthor.points = (postAuthor.points || 0) + reactionPoints;
        }
      }

      saveDb();

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, reactions: item.reactions, postAuthorPoints: postAuthor ? postAuthor.points : 0 }));
    });
    return;
  }

  // POST /api/sympathy/vote (Sympathie- & Eisbrecher-Punkte vergeben)
  if (pathname === '/api/sympathy/vote' && req.method === 'POST') {
    parseJsonBody(req, (err, data) => {
      if (err || !data.voterId || !data.votes || typeof data.votes !== 'object') {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Ungültige Sympathie-Voting-Daten' }));
        return;
      }

      let voter = db.players.find(p => p.id === data.voterId || (data.voterName && p.name && p.name.toLowerCase() === String(data.voterName).toLowerCase()));
      if (!voter) {
        if (db.players.length > 0) {
          voter = db.players[0];
        } else {
          voter = { id: data.voterId || "player_1", name: data.voterName || "Spieler", points: 0 };
          db.players.push(voter);
        }
      }

      const activeVoterId = voter.id;
      if (!db.sympathyVotes) db.sympathyVotes = {};
      db.sympathyVotes[activeVoterId] = data.votes;

      // Neuberechnung der Sympathie-Punkte für alle Spieler
      db.players.forEach(player => {
        const received = [];
        let totalSympathyPts = 0;

        Object.keys(db.sympathyVotes).forEach(vid => {
          if (vid === player.id) return; // Eigene Stimmen zählen nicht
          const voterObj = db.players.find(p => p.id === vid);
          const voterVotes = db.sympathyVotes[vid];
          if (voterVotes && voterVotes[player.id]) {
            const voteItem = voterVotes[player.id];
            const rating = Number(voteItem.rating) || 5;
            const pts = typeof voteItem.points === 'number' ? voteItem.points : Math.min(50, Math.max(10, rating * 10));
            totalSympathyPts += pts;
            received.push({
              voterId: vid,
              voterName: voterObj ? voterObj.name : "Mitspieler",
              voterAvatar: voterObj ? voterObj.avatar : null,
              rating: rating,
              points: pts,
              tag: voteItem.tag || null,
              comment: voteItem.comment || null
            });
          }
        });

        const oldSympathyPts = Number(player.sympathyPoints) || 0;
        const diff = totalSympathyPts - oldSympathyPts;

        player.sympathyVotesReceived = received;
        player.sympathyPoints = totalSympathyPts;
        player.points = Math.max(0, (Number(player.points) || 0) + diff);
      });

      saveDb();
      broadcastSSE({ type: "SYMPATHY_VOTES_UPDATED", sympathyVotes: db.sympathyVotes, state: db });

      console.log(`💖 SYMPATHIE-VOTE erhalten von ${voter.name} für ${Object.keys(data.votes).length} Spieler.`);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'Sympathie-Punkte erfolgreich verbucht', players: db.players, sympathyVotes: db.sympathyVotes }));
    });
    return;
  }

  // POST /api/admin/happy-hour (Happy Hour für 1 Stunde aktivieren/deaktivieren)
  if (pathname === '/api/admin/happy-hour' && req.method === 'POST') {
    parseJsonBody(req, (err, data) => {
      if (err || data.code !== '1008') {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Admin-Zugang verweigert' }));
        return;
      }

      if (data.action === 'stop') {
        db.happyHour = { active: false, endsAt: null, multiplier: 2 };
      } else {
        const durationMinutes = Number(data.durationMinutes) || 60;
        db.happyHour = {
          active: true,
          endsAt: new Date(Date.now() + durationMinutes * 60 * 1000).toISOString(),
          multiplier: 2
        };
      }

      saveDb();
      broadcastSSE({ type: "HAPPY_HOUR_UPDATE", happyHour: db.happyHour, state: db });

      console.log(`⚡ HAPPY HOUR UPDATE: Active=${db.happyHour.active}, EndsAt=${db.happyHour.endsAt}`);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, happyHour: db.happyHour }));
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

  // POST /api/sync/restore (Wiederherstellung & Auto-Healing nach Server-Neustart)
  if (pathname === '/api/sync/restore' && req.method === 'POST') {
    parseJsonBody(req, (err, data) => {
      if (err || !data) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Ungültige Restore-Daten' }));
        return;
      }

      if (!Array.isArray(db.deletedPlayerIds)) db.deletedPlayerIds = [];
      let updated = false;

      // 1. Spieler zusammenführen
      if (Array.isArray(data.players)) {
        data.players.forEach(incoming => {
          if (!incoming || !incoming.id) return;
          // Gelöschte Spieler ignorieren
          if (db.deletedPlayerIds.includes(incoming.id)) return;

          const existingIdx = db.players.findIndex(p => p.id === incoming.id);
          if (existingIdx >= 0) {
            const existing = db.players[existingIdx];
            // Merge Werte (höhere Punkte, Quests vereinigen, etc.)
            existing.points = Math.max(Number(existing.points) || 0, Number(incoming.points) || 0);
            existing.drinksCount = Math.max(Number(existing.drinksCount) || 0, Number(incoming.drinksCount) || 0);
            existing.gutGlaubenCount = Math.max(Number(existing.gutGlaubenCount) || 0, Number(incoming.gutGlaubenCount) || 0);
            existing.sympathyPoints = Math.max(Number(existing.sympathyPoints) || 0, Number(incoming.sympathyPoints) || 0);
            if (incoming.name) existing.name = incoming.name;
            if (incoming.avatar) existing.avatar = incoming.avatar;
            if (incoming.house) existing.house = incoming.house;

            if (Array.isArray(incoming.completedQuests)) {
              existing.completedQuests = Array.from(new Set([...(existing.completedQuests || []), ...incoming.completedQuests]));
            }
            if (Array.isArray(incoming.completedSideQuests)) {
              existing.completedSideQuests = Array.from(new Set([...(existing.completedSideQuests || []), ...incoming.completedSideQuests]));
            }
            if (incoming.rideCounts && typeof incoming.rideCounts === 'object') {
              if (!existing.rideCounts) existing.rideCounts = {};
              Object.keys(incoming.rideCounts).forEach(attrId => {
                existing.rideCounts[attrId] = Math.max(Number(existing.rideCounts[attrId]) || 0, Number(incoming.rideCounts[attrId]) || 0);
              });
            }
            if (incoming.drinksDetail && typeof incoming.drinksDetail === 'object') {
              if (!existing.drinksDetail) existing.drinksDetail = { beer: 0, shot: 0, longdrink: 0, joint: 0, water: 0 };
              Object.keys(incoming.drinksDetail).forEach(itemId => {
                existing.drinksDetail[itemId] = Math.max(Number(existing.drinksDetail[itemId]) || 0, Number(incoming.drinksDetail[itemId]) || 0);
              });
            }
          } else {
            // Neuer / wiederherzustellender Spieler
            db.players.push(incoming);
            updated = true;
          }
        });
      }

      // 2. Feed-Einträge zusammenführen
      if (Array.isArray(data.feed)) {
        data.feed.forEach(incomingItem => {
          if (!incomingItem || !incomingItem.id) return;
          if (db.deletedPlayerIds.includes(incomingItem.userId)) return;
          if (db.lastResetTimestamp && incomingItem.timestamp && new Date(incomingItem.timestamp) < new Date(db.lastResetTimestamp)) return;

          const exists = db.feed.some(f => f.id === incomingItem.id);
          if (!exists) {
            db.feed.push(incomingItem);
            updated = true;
          }
        });
        // Neueste Beiträge oben sortieren
        db.feed.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
      }

      saveDb();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, state: db }));
    });
    return;
  }

  // POST /api/admin/reset-game (Punkte, Feed, Drinks & Quests auf 0 zurücksetzen - ALLE SPIELER BEHALTEN)
  if (pathname === '/api/admin/reset-game' && req.method === 'POST') {
    parseJsonBody(req, (err, data) => {
      if (err || data.code !== '1008') {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Admin-Zugang verweigert' }));
        return;
      }

      const resetTime = new Date().toISOString();
      db.lastResetTimestamp = resetTime;
      db.deletedPlayerIds = [];

      // Spieler aus Server-DB und Client-Request sammeln
      const playerMap = new Map();
      (db.players || []).forEach(p => {
        if (p && p.id) playerMap.set(p.id, { ...p });
      });
      if (Array.isArray(data.players)) {
        data.players.forEach(p => {
          if (p && p.id) {
            if (playerMap.has(p.id)) {
              playerMap.set(p.id, { ...playerMap.get(p.id), ...p });
            } else {
              playerMap.set(p.id, { ...p });
            }
          }
        });
      }

      let allPlayers = Array.from(playerMap.values());
      if (allPlayers.length === 0) {
        allPlayers = [
          {
            id: "p_1786747056481_o5jo",
            name: "grossek",
            house: "Haus 1",
            avatar: "assets/mascot_fox.jpg"
          }
        ];
      }

      // Alle bestehenden Spieler behalten, aber Punkte, Getränke und Quests auf 0 setzen
      db.players = allPlayers.map(p => ({
        id: p.id,
        name: p.name,
        house: p.house || "Haus 1",
        avatar: p.avatar || "assets/mascot_fox.jpg",
        points: 0,
        drinksCount: 0,
        completedQuests: [],
        completedSideQuests: [],
        rideCounts: {},
        drinksDetail: { beer: 0, shot: 0, longdrink: 0, joint: 0, water: 0 },
        gutGlaubenCount: 0,
        sympathyPoints: 0,
        sympathyVotesReceived: []
      }));

      // Feed komplett leeren, Sympathie-Votes leeren, Happy Hour stoppen & Spiel reaktivieren
      db.feed = [];
      db.sympathyVotes = {};
      db.happyHour = { active: false, endsAt: null, multiplier: 2 };
      db.gameStatus = { isRunning: true, isEnded: false, startedAt: resetTime };
      saveDb();

      broadcastSSE({ type: "ADMIN_RESET", lastResetTimestamp: resetTime, state: db });

      console.log("🚨 ADMIN RESET DURCHGEFÜHRT: Punkte & Feed auf 0 gesetzt, alle Spieler behalten!");
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'Spielstand auf 0 zurückgesetzt, alle Spieler behalten', state: db }));
    });
    return;
  }

  // POST /api/admin/delete-player (Einzelnen Spieler löschen - NUR ADMIN GROSSEK)
  if (pathname === '/api/admin/delete-player' && req.method === 'POST') {
    parseJsonBody(req, (err, data) => {
      if (err || data.code !== '1008' || !data.playerId) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Admin-Zugang verweigert oder ungültige Daten' }));
        return;
      }

      const targetPlayer = db.players.find(p => p.id === data.playerId);
      if (!targetPlayer) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Spieler nicht gefunden' }));
        return;
      }

      if (targetPlayer.name.toLowerCase() === 'grossek') {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Admin grossek kann nicht gelöscht werden' }));
        return;
      }

      if (!Array.isArray(db.deletedPlayerIds)) db.deletedPlayerIds = [];
      if (!db.deletedPlayerIds.includes(data.playerId)) {
        db.deletedPlayerIds.push(data.playerId);
      }

      // Spieler aus db.players entfernen
      db.players = db.players.filter(p => p.id !== data.playerId);

      // Posts und Kommentare des gelöschten Spielers bereinigen
      db.feed = db.feed.filter(f => f.userId !== data.playerId);
      db.feed.forEach(f => {
        if (f.comments) f.comments = f.comments.filter(c => c.userId !== data.playerId);
        if (f.reactions) {
          Object.keys(f.reactions).forEach(k => {
            f.reactions[k] = f.reactions[k].filter(uId => uId !== data.playerId);
          });
        }
      });

      saveDb();
      broadcastSSE({ type: "PLAYER_DELETED", playerId: data.playerId, deletedPlayerIds: db.deletedPlayerIds, state: db });
      console.log(`🗑️ ADMIN: Spieler "${targetPlayer.name}" (${data.playerId}) gelöscht!`);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: `Spieler ${targetPlayer.name} gelöscht`, players: db.players, deletedPlayerIds: db.deletedPlayerIds }));
    });
    return;
  }

  // POST /api/admin/delete-all-players (Alle Spieler außer Grossek löschen - NUR ADMIN GROSSEK)
  if (pathname === '/api/admin/delete-all-players' && req.method === 'POST') {
    parseJsonBody(req, (err, data) => {
      if (err || data.code !== '1008') {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Admin-Zugang verweigert' }));
        return;
      }

      if (!Array.isArray(db.deletedPlayerIds)) db.deletedPlayerIds = [];
      db.players.forEach(p => {
        if (p.name.toLowerCase() !== 'grossek' && !db.deletedPlayerIds.includes(p.id)) {
          db.deletedPlayerIds.push(p.id);
        }
      });

      let grossek = db.players.find(p => p.name.toLowerCase() === 'grossek');
      if (!grossek) {
        grossek = getDefaultState().players[0];
      } else {
        grossek.points = 0;
        grossek.drinksCount = 0;
        grossek.completedQuests = [];
        grossek.completedSideQuests = [];
        grossek.rideCounts = {};
        grossek.drinksDetail = { beer: 0, shot: 0, longdrink: 0, joint: 0, water: 0 };
        grossek.gutGlaubenCount = 0;
      }

      db.players = [grossek];
      db.feed = [];
      saveDb();

      broadcastSSE({ type: "ALL_PLAYERS_DELETED", deletedPlayerIds: db.deletedPlayerIds, state: db });
      console.log("🗑️ ADMIN: Alle Spieler außer Grossek gelöscht!");
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'Alle Spieler außer Grossek wurden gelöscht', players: db.players, deletedPlayerIds: db.deletedPlayerIds }));
    });
    return;
  }

  // POST /api/reset (NUR MIT ADMIN PIN 1008 ERLAUBT)
  if (pathname === '/api/reset' && req.method === 'POST') {
    parseJsonBody(req, (err, data) => {
      if (err || data.code !== '1008') {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Nur Admin grossek darf das Spiel zurücksetzen' }));
        return;
      }
      db = getDefaultState();
      db.lastResetTimestamp = new Date().toISOString();
      saveDb();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, state: db }));
    });
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
