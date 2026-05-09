from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base

class ActivityLog(Base):
    __tablename__ = "activity_log"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(50), nullable=False)  # upload/download/delete/share
    target_id = Column(Integer, nullable=True)
    timestamp = Column(DateTime, default=func.now())
    ip = Column(String(50), nullable=True)