from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from app.database import Base

class Permission(Base):
    __tablename__ = "permissions"

    id = Column(Integer, primary_key=True, index=True)
    file_id = Column(Integer, ForeignKey("files.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    access_type = Column(String(20), nullable=False)  # read / read_write
    expires_at = Column(DateTime, nullable=True)