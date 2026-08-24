require("dotenv").config();
const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");
const Database = require("better-sqlite3");

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

const blacklist = [];

// REGISTER
app.post("/auth/register",
  [ body("email").isEmail(), body("password").isLength({ min: 6 }) ],
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
app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const row = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!row) return res.status(401).json({ error: "Invalid credentials" });

  const match = await bcrypt.compare(password, row.password_hash);
  if (!match) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign({ email: row.email }, process.env.JWT_SECRET || "devsecret", { expiresIn: "1h" });
  res.json({ token });
});

// PROFILE
app.get("/auth/profile", (req, res) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ error: "No token" });

  const token = authHeader.split(" ")[1];
  if (blacklist.includes(token)) return res.status(401).json({ error: "Token expired" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "devsecret");
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
  blacklist.push(token);
  res.json({ message: "Logged out" });
});

module.exports = app;
