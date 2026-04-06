"""
System Configuration API Routes
Manage system settings and configurations
"""

from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional
from datetime import datetime
import uuid
from pydantic import BaseModel

router = APIRouter(prefix="/api/system", tags=["System Configuration"])

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
class SystemConfigCreate(BaseModel):
    config_key: str
    config_value: str
    config_type: str = "string"
    category: str
    description: Optional[str] = None
    is_encrypted: bool = False


class SystemConfigUpdate(BaseModel):
    config_value: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class SystemConfigResponse(BaseModel):
    id: str
    config_key: str
    config_value: str
    config_type: str
    category: str
    description: Optional[str]
    is_encrypted: bool
    updated_by: Optional[str]
    updated_at: datetime
    
    class Config:
        from_attributes = True


@router.get("/config", response_model=List[SystemConfigResponse])
async def get_system_configs(
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get all system configurations"""
    try:
        if category:
            query = text("""
                SELECT id, config_key, config_value, config_type, category,
                       description, is_encrypted, updated_by, updated_at
                FROM system_configuration
                WHERE category = :category
                ORDER BY category, config_key
            """)
            results = db.execute(query, {"category": category}).fetchall()
        else:
            query = text("""
                SELECT id, config_key, config_value, config_type, category,
                       description, is_encrypted, updated_by, updated_at
                FROM system_configuration
                ORDER BY category, config_key
            """)
            results = db.execute(query).fetchall()
        
        configs = []
        for row in results:
            configs.append({
                "id": str(row[0]),
                "config_key": row[1],
                "config_value": row[2] if not row[6] else "***ENCRYPTED***",  # Hide encrypted values
                "config_type": row[3],
                "category": row[4],
                "description": row[5],
                "is_encrypted": row[6],
                "updated_by": row[7],
                "updated_at": row[8]
            })
        
        return configs
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/config/{config_key}", response_model=SystemConfigResponse)
async def get_config_by_key(
    config_key: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get a specific configuration"""
    try:
        query = text("""
            SELECT id, config_key, config_value, config_type, category,
                   description, is_encrypted, updated_by, updated_at
            FROM system_configuration
            WHERE config_key = :config_key
        """)
        
        result = db.execute(query, {"config_key": config_key}).fetchone()
        
        if not result:
            raise HTTPException(status_code=404, detail="Configuration not found")
        
        return {
            "id": str(result[0]),
            "config_key": result[1],
            "config_value": result[2],
            "config_type": result[3],
            "category": result[4],
            "description": result[5],
            "is_encrypted": result[6],
            "updated_by": result[7],
            "updated_at": result[8]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/config", response_model=SystemConfigResponse, status_code=status.HTTP_201_CREATED)
async def create_system_config(
    config: SystemConfigCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a new system configuration"""
    try:
        # Check if config already exists
        check_query = text("SELECT id FROM system_configuration WHERE config_key = :config_key")
        existing = db.execute(check_query, {"config_key": config.config_key}).fetchone()
        
        if existing:
            raise HTTPException(status_code=400, detail="Configuration with this key already exists")
        
        # Encrypt value if needed
        config_value = config.config_value
        if config.is_encrypted:
            # In production, use proper encryption
            config_value = f"ENC_{config.config_value}"  # Placeholder
        
        insert_query = text("""
            INSERT INTO system_configuration (
                id, config_key, config_value, config_type, category,
                description, is_encrypted, updated_by, updated_at
            ) VALUES (
                :id, :config_key, :config_value, :config_type, :category,
                :description, :is_encrypted, :updated_by, now()
            ) RETURNING id, config_key, config_value, config_type, category,
                        description, is_encrypted, updated_by, updated_at
        """)
        
        result = db.execute(insert_query, {
            "id": str(uuid.uuid4()),
            "config_key": config.config_key,
            "config_value": config_value,
            "config_type": config.config_type,
            "category": config.category,
            "description": config.description,
            "is_encrypted": config.is_encrypted,
            "updated_by": current_user.get('id')
        }).fetchone()
        
        db.commit()
        
        return {
            "id": str(result[0]),
            "config_key": result[1],
            "config_value": result[2],
            "config_type": result[3],
            "category": result[4],
            "description": result[5],
            "is_encrypted": result[6],
            "updated_by": result[7],
            "updated_at": result[8]
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/config/{config_key}")
async def update_system_config(
    config_key: str,
    config: SystemConfigUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update system configuration"""
    try:
        update_query = text("""
            UPDATE system_configuration
            SET config_value = COALESCE(:config_value, config_value),
                description = COALESCE(:description, description),
                updated_by = :updated_by,
                updated_at = now()
            WHERE config_key = :config_key
            RETURNING id
        """)
        
        result = db.execute(update_query, {
            "config_key": config_key,
            "config_value": config.config_value,
            "description": config.description,
            "updated_by": current_user.get('id')
        }).fetchone()
        
        if not result:
            raise HTTPException(status_code=404, detail="Configuration not found")
        
        db.commit()
        
        return {"message": "Configuration updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/config/categories/list")
async def get_config_categories(
    db: Session = Depends(get_db)
):
    """Get all configuration categories"""
    try:
        query = text("""
            SELECT DISTINCT category, COUNT(*) as config_count
            FROM system_configuration
            GROUP BY category
            ORDER BY category
        """)
        
        results = db.execute(query).fetchall()
        
        categories = []
        for row in results:
            categories.append({
                "name": row[0],
                "count": row[1]
            })
        
        return {"categories": categories}
    except Exception as e:
        return {"categories": [], "error": str(e)}


print("[OK] System Configuration routes loaded successfully")

