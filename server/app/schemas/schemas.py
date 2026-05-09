from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

# ===========================
# schemas الخاصة بالمستخدمين
# ===========================

class UserCreate(BaseModel):
    """شكل البيانات عند إنشاء مستخدم جديد"""
    username: str
    email: str
    password: str

class UserRead(BaseModel):
    """شكل البيانات عند إرجاع مستخدم — بدون كلمة المرور"""
    id: int
    username: str
    email: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True

# ===========================
# schemas الخاصة بالملفات
# ===========================

class FileRead(BaseModel):
    """شكل البيانات عند إرجاع ملف"""
    id: int
    name: str
    size: int
    type: str
    owner_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# ===========================
# schemas الخاصة بالمجلدات
# ===========================

class FolderCreate(BaseModel):
    """شكل البيانات عند إنشاء مجلد"""
    name: str
    parent_id: Optional[int] = None

class FolderRead(BaseModel):
    """شكل البيانات عند إرجاع مجلد"""
    id: int
    name: str
    parent_id: Optional[int]
    owner_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# ===========================
# schemas الخاصة بالصلاحيات
# ===========================

class PermissionCreate(BaseModel):
    """شكل البيانات عند إنشاء صلاحية"""
    file_id: int
    user_id: int
    access_type: str  # read / read_write

class PermissionRead(BaseModel):
    id: int
    file_id: int
    user_id: int
    access_type: str
    expires_at: Optional[datetime]

    class Config:
        from_attributes = True