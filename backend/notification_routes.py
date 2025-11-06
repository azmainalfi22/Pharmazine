"""
Notification System API Routes
Manage and track system notifications
"""

from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, text
from typing import List, Optional
from datetime import datetime
import uuid

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

# Database dependency
def get_db():
    from main import SessionLocal
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user():
    return {"id": "system", "email": "system@pharmazine.com"}


@router.get("/log")
async def get_notification_log(
    notification_type: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get notification log"""
    try:
        query = text("""
            SELECT 
                id, notification_type, recipient_email, recipient_phone,
                subject, message, status, sent_at, error_message, created_at
            FROM notification_log
            WHERE (:notification_type IS NULL OR notification_type = :notification_type)
            AND (:status_filter IS NULL OR status = :status_filter)
            ORDER BY created_at DESC
            LIMIT :limit OFFSET :skip
        """)
        
        results = db.execute(query, {
            "notification_type": notification_type,
            "status_filter": status,
            "limit": limit,
            "skip": skip
        }).fetchall()
        
        notifications = []
        for row in results:
            notifications.append({
                "id": str(row[0]),
                "notification_type": row[1],
                "recipient_email": row[2],
                "recipient_phone": row[3],
                "subject": row[4],
                "message": row[5],
                "status": row[6],
                "sent_at": row[7].isoformat() if row[7] else None,
                "error_message": row[8],
                "created_at": row[9].isoformat() if row[9] else None
            })
        
        return {"notifications": notifications, "count": len(notifications)}
    except Exception as e:
        return {"notifications": [], "count": 0, "error": str(e)}


@router.post("/send")
async def send_notification(
    notification_type: str,
    recipient_email: Optional[str] = None,
    recipient_phone: Optional[str] = None,
    subject: Optional[str] = None,
    message: str = "",
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Send a notification and log it"""
    from notifications import EmailNotification, SMSNotification
    
    notification_id = str(uuid.uuid4())
    status_value = "pending"
    error_message = None
    sent_at = None
    
    try:
        # Log the notification first
        log_query = text("""
            INSERT INTO notification_log (
                id, notification_type, recipient_email, recipient_phone,
                subject, message, status, created_at
            ) VALUES (
                :id, :notification_type, :recipient_email, :recipient_phone,
                :subject, :message, :status, now()
            )
        """)
        
        db.execute(log_query, {
            "id": notification_id,
            "notification_type": notification_type,
            "recipient_email": recipient_email,
            "recipient_phone": recipient_phone,
            "subject": subject,
            "message": message,
            "status": "pending"
        })
        db.commit()
        
        # Send notification
        if recipient_email and EmailNotification:
            EmailNotification.send_email(recipient_email, subject or "Notification", message)
            status_value = "sent"
            sent_at = datetime.utcnow()
        
        if recipient_phone and SMSNotification:
            SMSNotification.send_sms(recipient_phone, message)
            status_value = "sent"
            sent_at = datetime.utcnow()
        
        # Update notification status
        update_query = text("""
            UPDATE notification_log
            SET status = :status, sent_at = :sent_at
            WHERE id = :id
        """)
        
        db.execute(update_query, {
            "id": notification_id,
            "status": status_value,
            "sent_at": sent_at
        })
        db.commit()
        
        return {
            "notification_id": notification_id,
            "status": status_value,
            "message": "Notification sent successfully"
        }
        
    except Exception as e:
        error_message = str(e)
        
        # Update with error
        update_query = text("""
            UPDATE notification_log
            SET status = 'failed', error_message = :error_message
            WHERE id = :id
        """)
        
        db.execute(update_query, {
            "id": notification_id,
            "error_message": error_message
        })
        db.commit()
        
        raise HTTPException(status_code=500, detail=f"Failed to send notification: {error_message}")


@router.get("/stats")
async def get_notification_stats(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get notification statistics"""
    try:
        stats_query = text("""
            SELECT 
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE status = 'sent') as sent,
                COUNT(*) FILTER (WHERE status = 'pending') as pending,
                COUNT(*) FILTER (WHERE status = 'failed') as failed,
                COUNT(*) FILTER (WHERE notification_type = 'low_stock') as low_stock,
                COUNT(*) FILTER (WHERE notification_type = 'expiry') as expiry,
                COUNT(*) FILTER (WHERE notification_type = 'refill_reminder') as refill_reminder,
                COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as today_count
            FROM notification_log
            WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        """)
        
        result = db.execute(stats_query).fetchone()
        
        return {
            "total_notifications": int(result[0] or 0),
            "sent": int(result[1] or 0),
            "pending": int(result[2] or 0),
            "failed": int(result[3] or 0),
            "by_type": {
                "low_stock": int(result[4] or 0),
                "expiry": int(result[5] or 0),
                "refill_reminder": int(result[6] or 0)
            },
            "today_count": int(result[7] or 0)
        }
    except Exception as e:
        return {
            "total_notifications": 0,
            "sent": 0,
            "pending": 0,
            "failed": 0,
            "by_type": {"low_stock": 0, "expiry": 0, "refill_reminder": 0},
            "today_count": 0,
            "error": str(e)
        }


print("[OK] Notification routes loaded successfully")

