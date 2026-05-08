from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# مسار قاعدة البيانات — الملف cfms.db في مجلد server/
DATABASE_URL = "sqlite:///../cfms.db"

# المحرك الذي يتكلم مع SQLite
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

# الجلسة التي تنفذ العمليات
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# القاعدة الأم — كل جدول يرث منها
Base = declarative_base()

# دالة تفتح جلسة لكل طلب وتغلقها بعده
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()