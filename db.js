const fs = require("fs");
const path = require("path");
const initSqlJs = require("sql.js");
const bcrypt = require("bcryptjs");

const DATA_DIR = path.join(__dirname, "data");
const DB_PATH = path.join(DATA_DIR, "site.sqlite");

const SECTIONS = ["accomplishments", "general", "services", "focus"];

const SEED_POSTS = {
  accomplishments: [
    {
      title: "የመጀመሪያ የስራ ማስታወሻ",
      body: "ይህ ለሙከራ የተጨመረ መረጃ ነው። ባለቤቱ አዲስ መረጃ ሲጨምር ይህ እና ሌሎች የቆዩ መረጃዎች አብረው ይቀመጣሉ።",
    },
    {
      title: "የወሩ አጠቃላይ መረጃ",
      body: "ይህ ሁለተኛ የሙከራ መረጃ ነው። ርዕሱን በመጫን ዝርዝሩን ማየት ይችላሉ።",
    },
  ],
  general: [
    {
      title: "የመጀመሪያ የስራ ማስታወሻ",
      body: "ይህ ለሙከራ የተጨመረ መረጃ ነው። ባለቤቱ አዲስ መረጃ ሲጨምር ይህ እና ሌሎች የቆዩ መረጃዎች አብረው ይቀመጣሉ።",
    },
    {
      title: "የወሩ አጠቃላይ መረጃ",
      body: "ይህ ሁለተኛ የሙከራ መረጃ ነው። ርዕሱን በመጫን ዝርዝሩን ማየት ይችላሉ።",
    },
  ],
  services: [
    { title: "በአንድ ዕቅድ በአንድ ሪፖርትና አንድ ምዘና ስርዓት መመራት", body: "" },
    { title: "የፓርቲ አሰራር መመሪያዎች ስራ ላይ መዋሉን ማረጋገጥ", body: "" },
    { title: "የኢንስፔክሽን ስራ በየሩብ ዓመት በፓርቲ ተቐማት ላይ መስራት", body: "" },
    { title: "የሱፐርቪዝን ስራ በህብረት ኮሚቴ ማካሄድ", body: "" },
    { title: "የተሰሩ የኢንስፔክሽን እና የሱፐርቪዥን ስራ ግብረመልስ መስጠት", body: "" },
    { title: "የግብረ መልስ ግብረ መልስ መቀበል መስተካከሉን ማረጋገጥ", body: "" },
    { title: "በየ6 ወር የምዘና ስርዓት በማድረግ መልሶ እንዲደራጅ መስራት", body: "" },
    {
      title:
        "የህብረት ኮንፍራንስ በተቀመጠው ግዜ መሰረት ስለመከናወኑና 50+1 መሆኑን ማረጋገጥ እንዲሁም ማሞላት የሚገቡ ዝርዝር ነጥቦችን እንዲያሞሉ ማድረግ",
      body: "",
    },
    { title: "የቤተሰብ ውይይት በወቅቱና 50+1 አባላት በመገኜት ስለመወያየታቸው ማረጋገጥ", body: "" },
    { title: "የአባላትን አቤቱታ መቀበል ማዳመጥና ምላሽ መስጠት", body: "" },
    { title: "የመልካም አስተዳደር እና ብልሹ አሰራር ላይ ትግል እንዲደረግ ማድረግ", body: "" },
    {
      title: "ለፓርቲ አባላት እና ለኮሚሽን ኅብረቶች በተናጥልና በቅንጅት የአቅም ግንባታ ስልጠና መስጠት",
      body: "",
    },
    {
      title: "እሴት ጨማሪ ተግባራት ላይ እና የአደባባይ በዓላት ፣የፓርቲ ንቅናቄዎችን በጋር መስራት",
      body: "",
    },
  ],
  focus: [
    { title: "የፓርቲው ፖለቲካ ጤናማነት መጠበቅ", body: "" },
    { title: "የፓርቲው የፖለቲካ ጥራት እና የስነ ምግባር ጤናማነት ማረጋገጥ", body: "" },
    { title: "የፓርቲ አባላት እና አካላት መፍት ማስጠበቅ", body: "" },
    { title: "የፓርቲ ሀብት እና ሰነድ መጠበቅ ናቸው፡፡", body: "" },
  ],
};

const DEFAULT_SETTINGS = {
  slogan: "ጠንካራ ኢንስፔክሽን ለጠንካራ ፓርቲ!",
  office_name: "ልደታ ክፍለ ከተማ ወረዳ 3 ብልፅግና ኢንስፔክሽን ስነ ምግባር ኮሚሽን ቅ/ፅ/ቤት",
  address_line1: "ልደታ",
  address_line2: "ወረዳ 3",
  phone: "0911383081",
  telegram_label: "ወረዳ 3 ኢንስፔክሽን ስነ ምግባር ኮሚሽን",
  telegram_url: "https://t.me/",
  whatsapp_label: "ልደታ ወረዳ 3 ኢንስፔክሽን ስነ ምግባር",
  whatsapp_url: "https://chat.whatsapp.com/K1g1u3jzcG2LgM83KGckWm?s=cl&p=a&mlu=4&ilr=4",
  copyright: "ልደታ ክፍለ ከተማ ወረዳ 3 ብልፅግና ኢንስፔክሽን ስነ ምግባር ኮሚሽን ቅ/ፅ/ቤት · ስልክ 0911383081",
};

let db;

function persist() {
  if (!db) return;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_PATH, Buffer.from(db.export()));
}

function all(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function get(sql, params = []) {
  return all(sql, params)[0] || null;
}

function run(sql, params = []) {
  db.run(sql, params);
  persist();
}

function seedOwner() {
  const username = process.env.OWNER_USERNAME || "owner";
  const password = process.env.OWNER_PASSWORD || "ChangeMeNow!";
  const existing = get("SELECT id FROM owners WHERE username = ?", [username]);
  const hash = bcrypt.hashSync(password, 12);
  if (existing) {
    const passwordMatches = typeof existing.password_hash === "string" &&
      bcrypt.compareSync(password, existing.password_hash);
    if (!passwordMatches) {
      run("UPDATE owners SET password_hash = ? WHERE id = ?", [hash, existing.id]);
    }
    return;
  }
  run("INSERT INTO owners (username, password_hash) VALUES (?, ?)", [username, hash]);
}

function seedContent() {
  const count = get("SELECT COUNT(*) AS n FROM posts");
  if (count && count.n > 0) return;
  const now = new Date().toISOString();
  SECTIONS.forEach((section) => {
    (SEED_POSTS[section] || []).forEach((item, index) => {
      run(
        "INSERT INTO posts (section, title, body, position, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
        [section, item.title, item.body, index + 1, now, now]
      );
    });
  });
  Object.entries(DEFAULT_SETTINGS).forEach(([key, value]) => {
    run("INSERT INTO settings (key, value) VALUES (?, ?)", [key, value]);
  });
}

async function initDb() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    db = new SQL.Database(fs.readFileSync(DB_PATH));
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS owners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      section TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL DEFAULT '',
      media TEXT NOT NULL DEFAULT '[]',
      position INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
  const postColumns = all("PRAGMA table_info(posts)").map((column) => column.name);
  if (!postColumns.includes("media")) {
    db.run("ALTER TABLE posts ADD COLUMN media TEXT NOT NULL DEFAULT '[]'");
  }
  persist();
  seedOwner();
  seedContent();
  return api;
}

const api = {
  SECTIONS,
  persist,
  getOwnerByUsername(username) {
    return get("SELECT * FROM owners WHERE username = ?", [username]);
  },
  searchPosts(query) {
    const term = `%${String(query || "").trim()}%`;
    return all(
      "SELECT id, section, title, body, media, position, created_at, updated_at FROM posts WHERE title LIKE ? OR body LIKE ? ORDER BY section ASC, position ASC, id ASC",
      [term, term]
    );
  },
  listPosts(section) {
    return all(
      "SELECT id, section, title, body, media, position, created_at, updated_at FROM posts WHERE section = ? ORDER BY position ASC, id ASC",
      [section]
    );
  },
  getPost(id) {
    return get("SELECT * FROM posts WHERE id = ?", [id]);
  },
  createPost(section, title, body, media = []) {
    const now = new Date().toISOString();
    const last = get("SELECT MAX(position) AS n FROM posts WHERE section = ?", [section]);
    const position = (last && last.n ? last.n : 0) + 1;
    run(
      "INSERT INTO posts (section, title, body, media, position, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [section, title, body || "", JSON.stringify(media), position, now, now]
    );
    return get("SELECT * FROM posts WHERE section = ? ORDER BY id DESC LIMIT 1", [section]);
  },
  updatePost(id, title, body, media = []) {
    const now = new Date().toISOString();
    run("UPDATE posts SET title = ?, body = ?, media = ?, updated_at = ? WHERE id = ?", [
      title,
      body || "",
      JSON.stringify(media),
      now,
      id,
    ]);
    return get("SELECT * FROM posts WHERE id = ?", [id]);
  },
  deletePost(id) {
    run("DELETE FROM posts WHERE id = ?", [id]);
  },
  getSettings() {
    const rows = all("SELECT key, value FROM settings");
    const settings = { ...DEFAULT_SETTINGS };
    rows.forEach((row) => {
      settings[row.key] = row.value;
    });
    return settings;
  },
  updateSettings(updates) {
    Object.entries(updates).forEach(([key, value]) => {
      if (!(key in DEFAULT_SETTINGS)) return;
      run(
        "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        [key, String(value)]
      );
    });
    return api.getSettings();
  },
};

module.exports = { initDb, SECTIONS, DEFAULT_SETTINGS };
