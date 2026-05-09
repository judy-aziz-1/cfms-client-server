from fastapi import FastAPI
from app.database import engine, Base
from fastapi.middleware.cors import CORSMiddleware

# استيراد كل الجداول لإنشائها
from app.models import User, File, Folder, Permission, SharedLink, ActivityLog
from app.routers import users   
from app.routers import users, files
from app.routers import users, files,folder, permissions,shared_links,activity

# إنشاء الجداول
Base.metadata.create_all(bind=engine)

app = FastAPI(title="CFMS API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(users.router)
app.include_router(files.router)
app.include_router(folder.router)
app.include_router(permissions.router)
app.include_router(shared_links.router)
app.include_router(activity.router)
@app.get("/")
def root():
    return {"message": "CFMS is running ✅"}