# 📁 CFMS — Central File Management System

> A full-stack Client-Server file management system built with FastAPI and vanilla JavaScript.

![Status](https://img.shields.io/badge/Status-In%20Progress-blue)
![Python](https://img.shields.io/badge/Python-3.11-green)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-teal)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [API Endpoints](#api-endpoints)
- [Team](#team)
- [Milestones](#milestones)

---

## 🧭 Overview

CFMS is a centralized file management system based on a **Client-Server architecture**. It allows users to upload, download, share, and manage files securely through a web interface. The system supports role-based access control with separate views for regular users and administrators.

**Key Features:**
- 🔐 Secure authentication with JWT tokens
- 📂 File upload, download, and organization
- 🔗 File sharing with permission control
- 👥 User management and role-based access
- 📊 Storage usage tracking
- 🕐 Activity logging

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Backend** | Python 3.11 + FastAPI | REST API server |
| **Frontend** | HTML5 + CSS3 + JavaScript | User interface |
| **Database** | SQLite + SQLAlchemy | Data storage |
| **Auth** | JWT Tokens + bcrypt | Security |
| **Docs** | Swagger UI (auto) | API documentation |

---

## 📁 Project Structure

```
cfms-client-server/
│
├── server/                     # Python FastAPI backend
│   ├── app/
│   │   ├── main.py             # App entry point
│   │   ├── database.py         # DB connection & session
│   │   ├── routers/            # API route handlers
│   │   │   ├── auth.py         # Login & register endpoints
│   │   │   ├── files.py        # File CRUD endpoints
│   │   │   └── users.py        # User management endpoints
│   │   ├── models/             # SQLAlchemy DB models
│   │   │   ├── user.py
│   │   │   └── file.py
│   │   ├── schemas/            # Pydantic request/response schemas
│   │   └── utils/              # Helper functions (hashing, JWT, etc.)
│   └── requirements.txt        # Python dependencies
│
├── client/                     # Frontend (HTML/CSS/JS)
│   ├── pages/
│   │   ├── login.html          # Login & register page
│   │   ├── dashboard.html      # Main file explorer
│   │   └── admin.html          # Admin control panel
│   ├── css/
│   │   ├── style.css           # Global styles & variables
│   │   ├── login.css           # Login page styles
│   │   └── dashboard.css       # Dashboard styles
│   ├── js/
│   │   ├── auth.js             # Authentication & session logic
│   │   ├── dashboard.js        # Dashboard & file management logic
│   │   ├── admin.js            # Admin panel logic
│   │   └── files.js            # File operations helper
│   └── assets/                 # Images & icons
│
└── docs/                       # Documentation & reports
    └── CFMS_Project_Description.docx
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.11+
- A modern web browser
- VS Code with Live Server extension (for frontend)

### Backend Setup

```bash
# 1. Navigate to server folder
cd server

# 2. Install dependencies
pip install -r requirements.txt

# 3. Start the API server
uvicorn app.main:app --reload
```

The API will be running at: `http://localhost:8000`
Auto-generated API docs at: `http://localhost:8000/docs`

### Frontend Setup

```bash
# Open the client folder in VS Code
# Right-click on client/pages/login.html
# Select "Open with Live Server"
```

Or simply open `client/pages/login.html` in your browser.

### Test Credentials (Development Only)
```
Email:    admin@cfms.com
Password: 12345678
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/auth/register` | Register a new user | ❌ |
| `POST` | `/api/auth/login` | Login & get JWT token | ❌ |
| `GET` | `/api/files/` | List all user files | ✅ |
| `POST` | `/api/files/upload` | Upload a file | ✅ |
| `GET` | `/api/files/{id}/download` | Download a file | ✅ |
| `DELETE` | `/api/files/{id}` | Delete a file | ✅ |
| `POST` | `/api/files/{id}/share` | Share a file | ✅ |
| `GET` | `/api/users/me` | Get current user info | ✅ |
| `GET` | `/api/users/` | List all users (admin) | ✅ Admin |

---

## 👥 Team

| Member | Role | Responsibilities |
|--------|------|-----------------|
| **Hussien Fateh** | Backend Developer | FastAPI server, REST API, Database design |
| **Judy Aziz** | Frontend Developer | HTML/CSS/JS, UI/UX, Dashboard & Admin panel |
| **Batoul Hamdan** | Auth & DevOps | JWT authentication, bcrypt, security, deployment |

---

## 📅 Milestones

| Date | Milestone | Status |
|------|-----------|--------|
| April 30, 2026 | Project description + GitHub repo | ✅ Done |
| May 10, 2026 | Final documentation + code upload | 🔄 In Progress |
| May 25, 2026 | 75% of project complete | ⏳ Upcoming |
| June 5, 2026 | 100% complete — final version | ⏳ Upcoming |
| June 5, 2026 | Receive mirror group's project | ⏳ Upcoming |
| June 10, 2026 | Analyze mirror project + propose improvements | ⏳ Upcoming |
| June 20, 2026 | Final version of modified project | ⏳ Upcoming |

### Feature Progress

- [x] Project setup & repository structure
- [x] Frontend login & register page
- [x] Frontend dashboard page
- [ ] Frontend admin panel
- [ ] Authentication system (JWT + bcrypt)
- [ ] File management API
- [ ] Permissions & sharing system
- [ ] API integration (frontend ↔ backend)
- [ ] Final documentation

---

## 🔗 Mirror Group

This project is paired with a **P2P File Sharing** group as part of the Network Programming Applications course. Each group will analyze and propose improvements to the other's project.

---

*Network Programming Applications — 2026*
