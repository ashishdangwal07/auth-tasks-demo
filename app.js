require("dotenv").config();
const express = require("express");
const { rateLimit, ipKeyGenerator } = require("express-rate-limit");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");
const Database = require("better-sqlite3");

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is required. Set it in a .env file before starting the server.");
}

const app = express();
app.use(express.json());

const db = new Database('mydb.sqlite');

// Users table
db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

// Tasks table (important!)
db.prepare(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT,
    payload TEXT,
    status TEXT DEFAULT 'queued',
    retries INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

// Token blacklist is persisted in SQLite so logouts continue to work across server restarts.
db.prepare(`
  CREATE TABLE IF NOT EXISTS token_blacklist (
    token TEXT PRIMARY KEY,
    expires_at INTEGER NOT NULL
  )
`).run();
db.prepare("DELETE FROM token_blacklist WHERE expires_at < ?").run(Date.now());

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
  keyGenerator: (req) => ipKeyGenerator(req) || "unknown-ip",
});

// REGISTER
app.post("/auth/register",
  authRateLimiter,
  [
    body("username").trim().notEmpty().withMessage("Username is required").isLength({ min: 3, max: 30 }).withMessage("Username must be between 3 and 30 characters"),
    body("email").isEmail(),
    body("password").isLength({ min: 6 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { username, email, password } = req.body;
    const hashed = await bcrypt.hash(password, 12);

    try {
      const stmt = db.prepare("INSERT INTO users (username,email,password_hash) VALUES (?,?,?)");
      const info = stmt.run(username, email, hashed);
      const newId = info.lastInsertRowid;

      // ✅ Enqueue tasks right after user creation
      const insertTask = db.prepare("INSERT INTO tasks (type,payload) VALUES (?,?)");
      insertTask.run("send_welcome", JSON.stringify({ userId: newId, email }));
      insertTask.run("claude_orchestrate", JSON.stringify({ userId: newId, prompt: "Generate onboarding steps" }));

      res.status(200).json({ message: "User registered", userId: newId });
    } catch (err) {
      res.status(400).json({ error: "Email/Username already exists" });
    }
  }
);

// LOGIN
app.post("/auth/login", authRateLimiter, async (req, res) => {
  const { email, password } = req.body;
  const row = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!row) return res.status(401).json({ error: "Invalid credentials" });

  const match = await bcrypt.compare(password, row.password_hash);
  if (!match) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign({ email: row.email }, process.env.JWT_SECRET, { expiresIn: "1h" });
  res.json({ token });
});

// PROFILE
app.get("/auth/profile", (req, res) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ error: "No token" });

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const isBlacklisted = db.prepare("SELECT 1 FROM token_blacklist WHERE token = ?").get(token);
    if (isBlacklisted) return res.status(401).json({ error: "Token expired" });

    const row = db.prepare("SELECT username,email FROM users WHERE email = ?").get(decoded.email);
    res.json(row);
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
});

// LOGOUT
app.post("/auth/logout", (req, res) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ error: "No token" });

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const expiresAt = Number(decoded.exp) * 1000;
    db.prepare("INSERT OR REPLACE INTO token_blacklist (token, expires_at) VALUES (?, ?)")
      .run(token, expiresAt);
    res.json({ message: "Logged out" });
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
});

module.exports = app;
