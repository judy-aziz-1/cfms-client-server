from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.shared_link import SharedLink
from app.models.file import File
from typing import List
import secrets
from datetime import datetime

router = APIRouter(prefix="/shared-links", tags=["Shared Links"])


# ───────────────────────────────
# إنشاء رابط مشاركة عام لملف
# ───────────────────────────────
@router.post("/")
def create_shared_link(
    file_id: int,
    max_downloads: int = None,
    db: Session = Depends(get_db)
):
    # تحقق أن الملف موجود
    file = db.query(File).filter(File.id == file_id).first()
    if not file:
        raise HTTPException(status_code=404, detail="File not found")

    # أنشئ token عشوائي فريد
    token = secrets.token_urlsafe(32)

    new_link = SharedLink(
        file_id=file_id,
        token=token,
        max_downloads=max_downloads
    )
    db.add(new_link)
    db.commit()
    db.refresh(new_link)

    return {
        "message": "Link created successfully ✅",
        "link_id": new_link.id,
        "token": token,
        "share_url": f"/shared-links/access/{token}"
    }


# ───────────────────────────────
# الوصول لملف عبر الرابط العام
# ───────────────────────────────
@router.get("/access/{token}")
def access_shared_link(token: str, db: Session = Depends(get_db)):

    # ابحث عن الرابط
    link = db.query(SharedLink).filter(SharedLink.token == token).first()
    if not link:
        raise HTTPException(status_code=404, detail="Link not found or expired")

    # تحقق من الملف
    file = db.query(File).filter(File.id == link.file_id).first()
    if not file:
        raise HTTPException(status_code=404, detail="File not found")

    return {
        "file_id": file.id,
        "file_name": file.name,
        "file_size": file.size,
        "file_type": file.type,
        "download_url": f"/files/download/{file.id}"
    }


# ───────────────────────────────
# قراءة كل روابط ملف معين
# ───────────────────────────────
@router.get("/file/{file_id}")
def get_file_links(file_id: int, db: Session = Depends(get_db)):
    links = db.query(SharedLink).filter(
        SharedLink.file_id == file_id
    ).all()
    if not links:
        raise HTTPException(status_code=404, detail="No links for this file")
    return links


# ───────────────────────────────
# حذف رابط مشاركة
# ───────────────────────────────
@router.delete("/{link_id}")
def delete_shared_link(link_id: int, db: Session = Depends(get_db)):
    link = db.query(SharedLink).filter(SharedLink.id == link_id).first()
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")

    db.delete(link)
    db.commit()
    return {"message": "Link deleted successfully ✅"}