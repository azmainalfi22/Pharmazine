"""
Internal Messages System API Routes
Employee-to-employee communication
"""

from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional
from datetime import datetime
import uuid
from pydantic import BaseModel

router = APIRouter(prefix="/api/messages", tags=["Internal Messages"])

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


# Pydantic models
class MessageCreate(BaseModel):
    recipient_id: Optional[str] = None
    recipient_type: str = "individual"  # individual, department, all
    subject: str
    message_body: str
    priority: str = "normal"  # low, normal, high, urgent


class MessageResponse(BaseModel):
    id: str
    sender_id: Optional[str]
    recipient_id: Optional[str]
    recipient_type: str
    subject: str
    message_body: str
    priority: str
    is_read: bool
    read_at: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True


@router.get("/inbox")
async def get_inbox(
    skip: int = 0,
    limit: int = 50,
    is_read: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get inbox messages for current user"""
    try:
        user_id = current_user.get('id')
        
        query_params = {
            "user_id": user_id,
            "limit": limit,
            "skip": skip
        }
        
        if is_read is not None:
            query = text("""
                SELECT id, sender_id, recipient_id, recipient_type, subject,
                       message_body, priority, is_read, read_at, created_at
                FROM internal_messages
                WHERE (recipient_id = :user_id OR recipient_type IN ('department', 'all'))
                AND is_read = :is_read
                ORDER BY created_at DESC
                LIMIT :limit OFFSET :skip
            """)
            query_params["is_read"] = is_read
        else:
            query = text("""
                SELECT id, sender_id, recipient_id, recipient_type, subject,
                       message_body, priority, is_read, read_at, created_at
                FROM internal_messages
                WHERE (recipient_id = :user_id OR recipient_type IN ('department', 'all'))
                ORDER BY created_at DESC
                LIMIT :limit OFFSET :skip
            """)
        
        results = db.execute(query, query_params).fetchall()
        
        messages = []
        for row in results:
            messages.append({
                "id": str(row[0]),
                "sender_id": row[1],
                "recipient_id": row[2],
                "recipient_type": row[3],
                "subject": row[4],
                "message_body": row[5],
                "priority": row[6],
                "is_read": row[7],
                "read_at": row[8].isoformat() if row[8] else None,
                "created_at": row[9].isoformat()
            })
        
        return {"messages": messages, "count": len(messages)}
    except Exception as e:
        return {"messages": [], "count": 0, "error": str(e)}


@router.get("/sent")
async def get_sent_messages(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get sent messages"""
    try:
        user_id = current_user.get('id')
        
        query = text("""
            SELECT id, sender_id, recipient_id, recipient_type, subject,
                   message_body, priority, is_read, read_at, created_at
            FROM internal_messages
            WHERE sender_id = :user_id
            ORDER BY created_at DESC
            LIMIT :limit OFFSET :skip
        """)
        
        results = db.execute(query, {
            "user_id": user_id,
            "limit": limit,
            "skip": skip
        }).fetchall()
        
        messages = []
        for row in results:
            messages.append({
                "id": str(row[0]),
                "sender_id": row[1],
                "recipient_id": row[2],
                "recipient_type": row[3],
                "subject": row[4],
                "message_body": row[5],
                "priority": row[6],
                "is_read": row[7],
                "read_at": row[8].isoformat() if row[8] else None,
                "created_at": row[9].isoformat()
            })
        
        return {"messages": messages, "count": len(messages)}
    except Exception as e:
        return {"messages": [], "count": 0, "error": str(e)}


@router.post("/send", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def send_message(
    message: MessageCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Send an internal message"""
    try:
        query = text("""
            INSERT INTO internal_messages (
                id, sender_id, recipient_id, recipient_type, subject,
                message_body, priority, is_read, created_at
            ) VALUES (
                :id, :sender_id, :recipient_id, :recipient_type, :subject,
                :message_body, :priority, FALSE, now()
            ) RETURNING id, sender_id, recipient_id, recipient_type, subject,
                        message_body, priority, is_read, read_at, created_at
        """)
        
        result = db.execute(query, {
            "id": str(uuid.uuid4()),
            "sender_id": current_user.get('id'),
            "recipient_id": message.recipient_id,
            "recipient_type": message.recipient_type,
            "subject": message.subject,
            "message_body": message.message_body,
            "priority": message.priority
        }).fetchone()
        
        db.commit()
        
        return {
            "id": str(result[0]),
            "sender_id": result[1],
            "recipient_id": result[2],
            "recipient_type": result[3],
            "subject": result[4],
            "message_body": result[5],
            "priority": result[6],
            "is_read": result[7],
            "read_at": result[8].isoformat() if result[8] else None,
            "created_at": result[9].isoformat()
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{message_id}/read")
async def mark_as_read(
    message_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Mark a message as read"""
    try:
        query = text("""
            UPDATE internal_messages
            SET is_read = TRUE, read_at = now()
            WHERE id = :message_id
            RETURNING id
        """)
        
        result = db.execute(query, {"message_id": message_id}).fetchone()
        
        if not result:
            raise HTTPException(status_code=404, detail="Message not found")
        
        db.commit()
        
        return {"message": "Message marked as read"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/unread-count")
async def get_unread_count(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get count of unread messages"""
    try:
        user_id = current_user.get('id')
        
        query = text("""
            SELECT COUNT(*)
            FROM internal_messages
            WHERE (recipient_id = :user_id OR recipient_type IN ('department', 'all'))
            AND is_read = FALSE
        """)
        
        result = db.execute(query, {"user_id": user_id}).scalar()
        
        return {"unread_count": int(result or 0)}
    except Exception as e:
        return {"unread_count": 0, "error": str(e)}


@router.delete("/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_message(
    message_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Delete a message"""
    try:
        query = text("DELETE FROM internal_messages WHERE id = :message_id RETURNING id")
        result = db.execute(query, {"message_id": message_id}).fetchone()
        
        if not result:
            raise HTTPException(status_code=404, detail="Message not found")
        
        db.commit()
        return None
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


print("[OK] Internal Messages routes loaded successfully")

