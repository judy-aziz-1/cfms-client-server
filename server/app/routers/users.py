from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.schemas import UserCreate, UserRead
from typing import List

router = APIRouter(prefix="/users", tags=["Users"])


# ───────────────────────────────
# إنشاء مستخدم جديد
# ───────────────────────────────
@router.post("/", response_model=UserRead)
def create_user(user_data: UserCreate, db: Session = Depends(get_db)):
    
    # تحقق أن الإيميل غير مكرر
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already in use")
    
    # أنشئ المستخدم — كلمة المرور مؤقتاً بدون تشفير
    # بتول ستضيف التشفير لاحقاً
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        password_hash=user_data.password
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


# ───────────────────────────────
# قراءة كل المستخدمين
# ───────────────────────────────
@router.get("/", response_model=List[UserRead])
def get_all_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return users


# ───────────────────────────────
# قراءة مستخدم واحد بالـ ID
# ───────────────────────────────
@router.get("/{user_id}", response_model=UserRead)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


# ───────────────────────────────
# حذف مستخدم
# ───────────────────────────────
@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"message": f"User {user_id} deleted successfully"}