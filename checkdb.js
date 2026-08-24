const Database = require('better-sqlite3');
const db = new Database('mydb.sqlite');

// sab users fetch karo
const rows = db.prepare('SELECT id, username, email FROM users').all();
console.log(rows);
