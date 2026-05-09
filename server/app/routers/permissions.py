from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.permission import Permission
from app.models.file import File
from app.schemas.schemas import PermissionCreate, PermissionRead
from typing import List
from datetime import datetime

router = APIRouter(prefix="/permissions", tags=["Permissions"])


# ───────────────────────────────
# إعطاء صلاحية لمستخدم على ملف
# ───────────────────────────────
@router.post("/", response_model=PermissionRead)
def create_permission(perm_data: PermissionCreate, db: Session = Depends(get_db)):
    
    # تحقق أن الملف موجود
    file = db.query(File).filter(File.id == perm_data.file_id).first()
    if not file:
        raise HTTPException(status_code=404, detail="File not found")

    # تحقق أن الصلاحية غير موجودة مسبقاً
    existing = db.query(Permission).filter(
        Permission.file_id == perm_data.file_id,
        Permission.user_id == perm_data.user_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Permission already exists")

    # تحقق أن نوع الصلاحية صحيح
    if perm_data.access_type not in ["read", "read_write"]:
        raise HTTPException(status_code=400, detail="Access type must be read or read_write")

    new_perm = Permission(
        file_id=perm_data.file_id,
        user_id=perm_data.user_id,
        access_type=perm_data.access_type
    )
    db.add(new_perm)
    db.commit()
    db.refresh(new_perm)
    return new_perm


# ───────────────────────────────
# قراءة كل صلاحيات ملف معين
# ───────────────────────────────
@router.get("/file/{file_id}", response_model=List[PermissionRead])
def get_file_permissions(file_id: int, db: Session = Depends(get_db)):
    permissions = db.query(Permission).filter(
        Permission.file_id == file_id
    ).all()
    if not permissions:
        raise HTTPException(status_code=404, detail="No permissions for this file")
    return permissions


# ───────────────────────────────
# قراءة كل صلاحيات مستخدم معين
# ───────────────────────────────
@router.get("/user/{user_id}", response_model=List[PermissionRead])
def get_user_permissions(user_id: int, db: Session = Depends(get_db)):
    permissions = db.query(Permission).filter(
        Permission.user_id == user_id
    ).all()
    if not permissions:
        raise HTTPException(status_code=404, detail="No permissions for this user")
    return permissions


# ───────────────────────────────
# تعديل نوع الصلاحية
# ───────────────────────────────
@router.put("/{perm_id}", response_model=PermissionRead)
def update_permission(perm_id: int, new_access_type: str, db: Session = Depends(get_db)):
    perm = db.query(Permission).filter(Permission.id == perm_id).first()
    if not perm:
        raise HTTPException(status_code=404, detail="Permission not found")

    if new_access_type not in ["read", "read_write"]:
        raise HTTPException(status_code=400, detail="Access type must be read or read_write")

    perm.access_type = new_access_type
    db.commit()
    db.refresh(perm)
    return perm


# ───────────────────────────────
# حذف صلاحية
# ───────────────────────────────
@router.delete("/{perm_id}")
def delete_permission(perm_id: int, db: Session = Depends(get_db)):
    perm = db.query(Permission).filter(Permission.id == perm_id).first()
    if not perm:
        raise HTTPException(status_code=404, detail="Permission not found")

    db.delete(perm)
    db.commit()
    return {"message": f"Permission deleted successfully ✅"}