# ═══════════════════════════════════════════════════
#  schemas/__init__.py
#  Pydantic schemas — request & response shapes
# ═══════════════════════════════════════════════════

from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

# ════════════════════════════════════════════════════
#  AUTH SCHEMAS
# ════════════════════════════════════════════════════

class RegisterRequest(BaseModel):
    name:     str
    email:    EmailStr
    password: str

class LoginRequest(BaseModel):
    email:    EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type:   str = "bearer"
    user:         "UserResponse"

# ════════════════════════════════════════════════════
#  USER SCHEMAS
# ════════════════════════════════════════════════════

class UserResponse(BaseModel):
    id:         int
    name:       str
    email:      str
    role:       str
    is_active:  bool
    created_at: datetime

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    role:      Optional[str]  = None
    is_active: Optional[bool] = None

# ════════════════════════════════════════════════════
#  FILE SCHEMAS
# ════════════════════════════════════════════════════

class FileResponse(BaseModel):
    id:         int
    name:       str
    file_type:  str
    size:       int
    is_shared:  bool
    owner_id:   int
    created_at: datetime

    class Config:
        from_attributes = True

class ShareResponse(BaseModel):
    share_link: str

# ════════════════════════════════════════════════════
#  ACTIVITY SCHEMAS
# ════════════════════════════════════════════════════

class ActivityResponse(BaseModel):
    id:         int
    action:     str
    detail:     str
    user_id:    int
    created_at: datetime

    class Config:
        from_attributes = True

# ════════════════════════════════════════════════════
#  ADMIN SCHEMAS
# ════════════════════════════════════════════════════

class AdminUserResponse(BaseModel):
    id:         int
    name:       str
    email:      str
    role:       str
    is_active:  bool
    created_at: datetime
    file_count: int = 0
    storage:    int = 0

    class Config:
        from_attributes = True

class StatsResponse(BaseModel):
    total_users:   int
    total_files:   int
    total_storage: int
    shared_files:  int
    banned_users:  int

# Forward reference update
TokenResponse.model_rebuild()