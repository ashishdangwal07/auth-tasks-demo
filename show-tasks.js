const Database = require('better-sqlite3');
const db = new Database('mydb.sqlite');
const rows = db.prepare("SELECT id,type,payload,status,created_at FROM tasks ORDER BY created_at DESC LIMIT 50").all();
if (!rows.length) {
  console.log('No tasks found.');
} else {
  rows.forEach(r => {
    console.log('---');
    console.log('id:', r.id, 'type:', r.type, 'status:', r.status, 'created_at:', r.created_at);
    try { console.log('payload:', JSON.parse(r.payload)); } catch(e) { console.log('payload:', r.payload); }
  });
}
