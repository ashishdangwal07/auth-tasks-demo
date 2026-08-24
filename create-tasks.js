// create-tasks.js
const Database = require('better-sqlite3');
const db = new Database('mydb.sqlite');

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

console.log('tasks table ready');
