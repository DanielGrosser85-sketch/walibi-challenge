/**
 * WALIBI HOLLAND PARK MAP (PLATTEGROND 2026) DATASET (BETA)
 * 100% EXAKT an die offizielle Legende und die visuellen Kreise der Karte angepasst.
 */

window.WALIBI_MAP_ZONES = [
  { id: "all", name: "Alle Zonen", color: "#ffcc00", icon: "🌐" },
  { id: "main_street", name: "Main Street", color: "#e11d48", icon: "🔴", range: "i, 1-4 & A-F" },
  { id: "exotic", name: "Exotic", color: "#ea580c", icon: "🟠", range: "5-9 & G" },
  { id: "speed_zone", name: "Speed Zone", color: "#2563eb", icon: "🔵", range: "10-14 & H, i, j" },
  { id: "speed_offroad", name: "Speed Zone Off-Road", color: "#854d0e", icon: "🟤", range: "15-18 & K" },
  { id: "wilderness", name: "Wilderness", color: "#16a34a", icon: "🟢", range: "19-22 & L-O" },
  { id: "zero_zone", name: "Zero Zone", color: "#ca8a04", icon: "🟡", range: "23-29 & P-S" },
  { id: "play_land", name: "Walibi Play Land", color: "#db2777", icon: "🌸", range: "30-35 & T" },
  { id: "play_ground", name: "Play Ground", color: "#0891b2", icon: "💎", range: "36-43 & U-W" },
  { id: "yoy", name: "Neuheit: YOY", color: "#8b5cf6", icon: "✨", range: "Dueling Coaster" }
];

window.WALIBI_MAP_CATEGORIES = [
  { id: "all", name: "Alle Kategorien", icon: "✨" },
  { id: "coaster", name: "Achterbahnen", icon: "🎢" },
  { id: "water", name: "Wasserbahnen", icon: "💧" },
  { id: "thrill", name: "Thrill & Action", icon: "🔥" },
  { id: "family", name: "Familie & Fun", icon: "🎡" },
  { id: "kids", name: "Kids", icon: "👶" },
  { id: "food", name: "Essen & Trinken", icon: "🍔" },
  { id: "shop", name: "Shops & Merch", icon: "🛍️" },
  { id: "service", name: "Services & WC", icon: "ℹ️" }
];

window.WALIBI_MAP_POINTS = [
  // ==========================================
  // 1. MAIN STREET (ROT) - Legende: i, 1-4, A-F
  // ==========================================
  {
    id: "map_i_service",
    num: "i",
    zone: "main_street",
    category: "service",
    name: "Guest Service",
    type: "Gäste-Information",
    x: 74.3,
    y: 84.1,
    desc: "Zentraler Gästeservice am Parkeingang für alle Fragen, Tickets und Fundsachen."
  },
  {
    id: "map_1",
    num: "1",
    zone: "main_street",
    category: "coaster",
    attrId: "attr_xpress",
    name: "Xpress: Platform 13",
    type: "LSM Launch Coaster",
    minHeight: "120 cm",
    fastLane: true,
    speed: "90 km/h",
    height: "25.8 m",
    x: 74.3,
    y: 72.4,
    desc: "Katapultstart aus dem Stand in einen U-Bahn-Tunnel mit 3 Überschlägen und Grusel-Warteschlange."
  },
  {
    id: "map_2",
    num: "2",
    zone: "main_street",
    category: "family",
    attrId: "attr_tour_des_jardins",
    name: "Le Tour des Jardins",
    type: "Oldtimer-Rundfahrt",
    minHeight: "120 cm",
    x: 76.9,
    y: 70.1,
    desc: "Gemütliche Oldtimer-Rundfahrt durch gepflegte Gartenanlagen."
  },
  {
    id: "map_3",
    num: "3",
    zone: "main_street",
    category: "family",
    attrId: "attr_grande_roue",
    name: "La Grande Roue",
    type: "Riesenrad (45m)",
    minHeight: "140 cm",
    x: 72.4,
    y: 53.4,
    desc: "45 Meter hohes Riesenrad mit geschlossenen Gondeln und Panoramablick über ganz Walibi."
  },
  {
    id: "map_4",
    num: "4",
    zone: "main_street",
    category: "family",
    attrId: "attr_pavillon_de_the",
    name: "Pavillon de Thé",
    type: "Drehende Teetassen",
    minHeight: "90 cm",
    x: 70.4,
    y: 51.1,
    desc: "Klassisches Kaffeetassen-Karussell mit drehbaren Steuerrädern für puren Drehwurm."
  },
  {
    id: "map_A",
    num: "A",
    zone: "main_street",
    category: "food",
    name: "The Bakery",
    type: "Bäckerei & Snacks",
    x: 77.5,
    y: 87.6,
    desc: "Frische Croissants, belegte Brötchen, Donuts und heißer Kaffee."
  },
  {
    id: "map_B",
    num: "B",
    zone: "main_street",
    category: "shop",
    name: "Sunset Shop",
    type: "Souvenirs & Merch",
    x: 74.2,
    y: 86.7,
    desc: "Walibi Hoodies, Caps, Pins und coole Festival-Accessoires."
  },
  {
    id: "map_C",
    num: "C",
    zone: "main_street",
    category: "food",
    name: "American Café",
    type: "Burger & Fries",
    x: 74.3,
    y: 79.6,
    desc: "Klassische Burger, knusprige Fries, Shakes und kühles Bier."
  },
  {
    id: "map_D",
    num: "D",
    zone: "main_street",
    category: "food",
    name: "Candy & Cream",
    type: "Süßwaren & Eis",
    x: 74.3,
    y: 76.6,
    desc: "Bunte Bonbons, Fruchtgummis, Schokolade und Softeisbecher."
  },
  {
    id: "map_E",
    num: "E",
    zone: "main_street",
    category: "food",
    name: "Fame Café",
    type: "Lounge & Getränke",
    x: 76.5,
    y: 73.4,
    desc: "Erfrischende Kaltgetränke, Bier und Snacks im modernen Lounge-Stil."
  },
  {
    id: "map_F",
    num: "F",
    zone: "main_street",
    category: "shop",
    name: "Till Ya Drop Shop",
    type: "Haupt-Souvenirshop",
    x: 74.3,
    y: 69.5,
    desc: "Der größte Souvenirshop am Parkausgang für Mitbringsel aller Art."
  },

  // ==========================================
  // 2. EXOTIC (ORANGE) - Legende: 5-9, G
  // ==========================================
  {
    id: "map_5",
    num: "5",
    zone: "exotic",
    category: "water",
    attrId: "attr_el_rio_grande",
    name: "El Rio Grande",
    type: "Rapid River (Rafting)",
    minHeight: "90 cm",
    fastLane: true,
    x: 65.7,
    y: 64.1,
    desc: "375 Meter langes Wildwasser-Rafting in runden Booten durch Wasserfälle und Strudel."
  },
  {
    id: "map_6",
    num: "6",
    zone: "exotic",
    category: "family",
    attrId: "attr_los_sombreros",
    name: "Los Sombreros",
    type: "Mexiko-Hüte Karussell",
    minHeight: "100 cm",
    x: 66.4,
    y: 57.0,
    desc: "Drehende und schwingende mexikanische Riesen-Sombreros mit fetziger Musik."
  },
  {
    id: "map_7",
    num: "7",
    zone: "exotic",
    category: "family",
    attrId: "attr_mini_taxis",
    name: "Mini Taxi's",
    type: "Autoscooter",
    minHeight: "105 cm",
    x: 67.0,
    y: 53.4,
    desc: "Autoscooter-Arena im bunten Taxi-Design für wilde Ramm-Duelle."
  },
  {
    id: "map_8",
    num: "8",
    zone: "exotic",
    category: "coaster",
    attrId: "attr_condor",
    name: "Condor",
    type: "Suspended Looping Coaster",
    minHeight: "140 cm",
    fastLane: true,
    speed: "80 km/h",
    height: "31.0 m",
    x: 63.0,
    y: 55.8,
    desc: "Frei hängende Sitze mit baumelnden Beinen bei 5 rasanten Überschlägen."
  },
  {
    id: "map_9",
    num: "9",
    zone: "exotic",
    category: "food",
    name: "Tequila Taxi's",
    type: "Mexikanische Snacks",
    minHeight: "120 cm",
    x: 67.7,
    y: 49.9,
    desc: "Nachos mit Käsesauce, Tacos und kühle Getränke."
  },
  {
    id: "map_G",
    num: "G",
    zone: "exotic",
    category: "shop",
    name: "Hacienda (Shop)",
    type: "Exotic Shop",
    x: 65.3,
    y: 51.1,
    desc: "Mexiko-Merch, Ponchos und Condor Souvenirs."
  },

  // ==========================================
  // 3. SPEED ZONE (BLAU) - Legende: 10-14, H, i, j
  // ==========================================
  {
    id: "map_10",
    num: "10",
    zone: "speed_zone",
    category: "thrill",
    name: "Game Street",
    type: "Skill Games & Arcade",
    x: 65.7,
    y: 39.8,
    desc: "Geschicklichkeitsstände mit großen Plüschfiguren und Challenges."
  },
  {
    id: "map_11",
    num: "11",
    zone: "speed_zone",
    category: "thrill",
    attrId: "attr_space_shot",
    name: "Space Shot",
    type: "Katapult-Freifallturm (60m)",
    minHeight: "120 cm",
    fastLane: true,
    speed: "85 km/h",
    height: "60.0 m",
    x: 64.7,
    y: 36.8,
    desc: "Druckluft-Raketenstart senkrecht auf 60 Meter mit 4G Beschleunigung."
  },
  {
    id: "map_12",
    num: "12",
    zone: "speed_zone",
    category: "kids",
    attrId: "attr_space_kidz",
    name: "Space Kidz",
    type: "Kinder-Freifallturm",
    minHeight: "90 cm",
    x: 64.3,
    y: 33.3,
    desc: "Sanfter Hüpf- und Freifallturm für jüngere Astronauten."
  },
  {
    id: "map_13",
    num: "13",
    zone: "speed_zone",
    category: "thrill",
    attrId: "attr_g_force",
    name: "G-Force",
    type: "Enterprise (Looping)",
    minHeight: "120 cm",
    speed: "45 km/h",
    height: "20.0 m",
    x: 62.3,
    y: 34.4,
    desc: "Rotierendes Rad, das sich senkrecht stellt – ohne Bügel nur durch Fliehkraft gehalten!"
  },
  {
    id: "map_14",
    num: "14",
    zone: "speed_zone",
    category: "coaster",
    attrId: "attr_goliath",
    name: "Goliath",
    type: "Mega Coaster (Stahl)",
    minHeight: "140 cm",
    fastLane: true,
    speed: "106 km/h",
    height: "46.8 m",
    length: "1.214 m",
    x: 55.9,
    y: 52.3,
    desc: "Das legendäre lila Monster! 46 Meter First Drop und Stengel-Dives über dem See."
  },
  {
    id: "map_H_mission",
    num: "H",
    zone: "speed_zone",
    category: "food",
    name: "Mission Control",
    type: "Speed Snacks",
    x: 64.3,
    y: 39.8,
    desc: "Currywurst, Pommes frites und Softdrinks."
  },
  {
    id: "map_i_goliath_kiosk",
    num: "i",
    zone: "speed_zone",
    category: "food",
    name: "Goliath Kiosk",
    type: "Erfrischungsstand",
    x: 57.4,
    y: 52.3,
    desc: "Kühles Dosenbier, Cola und Energy Drinks direkt am Goliath-Ausgang."
  },
  {
    id: "map_j_goliath_shop",
    num: "j",
    zone: "speed_zone",
    category: "shop",
    name: "Goliath Shop",
    type: "Goliath Merch & Onride",
    x: 55.9,
    y: 55.2,
    desc: "Dein Highspeed-Foto und originale Goliath T-Shirts."
  },

  // ==========================================
  // 4. SPEED ZONE OFF ROAD (DUNKEL / BRAUN) - Legende: 15-18, K
  // ==========================================
  {
    id: "map_15",
    num: "15",
    zone: "speed_offroad",
    category: "family",
    attrId: "attr_wind_dancer",
    name: "Wind Seekers",
    type: "Windstarz Flugkarussell",
    minHeight: "90 cm",
    x: 60.3,
    y: 39.8,
    desc: "Interaktives Segelflieger-Karussell – steuere deine Flughöhe selbst!"
  },
  {
    id: "map_16",
    num: "16",
    zone: "speed_offroad",
    category: "coaster",
    attrId: "attr_eat_my_dust",
    name: "Eat my Dust",
    type: "Junior Coaster",
    minHeight: "90 cm",
    speed: "40 km/h",
    height: "11.0 m",
    x: 58.9,
    y: 43.3,
    desc: "Flotte Quad-Achterbahn mit dynamischen Hügeln und Offroad-Feeling."
  },
  {
    id: "map_17",
    num: "17",
    zone: "speed_offroad",
    category: "kids",
    name: "Play Area Off-Road",
    type: "Abenteuer-Spielplatz",
    minHeight: "110 cm",
    x: 58.9,
    y: 34.4,
    desc: "Kletterparcours für Kids im coolen Baustellen-Look."
  },
  {
    id: "map_18",
    num: "18",
    zone: "speed_offroad",
    category: "kids",
    name: "Cool Down",
    type: "Wasserspielplatz",
    x: 60.3,
    y: 36.8,
    desc: "Wasserfontänen und Spritzdüsen zum Erfrischen."
  },
  {
    id: "map_K_food",
    num: "K",
    zone: "speed_offroad",
    category: "food",
    name: "Food & Drinks (Off-Road)",
    type: "Snack Bar",
    x: 56.9,
    y: 38.6,
    desc: "Eis, kühle Drinks und Knabbereien."
  },

  // ==========================================
  // 5. WILDERNESS (GRÜN) - Legende: 19-22, L-O
  // ==========================================
  {
    id: "map_19",
    num: "19",
    zone: "wilderness",
    category: "thrill",
    attrId: "attr_skydiver",
    name: "Skydiver",
    type: "Skycoaster (Bungee-Flug)",
    minHeight: "155 cm",
    speed: "100 km/h",
    height: "54.0 m",
    x: 66.7,
    y: 39.8,
    desc: "Auf 54 Meter hochgezogen werden und die Ausklinkleine selbst ziehen – Bungee pur!"
  },
  {
    id: "map_20",
    num: "20",
    zone: "wilderness",
    category: "coaster",
    attrId: "attr_untamed",
    name: "UNTAMED",
    type: "RMC Hybrid Coaster",
    minHeight: "120 cm",
    fastLane: true,
    speed: "92 km/h",
    height: "36.5 m",
    inversions: 5,
    x: 71.8,
    y: 30.9,
    desc: "Die Königin von Walibi! 5 Inversionen, 14 Airtime-Momente und 80-Grad Drop."
  },
  {
    id: "map_21",
    num: "21",
    zone: "wilderness",
    category: "family",
    attrId: "attr_merlins_castle",
    name: "Merlin's Magic Castle",
    type: "Madhouse (Illusion)",
    minHeight: "90 cm",
    fastLane: true,
    x: 68.4,
    y: 45.7,
    desc: "Schwerkraft-Illusion: Der gesamte Raum dreht sich scheinbar überkopf."
  },
  {
    id: "map_22",
    num: "22",
    zone: "wilderness",
    category: "thrill",
    attrId: "attr_blast",
    name: "Blast",
    type: "Top Spin",
    minHeight: "140 cm",
    fastLane: true,
    x: 72.1,
    y: 49.9,
    desc: "Wilde Überkopf-Loopings auf der schaukelnden Sitzbank über Wasserfontänen."
  },
  {
    id: "map_L",
    num: "L",
    zone: "wilderness",
    category: "food",
    name: "Toast 'n Wrap",
    type: "Wraps & Panini",
    x: 69.7,
    y: 29.7,
    desc: "Herzhafte Wraps, getoastete Sandwiches und Kaffeespezialitäten."
  },
  {
    id: "map_M",
    num: "M",
    zone: "wilderness",
    category: "shop",
    name: "Wilderness Shop",
    type: "Untamed Merch",
    x: 67.7,
    y: 30.9,
    desc: "Untamed T-Shirts, Caps, Hoodies und Onride-Fotos."
  },
  {
    id: "map_N",
    num: "N",
    zone: "wilderness",
    category: "food",
    name: "Cock-a-Doodle-Doo",
    type: "Crispy Chicken Bar",
    x: 72.1,
    y: 34.4,
    desc: "Knusprige Chicken Wings, Crispy Burger und Pommes."
  },
  {
    id: "map_O",
    num: "O",
    zone: "wilderness",
    category: "food",
    name: "The Answer is Pizza",
    type: "Pizzeria & Bier",
    x: 73.5,
    y: 54.0,
    desc: "Frische Steinofen-Pizza-Stücke und eiskaltes Bier für die Tour!"
  },

  // ==========================================
  // 6. ZERO ZONE (GELB) - Legende: 23-29, P-S
  // ==========================================
  {
    id: "map_23",
    num: "23",
    zone: "zero_zone",
    category: "family",
    attrId: "attr_walibi_express",
    name: "Walibi Express (Zero Zone)",
    type: "Park-Eisenbahn",
    minHeight: "120 cm",
    x: 81.9,
    y: 62.9,
    desc: "Ruhige Panoramazug-Station zur Fahrt durch den gesamten Park."
  },
  {
    id: "map_24",
    num: "24",
    zone: "zero_zone",
    category: "kids",
    name: "Play Area Zero",
    type: "Spielbereich",
    minHeight: "110 cm",
    x: 83.9,
    y: 60.6,
    desc: "Klettern, Rutschen und Toben."
  },
  {
    id: "map_25",
    num: "25",
    zone: "zero_zone",
    category: "water",
    attrId: "attr_crazy_river",
    name: "Crazy River",
    type: "Wildwasserbahn (3 Drops)",
    minHeight: "90 cm",
    fastLane: true,
    height: "23.0 m",
    x: 79.9,
    y: 53.4,
    desc: "Baumstamm-Rundfahrt mit 3 Abfahrten und Rückwärts-Rutsche – garantiert nass!"
  },
  {
    id: "map_26",
    num: "26",
    zone: "zero_zone",
    category: "coaster",
    attrId: "attr_lost_gravity",
    name: "Lost Gravity",
    type: "BigDipper Coaster",
    minHeight: "140 cm",
    fastLane: true,
    speed: "87 km/h",
    height: "32.0 m",
    inversions: 2,
    x: 89.4,
    y: 54.6,
    desc: "Freischwebende Wing-Sitze, Schwerelosigkeit und intensive Schrauben."
  },
  {
    id: "map_27",
    num: "27",
    zone: "zero_zone",
    category: "thrill",
    name: "Games Zero Zone",
    type: "Game Street",
    x: 87.3,
    y: 53.4,
    desc: "Basketball-Werfen, Dosenwerfen und Gewinnspiel-Stände."
  },
  {
    id: "map_28",
    num: "28",
    zone: "zero_zone",
    category: "coaster",
    attrId: "attr_drako",
    name: "Drako",
    type: "Family Coaster",
    minHeight: "90 cm",
    speed: "32 km/h",
    x: 87.0,
    y: 51.1,
    desc: "Zwei flotte Runden mit dem bunten Drachenzug – perfekt zum Vorglühen."
  },
  {
    id: "map_29",
    num: "29",
    zone: "zero_zone",
    category: "thrill",
    attrId: "attr_tomahawk",
    name: "The Tomahawk",
    type: "Frisbee Schaukel",
    minHeight: "120 cm",
    x: 88.4,
    y: 56.4,
    desc: "Schaukelnde Riesenscheibe mit 120 Grad Pendelwinkel und Eigenrotation."
  },
  {
    id: "map_P",
    num: "P",
    zone: "zero_zone",
    category: "food",
    name: "Dizzies Ice Cream",
    type: "Eis-Spezialitäten",
    x: 83.9,
    y: 56.4,
    desc: "Softeis mit Streuseln, Shakes und Waffeln."
  },
  {
    id: "map_Q",
    num: "Q",
    zone: "zero_zone",
    category: "shop",
    name: "Lost Gravity Shop",
    type: "Lost Gravity Merch",
    x: 83.6,
    y: 52.9,
    desc: "Neon-Accessoires, Onride-Fotos und Coaster-Poster."
  },
  {
    id: "map_R",
    num: "R",
    zone: "zero_zone",
    category: "food",
    name: "Döner Kebab",
    type: "Kebab & Türkische Snacks",
    x: 85.0,
    y: 52.9,
    desc: "Frischer Döner, Dürüm Kebab und Pommes spezial."
  },
  {
    id: "map_S",
    num: "S",
    zone: "zero_zone",
    category: "food",
    name: "Zero Zone Kiosk",
    type: "Kiosk & Getränke",
    x: 84.6,
    y: 55.2,
    desc: "Snacks, Riegel, Bier und Kaltgetränke."
  },

  // ==========================================
  // 7. WALIBI PLAY LAND (PINK) - Legende: 30-35, T
  // ==========================================
  {
    id: "map_30",
    num: "30",
    zone: "play_land",
    category: "kids",
    name: "W.A.B. World Tour",
    type: "Kinder-Eisenbahn",
    minHeight: "105 cm",
    x: 87.3,
    y: 58.2,
    desc: "Musikalische Mini-Bahn rund um Walibi und seine Band."
  },
  {
    id: "map_31",
    num: "31",
    zone: "play_land",
    category: "kids",
    name: "Zenko's Graffiti Shuttle",
    type: "Hubschrauber-Flug",
    minHeight: "105 cm",
    x: 86.7,
    y: 62.9,
    desc: "Bunte Gondeln, die sich per Hebel nach oben und unten steuern lassen."
  },
  {
    id: "map_32",
    num: "32",
    zone: "play_land",
    category: "kids",
    name: "Fibi's Bubble Swirl",
    type: "Wasserblasen-Karussell",
    minHeight: "105 cm",
    x: 86.0,
    y: 57.6,
    desc: "Sanftes Dreh-Karussell für Kinder."
  },
  {
    id: "map_33",
    num: "33",
    zone: "play_land",
    category: "kids",
    name: "Haaz' Garage",
    type: "Mini-Fahrschule",
    minHeight: "105 cm",
    x: 86.3,
    y: 66.5,
    desc: "Kleine Autos zum Selbstlenken auf dem Parcours."
  },
  {
    id: "map_34",
    num: "34",
    zone: "play_land",
    category: "kids",
    name: "Walibi's Fun Recorder",
    type: "Musik-Karussell",
    minHeight: "105 cm",
    x: 85.3,
    y: 62.9,
    desc: "Drehendes Karussell mit lustigen Soundeffekten."
  },
  {
    id: "map_35",
    num: "35",
    zone: "play_land",
    category: "kids",
    name: "Squad's Stunt Flight",
    type: "Flugzeug-Rundflug",
    minHeight: "90 cm",
    x: 85.3,
    y: 60.0,
    desc: "Flugzeuge im Kreis mit kleiner Steigung."
  },
  {
    id: "map_T",
    num: "T",
    zone: "play_land",
    category: "food",
    name: "Donut Factory",
    type: "Donuts & Süßes",
    x: 88.0,
    y: 57.6,
    desc: "Bunt glasierte Donuts und Kaffee."
  },

  // ==========================================
  // 8. PLAY GROUND (CYAN) - Legende: 36-43, U-W
  // ==========================================
  {
    id: "map_36",
    num: "36",
    zone: "play_ground",
    category: "water",
    attrId: "attr_splash_battle",
    name: "Splash Battle",
    type: "Interaktive Wasser-Schlacht",
    minHeight: "90 cm",
    x: 83.9,
    y: 62.4,
    desc: "Bootsfahrt mit Wasserkanonen – spritze auf Ziele und die Zuschauer am Ufer!"
  },
  {
    id: "map_37",
    num: "37",
    zone: "play_ground",
    category: "kids",
    name: "Play Castle",
    type: "Kletterburg",
    minHeight: "125 cm",
    x: 81.6,
    y: 63.5,
    desc: "Mehrstöckiges Kletterparadies mit Röhrenrutschen."
  },
  {
    id: "map_38",
    num: "38",
    zone: "play_ground",
    category: "thrill",
    attrId: "attr_spinning_vibe",
    name: "Spinning Vibe",
    type: "Magic Breakdance",
    minHeight: "120 cm",
    x: 82.3,
    y: 67.1,
    desc: "Rasanter Breakdance-Kreisel zu Festival-Beats."
  },
  {
    id: "map_39",
    num: "39",
    zone: "play_ground",
    category: "coaster",
    attrId: "attr_speed_of_sound",
    name: "Speed of Sound",
    type: "Boomerang Coaster",
    minHeight: "120 cm",
    fastLane: true,
    speed: "75.6 km/h",
    height: "35.5 m",
    inversions: 6,
    x: 84.3,
    y: 76.6,
    desc: "Rast vorwärts durch Looping und Cobra Roll – und dann die gesamte Strecke rückwärts!"
  },
  {
    id: "map_40",
    num: "40",
    zone: "play_ground",
    category: "water",
    name: "Water Chat",
    type: "Wasserspielplatz",
    x: 82.9,
    y: 73.0,
    desc: "Wasserfontänen und interaktive Spritzdüsen."
  },
  {
    id: "map_41",
    num: "41",
    zone: "play_ground",
    category: "family",
    attrId: "attr_merrie_goround",
    name: "Merrie Go'Round",
    type: "Historisches Karussell",
    minHeight: "120 cm",
    x: 80.9,
    y: 74.2,
    desc: "Wunderschönes traditionelles Karussell mit handgeschnitzten Pferden."
  },
  {
    id: "map_42",
    num: "42",
    zone: "play_ground",
    category: "family",
    attrId: "attr_super_swing",
    name: "Super Swing",
    type: "Wellenflug Kettenkarussell",
    minHeight: "100 cm",
    x: 80.9,
    y: 68.9,
    desc: "Schwinge durch die Lüfte im klassischen Wellenflug-Kettenkarussell."
  },
  {
    id: "map_43",
    num: "43",
    zone: "play_ground",
    category: "family",
    attrId: "attr_walibi_express",
    name: "Walibi Express (Play Ground)",
    type: "Park-Eisenbahn",
    minHeight: "120 cm",
    x: 78.9,
    y: 71.3,
    desc: "Hauptbahnhof der Park-Eisenbahn direkt im Play Ground."
  },
  {
    id: "map_U",
    num: "U",
    zone: "play_ground",
    category: "food",
    name: "Chiptwister",
    type: "Kartoffel-Spiralen",
    x: 82.6,
    y: 62.4,
    desc: "Frittierte Spiralkartoffeln am Spieß mit Salz, Paprika oder BBQ."
  },
  {
    id: "map_V",
    num: "V",
    zone: "play_ground",
    category: "food",
    name: "Sugar Shot",
    type: "Churros & Slush",
    x: 83.6,
    y: 69.5,
    desc: "Frische warme Churros mit Zimtzucker und bunte Slush-Eis-Sorten."
  },
  {
    id: "map_W",
    num: "W",
    zone: "play_ground",
    category: "food",
    name: "Yummy Tummy",
    type: "Food Court & Lounge",
    x: 82.6,
    y: 75.4,
    desc: "Große Food-Halle mit asiatischen Nudeln, Döner, Tacos und Cocktails."
  },

  // ==========================================
  // NEUHEIT 2025: YOY (DUELING SINGLE-RAIL)
  // ==========================================
  {
    id: "map_yoy_chill",
    num: "YOY-1",
    zone: "yoy",
    category: "coaster",
    attrId: "attr_yoy_chill",
    name: "YOY (Track: Chill)",
    type: "Dueling Single-Rail Coaster",
    minHeight: "120 cm",
    fastLane: true,
    speed: "75 km/h",
    height: "30.0 m",
    x: 57.2,
    y: 63.5,
    desc: "Grüne Spur: Geschmeidiger Flow, Near-Miss Überholmanöver und Airtime-Wellen!"
  },
  {
    id: "map_yoy_thrill",
    num: "YOY-2",
    zone: "yoy",
    category: "coaster",
    attrId: "attr_yoy_thrill",
    name: "YOY (Track: Thrill)",
    type: "Dueling Single-Rail Coaster",
    minHeight: "130 cm",
    fastLane: true,
    speed: "82 km/h",
    height: "30.0 m",
    inversions: 4,
    x: 57.8,
    y: 64.5,
    desc: "Violette Spur: 4 spektakuläre Single-Rail Inversionen und Zero-G Überkopf-Duelle!"
  },

  // ==========================================
  // SERVICES, EHBO & TOILETTEN
  // ==========================================
  {
    id: "map_ehbo",
    num: "EHBO",
    zone: "play_ground",
    category: "service",
    name: "EHBO Erste Hilfe (AED)",
    type: "Sanitätsstation & AED",
    x: 85.0,
    y: 64.7,
    desc: "Zentrale Erste-Hilfe-Station mit Sanitätern und Notfallversorgung."
  },
  {
    id: "map_wc_main",
    num: "WC",
    zone: "main_street",
    category: "service",
    name: "Toiletten Main Street",
    type: "WC & Barrierefrei",
    x: 73.8,
    y: 78.4,
    desc: "Saubere WCs am Parkeingang mit barrierefreiem Zugang."
  },
  {
    id: "map_wc_speed",
    num: "WC",
    zone: "speed_zone",
    category: "service",
    name: "Toiletten Speed Zone",
    type: "WC Station",
    x: 64.0,
    y: 51.1,
    desc: "WCs nahe Condor und Speed Zone."
  },
  {
    id: "map_wc_wilderness",
    num: "WC",
    zone: "wilderness",
    category: "service",
    name: "Toiletten Wilderness",
    type: "WC Station",
    x: 72.4,
    y: 40.4,
    desc: "WCs nahe Untamed und Merlin's Magic Castle."
  },
  {
    id: "map_wc_play",
    num: "WC",
    zone: "play_ground",
    category: "service",
    name: "Toiletten Play Ground",
    type: "WC Station",
    x: 82.3,
    y: 76.6,
    desc: "WCs nahe Speed of Sound und Spinning Vibe."
  },
  {
    id: "map_lockers",
    num: "🎒",
    zone: "main_street",
    category: "service",
    name: "Gepäckschließfächer (Lockers)",
    type: "Bagagekluis",
    x: 74.2,
    y: 86.7,
    desc: "Elektronische Schließfächer für Rucksäcke und Taschen."
  },
  {
    id: "map_atm",
    num: "🏧",
    zone: "main_street",
    category: "service",
    name: "Geldautomat (Pinautomaat)",
    type: "ATM",
    x: 74.3,
    y: 84.1,
    desc: "Bargeldabhebung direkt am Eingang."
  }
];
