# auth-tasks-demo
# Auth + Task Queue Demo

## 📌 Overview
Ye project ek simple **authentication system** aur **background task queue** dikhata hai.  
User register hone ke baad tasks enqueue hote hain aur ek worker script unhe process karta hai.

## ✨ Features
- User registration & login with JWT
- SQLite database (`users`, `tasks`)
- Background worker (`agent-worker.js`) for queued jobs
- Flow: Register → Tasks enqueue → Worker process

## 🔄 Project Flow
User Registration → Task Enqueue → Worker Process

+-------------------+
|   User registers  |
|   (POST /register)|
+-------------------+
          |
          v
+-------------------+
|  Insert user in   |
|     SQLite DB     |
+-------------------+
          |
          v
+-------------------+
|  Enqueue tasks in |
|     tasks table   |
+-------------------+
          |
          v
+-------------------+
|  agent-worker.js  |
|  polls tasks and  |
|  processes them   |
+-------------------+
          |
          v
+-------------------+
| Console output /  |
| Email / Future AI |
+-------------------+

## ⚙️ Setup
```bash
# Install dependencies
npm install

# Run server
node app.js

# Run worker
node agent-worker.js
