import os
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import bcrypt 
import uuid
import re
# --- Part One: Encryption and JWT Settings ---
SECRET_KEY = "your-super-secret-key-here" 
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440 


def get_password_hash(password: str) -> str:
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8') 

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(
            plain_password.encode('utf-8'), 
            hashed_password.encode('utf-8')
        )
    except Exception:
        return False
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    current_time = datetime.now(timezone.utc)
    
    if expires_delta:
        expire = current_time + expires_delta
    else:
        expire = current_time + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
# --- Part Two: Route Protection (Authentication) ---
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        role: str = payload.get("role")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    return {"email": email, "role": role}

async def get_admin_user(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have the required permissions to perform this action"
        )
    return current_user
# --- Part Three: Utility Functions ---
# --- 1. Function to sanitize file names to prevent Directory Traversal attacks ---
def sanitize_filename(filename: str) -> str:
    """
   It takes the name of the uploaded file and ensures that it does not contain malicious paths such as ../../
    """
    # Using os.path.basename to extract only the base file name to prevent path manipulation
    clean_name = os.path.basename(filename)
    
    # Additional security step: Remove any symbols that may cause problems in operating systems
    clean_name = re.sub(r'[\\/*?:"<>|]', "", clean_name)
    return clean_name
# --- 2. XSS Prevention Function (Sanitizing Passed Texts) ---
def sanitize_html(text: str) -> str:
    """
    It converts special symbols like < and > to safe text (HTML Entities) to prevent script injection
    """
    if not text:
        return text
    return (
        text.replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace('"', "&quot;")
            .replace("'", "&#x27;")
    )
# --- 3. Function to Generate Unique and Very Secure Share Tokens ---
def generate_share_token() -> str:
    """
    It generates a random and complex UUID 4 token that is very difficult to guess for secure file sharing
    """
    return str(uuid.uuid4())