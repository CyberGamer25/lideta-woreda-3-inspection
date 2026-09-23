const bcrypt = require("bcryptjs");
const { Pool } = require("pg");

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

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

async function getOwnerByUsername(username) {
  const result = await pool.query("SELECT * FROM owners WHERE username = $1", [username]);
  return result.rows[0] || null;
}

async function seedOwner() {
  const username = process.env.OWNER_USERNAME || "owner";
  const password = process.env.OWNER_PASSWORD || "ChangeMeNow!";
  const existing = await getOwnerByUsername(username);
  const hash = bcrypt.hashSync(password, 12);

  if (existing) {
    const passwordMatches = typeof existing.password_hash === "string" && bcrypt.compareSync(password, existing.password_hash);
    if (!passwordMatches) {
      await pool.query("UPDATE owners SET password_hash = $1 WHERE id = $2", [hash, existing.id]);
    }
    return;
  }

  await pool.query("INSERT INTO owners (username, password_hash) VALUES ($1, $2)", [username, hash]);
}

async function seedContent() {
  const countResult = await pool.query("SELECT COUNT(*) AS n FROM posts");
  if (Number(countResult.rows[0].n) > 0) return;

  const now = new Date().toISOString();
  for (const section of SECTIONS) {
    for (const [index, item] of (SEED_POSTS[section] || []).entries()) {
      await pool.query(
        "INSERT INTO posts (section, title, body, media, position, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [section, item.title, item.body || "", JSON.stringify([]), index + 1, now, now]
      );
    }
  }

  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    await pool.query(
      "INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING",
      [key, String(value)]
    );
  }
}

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS owners (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS posts (
      id SERIAL PRIMARY KEY,
      section TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL DEFAULT '',
      media JSONB NOT NULL DEFAULT '[]'::jsonb,
      position INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_sessions (
      sid TEXT PRIMARY KEY,
      sess JSON NOT NULL,
      expire TIMESTAMPTZ NOT NULL
    );
  `);

  await seedOwner();
  await seedContent();
  return api;
}

const api = {
  SECTIONS,
  async getOwnerByUsername(username) {
    return getOwnerByUsername(username);
  },
  async searchPosts(query) {
    const term = `%${String(query || "").trim()}%`;
    const result = await pool.query(
      "SELECT id, section, title, body, media, position, created_at, updated_at FROM posts WHERE title ILIKE $1 OR body ILIKE $2 ORDER BY section ASC, position ASC, id ASC",
      [term, term]
    );
    return result.rows;
  },
  async listPosts(section) {
    const result = await pool.query(
      "SELECT id, section, title, body, media, position, created_at, updated_at FROM posts WHERE section = $1 ORDER BY position ASC, id ASC",
      [section]
    );
    return result.rows;
  },
  async getPost(id) {
    const result = await pool.query("SELECT * FROM posts WHERE id = $1", [id]);
    return result.rows[0] || null;
  },
  async createPost(section, title, body, media = []) {
    const previous = await pool.query(
      "SELECT COALESCE(MAX(position), 0) + 1 AS position FROM posts WHERE section = $1",
      [section]
    );
    const position = Number(previous.rows[0].position || 1);
    const now = new Date().toISOString();
    const result = await pool.query(
      "INSERT INTO posts (section, title, body, media, position, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [section, title, body || "", JSON.stringify(media || []), position, now, now]
    );
    return result.rows[0];
  },
  async updatePost(id, title, body, media = []) {
    const now = new Date().toISOString();
    const result = await pool.query(
      "UPDATE posts SET title = $1, body = $2, media = $3, updated_at = $4 WHERE id = $5 RETURNING *",
      [title, body || "", JSON.stringify(media || []), now, id]
    );
    return result.rows[0] || null;
  },
  async deletePost(id) {
    await pool.query("DELETE FROM posts WHERE id = $1", [id]);
  },
  async getSettings() {
    const result = await pool.query("SELECT key, value FROM settings");
    const settings = { ...DEFAULT_SETTINGS };
    for (const row of result.rows) {
      settings[row.key] = row.value;
    }
    return settings;
  },
  async updateSettings(updates) {
    for (const [key, value] of Object.entries(updates)) {
      if (!(key in DEFAULT_SETTINGS)) continue;
      await pool.query(
        "INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = excluded.value",
        [key, String(value)]
      );
    }
    return api.getSettings();
  },
};

module.exports = { initDb, SECTIONS, DEFAULT_SETTINGS };
