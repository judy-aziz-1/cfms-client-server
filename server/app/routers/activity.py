from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.activity_log import ActivityLog
from typing import List

router = APIRouter(prefix="/activity", tags=["Activity Log"])


# ───────────────────────────────
# قراءة كل سجل النشاط
# ───────────────────────────────
@router.get("/")
def get_all_activity(db: Session = Depends(get_db)):
    logs = db.query(ActivityLog).order_by(
        ActivityLog.timestamp.desc()
    ).all()
    if not logs:
        raise HTTPException(status_code=404, detail="No activity yet")
    return logs


# ───────────────────────────────
# قراءة نشاط مستخدم معين
# ───────────────────────────────
@router.get("/user/{user_id}")
def get_user_activity(user_id: int, db: Session = Depends(get_db)):
    logs = db.query(ActivityLog).filter(
        ActivityLog.user_id == user_id
    ).order_by(ActivityLog.timestamp.desc()).all()
    
    if not logs:
        raise HTTPException(status_code=404, detail="No activity for this user")
    return logs


# ───────────────────────────────
# قراءة نشاط نوع معين
# مثال: كل عمليات الرفع فقط
# ───────────────────────────────
@router.get("/action/{action}")
def get_activity_by_action(action: str, db: Session = Depends(get_db)):
    
    # تحقق أن نوع العملية صحيح
    valid_actions = ["upload", "download", "delete", "share"]
    if action not in valid_actions:
        raise HTTPException(
            status_code=400,
            detail=f"Action type must be: {', '.join(valid_actions)}"
        )
    
    logs = db.query(ActivityLog).filter(
        ActivityLog.action == action
    ).order_by(ActivityLog.timestamp.desc()).all()
    
    if not logs:
        raise HTTPException(status_code=404, detail=f"No operations of type {action}")
    return logs


# ───────────────────────────────
# إحصاءات عامة للمسؤول
# ───────────────────────────────
@router.get("/stats/summary")
def get_stats(db: Session = Depends(get_db)):
    
    total = db.query(ActivityLog).count()
    uploads = db.query(ActivityLog).filter(ActivityLog.action == "upload").count()
    downloads = db.query(ActivityLog).filter(ActivityLog.action == "download").count()
    deletes = db.query(ActivityLog).filter(ActivityLog.action == "delete").count()
    shares = db.query(ActivityLog).filter(ActivityLog.action == "share").count()

    return {
        "total_operations": total,
        "uploads": uploads,
        "downloads": downloads,
        "deletes": deletes,
        "shares": shares
    }


# ───────────────────────────────
# حذف كل سجل النشاط
# للمسؤول فقط
# ───────────────────────────────
@router.delete("/clear")
def clear_activity_log(db: Session = Depends(get_db)):
    db.query(ActivityLog).delete()
    db.commit()
    return {"message": "Activity log cleared completely ✅"}