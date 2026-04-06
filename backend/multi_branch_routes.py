"""
Multi-Branch Management Routes
Handles branch operations for multi-location pharmacy management
"""
from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, func
from sqlalchemy.ext.declarative import declarative_base
from pydantic import BaseModel, Field, validator
from typing import List, Optional
from datetime import datetime
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

load_dotenv()

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL environment variable is not set")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

router = APIRouter(prefix="/api/branches", tags=["Multi-Branch Management"])

# ==================== MODELS ====================

class Branch(Base):
    """Branch database model"""
    __tablename__ = "branches"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), unique=True, index=True, nullable=False)
    name = Column(String(200), nullable=False)
    address = Column(Text)
    city = Column(String(100))
    state = Column(String(100))
    postal_code = Column(String(20))
    country = Column(String(100), default="Bangladesh")
    phone = Column(String(20))
    email = Column(String(100))
    manager_name = Column(String(200))
    manager_phone = Column(String(20))
    is_active = Column(Boolean, default=True)
    is_head_office = Column(Boolean, default=False)
    opening_date = Column(DateTime)
    total_employees = Column(Integer, default=0)
    monthly_sales_target = Column(Float, default=0.0)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# ==================== SCHEMAS ====================

class BranchCreate(BaseModel):
    """Schema for creating a branch"""
    code: str = Field(..., min_length=2, max_length=20, description="Unique branch code")
    name: str = Field(..., min_length=3, max_length=200, description="Branch name")
    address: Optional[str] = Field(None, description="Physical address")
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    postal_code: Optional[str] = Field(None, max_length=20)
    country: str = Field(default="Bangladesh", max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    email: Optional[str] = Field(None, max_length=100)
    manager_name: Optional[str] = Field(None, max_length=200)
    manager_phone: Optional[str] = Field(None, max_length=20)
    is_active: bool = Field(default=True)
    is_head_office: bool = Field(default=False)
    opening_date: Optional[datetime] = None
    total_employees: int = Field(default=0, ge=0)
    monthly_sales_target: float = Field(default=0.0, ge=0)
    notes: Optional[str] = None

    @validator('code')
    def code_must_be_alphanumeric(cls, v):
        if not v.replace('_', '').replace('-', '').isalnum():
            raise ValueError('Branch code must be alphanumeric (with _ or - allowed)')
        return v.upper()

    @validator('email')
    def email_validation(cls, v):
        if v and '@' not in v:
            raise ValueError('Invalid email address')
        return v

class BranchUpdate(BaseModel):
    """Schema for updating a branch"""
    name: Optional[str] = Field(None, min_length=3, max_length=200)
    address: Optional[str] = None
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    postal_code: Optional[str] = Field(None, max_length=20)
    country: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    email: Optional[str] = Field(None, max_length=100)
    manager_name: Optional[str] = Field(None, max_length=200)
    manager_phone: Optional[str] = Field(None, max_length=20)
    is_active: Optional[bool] = None
    is_head_office: Optional[bool] = None
    opening_date: Optional[datetime] = None
    total_employees: Optional[int] = Field(None, ge=0)
    monthly_sales_target: Optional[float] = Field(None, ge=0)
    notes: Optional[str] = None

class BranchResponse(BaseModel):
    """Schema for branch response"""
    id: int
    code: str
    name: str
    address: Optional[str]
    city: Optional[str]
    state: Optional[str]
    postal_code: Optional[str]
    country: str
    phone: Optional[str]
    email: Optional[str]
    manager_name: Optional[str]
    manager_phone: Optional[str]
    is_active: bool
    is_head_office: bool
    opening_date: Optional[datetime]
    total_employees: int
    monthly_sales_target: float
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class BranchStats(BaseModel):
    """Branch statistics"""
    total_branches: int
    active_branches: int
    inactive_branches: int
    total_employees: int
    head_office_branch: Optional[BranchResponse]

# ==================== ROUTES ====================

@router.post("/", response_model=BranchResponse, status_code=status.HTTP_201_CREATED)
async def create_branch(branch: BranchCreate, db: Session = Depends(get_db)):
    """
    Create a new branch
    
    - **code**: Unique branch code (auto-uppercased)
    - **name**: Branch name
    - **address, city, state, etc.**: Location details
    - **manager_name**: Branch manager name
    - **is_active**: Branch status
    - **is_head_office**: Mark as head office
    """
    try:
        # Check if code already exists
        existing = db.query(Branch).filter(Branch.code == branch.code).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Branch with code '{branch.code}' already exists"
            )
        
        # Create new branch
        db_branch = Branch(**branch.dict())
        db.add(db_branch)
        db.commit()
        db.refresh(db_branch)
        
        return db_branch
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating branch: {str(e)}"
        )

@router.get("/", response_model=List[BranchResponse])
async def get_all_branches(
    skip: int = 0,
    limit: int = 100,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """
    Get all branches with optional filtering
    
    - **skip**: Number of records to skip (pagination)
    - **limit**: Maximum number of records to return
    - **is_active**: Filter by active status
    """
    try:
        query = db.query(Branch)
        
        if is_active is not None:
            query = query.filter(Branch.is_active == is_active)
        
        branches = query.offset(skip).limit(limit).all()
        return branches
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching branches: {str(e)}"
        )

@router.get("/stats", response_model=BranchStats)
async def get_branch_stats(db: Session = Depends(get_db)):
    """Get overall branch statistics"""
    try:
        total = db.query(Branch).count()
        active = db.query(Branch).filter(Branch.is_active == True).count()
        inactive = total - active
        total_employees = db.query(func.sum(Branch.total_employees)).scalar() or 0
        head_office = db.query(Branch).filter(Branch.is_head_office == True).first()
        
        return {
            "total_branches": total,
            "active_branches": active,
            "inactive_branches": inactive,
            "total_employees": int(total_employees),
            "head_office_branch": head_office
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching branch stats: {str(e)}"
        )

@router.get("/{branch_id}", response_model=BranchResponse)
async def get_branch(branch_id: int, db: Session = Depends(get_db)):
    """Get a specific branch by ID"""
    try:
        branch = db.query(Branch).filter(Branch.id == branch_id).first()
        if not branch:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Branch with ID {branch_id} not found"
            )
        return branch
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching branch: {str(e)}"
        )

@router.get("/code/{branch_code}", response_model=BranchResponse)
async def get_branch_by_code(branch_code: str, db: Session = Depends(get_db)):
    """Get a specific branch by code"""
    try:
        branch = db.query(Branch).filter(Branch.code == branch_code.upper()).first()
        if not branch:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Branch with code '{branch_code}' not found"
            )
        return branch
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching branch: {str(e)}"
        )

@router.put("/{branch_id}", response_model=BranchResponse)
async def update_branch(
    branch_id: int,
    branch_update: BranchUpdate,
    db: Session = Depends(get_db)
):
    """Update a branch"""
    try:
        db_branch = db.query(Branch).filter(Branch.id == branch_id).first()
        if not db_branch:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Branch with ID {branch_id} not found"
            )
        
        # Update fields
        update_data = branch_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_branch, field, value)
        
        db_branch.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_branch)
        
        return db_branch
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating branch: {str(e)}"
        )

@router.delete("/{branch_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_branch(branch_id: int, db: Session = Depends(get_db)):
    """
    Delete a branch (soft delete - marks as inactive)
    
    For permanent deletion, use force=true query parameter
    """
    try:
        db_branch = db.query(Branch).filter(Branch.id == branch_id).first()
        if not db_branch:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Branch with ID {branch_id} not found"
            )
        
        # Soft delete (mark as inactive)
        db_branch.is_active = False
        db_branch.updated_at = datetime.utcnow()
        db.commit()
        
        return {"message": "Branch deactivated successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting branch: {str(e)}"
        )

# ==================== INITIALIZE DATABASE ====================

def create_tables():
    """Create database tables if they don't exist"""
    try:
        Base.metadata.create_all(bind=engine)
        print("[OK] Multi-branch tables created/verified successfully")
    except Exception as e:
        print(f"[ERROR] Failed to create multi-branch tables: {e}")

# Create tables on module import
create_tables()

