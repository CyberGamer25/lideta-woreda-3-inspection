const fs = require("fs");
const path = require("path");
const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const multer = require("multer");
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
const UPLOAD_DIR = path.join(__dirname, "uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const upload = multer({
  dest: UPLOAD_DIR,
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

  app.post("/api/auth/login", (req, res) => {
    const username = String(req.body.username || "").trim();
    const password = String(req.body.password || "");
    const owner = db.getOwnerByUsername(username);
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

  app.use("/uploads", express.static(UPLOAD_DIR));

  app.get("/api/settings", (_req, res) => {
    res.json(db.getSettings());
  });

  app.put("/api/settings", requireOwner, (req, res) => {
    res.json(db.updateSettings(req.body || {}));
  });

  function uploadedMedia(files = []) {
    return files.map((file) => ({
      url: "/uploads/" + file.filename,
      name: file.originalname,
      type: file.mimetype,
    }));
  }

  function parseMedia(post) {
    if (!post) return { media: [] };
    if (Array.isArray(post.media)) return post;
    try {
      return { ...post, media: JSON.parse(post.media || "[]") };
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

  app.get("/api/content/search", (req, res) => {
    const query = String(req.query.q || "").trim();
    if (!query) return res.json([]);
    res.json(db.searchPosts(query).map(parseMedia));
  });

  app.get("/api/content/:section", (req, res) => {
    if (!validSection(req.params.section)) {
      return res.status(404).json({ error: "Unknown section." });
    }
    res.json(db.listPosts(req.params.section).map(parseMedia));
  });

  app.post("/api/content/:section", requireOwner, upload.array("media", 8), (req, res) => {
    if (!validSection(req.params.section)) {
      return res.status(404).json({ error: "Unknown section." });
    }
    const title = String(req.body.title || "").trim();
    const body = String(req.body.body || "").trim();
    if (!title) return res.status(400).json({ error: "Title is required." });
    res.status(201).json(parseMedia(db.createPost(req.params.section, title, body, uploadedMedia(req.files))));
  });

  app.put("/api/content/:section/:id", requireOwner, upload.array("media", 8), (req, res) => {
    if (!validSection(req.params.section)) {
      return res.status(404).json({ error: "Unknown section." });
    }
    const id = Number(req.params.id);
    const post = db.getPost(id);
    if (!post || post.section !== req.params.section) {
      return res.status(404).json({ error: "Item not found." });
    }
    const title = String(req.body.title || "").trim();
    const body = String(req.body.body || "").trim();
    if (!title) return res.status(400).json({ error: "Title is required." });
    const media = existingMedia(req.body.existingMedia).concat(uploadedMedia(req.files));
    res.json(parseMedia(db.updatePost(id, title, body, media)));
  });

  app.delete("/api/content/:section/:id", requireOwner, (req, res) => {
    if (!validSection(req.params.section)) {
      return res.status(404).json({ error: "Unknown section." });
    }
    const id = Number(req.params.id);
    const post = db.getPost(id);
    if (!post || post.section !== req.params.section) {
      return res.status(404).json({ error: "Item not found." });
    }
    db.deletePost(id);
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

