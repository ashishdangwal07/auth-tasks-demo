# Auth + Task Queue Demo

![GitHub stars](https://img.shields.io/github/stars/ashishdangwal07/auth-tasks-demo?style=social)
![GitHub license](https://img.shields.io/github/license/ashishdangwal07/auth-tasks-demo)
![npm version](https://img.shields.io/badge/npm-v10.0.0-blue)

## 📌 Overview
Ye project ek simple **authentication system** aur **background task queue** dikhata hai.  
User register hone ke baad tasks enqueue hote hain aur ek worker script unhe process karta hai.

## 📂 Folder Structure
```text
.
├── .gitignore
├── .env                 # local-only file; set JWT_SECRET before run
├── LICENSE
├── README.md
├── agent-worker.js
├── app.js
├── checkdb.js
├── create-tasks.js
├── jwt-auth.ps1
├── mydb.sqlite          # local SQLite database
├── package.json
├── server.js
├── show-tasks.js
└── test/
    └── auth.test.js
```

## ✨ Features
- User registration & login with JWT
- Rate limiting on login/register (5 requests per 15 min)
- Persistent logout with SQLite-backed token blacklist that survives server restart
- Input validation on username, email, and password
- SQLite database (`users`, `tasks`, `token_blacklist`)
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

# Create a local .env file and set JWT_SECRET before starting the server
# Server won't start without this value.
JWT_SECRET=your_secret_here

# Run the server
npm start

# Run the worker
node agent-worker.js

# Run tests
npm test
```

The server reads `JWT_SECRET` from `.env` on startup. If it is missing, the app exits instead of using a fallback secret.
