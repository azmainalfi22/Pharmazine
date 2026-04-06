"""
Database Backup Management API Routes
"""

from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from typing import List, Optional
from datetime import datetime
import uuid
import os
import subprocess

router = APIRouter(prefix="/api/backup", tags=["Backup Management"])

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


@router.get("/list")
async def get_backup_list(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get list of backups"""
    try:
        query = text("""
            SELECT 
                id, filename, file_path, file_size_mb, backup_type,
                status, error_message, created_by, created_at
            FROM backup_log
            ORDER BY created_at DESC
            LIMIT :limit OFFSET :skip
        """)
        
        results = db.execute(query, {"limit": limit, "skip": skip}).fetchall()
        
        backups = []
        for row in results:
            backups.append({
                "id": str(row[0]),
                "filename": row[1],
                "file_path": row[2],
                "file_size_mb": float(row[3] or 0),
                "backup_type": row[4],
                "status": row[5],
                "error_message": row[6],
                "created_by": row[7],
                "created_at": row[8].isoformat() if row[8] else None
            })
        
        return {"backups": backups, "count": len(backups)}
    except Exception as e:
        return {"backups": [], "count": 0, "error": str(e)}


@router.post("/create")
async def create_backup(
    backup_type: str = "manual",
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a database backup"""
    from backup_system import BackupSystem
    
    backup_system = BackupSystem(db)
    result = backup_system.create_backup(
        backup_type=backup_type,
        created_by=current_user.get("id", "system")
    )
    
    if result.get("success"):
        return {
            "message": "Backup created successfully",
            "backup_id": result.get("backup_id"),
            "filename": result.get("filename"),
            "file_size_mb": result.get("file_size_mb")
        }
    else:
        raise HTTPException(
            status_code=500,
            detail=f"Backup failed: {result.get('error')}"
        )


@router.get("/stats")
async def get_backup_stats(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get backup statistics"""
    try:
        stats_query = text("""
            SELECT 
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE status = 'success') as successful,
                COUNT(*) FILTER (WHERE status = 'failed') as failed,
                COUNT(*) FILTER (WHERE backup_type = 'automatic') as automatic,
                COUNT(*) FILTER (WHERE backup_type = 'manual') as manual,
                COALESCE(SUM(file_size_mb), 0) as total_size_mb,
                MAX(created_at) as last_backup
            FROM backup_log
            WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        """)
        
        result = db.execute(stats_query).fetchone()
        
        return {
            "total_backups": int(result[0] or 0),
            "successful": int(result[1] or 0),
            "failed": int(result[2] or 0),
            "automatic": int(result[3] or 0),
            "manual": int(result[4] or 0),
            "total_size_mb": float(result[5] or 0),
            "last_backup": result[6].isoformat() if result[6] else None
        }
    except Exception as e:
        return {
            "total_backups": 0,
            "successful": 0,
            "failed": 0,
            "automatic": 0,
            "manual": 0,
            "total_size_mb": 0,
            "last_backup": None,
            "error": str(e)
        }


@router.delete("/{backup_id}")
async def delete_backup(
    backup_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Delete a backup file and its log entry"""
    try:
        # Get backup info
        query = text("SELECT file_path FROM backup_log WHERE id = :backup_id")
        result = db.execute(query, {"backup_id": backup_id}).fetchone()
        
        if not result:
            raise HTTPException(status_code=404, detail="Backup not found")
        
        file_path = result[0]
        
        # Delete file if it exists
        if os.path.exists(file_path):
            os.remove(file_path)
        
        # Delete log entry
        delete_query = text("DELETE FROM backup_log WHERE id = :backup_id")
        db.execute(delete_query, {"backup_id": backup_id})
        db.commit()
        
        return {"message": "Backup deleted successfully"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


print("[OK] Backup routes loaded successfully")

