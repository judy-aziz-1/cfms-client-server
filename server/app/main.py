from fastapi import FastAPI
from app.database import engine, Base
from fastapi.middleware.cors import CORSMiddleware

# استيراد كل الجداول لإنشائها
from app.models import User, File, Folder, Permission, SharedLink, ActivityLog
from app.routers import users, files, folder, permissions, shared_links, activity

# إنشاء الجداول
Base.metadata.create_all(bind=engine)

app = FastAPI(title="CFMS API")

# 👇 الإجراء الأمني: تقييد حماية الـ CORS لبيئة النشر والإنتاج
# نحدد العناوين المسموح لها بالوصول إلى الـ Backend فقط (مواقع جودي المعتمدة)
ALLOWED_ORIGINS = [
    "http://127.0.0.1:5500",  # عنوان الـ Live Server الافتراضي لـ VS Code للفرونت إند
    "http://localhost:5500",  # لضمان التوافق إذا تم فتح الرابط عبر localhost
    # يمكنكِ مستقبلاً إضافة دومين الإنتاج الفعلي هنا عند النشر النهائي
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,  # استخدام القائمة المقيدة والآمنة بدلاً من "*"
    allow_credentials=True,
    # تحديد العمليات البرمجية المعتمدة في النظام فقط لمنع العمليات العشوائية غير المرغوبة
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# تسجيل الـ Routers الأساسية للنظام
app.include_router(users.router)
app.include_router(files.router)
app.include_router(folder.router)
app.include_router(permissions.router)
app.include_router(shared_links.router)
app.include_router(activity.router)

@app.get("/")
def root():
    return {"message": "CFMS is running ✅"}