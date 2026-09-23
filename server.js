const fs = require("fs");
const path = require("path");
const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const { Pool } = require("pg");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const pgSession = require("connect-pg-simple")(session);
const { initDb, SECTIONS } = require("./db");
const cors = require("cors");

function loadEnvFile() {
  const envPath = path.join(__dirname, ".env");
  if (!fs.existsSync(envPath)) return;
  fs.readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;
      const eq = trimmed.indexOf("=");
      if (eq < 1) return;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!(key in process.env)) process.env[key] = value;
    });
}

loadEnvFile();

const PORT = Number(process.env.PORT) || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || "dev-only-change-me";

const sessionPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (_req, file) => ({
    folder: "lideta-website",
    resource_type: file.mimetype.startsWith("video/") ? "video" : "image",
    public_id: `${Date.now()}-${file.originalname
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9-_]/g, "-")}`,
  }),
});

const upload = multer({
  storage,
  limits: { files: 8, fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) return callback(null, true);
    callback(new Error("Only image and video files are allowed."));
  },
});

function requireOwner(req, res, next) {
  if (req.session && req.session.ownerId) return next();
  return res.status(401).json({ error: "Owner login required." });
}

function validSection(section) {
  return SECTIONS.includes(section);
}

async function main() {
  const db = await initDb();
  const app = express();

  app.set("trust proxy", 1);

  if (process.env.FRONTEND_URL) {
    app.use(cors({
      origin: process.env.FRONTEND_URL,
      credentials: true,
    }));
  }

  app.use(express.json({ limit: "1mb" }));
  app.use(
    session({
      store: new pgSession({
        pool: sessionPool,
        tableName: "user_sessions",
        createTableIfMissing: true,
      }),
      name: "owner.sid",
      secret: process.env.SESSION_SECRET || SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: process.env.FRONTEND_URL ? "none" : "lax",
        secure: Boolean(process.env.FRONTEND_URL),
        maxAge: 1000 * 60 * 60 * 8,
      },
    })
  );

  app.get("/api/auth/me", (req, res) => {
    if (!req.session.ownerId) return res.json({ authenticated: false });
    res.json({ authenticated: true, username: req.session.username });
  });

  app.post("/api/auth/login", async (req, res) => {
    const username = String(req.body.username || "").trim();
    const password = String(req.body.password || "");
    const owner = await db.getOwnerByUsername(username);
    if (!owner || !bcrypt.compareSync(password, owner.password_hash)) {
      return res.status(401).json({ error: "Invalid username or password." });
    }
    req.session.ownerId = owner.id;
    req.session.username = owner.username;
    res.json({ authenticated: true, username: owner.username });
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.clearCookie("owner.sid");
      res.json({ authenticated: false });
    });
  });

  app.get("/api/settings", async (_req, res) => {
    res.json(await db.getSettings());
  });

  app.put("/api/settings", requireOwner, async (req, res) => {
    res.json(await db.updateSettings(req.body || {}));
  });

  function uploadedMedia(files = []) {
    return files.map((file) => ({
      url: file.path,
      name: file.originalname,
      type: file.mimetype,
      publicId: file.filename,
    }));
  }

  function parseMedia(post) {
    if (!post) return { media: [] };
    if (Array.isArray(post.media)) return { ...post, media: post.media };
    try {
      const media = JSON.parse(String(post.media || "[]"));
      return { ...post, media: Array.isArray(media) ? media : [] };
    } catch (_error) {
      return { ...post, media: [] };
    }
  }

  function existingMedia(value) {
    try {
      const media = JSON.parse(String(value || "[]"));
      return Array.isArray(media) ? media : [];
    } catch (_error) {
      return [];
    }
  }

  app.get("/api/content/search", async (req, res) => {
    const query = String(req.query.q || "").trim();
    if (!query) return res.json([]);
    const rows = await db.searchPosts(query);
    res.json(rows.map(parseMedia));
  });

  app.get("/api/content/:section", async (req, res) => {
    if (!validSection(req.params.section)) {
      return res.status(404).json({ error: "Unknown section." });
    }
    const rows = await db.listPosts(req.params.section);
    res.json(rows.map(parseMedia));
  });

  app.post("/api/content/:section", requireOwner, upload.array("media", 8), async (req, res) => {
    if (!validSection(req.params.section)) {
      return res.status(404).json({ error: "Unknown section." });
    }
    const title = String(req.body.title || "").trim();
    const body = String(req.body.body || "").trim();
    if (!title) return res.status(400).json({ error: "Title is required." });
    const post = await db.createPost(req.params.section, title, body, uploadedMedia(req.files));
    res.status(201).json(parseMedia(post));
  });

  app.put("/api/content/:section/:id", requireOwner, upload.array("media", 8), async (req, res) => {
    if (!validSection(req.params.section)) {
      return res.status(404).json({ error: "Unknown section." });
    }
    const id = Number(req.params.id);
    const current = await db.getPost(id);
    if (!current || current.section !== req.params.section) {
      return res.status(404).json({ error: "Item not found." });
    }
    const title = String(req.body.title || "").trim();
    const body = String(req.body.body || "").trim();
    if (!title) return res.status(400).json({ error: "Title is required." });
    const media = existingMedia(req.body.existingMedia).concat(uploadedMedia(req.files));
    const post = await db.updatePost(id, title, body, media);
    res.json(parseMedia(post));
  });

  app.delete("/api/content/:section/:id", requireOwner, async (req, res) => {
    if (!validSection(req.params.section)) {
      return res.status(404).json({ error: "Unknown section." });
    }
    const id = Number(req.params.id);
    const current = await db.getPost(id);
    if (!current || current.section !== req.params.section) {
      return res.status(404).json({ error: "Item not found." });
    }
    await db.deletePost(id);
    res.json({ ok: true });
  });

  app.get("/admin", (req, res) => {
    res.sendFile(path.join(__dirname, "admin.html"));
  });

  app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "login.html"));
  });

  app.use(express.static(__dirname, { extensions: ["html"] }));

  app.use((error, _req, res, _next) => {
    if (error instanceof multer.MulterError || error.message === "Only image and video files are allowed.") {
      return res.status(400).json({ error: error.message });
    }
    console.error(error);
    return res.status(500).json({ error: "Unexpected server error." });
  });

  app.listen(PORT, () => {
    console.log(`Site running at http://localhost:${PORT}`);
    console.log("Owner login: http://localhost:" + PORT + "/login");
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

