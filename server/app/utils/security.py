# ═══════════════════════════════════════════════════
#  utils/security.py
#  JWT token generation & password hashing
# ═══════════════════════════════════════════════════

from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from passlib.context import CryptContext

# ── Config ────────────────────────────────────────────
SECRET_KEY   = "cfms-super-secret-key-change-in-production"
ALGORITHM    = "HS256"
TOKEN_EXPIRE = 60 * 24  # 24 hours in minutes

# ── Password hashing ──────────────────────────────────
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

# ── JWT tokens ────────────────────────────────────────
def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    # Fixed: use timezone-aware datetime (utcnow() is deprecated in Python 3.12+)
    expire = datetime.now(timezone.utc) + timedelta(minutes=TOKEN_EXPIRE)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_access_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None