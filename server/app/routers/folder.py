from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.folder import Folder
from app.schemas.schemas import FolderCreate, FolderRead
from typing import List

router = APIRouter(prefix="/folders", tags=["Folders"])


# ───────────────────────────────
# إنشاء مجلد جديد
# ───────────────────────────────
@router.post("/", response_model=FolderRead)
def create_folder(folder_data: FolderCreate, owner_id: int, db: Session = Depends(get_db)):
    
    # تحقق أن المجلد الأب موجود إذا تم تحديده
    if folder_data.parent_id:
        parent = db.query(Folder).filter(Folder.id == folder_data.parent_id).first()
        if not parent:
            raise HTTPException(status_code=404, detail="Parent folder not found")

    new_folder = Folder(
        name=folder_data.name,
        parent_id=folder_data.parent_id,
        owner_id=owner_id
    )
    db.add(new_folder)
    db.commit()
    db.refresh(new_folder)
    return new_folder


# ───────────────────────────────
# قراءة كل مجلدات مستخدم معين
# ───────────────────────────────
@router.get("/owner/{owner_id}", response_model=List[FolderRead])
def get_folders_by_owner(owner_id: int, db: Session = Depends(get_db)):
    folders = db.query(Folder).filter(Folder.owner_id == owner_id).all()
    return folders


# ───────────────────────────────
# قراءة مجلد واحد بالـ ID
# ───────────────────────────────
@router.get("/{folder_id}", response_model=FolderRead)
def get_folder(folder_id: int, db: Session = Depends(get_db)):
    folder = db.query(Folder).filter(Folder.id == folder_id).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    return folder


# ───────────────────────────────
# تعديل اسم مجلد
# ───────────────────────────────
@router.put("/{folder_id}", response_model=FolderRead)
def rename_folder(folder_id: int, new_name: str, db: Session = Depends(get_db)):
    folder = db.query(Folder).filter(Folder.id == folder_id).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    
    folder.name = new_name
    db.commit()
    db.refresh(folder)
    return folder


# ───────────────────────────────
# حذف مجلد
# ───────────────────────────────
@router.delete("/{folder_id}")
def delete_folder(folder_id: int, db: Session = Depends(get_db)):
    folder = db.query(Folder).filter(Folder.id == folder_id).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    
    # تحقق أن المجلد فارغ
    files_in_folder = folder.id
    
    db.delete(folder)
    db.commit()
    return {"message": f"Folder {folder.name} deleted successfully ✅"}