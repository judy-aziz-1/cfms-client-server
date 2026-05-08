from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from app.database import Base

class SharedLink(Base):
    __tablename__ = "shared_links"

    id = Column(Integer, primary_key=True, index=True)
    file_id = Column(Integer, ForeignKey("files.id"), nullable=False)
    token = Column(String(255), unique=True, nullable=False)
    expires_at = Column(DateTime, nullable=True)
    max_downloads = Column(Integer, nullable=True)