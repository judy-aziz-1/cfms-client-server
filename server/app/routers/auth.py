# ═══════════════════════════════════════════════════
#  routers/auth.py
#  Register · Login · Get current user
# ═══════════════════════════════════════════════════

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.file import ActivityLog
from app.schemas import RegisterRequest, LoginRequest, TokenResponse, UserResponse
from app.utils.security import hash_password, verify_password, create_access_token, decode_access_token

router = APIRouter(prefix="/api/auth", tags=["Auth"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# ── Dependency: get current logged-in user ────────────
def get_current_user(
    token: str     = Depends(oauth2_scheme),
    db:    Session = Depends(get_db)
) -> User:
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user = db.query(User).filter(User.id == payload.get("user_id")).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or banned")
    return user

# ── Dependency: admin only ────────────────────────────
def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

# ════════════════════════════════════════════════════
#  REGISTER
# ════════════════════════════════════════════════════
@router.post("/register", response_model=UserResponse, status_code=201)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    # Check email not already taken
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        name     = body.name,
        email    = body.email,
        password = hash_password(body.password),
        role     = "admin" if db.query(User).count() == 0 else "user"
        # First user ever = admin automatically
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Log activity
    db.add(ActivityLog(action="register", detail=f"{user.name} created an account", user_id=user.id))
    db.commit()

    return user

# ════════════════════════════════════════════════════
#  LOGIN
# ════════════════════════════════════════════════════
@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()

    if not user or not verify_password(body.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Your account has been banned")

    token = create_access_token({"user_id": user.id, "role": user.role})

    # Log activity
    db.add(ActivityLog(action="login", detail=f"{user.name} logged in", user_id=user.id))
    db.commit()

    return {
        "access_token": token,
        "token_type":   "bearer",
        "user": user
    }

# ════════════════════════════════════════════════════
#  GET CURRENT USER
# ════════════════════════════════════════════════════
@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user