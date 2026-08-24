// agent-worker.js
const Database = require('better-sqlite3');
const db = new Database('mydb.sqlite');

// Helper: sleep function
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function processTask(task) {
  const payload = JSON.parse(task.payload);
  try {
    if (task.type === 'send_welcome') {
      // Example: send welcome email (abhi console log kar rahe hain)
      console.log(`📧 Sending welcome email to ${payload.email} (userId=${payload.userId})`);
      // TODO: integrate nodemailer or any email service here
    } else if (task.type === 'claude_orchestrate') {
      // Example: call Claude/Ruflo orchestration (abhi console log kar rahe hain)
      console.log(`🤖 Running Claude orchestration for userId=${payload.userId}, prompt=${payload.prompt}`);
      // TODO: integrate Claude API / Ruflo logic here
    }

    // Mark task completed
    db.prepare("UPDATE tasks SET status = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?")
      .run('completed', task.id);

  } catch (err) {
    console.error("Task failed:", err.message);
    // Retry logic: increment retries and requeue
    db.prepare("UPDATE tasks SET retries = retries + 1, status = ? WHERE id = ?")
      .run('queued', task.id);
  }
}

(async function loop() {
  while (true) {
    const task = db.prepare("SELECT * FROM tasks WHERE status = 'queued' ORDER BY created_at LIMIT 1").get();
    if (!task) {
      await sleep(2000); // wait 2s if no task
      continue;
    }
    // Mark in progress
    db.prepare("UPDATE tasks SET status = ? WHERE id = ?").run('in_progress', task.id);
    await processTask(task);
  }
})();
