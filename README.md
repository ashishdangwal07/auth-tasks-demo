<img width="789" height="737" alt="image" src="https://github.com/user-attachments/assets/66a35330-7d55-45b2-8902-71f8d88cb552" /># Auth + Task Queue Demo

![GitHub stars](https://img.shields.io/github/stars/ashishdangwal07/auth-tasks-demo?style=social)
![GitHub license](https://img.shields.io/github/license/ashishdangwal07/auth-tasks-demo)
![npm version](https://img.shields.io/badge/npm-v10.0.0-blue)

# Auth + Task Queue Demo

## 📌 Overview
Ye project ek simple **authentication system** aur **background task queue** dikhata hai.  
User register hone ke baad tasks enqueue hote hain aur ek worker script unhe process karta hai.
## 📂 Folder Structure
├── app.js
├── agent-worker.js
├── show-tasks.js
├── README.md
├── .gitignore
└── LICENSE


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
