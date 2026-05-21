from fastapi import APIRouter, Depends, HTTPException, status,UploadFile, File as FastAPIFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.file import File
from app.models.activity_log import ActivityLog
from app.schemas.schemas import FileRead
from typing import List
import os
import shutil
from sqlalchemy.orm import Session
# 👇 الخطوة 1: استيراد الدوال الأمنية في ملف security.py
from utils.security import sanitize_filename, generate_share_token

router = APIRouter(prefix="/files", tags=["Files"])

# مجلد حفظ الملفات
STORAGE_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "storage")


# ───────────────────────────────
# رفع ملف
# ───────────────────────────────

router = APIRouter()
# حد الحجم الأقصى المسموح به: 50 ميغابايت تحول إلى بايتس (50 * 1024 * 1024)
MAX_FILE_SIZE = 52428800 

@router.post("/upload")
async def upload_file(
    file: UploadFile,
    owner_id: int,
    folder_id: int = None,
    db: Session = Depends(get_db)
):
    # 👇 الإجراء الأمني الأول: التحقق من حجم الملف (File Size Limit) قبل المعالجة
    # نقرأ المحتوى لمعرفة حجمه الفعلي برمجياً
    content = await file.read()
    file_size = len(content)
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="حجم الملف كبير جداً! الحد الأقصى المسموح به هو 50 ميغابايت."
        )
    
    # إعادة مؤشر القراءة للبداية حتى نتمكن من نسخ الملف للقرص بنجاح
    await file.seek(0)

    # تأكد أن مجلد storage موجود
    os.makedirs(STORAGE_PATH, exist_ok=True)

    # 👇 الإجراء الأمني الثاني: تنظيف اسم الملف (Directory Traversal Protection)
    safe_filename = sanitize_filename(file.filename)

    # مسار حفظ الملف الآمن على القرص باستخدام الاسم المنظف
    file_path = os.path.join(STORAGE_PATH, safe_filename)

    # احفظ الملف على القرص
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_type = file.content_type or "unknown"

    # 👇 الإجراء الأمني الثالث: توليد رمز مشاركة فريد وآمن (Share Token) لكل ملف مرفوع
    unique_share_token = generate_share_token()

    # احفظ معلومات الملف في قاعدة البيانات مع التعديلات الأمنية
    new_file = File(
        name=safe_filename,         # استخدام الاسم المنظف
        path=file_path,
        size=file_size,             # الحجم الدقيق الذي تم فحصه
        type=file_type,
        owner_id=owner_id,
        folder_id=folder_id,
        share_token=unique_share_token # إضافة الرمز الفريد الخاص بقسمكِ لجدول قاعدة البيانات
    )
    db.add(new_file)

    # سجّل العملية في activity_log
    log = ActivityLog(
        user_id=owner_id,
        action="upload",
        target_id=None
    )
    db.add(log)
    db.commit()
    db.refresh(new_file)

    return {
        "message": "File uploaded successfully ✅",
        "file_id": new_file.id,
        "file_name": new_file.name,
        "file_size": new_file.size
    }


# ───────────────────────────────
# قراءة كل الملفات
# ───────────────────────────────
@router.get("/", response_model=List[FileRead])
def get_all_files(db: Session = Depends(get_db)):
    files = db.query(File).all()
    return files


# ───────────────────────────────
# قراءة ملفات مستخدم معين
# ───────────────────────────────
@router.get("/owner/{owner_id}", response_model=List[FileRead])
def get_files_by_owner(owner_id: int, db: Session = Depends(get_db)):
    files = db.query(File).filter(File.owner_id == owner_id).all()
    return files


# ───────────────────────────────
# تنزيل ملف
# ───────────────────────────────
@router.get("/download/{file_id}")
def download_file(file_id: int, db: Session = Depends(get_db)):
    # ابحث عن الملف في قاعدة البيانات
    file = db.query(File).filter(File.id == file_id).first()
    if not file:
        raise HTTPException(status_code=404, detail="File not found")

    # تحقق أن الملف موجود على القرص
    if not os.path.exists(file.path):
        raise HTTPException(status_code=404, detail="File not found on server")

    # سجّل عملية التنزيل
    log = ActivityLog(
        user_id=None,
        action="download",
        target_id=file_id
    )
    db.add(log)
    db.commit()

    return FileResponse(
        path=file.path,
        filename=file.name,
        media_type=file.type
    )


# ───────────────────────────────
# حذف ملف
# ───────────────────────────────
@router.delete("/{file_id}")
def delete_file(file_id: int, db: Session = Depends(get_db)):
    file = db.query(File).filter(File.id == file_id).first()
    if not file:
        raise HTTPException(status_code=404, detail="File not found")

    # احذف الملف من القرص
    if os.path.exists(file.path):
        os.remove(file.path)

    # سجّل عملية الحذف
    log = ActivityLog(
        user_id=file.owner_id,
        action="delete",
        target_id=file_id
    )
    db.add(log)

    # احذف من قاعدة البيانات
    db.delete(file)
    db.commit()

    return {"message": f"File {file.name} deleted successfully ✅"}


# ───────────────────────────────
# البحث عن ملف باسمه
# ───────────────────────────────
@router.get("/search/{file_name}", response_model=List[FileRead])
def search_files(file_name: str, db: Session = Depends(get_db)):
    files = db.query(File).filter(
        File.name.contains(file_name)
    ).all()
    if not files:
        raise HTTPException(status_code=404, detail="No files found")
    return files