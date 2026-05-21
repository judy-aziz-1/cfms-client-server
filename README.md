# 📁 CFMS — Central File Management System

> A full-stack Client-Server file management system built with FastAPI and vanilla JavaScript.

![Status](https://img.shields.io/badge/Status-Completed-brightgreen)
![Python](https://img.shields.io/badge/Python-3.11-green)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-teal)
![SQLite](https://img.shields.io/badge/Database-SQLite-blue)
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
- 🔐 Secure authentication with JWT tokens + bcrypt password hashing
- 📂 File upload, download, delete, and rename
- 🔗 File sharing via unique share tokens (no auth required to access)
- 👥 User management with role-based access (user / admin)
- 📊 Real-time storage usage tracking per user
- 🕐 Full activity logging (upload, download, share, delete, login)
- ⚙ Admin panel with system-wide stats, user ban/unban, file oversight
- 🛡 File size validation (50MB limit) and filename sanitization

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Backend** | Python 3.11 + FastAPI 0.115 | REST API server |
| **Frontend** | HTML5 + CSS3 + JavaScript | User interface |
| **Database** | SQLite + SQLAlchemy 2.0 | Data storage |
| **Auth** | JWT Tokens + bcrypt (passlib) | Security |
| **Docs** | Swagger UI (auto-generated) | API documentation |
| **Server** | Uvicorn (ASGI) | Production-ready async server |

---

## 📁 Project Structure

```
cfms-client-server/
│
├── server/                        # Python FastAPI backend
│   ├── app/
│   │   ├── main.py                # App entry point, CORS, router registration
│   │   ├── database.py            # SQLite connection & SQLAlchemy session
│   │   ├── routers/
│   │   │   ├── auth.py            # Register, Login, JWT, get current user
│   │   │   ├── files.py           # Upload, Download, Delete, Rename, Share
│   │   │   └── users.py           # Profile, Admin: list users, ban, stats
│   │   ├── models/
│   │   │   ├── user.py            # User table (id, name, email, role, is_active)
│   │   │   └── file.py            # File table + ActivityLog table
│   │   ├── schemas/
│   │   │   └── __init__.py        # Pydantic schemas + input validation
│   │   └── utils/
│   │       └── security.py        # bcrypt hashing + JWT encode/decode
│   ├── storage/                   # Uploaded files stored here (gitignored)
│   └── requirements.txt           # Python dependencies
│
├── client/                        # Frontend (HTML/CSS/JS)
│   ├── pages/
│   │   ├── login.html             # Login & register page
│   │   ├── dashboard.html         # Main file explorer
│   │   └── admin.html             # Admin control panel
│   ├── css/
│   │   ├── style.css              # Global styles & CSS variables
│   │   ├── login.css              # Login page styles
│   │   ├── dashboard.css          # Dashboard styles
│   │   └── admin.css              # Admin panel styles
│   ├── js/
│   │   ├── auth.js                # Auth guard, login, register, session management
│   │   ├── dashboard.js           # File management, upload, download, share
│   │   ├── admin.js               # Admin panel — users, files, activity log
│   │   ├── api.js                 # Reserved for future API helper functions
│   │   └── files.js               # Reserved for shared file utilities
│   └── assets/                    # Images & icons
│
└── docs/                          # Documentation & reports
    └── CFMS_Project_Description.docx
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.11 (not 3.12+ due to package compatibility)
- A modern web browser (Chrome, Firefox, Edge)
- VS Code with Live Server extension

### Backend Setup

```bash
# 1. Navigate to server folder
cd server

# 2. Install dependencies
py -3.11 -m pip install -r requirements.txt

# 3. Start the API server
py -3.11 -m uvicorn app.main:app --reload
```

The API will be running at: `http://localhost:8000`
Interactive API docs (Swagger UI): `http://localhost:8000/docs`

> ⚠️ **Note:** If you have multiple Python versions installed, always use `py -3.11` to ensure compatibility with all packages.

### Frontend Setup

1. Open the `client/` folder in VS Code
2. Right-click on `client/pages/login.html`
3. Select **"Open with Live Server"**

The frontend will open at: `http://127.0.0.1:5500/pages/login.html`

> ⚠️ **Important:** Make sure the backend server is running before opening the frontend, otherwise API calls will fail.

### First-Time Setup

The **first user to register automatically becomes admin**. Register with:

```
Name:     Admin User
Email:    admin@cfms.com
Password: 12345678
```

After logging in, the **⚙ Admin Panel** link will appear at the bottom of the dashboard sidebar.

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/auth/register` | Register a new user | ❌ |
| `POST` | `/api/auth/login` | Login & receive JWT token | ❌ |
| `GET`  | `/api/auth/me` | Get current logged-in user | ✅ |

### Files
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET`    | `/api/files/` | List all files for current user | ✅ |
| `POST`   | `/api/files/upload` | Upload one or more files (max 50MB each) | ✅ |
| `GET`    | `/api/files/{id}/download` | Download a file | ✅ |
| `PATCH`  | `/api/files/{id}` | Rename a file | ✅ |
| `DELETE` | `/api/files/{id}` | Delete a file | ✅ |
| `POST`   | `/api/files/{id}/share` | Generate a public share link | ✅ |
| `GET`    | `/api/files/shared/{token}` | Access a shared file (no auth needed) | ❌ |

### Users & Admin
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET`    | `/api/users/me` | Get current user profile | ✅ |
| `GET`    | `/api/users/admin/users` | List all users with file stats | ✅ Admin |
| `PATCH`  | `/api/users/admin/users/{id}` | Update user role or status | ✅ Admin |
| `POST`   | `/api/users/admin/users/{id}/ban` | Toggle ban/unban a user | ✅ Admin |
| `GET`    | `/api/users/admin/files` | List all files in the system | ✅ Admin |
| `DELETE` | `/api/users/admin/files/{id}` | Delete any file | ✅ Admin |
| `GET`    | `/api/users/admin/activity` | View activity log (last 100 entries) | ✅ Admin |
| `GET`    | `/api/users/admin/stats` | Get system-wide statistics | ✅ Admin |

---

## 👥 Team

| Member | Role | Responsibilities |
|--------|------|-----------------|
| **Hussien Fateh** | Backend Developer | FastAPI server, REST API, Database design |
| **Judy Aziz** | Frontend Developer | HTML/CSS/JS, UI/UX, Dashboard, Admin panel, Backend integration |
| **Batoul Hamdan** | Auth & Security | JWT authentication, bcrypt, security, DevOps |

---

## 📅 Milestones

| Date | Milestone | Status |
|------|-----------|--------|
| April 30, 2026 | Project description + GitHub repo setup | ✅ Done |
| May 7, 2026 | Full frontend + backend + API integration complete | ✅ Done |
| May 10, 2026 | Final documentation + code upload | ✅ Done |
| May 25, 2026 | 75% of project complete | ✅ Done ahead of schedule |
| June 5, 2026 | 100% complete — final version | ✅ Done ahead of schedule |
| June 5, 2026 | Receive mirror group's project | ⏳ Upcoming |
| June 10, 2026 | Analyze mirror project + propose improvements | ⏳ Upcoming |
| June 20, 2026 | Final version of modified project | ⏳ Upcoming |

### ✅ Feature Progress

- [x] Project setup & repository structure
- [x] Frontend — Login & register page
- [x] Frontend — Dashboard with file management
- [x] Frontend — Admin panel
- [x] Backend — FastAPI server setup
- [x] Backend — JWT authentication + bcrypt password hashing
- [x] Backend — File upload, download, delete, rename, share
- [x] Backend — Role-based access control (user / admin)
- [x] Backend — Activity logging
- [x] Backend — Admin endpoints (stats, user management, file oversight)
- [x] Frontend ↔ Backend — Full API integration
- [x] Code review & optimization (security, validation, query optimization)
- [x] Final documentation
- [ ] Mirror group project analysis

---

## 🔒 Security Notes

- Passwords are hashed using **bcrypt** — never stored as plain text
- All protected routes require a valid **JWT Bearer token**
- File downloads use secure **fetch + Blob** — token never exposed in URL or browser history
- Filenames are **sanitized** using `os.path.basename()` to prevent path traversal attacks
- File size is **limited to 50MB** per upload
- The **first registered user** automatically becomes admin
- Banned users cannot log in or access any protected endpoint

---

## 🔗 Mirror Group

This project is paired with a **P2P File Sharing** group as part of the Network Programming Applications course. Each group will analyze and propose improvements to the other's project after June 5, 2026.

---

*Network Programming Applications — ITE Program — 2026*
