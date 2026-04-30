# Central File Management System (CFMS)

Central File Management System Based of Client-Server Architecture

## Tech Stack
| Layer | Technology |
|-------|------------|
| Backend | Python 3.11 + FastAPI |
| Frontend | HTML5 + CSS3 + JavaScript |
| Database | SQLite + SQLAlchemy |
| Auth | JWT Tokens + bcrypt |

# Project Structure

cfms-client-server/
├──server/          # Python FastAPI backend
│   ├── app/
│   │   ├── routers/ # API endpoints
│   │   ├── models/  # Database models
│   │   ├── schemas/ # Pydantic schemas
│   │   └── utils/   # Helper functions
│   └── requirements.txt
├── client/          # Frontend (HTML/CSS/JS)
│   ├── pages/       # HTML pages
│   ├── css/         # Stylesheets
│   ├── js/          # JavaScript files
│   └── assets/      # Images & icons
└── docs/            # Documentation

## Team

| Member | Role |
|--------|------|
| Hussien Fateh | Backend + API + Database |
| Judy Aziz | Frontend + UI/UX |
| Batoul Hamdan | Auth + Security + DevOps |

## Getting Started

```bash
# Backend
cd server
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
# Open client/pages/login.html in browser
```

## Milestones

- [x] Project setup & repository
- [ ] Authentication system
- [ ] File management API
- [ ] Frontend pages
- [ ] Permissions system
- [ ] Final documentation
