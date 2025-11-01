from fastapi import FastAPI, HTTPException, Depends, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from pydantic import BaseModel, EmailStr, validator, Field
from typing import List, Optional
from datetime import datetime, timedelta
import os
import uuid
import secrets
from passlib.context import CryptContext
from jose import JWTError, jwt
from dotenv import load_dotenv
from sqlalchemy import text
from pathlib import Path
from io import StringIO, TextIOWrapper
import csv
from fastapi.responses import StreamingResponse, HTMLResponse

# Load environment variables
load_dotenv()

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:pharmazine123@localhost:5432/pharmazine")

# Redis configuration
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# Environment
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

# Authentication configuration
SECRET_KEY = os.getenv("SECRET_KEY", secrets.token_urlsafe(32))
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT token security
security = HTTPBearer()

# Create FastAPI app
app = FastAPI(title="Pharmazine API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost", "http://localhost:80", "http://localhost:3000", "http://localhost:8080", "http://localhost:8081", "http://localhost:8082", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database setup
if "sqlite" in DATABASE_URL:
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Database Models
class Profile(Base):
    __tablename__ = "profiles"
    
    id = Column(String, primary_key=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    phone = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    roles = relationship("UserRole", back_populates="user")

class UserRole(Base):
    __tablename__ = "user_roles"
    
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("profiles.id"), nullable=False)
    role = Column(String, nullable=False)  # admin, manager, employee
    created_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("Profile", back_populates="roles")

class Category(Base):
    __tablename__ = "categories"
    
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Subcategory(Base):
    __tablename__ = "subcategories"
    
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    category_id = Column(String, ForeignKey("categories.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Country(Base):
    __tablename__ = "countries"
    
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    code = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Supplier(Base):
    __tablename__ = "suppliers"
    
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    contact_person = Column(String)
    phone = Column(String)
    email = Column(String)
    address = Column(Text)
    payment_terms = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Customer(Base):
    __tablename__ = "customers"
    
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    email = Column(String)
    phone = Column(String)
    address = Column(Text)
    company = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Company(Base):
    __tablename__ = "companies"
    
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    email = Column(String)
    phone = Column(String)
    address = Column(Text)
    website = Column(String)
    tax_id = Column(String)
    registration_number = Column(String)
    business_type = Column(String)
    established_date = Column(String)
    description = Column(Text)
    logo_url = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Product(Base):
    __tablename__ = "products"
    
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    sku = Column(String, unique=True, nullable=False)
    category_id = Column(String, ForeignKey("categories.id"))
    subcategory_id = Column(String, ForeignKey("subcategories.id"))
    supplier_id = Column(String, ForeignKey("suppliers.id"))
    description = Column(Text)
    unit_price = Column(Float, nullable=False)
    cost_price = Column(Float, nullable=False)
    # Pharmacy/feed extensions
    unit_type = Column(String, nullable=True)
    unit_size = Column(String, nullable=True)
    unit_multiplier = Column(Float, nullable=True)
    purchase_price = Column(Float, nullable=True)
    selling_price = Column(Float, nullable=True)
    min_stock_threshold = Column(Integer, default=0)
    stock_quantity = Column(Integer, default=0)
    reorder_level = Column(Integer, default=0)
    min_stock_level = Column(Integer, default=0)
    max_stock_level = Column(Integer, default=0)
    image_url = Column(String)
    brand = Column(String)
    model = Column(String)  # For medical equipment model numbers
    manufacturer = Column(String)
    country_of_origin = Column(String)
    mrp_unit = Column(Float)
    mrp_strip = Column(Float)
    weight = Column(Float)  # Medicine/product weight
    dimensions = Column(String)  # Package dimensions
    color = Column(String)  # Medicine color for identification
    specifications = Column(Text)  # Product specifications
    features = Column(Text)  # Product features
    package_contents = Column(Text)  # Package contents
    # Pharmacy-specific fields (from Phase 1 migration)
    generic_name = Column(String)
    brand_name = Column(String)
    strength = Column(String)  # e.g., "500mg", "10ml"
    composition = Column(Text)
    barcode = Column(String)
    qr_code = Column(String)
    shelf_life_days = Column(Integer)
    storage_condition = Column(String)
    is_prescription_required = Column(Boolean, default=False)
    is_schedule_drug = Column(Boolean, default=False)
    schedule_category = Column(String)  # H, H1, X, etc.
    side_effects = Column(Text)
    dosage_info = Column(Text)
    pack_size = Column(Integer, default=1)
    strip_size = Column(Integer, default=1)
    box_size = Column(Integer, default=1)
    vat_percentage = Column(Float, default=0)
    cgst_percentage = Column(Float, default=0)
    sgst_percentage = Column(Float, default=0)
    igst_percentage = Column(Float, default=0)
    hsn_code = Column(String)
    max_discount_percentage = Column(Float, default=0)
    is_narcotic = Column(Boolean, default=False)
    rack_number = Column(String)
    shelf_number = Column(String)
    # Legacy pharmacy fields (to be migrated to new structure)
    batch_number = Column(String)
    expiry_date = Column(DateTime)
    manufacturing_date = Column(DateTime)
    shelf_life = Column(String)
    active_ingredients = Column(Text)
    dosage = Column(String)
    storage_instructions = Column(Text)
    indications = Column(Text)
    prescription_required = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class ProductStock(Base):
    __tablename__ = "product_stock"

    id = Column(String, primary_key=True)
    product_id = Column(String, nullable=False)
    store_id = Column(String, nullable=True)
    opening_qty = Column(Float, default=0)
    current_qty = Column(Float, default=0)
    reserved_qty = Column(Float, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Purchases & GRN
class Purchase(Base):
    __tablename__ = "purchases"

    id = Column(String, primary_key=True)
    supplier_id = Column(String)
    invoice_no = Column(String)
    date = Column(String)
    total_amount = Column(Float, default=0)
    payment_status = Column(String, default="pending")
    created_by = Column(String, ForeignKey("profiles.id"))
    store_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class PurchaseItem(Base):
    __tablename__ = "purchase_items"

    id = Column(String, primary_key=True)
    purchase_id = Column(String, ForeignKey("purchases.id"), nullable=False)
    product_id = Column(String, ForeignKey("products.id"), nullable=False)
    qty = Column(Float, nullable=False)
    unit = Column(String)
    unit_price = Column(Float, nullable=False)
    total_price = Column(Float, nullable=False)
    # Pharmacy-specific fields
    batch_no = Column(String)
    expiry_date = Column(DateTime)
    mrp = Column(Float)
    gst_percent = Column(Float)

class GRN(Base):
    __tablename__ = "grns"

    id = Column(String, primary_key=True)
    purchase_id = Column(String, ForeignKey("purchases.id"), nullable=False)
    date = Column(String)
    created_by = Column(String, ForeignKey("profiles.id"))

class StockTransaction(Base):
    __tablename__ = "stock_transactions"
    
    id = Column(String, primary_key=True)
    product_id = Column(String, ForeignKey("products.id"), nullable=False)
    transaction_type = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float)
    reference_id = Column(String)
    notes = Column(Text)
    from_location = Column(String)
    to_location = Column(String)
    reason = Column(String)
    created_by = Column(String, ForeignKey("profiles.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

class Sale(Base):
    __tablename__ = "sales"
    
    id = Column(String, primary_key=True)
    customer_name = Column(String, nullable=False)
    customer_phone = Column(String)
    customer_email = Column(String)
    total_amount = Column(Float, nullable=False)
    discount = Column(Float, default=0)
    tax = Column(Float, default=0)
    net_amount = Column(Float, nullable=False)
    payment_method = Column(String, nullable=False)
    payment_status = Column(String, nullable=False)
    emi_enabled = Column(Boolean, default=False)
    emi_months = Column(Integer)
    emi_amount = Column(Float)
    emi_interest_rate = Column(Float)
    notes = Column(Text)
    created_by = Column(String, ForeignKey("profiles.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class SaleItem(Base):
    __tablename__ = "sales_items"
    
    id = Column(String, primary_key=True)
    sale_id = Column(String, ForeignKey("sales.id"), nullable=False)
    product_id = Column(String, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    total_price = Column(Float, nullable=False)
    # Pharmacy-specific fields
    batch_no = Column(String)
    expiry_date = Column(DateTime)
    gst_percent = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)

class SalePayment(Base):
    __tablename__ = "sale_payments"
    
    id = Column(String, primary_key=True)
    sale_id = Column(String, ForeignKey("sales.id"), nullable=False)
    amount = Column(Float, nullable=False)
    method = Column(String, nullable=False)  # cash | card | online | bank
    status = Column(String, nullable=False, default="pending")  # pending | cleared
    created_by = Column(String, ForeignKey("profiles.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    cleared_at = Column(DateTime, nullable=True)

# New Stock Management Tables
class ElcReceiveMaster(Base):
    __tablename__ = "elc_receive_master"
    
    receive_pk_no = Column(Integer, primary_key=True, autoincrement=True)
    chalan_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    chalan_no = Column(String(100), nullable=True)
    category = Column(String, nullable=True)
    supplier_name = Column(String, nullable=True)
    product_model_number = Column(String, nullable=True)
    receive_type = Column(String(50), nullable=True)
    status = Column(Integer, nullable=True, default=1)
    au_entry_by = Column(Integer, nullable=False)
    au_entry_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    au_update_by = Column(Integer, nullable=True)
    au_update_at = Column(DateTime, nullable=True)

class ElcReceiveDetails(Base):
    __tablename__ = "elc_receive_details"
    
    receivedtl_pk_no = Column(Integer, primary_key=True, autoincrement=True)
    receive_pk_no = Column(Integer, ForeignKey("elc_receive_master.receive_pk_no"), nullable=True)
    chalan_no = Column(String(100), nullable=True)
    item_barcode = Column(String(200), nullable=True)
    item_pk_no = Column(Integer, nullable=False)
    item_name = Column(String(200), nullable=True)
    receive_quantity = Column(Float, nullable=False, default=0)
    unit_price = Column(Float, nullable=True)
    status = Column(Integer, nullable=True, default=0)
    au_entry_by = Column(Integer, nullable=False)
    au_entry_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    au_update_by = Column(Integer, nullable=True)
    au_update_at = Column(DateTime, nullable=True)
    adj_reason = Column(String(1000), nullable=True)
    adj_type = Column(String(100), nullable=True)
    remarks = Column(String(200), nullable=True)

class ElcIssueMaster(Base):
    __tablename__ = "elc_issue_master"
    
    issue_pk_no = Column(Integer, primary_key=True, autoincrement=True)
    chalan_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    chalan_no = Column(String(100), nullable=True)
    category = Column(String, nullable=True)
    supplier_name = Column(String, nullable=True)
    product_model_number = Column(String, nullable=True)
    issue_type = Column(String(50), nullable=True)
    status = Column(Integer, nullable=True, default=1)
    au_entry_by = Column(Integer, nullable=False)
    au_entry_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    au_update_by = Column(Integer, nullable=True)
    au_update_at = Column(DateTime, nullable=True)

class ElcIssueDetails(Base):
    __tablename__ = "elc_issue_details"
    
    issuedtl_pk_no = Column(Integer, primary_key=True, autoincrement=True)
    issue_pk_no = Column(Integer, ForeignKey("elc_issue_master.issue_pk_no"), nullable=True)
    chalan_no = Column(String(100), nullable=True)
    item_barcode = Column(String(200), nullable=True)
    item_pk_no = Column(Integer, nullable=False)
    item_name = Column(String(200), nullable=True)
    issue_quantity = Column(Float, nullable=False, default=0)
    unit_price = Column(Float, nullable=True)
    status = Column(Integer, nullable=True, default=0)
    au_entry_by = Column(Integer, nullable=False)
    au_entry_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    au_update_by = Column(Integer, nullable=True)
    au_update_at = Column(DateTime, nullable=True)
    adj_reason = Column(String(1000), nullable=True)
    adj_type = Column(String(100), nullable=True)
    remarks = Column(String(200), nullable=True)

# Requisition Models
class Requisition(Base):
    __tablename__ = "requisitions"

    id = Column(String, primary_key=True)
    store_id = Column(String, nullable=True)
    requested_by = Column(String, ForeignKey("profiles.id"))
    status = Column(String, default="pending")  # pending | approved | rejected | purchased
    approved_by = Column(String, nullable=True)
    approved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class RequisitionItem(Base):
    __tablename__ = "requisition_items"

    id = Column(String, primary_key=True)
    requisition_id = Column(String, ForeignKey("requisitions.id"), nullable=False)
    product_id = Column(String, ForeignKey("products.id"), nullable=False)
    qty = Column(Float, nullable=False)
    unit = Column(String, nullable=True)

# Finance Models
class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String, primary_key=True)
    date = Column(DateTime, default=datetime.utcnow)
    type = Column(String, nullable=False)  # cash_in, cash_out, sale_receivable, supplier_payment, expense
    amount = Column(Float, nullable=False)
    reference_id = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    created_by = Column(String, ForeignKey("profiles.id"))

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(String, primary_key=True)
    date = Column(DateTime, default=datetime.utcnow)
    category = Column(String)
    amount = Column(Float, nullable=False)
    description = Column(Text, nullable=True)
    receipt_url = Column(String, nullable=True)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("profiles.id"))
    action = Column(String)
    table_name = Column(String)
    record_id = Column(String)
    old_value = Column(Text)
    new_value = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Authentication helper functions
def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        # Fallback verification
        import hashlib
        return hashlib.sha256(plain_password.encode()).hexdigest() == hashed_password

def get_password_hash(password: str) -> str:
    try:
        return pwd_context.hash(password)
    except Exception:
        # Fallback to simple hash if bcrypt fails
        import hashlib
        return hashlib.sha256(password.encode()).hexdigest()

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_user_by_email(db: Session, email: str):
    return db.query(Profile).filter(Profile.email == email).first()

def get_roles_for_user(db: Session, user_id: str) -> List[str]:
    roles = db.query(UserRole).filter(UserRole.user_id == user_id).all()
    return [r.role for r in roles]

def require_roles(allowed_roles: List[str]):
    def _checker(current_user: Profile = Depends(get_current_user), db: Session = Depends(get_db)):
        roles = get_roles_for_user(db, current_user.id)
        if not any(role in allowed_roles for role in roles):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden: insufficient role")
        return True
    return _checker

def require_admin():
    return require_roles(["admin"])

# Chalan Generation Functions
def generate_chalan_number(receive_type: str, db: Session) -> str:
    """
    Generate chalan number in format: TYPE + 6 digits + MMYYYY
    Examples: OP000001112025, TR000001112025, ADJ000001112025
    """
    from datetime import datetime
    
    # Get current month and year
    now = datetime.now()
    month_year = f"{now.month:02d}{now.year}"
    
    # Map receive types to prefixes
    type_prefixes = {
        'OP': 'OP',      # Opening Stock
        'TRNS': 'TR',    # Transfer
        'ADJ': 'ADJ',    # Adjustment
        'PUR': 'PUR',    # Purchase
        'RET': 'RET'     # Return
    }
    
    prefix = type_prefixes.get(receive_type, 'GEN')
    
    # Get the next sequential number for this type and month/year
    # Count existing records for this type and month/year
    if receive_type in ['OP', 'TRNS', 'ADJ']:
        # For receive types, check elc_receive_master table
        count = db.query(ElcReceiveMaster).filter(
            ElcReceiveMaster.receive_type == receive_type,
            func.extract('month', ElcReceiveMaster.chalan_date) == now.month,
            func.extract('year', ElcReceiveMaster.chalan_date) == now.year
        ).count()
    else:
        # For issue types, check elc_issue_master table
        count = db.query(ElcIssueMaster).filter(
            ElcIssueMaster.issue_type == receive_type,
            func.extract('month', ElcIssueMaster.chalan_date) == now.month,
            func.extract('year', ElcIssueMaster.chalan_date) == now.year
        ).count()
    
    # Generate next sequential number (1-based)
    next_number = count + 1
    
    # Format as 6-digit number with leading zeros
    sequential = f"{next_number:06d}"
    
    # Combine: PREFIX + 6 digits + MMYYYY
    chalan_no = f"{prefix}{sequential}{month_year}"
    
    return chalan_no

def authenticate_user(db: Session, email: str, password: str):
    user = get_user_by_email(db, email)
    if not user:
        return False
    if not verify_password(password, user.password_hash):
        return False
    return user

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(Profile).filter(Profile.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user

# Pydantic models for requests
class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    full_name: str
    email: str
    password: str
    phone: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: Optional[str] = None

class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None

class SubcategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None
    category_id: Optional[str] = None

class CountryCreate(BaseModel):
    name: str
    code: str

class SupplierCreate(BaseModel):
    name: str
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    payment_terms: Optional[str] = None

class CustomerCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    company: Optional[str] = None

class CompanyCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    website: Optional[str] = None
    tax_id: Optional[str] = None
    registration_number: Optional[str] = None
    business_type: Optional[str] = None
    established_date: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None

class ProductCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Product name")
    sku: str = Field(..., min_length=1, max_length=100, description="Stock Keeping Unit")
    category_id: Optional[str] = None
    subcategory_id: Optional[str] = None
    supplier_id: Optional[str] = None
    description: Optional[str] = Field(None, max_length=5000)
    unit_price: float = Field(..., ge=0, description="Unit price must be non-negative")
    cost_price: float = Field(..., ge=0, description="Cost price must be non-negative")
    
    @validator('name', 'sku')
    def strip_whitespace(cls, v):
        return v.strip() if v else v
    
    @validator('unit_price', 'cost_price')
    def validate_prices(cls, v):
        if v < 0:
            raise ValueError('Price must be non-negative')
        return round(v, 2)
    unit_type: Optional[str] = None
    unit_size: Optional[str] = None
    unit_multiplier: Optional[float] = None
    purchase_price: Optional[float] = None
    selling_price: Optional[float] = None
    min_stock_threshold: Optional[int] = 0
    stock_quantity: int = 0
    reorder_level: int = 0
    min_stock_level: int = 0
    max_stock_level: int = 0
    image_url: Optional[str] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    manufacturer: Optional[str] = None
    country_of_origin: Optional[str] = None
    mrp_unit: Optional[float] = None
    mrp_strip: Optional[float] = None
    weight: Optional[float] = None  # Medicine weight
    dimensions: Optional[str] = None  # Package dimensions
    color: Optional[str] = None  # Medicine color
    specifications: Optional[str] = None
    features: Optional[str] = None
    package_contents: Optional[str] = None
    # Pharmacy-specific fields (from Phase 1)
    generic_name: Optional[str] = None
    brand_name: Optional[str] = None
    strength: Optional[str] = None
    composition: Optional[str] = None
    barcode: Optional[str] = None
    qr_code: Optional[str] = None
    shelf_life_days: Optional[int] = None
    storage_condition: Optional[str] = None
    is_prescription_required: bool = False
    is_schedule_drug: bool = False
    schedule_category: Optional[str] = None
    side_effects: Optional[str] = None
    dosage_info: Optional[str] = None
    pack_size: int = 1
    strip_size: int = 1
    box_size: int = 1
    vat_percentage: float = 0
    cgst_percentage: float = 0
    sgst_percentage: float = 0
    igst_percentage: float = 0
    hsn_code: Optional[str] = None
    max_discount_percentage: float = 0
    is_narcotic: bool = False
    rack_number: Optional[str] = None
    shelf_number: Optional[str] = None
    # Legacy pharmacy fields (for backward compatibility)
    batch_number: Optional[str] = None
    expiry_date: Optional[datetime] = None
    manufacturing_date: Optional[datetime] = None
    shelf_life: Optional[str] = None
    active_ingredients: Optional[str] = None
    dosage: Optional[str] = None
    storage_instructions: Optional[str] = None
    indications: Optional[str] = None
    side_effects: Optional[str] = None
    prescription_required: bool = False

class StockTransactionCreate(BaseModel):
    product_id: str
    transaction_type: str = Field(..., pattern="^(in|out|adjust)$")
    quantity: int = Field(..., gt=0, description="Quantity must be positive")
    unit_price: Optional[float] = Field(None, ge=0)
    
    @validator('quantity')
    def validate_quantity(cls, v):
        if v <= 0:
            raise ValueError('Quantity must be positive')
        return v
    reference_id: Optional[str] = None
    notes: Optional[str] = None
    from_location: Optional[str] = None
    to_location: Optional[str] = None
    reason: Optional[str] = None
    created_by: Optional[str] = None

class SaleCreate(BaseModel):
    customer_name: str = Field(..., min_length=1, max_length=255)
    customer_phone: Optional[str] = Field(None, max_length=20)
    customer_email: Optional[EmailStr] = None
    total_amount: float = Field(..., ge=0)
    discount: float = Field(0, ge=0)
    tax: float = Field(0, ge=0)
    net_amount: float = Field(..., ge=0)
    payment_method: str = Field(..., pattern="^(cash|card|online|bank)$")
    payment_status: str = Field(..., pattern="^(pending|completed|failed)$")
    
    @validator('customer_name')
    def validate_customer_name(cls, v):
        return v.strip() if v else v
    
    @validator('net_amount')
    def validate_net_amount(cls, v, values):
        if 'total_amount' in values and 'discount' in values and 'tax' in values:
            expected = values['total_amount'] - values['discount'] + values['tax']
            if abs(v - expected) > 0.01:
                raise ValueError('Net amount calculation mismatch')
        return round(v, 2)
    emi_enabled: bool = False
    emi_months: Optional[int] = None
    emi_amount: Optional[float] = None
    emi_interest_rate: Optional[float] = None
    notes: Optional[str] = None
    created_by: Optional[str] = None

class SaleItemCreate(BaseModel):
    sale_id: str
    product_id: str
    quantity: int
    unit_price: float
    total_price: float
    # Pharmacy-specific fields
    batch_no: Optional[str] = None
    expiry_date: Optional[datetime] = None
    gst_percent: Optional[float] = None

class PaymentCreate(BaseModel):
    amount: float
    method: str  # cash | card | online | bank
    status: Optional[str] = None  # pending | cleared (admin can set cleared)

class PurchaseItemCreate(BaseModel):
    product_id: str
    qty: float
    unit: Optional[str] = None
    unit_price: float
    # Pharmacy-specific fields
    batch_no: Optional[str] = None
    expiry_date: Optional[datetime] = None
    mrp: Optional[float] = None
    gst_percent: Optional[float] = None

class PurchaseCreate(BaseModel):
    supplier_id: Optional[str] = None
    invoice_no: Optional[str] = None
    date: Optional[str] = None
    items: List[PurchaseItemCreate]
    payment_status: Optional[str] = "pending"
    created_by: Optional[str] = None
    store_id: Optional[str] = None

class GRNCreate(BaseModel):
    purchase_id: str
    date: Optional[str] = None
    created_by: Optional[str] = None

# Pydantic models for API
class ProfileResponse(BaseModel):
    id: str
    full_name: str
    email: str
    phone: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class CategoryResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class SubcategoryResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    category_id: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class CountryResponse(BaseModel):
    id: str
    name: str
    code: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class SupplierResponse(BaseModel):
    id: str
    name: str
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    payment_terms: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class CustomerResponse(BaseModel):
    id: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    company: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class CompanyResponse(BaseModel):
    id: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    website: Optional[str] = None
    tax_id: Optional[str] = None
    registration_number: Optional[str] = None
    business_type: Optional[str] = None
    established_date: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ProductResponse(BaseModel):
    id: str
    name: str
    sku: str
    category_id: Optional[str] = None
    category: Optional[str] = None
    subcategory_id: Optional[str] = None
    supplier_id: Optional[str] = None
    description: Optional[str] = None
    unit_price: float
    cost_price: float
    stock_quantity: int
    reorder_level: Optional[int] = None
    min_stock_level: Optional[int] = None
    max_stock_level: Optional[int] = None
    image_url: Optional[str] = None
    brand: Optional[str] = None
    model: Optional[str] = None  # Medical equipment model
    manufacturer: Optional[str] = None
    country_of_origin: Optional[str] = None
    mrp_unit: Optional[float] = None
    mrp_strip: Optional[float] = None
    weight: Optional[float] = None  # Product weight
    dimensions: Optional[str] = None  # Package dimensions
    color: Optional[str] = None  # Medicine color
    specifications: Optional[str] = None
    features: Optional[str] = None
    package_contents: Optional[str] = None
    # Pharmacy-specific update fields
    generic_name: Optional[str] = None
    brand_name: Optional[str] = None
    strength: Optional[str] = None
    composition: Optional[str] = None
    barcode: Optional[str] = None
    qr_code: Optional[str] = None
    shelf_life_days: Optional[int] = None
    storage_condition: Optional[str] = None
    is_prescription_required: Optional[bool] = None
    is_schedule_drug: Optional[bool] = None
    schedule_category: Optional[str] = None
    side_effects: Optional[str] = None
    dosage_info: Optional[str] = None
    pack_size: Optional[int] = None
    strip_size: Optional[int] = None
    box_size: Optional[int] = None
    vat_percentage: Optional[float] = None
    cgst_percentage: Optional[float] = None
    sgst_percentage: Optional[float] = None
    igst_percentage: Optional[float] = None
    hsn_code: Optional[str] = None
    max_discount_percentage: Optional[float] = None
    is_narcotic: Optional[bool] = None
    rack_number: Optional[str] = None
    shelf_number: Optional[str] = None
    unit_type: Optional[str] = None
    unit_size: Optional[str] = None
    unit_multiplier: Optional[float] = None
    purchase_price: Optional[float] = None
    selling_price: Optional[float] = None
    min_stock_threshold: Optional[int] = None
    # Pharmacy-specific fields
    batch_number: Optional[str] = None
    expiry_date: Optional[datetime] = None
    manufacturing_date: Optional[datetime] = None
    shelf_life: Optional[str] = None
    active_ingredients: Optional[str] = None
    dosage: Optional[str] = None
    storage_instructions: Optional[str] = None
    indications: Optional[str] = None
    side_effects: Optional[str] = None
    prescription_required: Optional[bool] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class StockTransactionResponse(BaseModel):
    id: str
    product_id: str
    transaction_type: str
    quantity: int
    unit_price: Optional[float] = None
    reference_id: Optional[str] = None
    notes: Optional[str] = None
    from_location: Optional[str] = None
    to_location: Optional[str] = None
    reason: Optional[str] = None
    created_by: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class SaleResponse(BaseModel):
    id: str
    customer_name: str
    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None
    total_amount: float
    discount: float
    tax: float
    net_amount: float
    payment_method: str
    payment_status: str
    emi_enabled: bool
    emi_months: Optional[int] = None
    emi_amount: Optional[float] = None
    emi_interest_rate: Optional[float] = None
    notes: Optional[str] = None
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class SaleItemResponse(BaseModel):
    id: str
    sale_id: str
    product_id: str
    quantity: int
    unit_price: float
    total_price: float
    batch_no: Optional[str] = None
    expiry_date: Optional[datetime] = None
    gst_percent: Optional[float] = None
    created_at: datetime

    class Config:
        from_attributes = True

class PurchaseItemResponse(BaseModel):
    id: str
    purchase_id: str
    product_id: str
    qty: float
    unit: Optional[str] = None
    unit_price: float
    total_price: float
    batch_no: Optional[str] = None
    expiry_date: Optional[datetime] = None
    mrp: Optional[float] = None
    gst_percent: Optional[float] = None

    class Config:
        from_attributes = True

class PurchaseResponse(BaseModel):
    id: str
    supplier_id: Optional[str] = None
    invoice_no: Optional[str] = None
    date: Optional[str] = None
    total_amount: float
    payment_status: str
    created_by: Optional[str] = None
    store_id: Optional[str] = None
    created_at: datetime
    items: Optional[List[PurchaseItemResponse]] = None

    class Config:
        from_attributes = True

class GRNResponse(BaseModel):
    id: str
    purchase_id: str
    date: Optional[str] = None
    created_by: Optional[str] = None

    class Config:
        from_attributes = True

# New Stock Management Pydantic Models
class ElcReceiveMasterCreate(BaseModel):
    category: Optional[str] = None
    supplier_name: Optional[str] = None
    product_model_number: Optional[str] = None
    receive_type: str
    au_entry_by: int

class ElcReceiveMasterResponse(BaseModel):
    receive_pk_no: int
    chalan_date: datetime
    chalan_no: Optional[str] = None
    category: Optional[str] = None
    supplier_name: Optional[str] = None
    product_model_number: Optional[str] = None
    receive_type: Optional[str] = None
    status: Optional[int] = None
    au_entry_by: int
    au_entry_at: datetime
    au_update_by: Optional[int] = None
    au_update_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ElcReceiveDetailsCreate(BaseModel):
    receive_pk_no: Optional[int] = None
    chalan_no: Optional[str] = None
    item_barcode: Optional[str] = None
    item_pk_no: int
    item_name: Optional[str] = None
    receive_quantity: float
    unit_price: Optional[float] = None
    adj_reason: Optional[str] = None
    adj_type: Optional[str] = None
    remarks: Optional[str] = None
    au_entry_by: int

class ElcReceiveDetailsResponse(BaseModel):
    receivedtl_pk_no: int
    receive_pk_no: Optional[int] = None
    chalan_no: Optional[str] = None
    item_barcode: Optional[str] = None
    item_pk_no: int
    item_name: Optional[str] = None
    receive_quantity: float
    unit_price: Optional[float] = None
    status: Optional[int] = None
    au_entry_by: int
    au_entry_at: datetime
    au_update_by: Optional[int] = None
    au_update_at: Optional[datetime] = None
    adj_reason: Optional[str] = None
    adj_type: Optional[str] = None
    remarks: Optional[str] = None

    class Config:
        from_attributes = True

class ElcIssueMasterCreate(BaseModel):
    category: Optional[str] = None
    supplier_name: Optional[str] = None
    product_model_number: Optional[str] = None
    issue_type: str
    au_entry_by: int

class ElcIssueMasterResponse(BaseModel):
    issue_pk_no: int
    chalan_date: datetime
    chalan_no: Optional[str] = None
    category: Optional[str] = None
    supplier_name: Optional[str] = None
    product_model_number: Optional[str] = None
    issue_type: Optional[str] = None
    status: Optional[int] = None
    au_entry_by: int
    au_entry_at: datetime
    au_update_by: Optional[int] = None
    au_update_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ElcIssueDetailsCreate(BaseModel):
    issue_pk_no: Optional[int] = None
    chalan_no: Optional[str] = None
    item_barcode: Optional[str] = None
    item_pk_no: int
    item_name: Optional[str] = None
    issue_quantity: float
    unit_price: Optional[float] = None
    adj_reason: Optional[str] = None
    adj_type: Optional[str] = None
    remarks: Optional[str] = None
    au_entry_by: int

class ElcIssueDetailsResponse(BaseModel):
    issuedtl_pk_no: int
    issue_pk_no: Optional[int] = None
    chalan_no: Optional[str] = None
    item_barcode: Optional[str] = None
    item_pk_no: int
    item_name: Optional[str] = None
    issue_quantity: float
    unit_price: Optional[float] = None
    status: Optional[int] = None
    au_entry_by: int
    au_entry_at: datetime
    au_update_by: Optional[int] = None
    au_update_at: Optional[datetime] = None
    adj_reason: Optional[str] = None
    adj_type: Optional[str] = None
    remarks: Optional[str] = None

    class Config:
        from_attributes = True

# Requisition Schemas
class RequisitionItemCreate(BaseModel):
    product_id: str
    qty: float
    unit: Optional[str] = None

class RequisitionCreate(BaseModel):
    store_id: Optional[str] = None
    items: List[RequisitionItemCreate]

class RequisitionResponse(BaseModel):
    id: str
    store_id: Optional[str] = None
    requested_by: str
    status: str
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class TransactionCreate(BaseModel):
    date: Optional[datetime] = None
    type: str
    amount: float
    reference_id: Optional[str] = None
    description: Optional[str] = None

class ExpenseCreate(BaseModel):
    date: Optional[datetime] = None
    category: Optional[str] = None
    amount: float
    description: Optional[str] = None
    receipt_url: Optional[str] = None

# API Endpoints
@app.get("/api/health")
async def health_check():
    return {"status": "OK", "database": "Connected"}

# Authentication endpoints
@app.post("/api/auth/login", response_model=Token)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, request.email, request.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.id}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/auth/register", response_model=ProfileResponse)
async def register(request: RegisterRequest, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = get_user_by_email(db, request.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(request.password)
    user = Profile(
        id=str(uuid.uuid4()),
        full_name=request.full_name,
        email=request.email,
        password_hash=hashed_password,
        phone=request.phone
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Create default role (employee)
    role = UserRole(
        id=str(uuid.uuid4()),
        user_id=user.id,
        role="employee"
    )
    db.add(role)
    db.commit()
    
    return user

@app.get("/api/auth/me", response_model=ProfileResponse)
async def get_current_user_info(current_user: Profile = Depends(get_current_user)):
    return current_user

@app.get("/api/users/{user_id}/roles")
async def get_user_roles(user_id: str, db: Session = Depends(get_db)):
    roles = db.query(UserRole).filter(UserRole.user_id == user_id).all()
    return [{"role": role.role} for role in roles]

# CRUD endpoints for all entities
@app.get("/api/categories", response_model=List[CategoryResponse])
async def get_categories(db: Session = Depends(get_db)):
    return db.query(Category).all()

@app.get("/api/subcategories", response_model=List[SubcategoryResponse])
async def get_subcategories(db: Session = Depends(get_db)):
    return db.query(Subcategory).all()

@app.get("/api/countries", response_model=List[CountryResponse])
async def get_countries(db: Session = Depends(get_db)):
    return db.query(Country).all()

@app.get("/api/suppliers", response_model=List[SupplierResponse])
async def get_suppliers(db: Session = Depends(get_db)):
    return db.query(Supplier).all()

@app.get("/api/customers", response_model=List[CustomerResponse])
async def get_customers(db: Session = Depends(get_db)):
    return db.query(Customer).all()

@app.get("/api/companies", response_model=List[CompanyResponse])
async def get_companies(db: Session = Depends(get_db)):
    return db.query(Company).all()

@app.get("/api/products", response_model=List[ProductResponse])
async def get_products(db: Session = Depends(get_db)):
    products = db.query(Product).all()
    result = []
    for product in products:
        product_dict = {
            "id": product.id,
            "name": product.name,
            "sku": product.sku,
            "category_id": product.category_id,
            "category": None,
            "subcategory_id": product.subcategory_id,
            "supplier_id": product.supplier_id,
            "description": product.description,
            "unit_price": product.unit_price,
            "cost_price": product.cost_price,
            "stock_quantity": product.stock_quantity,
            "reorder_level": product.reorder_level,
            "min_stock_level": product.min_stock_level,
            "max_stock_level": product.max_stock_level,
            "image_url": product.image_url,
            "brand": product.brand,
            "model": product.model,
            "manufacturer": product.manufacturer,
            "country_of_origin": product.country_of_origin,
            "mrp_unit": product.mrp_unit,
            "mrp_strip": product.mrp_strip,
            "weight": product.weight,
            "dimensions": product.dimensions,
            "color": product.color,
            "specifications": product.specifications,
            "features": product.features,
            "package_contents": product.package_contents,
            "unit_type": getattr(product, "unit_type", None),
            "unit_size": getattr(product, "unit_size", None),
            "unit_multiplier": getattr(product, "unit_multiplier", None),
            "purchase_price": getattr(product, "purchase_price", None),
            "selling_price": getattr(product, "selling_price", None),
            "min_stock_threshold": getattr(product, "min_stock_threshold", None),
            "batch_number": getattr(product, "batch_number", None),
            "expiry_date": getattr(product, "expiry_date", None),
            "manufacturing_date": getattr(product, "manufacturing_date", None),
            "shelf_life": getattr(product, "shelf_life", None),
            "active_ingredients": getattr(product, "active_ingredients", None),
            "dosage": getattr(product, "dosage", None),
            "storage_instructions": getattr(product, "storage_instructions", None),
            "indications": getattr(product, "indications", None),
            "side_effects": getattr(product, "side_effects", None),
            "prescription_required": getattr(product, "prescription_required", False),
            "created_at": product.created_at,
            "updated_at": product.updated_at
        }
        
        # Get category name if category_id exists
        if product.category_id:
            category = db.query(Category).filter(Category.id == product.category_id).first()
            if category:
                product_dict["category"] = category.name
        
        result.append(ProductResponse(**product_dict))
    
    return result

@app.get("/api/products/{product_id}/stock")
async def get_product_stock(product_id: str, db: Session = Depends(get_db)):
    # Sum stock across stores if product_stock exists; fallback to product.stock_quantity
    try:
        total = db.query(func.coalesce(func.sum(ProductStock.current_qty), 0)).filter(ProductStock.product_id == product_id).scalar()
        return {"product_id": product_id, "total_qty": float(total)}
    except Exception:
        product = db.query(Product).filter(Product.id == product_id).first()
        qty = product.stock_quantity if product else 0
        return {"product_id": product_id, "total_qty": float(qty)}

@app.get("/api/sales", response_model=List[SaleResponse])
async def get_sales(db: Session = Depends(get_db)):
    return db.query(Sale).all()

@app.get("/api/stock-transactions", response_model=List[StockTransactionResponse])
async def get_stock_transactions(db: Session = Depends(get_db)):
    return db.query(StockTransaction).all()

@app.get("/api/sales/{sale_id}/items", response_model=List[SaleItemResponse])
async def get_sale_items(sale_id: str, db: Session = Depends(get_db)):
    return db.query(SaleItem).filter(SaleItem.sale_id == sale_id).all()

# POST endpoints for creating records
@app.post("/api/categories", response_model=CategoryResponse, dependencies=[Depends(require_admin())])
async def create_category(category: CategoryCreate, db: Session = Depends(get_db)):
    db_category = Category(
        id=str(uuid.uuid4()),
        **category.dict()
    )
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    write_audit_log(db, None, "create", "categories", db_category.id, None, {"name": db_category.name, "description": db_category.description})
    return db_category

@app.post("/api/subcategories", response_model=SubcategoryResponse, dependencies=[Depends(require_admin())])
async def create_subcategory(subcategory: SubcategoryCreate, db: Session = Depends(get_db)):
    db_subcategory = Subcategory(
        id=str(uuid.uuid4()),
        **subcategory.dict()
    )
    db.add(db_subcategory)
    db.commit()
    db.refresh(db_subcategory)
    return db_subcategory

@app.put("/api/subcategories/{subcategory_id}", response_model=SubcategoryResponse, dependencies=[Depends(require_admin())])
async def update_subcategory(subcategory_id: str, subcategory: SubcategoryCreate, db: Session = Depends(get_db)):
    db_subcategory = db.query(Subcategory).filter(Subcategory.id == subcategory_id).first()
    if not db_subcategory:
        raise HTTPException(status_code=404, detail="Subcategory not found")
    
    for key, value in subcategory.dict().items():
        setattr(db_subcategory, key, value)
    
    db.commit()
    db.refresh(db_subcategory)
    return db_subcategory

@app.delete("/api/subcategories/{subcategory_id}", dependencies=[Depends(require_admin())])
async def delete_subcategory(subcategory_id: str, db: Session = Depends(get_db)):
    db_subcategory = db.query(Subcategory).filter(Subcategory.id == subcategory_id).first()
    if not db_subcategory:
        raise HTTPException(status_code=404, detail="Subcategory not found")
    
    db.delete(db_subcategory)
    db.commit()
    return {"message": "Subcategory deleted successfully"}

@app.post("/api/countries", response_model=CountryResponse, dependencies=[Depends(require_admin())])
async def create_country(country: CountryCreate, db: Session = Depends(get_db)):
    db_country = Country(
        id=str(uuid.uuid4()),
        **country.dict()
    )
    db.add(db_country)
    db.commit()
    db.refresh(db_country)
    return db_country

@app.put("/api/countries/{country_id}", response_model=CountryResponse, dependencies=[Depends(require_admin())])
async def update_country(country_id: str, country: CountryCreate, db: Session = Depends(get_db)):
    db_country = db.query(Country).filter(Country.id == country_id).first()
    if not db_country:
        raise HTTPException(status_code=404, detail="Country not found")
    
    for key, value in country.dict().items():
        setattr(db_country, key, value)
    
    db.commit()
    db.refresh(db_country)
    return db_country

@app.delete("/api/countries/{country_id}", dependencies=[Depends(require_admin())])
async def delete_country(country_id: str, db: Session = Depends(get_db)):
    db_country = db.query(Country).filter(Country.id == country_id).first()
    if not db_country:
        raise HTTPException(status_code=404, detail="Country not found")
    
    db.delete(db_country)
    db.commit()
    return {"message": "Country deleted successfully"}

@app.post("/api/suppliers", response_model=SupplierResponse, dependencies=[Depends(require_admin())])
async def create_supplier(supplier: SupplierCreate, db: Session = Depends(get_db)):
    db_supplier = Supplier(
        id=str(uuid.uuid4()),
        **supplier.dict()
    )
    db.add(db_supplier)
    db.commit()
    db.refresh(db_supplier)
    return db_supplier

@app.post("/api/customers", response_model=CustomerResponse, dependencies=[Depends(require_admin())])
async def create_customer(customer: CustomerCreate, db: Session = Depends(get_db)):
    db_customer = Customer(
        id=str(uuid.uuid4()),
        **customer.dict()
    )
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer

@app.post("/api/companies", response_model=CompanyResponse, dependencies=[Depends(require_admin())])
async def create_company(company: CompanyCreate, db: Session = Depends(get_db)):
    db_company = Company(
        id=str(uuid.uuid4()),
        **company.dict()
    )
    db.add(db_company)
    db.commit()
    db.refresh(db_company)
    return db_company

@app.post("/api/products", response_model=ProductResponse, dependencies=[Depends(require_admin())])
async def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    # Check if SKU already exists
    existing_product = db.query(Product).filter(Product.sku == product.sku).first()
    if existing_product:
        raise HTTPException(status_code=400, detail="Product with this SKU already exists")
    
    db_product = Product(
        id=str(uuid.uuid4()),
        **product.dict()
    )
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    write_audit_log(db, None, "create", "products", db_product.id, None, {"sku": db_product.sku, "name": db_product.name})
    return db_product

# UPDATE and DELETE endpoints
@app.put("/api/categories/{category_id}", response_model=CategoryResponse, dependencies=[Depends(require_admin())])
async def update_category(category_id: str, category: CategoryCreate, db: Session = Depends(get_db)):
    db_category = db.query(Category).filter(Category.id == category_id).first()
    if not db_category:
        raise HTTPException(status_code=404, detail="Category not found")
    old_state = {"name": db_category.name, "description": db_category.description}
    for key, value in category.dict().items():
        setattr(db_category, key, value)
    
    db.commit()
    db.refresh(db_category)
    write_audit_log(db, None, "update", "categories", db_category.id, old_state, {"name": db_category.name, "description": db_category.description})
    return db_category

@app.delete("/api/categories/{category_id}", dependencies=[Depends(require_admin())])
async def delete_category(category_id: str, db: Session = Depends(get_db)):
    db_category = db.query(Category).filter(Category.id == category_id).first()
    if not db_category:
        raise HTTPException(status_code=404, detail="Category not found")
    old_state = {"name": db_category.name}
    db.delete(db_category)
    db.commit()
    write_audit_log(db, None, "delete", "categories", category_id, old_state, None)
    return {"message": "Category deleted successfully"}

@app.put("/api/suppliers/{supplier_id}", response_model=SupplierResponse, dependencies=[Depends(require_admin())])
async def update_supplier(supplier_id: str, supplier: SupplierCreate, db: Session = Depends(get_db)):
    db_supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not db_supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    for key, value in supplier.dict().items():
        setattr(db_supplier, key, value)
    
    db.commit()
    db.refresh(db_supplier)
    return db_supplier

@app.delete("/api/suppliers/{supplier_id}", dependencies=[Depends(require_admin())])
async def delete_supplier(supplier_id: str, db: Session = Depends(get_db)):
    db_supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not db_supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    db.delete(db_supplier)
    db.commit()
    return {"message": "Supplier deleted successfully"}

@app.put("/api/customers/{customer_id}", response_model=CustomerResponse, dependencies=[Depends(require_admin())])
async def update_customer(customer_id: str, customer: CustomerCreate, db: Session = Depends(get_db)):
    db_customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    for key, value in customer.dict().items():
        setattr(db_customer, key, value)
    
    db.commit()
    db.refresh(db_customer)
    return db_customer

@app.delete("/api/customers/{customer_id}", dependencies=[Depends(require_admin())])
async def delete_customer(customer_id: str, db: Session = Depends(get_db)):
    db_customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    db.delete(db_customer)
    db.commit()
    return {"message": "Customer deleted successfully"}

@app.put("/api/products/{product_id}", response_model=ProductResponse, dependencies=[Depends(require_admin())])
async def update_product(product_id: str, product: ProductCreate, db: Session = Depends(get_db)):
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check if SKU is being changed and if it already exists
    if product.sku != db_product.sku:
        existing_product = db.query(Product).filter(Product.sku == product.sku).first()
        if existing_product:
            raise HTTPException(status_code=400, detail="Product with this SKU already exists")
    
    for key, value in product.dict().items():
        setattr(db_product, key, value)
    
    db.commit()
    db.refresh(db_product)
    write_audit_log(db, None, "update", "products", db_product.id, None, {"name": db_product.name, "sku": db_product.sku})
    return db_product

@app.delete("/api/products/{product_id}", dependencies=[Depends(require_admin())])
async def delete_product(product_id: str, db: Session = Depends(get_db)):
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    db.delete(db_product)
    db.commit()
    write_audit_log(db, None, "delete", "products", product_id, None, None)
    return {"message": "Product deleted successfully"}

@app.get("/api/dashboard/stats")
async def get_dashboard_stats(db: Session = Depends(get_db)):
    total_products = db.query(Product).count()
    total_sales = db.query(Sale).count()
    total_customers = db.query(Customer).count()
    low_stock_products = db.query(Product).filter(Product.stock_quantity <= Product.min_stock_level).count()
    
    return {
        "totalProducts": total_products,
        "totalSales": total_sales,
        "totalCustomers": total_customers,
        "lowStockProducts": low_stock_products
    }

@app.post("/api/stock-transactions", response_model=StockTransactionResponse)
async def create_stock_transaction(transaction: StockTransactionCreate, db: Session = Depends(get_db)):
    # Create the stock transaction
    db_transaction = StockTransaction(
        id=str(uuid.uuid4()),
        **transaction.dict()
    )
    db.add(db_transaction)
    
    # Update product stock quantity
    product = db.query(Product).filter(Product.id == transaction.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Determine if this is stock in or out
    is_stock_in = transaction.transaction_type in ['purchase', 'sales_return', 'opening_stock', 'transfer_in', 'stock_adjustment_in', 'misc_receive']
    quantity_change = transaction.quantity if is_stock_in else -transaction.quantity
    
    # Update stock quantity
    new_quantity = product.stock_quantity + quantity_change
    if new_quantity < 0:
        raise HTTPException(status_code=400, detail="Insufficient stock quantity")
    
    product.stock_quantity = new_quantity
    
    db.commit()
    db.refresh(db_transaction)
    return db_transaction

@app.delete("/api/stock-transactions/{transaction_id}")
async def delete_stock_transaction(transaction_id: str, db: Session = Depends(get_db)):
    transaction = db.query(StockTransaction).filter(StockTransaction.id == transaction_id).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Stock transaction not found")
    
    # Reverse the stock change
    product = db.query(Product).filter(Product.id == transaction.product_id).first()
    if product:
        is_stock_in = transaction.transaction_type in ['purchase', 'sales_return', 'opening_stock', 'transfer_in', 'stock_adjustment_in', 'misc_receive']
        quantity_change = transaction.quantity if is_stock_in else -transaction.quantity
        product.stock_quantity -= quantity_change
    
    db.delete(transaction)
    db.commit()
    return {"message": "Stock transaction deleted successfully"}

@app.post("/api/sales", response_model=SaleResponse)
async def create_sale(sale: SaleCreate, db: Session = Depends(get_db)):
    db_sale = Sale(
        id=str(uuid.uuid4()),
        **sale.dict()
    )
    db.add(db_sale)
    db.commit()
    db.refresh(db_sale)
    return db_sale

@app.post("/api/sales/items", response_model=SaleItemResponse)
async def create_sale_item(item: SaleItemCreate, db: Session = Depends(get_db)):
    db_item = SaleItem(
        id=str(uuid.uuid4()),
        **item.dict()
    )
    db.add(db_item)
    
    # Update product stock quantity
    product = db.query(Product).filter(Product.id == item.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if product.stock_quantity < item.quantity:
        raise HTTPException(status_code=400, detail="Insufficient stock quantity")
    
    product.stock_quantity -= item.quantity
    
    db.commit()
    db.refresh(db_item)
    return db_item

""" Requisition Endpoints """
@app.post("/api/requisitions", response_model=RequisitionResponse)
async def create_requisition(payload: RequisitionCreate, db: Session = Depends(get_db), current_user: Profile = Depends(get_current_user)):
    if not payload.items or len(payload.items) == 0:
        raise HTTPException(status_code=400, detail="Requisition must include items")
    req = Requisition(
        id=str(uuid.uuid4()),
        store_id=payload.store_id,
        requested_by=current_user.id,
        status="pending"
    )
    db.add(req)
    for it in payload.items:
        db.add(RequisitionItem(
            id=str(uuid.uuid4()),
            requisition_id=req.id,
            product_id=it.product_id,
            qty=it.qty,
            unit=it.unit
        ))
    db.commit()
    db.refresh(req)
    return req

@app.get("/api/requisitions", response_model=List[RequisitionResponse])
async def list_requisitions(db: Session = Depends(get_db), current_user: Profile = Depends(get_current_user)):
    roles = get_roles_for_user(db, current_user.id)
    is_admin = "admin" in roles
    q = db.query(Requisition)
    if not is_admin:
        q = q.filter(Requisition.requested_by == current_user.id)
    return q.order_by(Requisition.created_at.desc()).all()

@app.post("/api/requisitions/{req_id}/approve", response_model=RequisitionResponse, dependencies=[Depends(require_admin())])
async def approve_requisition(req_id: str, db: Session = Depends(get_db), current_user: Profile = Depends(get_current_user)):
    req = db.query(Requisition).filter(Requisition.id == req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Requisition not found")
    req.status = "approved"
    req.approved_by = current_user.id
    req.approved_at = datetime.utcnow()
    db.commit()
    db.refresh(req)
    return req

@app.post("/api/requisitions/{req_id}/purchase", response_model=RequisitionResponse, dependencies=[Depends(require_admin())])
async def mark_requisition_purchased(req_id: str, db: Session = Depends(get_db)):
    req = db.query(Requisition).filter(Requisition.id == req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Requisition not found")
    req.status = "purchased"
    db.commit()
    db.refresh(req)
    return req

# Finance Endpoints (Admin only)
@app.post("/api/transactions", dependencies=[Depends(require_admin())])
async def create_transaction(payload: TransactionCreate, db: Session = Depends(get_db), current_user: Profile = Depends(get_current_user)):
    tr = Transaction(
        id=str(uuid.uuid4()),
        date=payload.date or datetime.utcnow(),
        type=payload.type,
        amount=payload.amount,
        reference_id=payload.reference_id,
        description=payload.description,
        created_by=current_user.id
    )
    db.add(tr)
    db.commit()
    return {"id": tr.id}

@app.get("/api/transactions", dependencies=[Depends(require_admin())])
async def list_transactions(db: Session = Depends(get_db), from_date: Optional[str] = None, to_date: Optional[str] = None, type: Optional[str] = None):
    q = db.query(Transaction)
    if from_date:
        q = q.filter(Transaction.date >= from_date)
    if to_date:
        q = q.filter(Transaction.date <= to_date)
    if type:
        q = q.filter(Transaction.type == type)
    return [
        {
            "id": t.id,
            "date": t.date,
            "type": t.type,
            "amount": t.amount,
            "reference_id": t.reference_id,
            "description": t.description
        } for t in q.order_by(Transaction.date.desc()).all()
    ]

@app.post("/api/expenses", dependencies=[Depends(require_admin())])
async def create_expense(payload: ExpenseCreate, db: Session = Depends(get_db)):
    ex = Expense(
        id=str(uuid.uuid4()),
        date=payload.date or datetime.utcnow(),
        category=payload.category,
        amount=payload.amount,
        description=payload.description,
        receipt_url=payload.receipt_url
    )
    db.add(ex)
    db.commit()
    return {"id": ex.id}

@app.get("/api/expenses", dependencies=[Depends(require_admin())])
async def list_expenses(db: Session = Depends(get_db), from_date: Optional[str] = None, to_date: Optional[str] = None, category: Optional[str] = None):
    q = db.query(Expense)
    if from_date:
        q = q.filter(Expense.date >= from_date)
    if to_date:
        q = q.filter(Expense.date <= to_date)
    if category:
        q = q.filter(Expense.category == category)
    return [
        {
            "id": e.id,
            "date": e.date,
            "category": e.category,
            "amount": e.amount,
            "description": e.description
        } for e in q.order_by(Expense.date.desc()).all()
    ]

@app.get("/api/reports/finance/trial-balance", dependencies=[Depends(require_admin())])
async def trial_balance_report(db: Session = Depends(get_db), from_date: Optional[str] = None, to_date: Optional[str] = None):
    # Sum transactions by type; simple model
    q = db.query(Transaction)
    if from_date:
        q = q.filter(Transaction.date >= from_date)
    if to_date:
        q = q.filter(Transaction.date <= to_date)
    rows = q.all()
    totals: dict[str, float] = {}
    for r in rows:
        totals[r.type] = totals.get(r.type, 0.0) + (r.amount or 0.0)
    return {"totals": totals}

@app.get("/api/reports/profit-loss", dependencies=[Depends(require_admin())])
async def profit_loss_report(db: Session = Depends(get_db), from_date: Optional[str] = None, to_date: Optional[str] = None):
    sq = db.query(Sale)
    if from_date:
        sq = sq.filter(Sale.created_at >= from_date)
    if to_date:
        sq = sq.filter(Sale.created_at <= to_date)
    total_sales = sum(s.net_amount for s in sq.all())

    # Approximate COGS = sum(sales_items.quantity * products.cost_price)
    siq = db.query(SaleItem, Product).join(Product, SaleItem.product_id == Product.id)
    if from_date:
        siq = siq.join(Sale, SaleItem.sale_id == Sale.id).filter(Sale.created_at >= from_date)
    if to_date:
        siq = siq.join(Sale, SaleItem.sale_id == Sale.id).filter(Sale.created_at <= to_date)
    cogs = 0.0
    for item, prod in siq.all():
        cogs += (item.quantity or 0) * (prod.cost_price or 0.0)

    eq = db.query(Expense)
    if from_date:
        eq = eq.filter(Expense.date >= from_date)
    if to_date:
        eq = eq.filter(Expense.date <= to_date)
    total_expenses = sum(e.amount for e in eq.all())

    gross_profit = total_sales - cogs
    net_profit = gross_profit - total_expenses
    return {
        "total_sales": total_sales,
        "cogs": cogs,
        "gross_profit": gross_profit,
        "expenses": total_expenses,
        "net_profit": net_profit
    }

@app.get("/api/reports/stock/export", dependencies=[Depends(require_admin())])
async def export_stock_csv(db: Session = Depends(get_db)):
    products = db.query(Product).all()
    sio = StringIO()
    sio.write("id,sku,name,unit_type,stock_quantity,min_stock_threshold,cost_price,selling_price\n")
    for p in products:
        sio.write(
            f"{p.id},{p.sku},{p.name},{getattr(p,'unit_type', '')},{p.stock_quantity},{getattr(p,'min_stock_threshold',0)},{p.cost_price},{getattr(p,'selling_price','')}\n"
        )
    sio.seek(0)
    return StreamingResponse(sio, media_type="text/csv", headers={
        "Content-Disposition": "attachment; filename=stock_export.csv"
    })

@app.get("/api/reports/sales/export", dependencies=[Depends(require_admin())])
async def export_sales_csv(db: Session = Depends(get_db)):
    sales = db.query(Sale).order_by(Sale.created_at.desc()).all()
    sio = StringIO()
    sio.write("id,date,customer_name,total_amount,net_amount,payment_method,payment_status\n")
    for s in sales:
        sio.write(
            f"{s.id},{s.created_at.isoformat() if s.created_at else ''},{s.customer_name},{s.total_amount},{s.net_amount},{s.payment_method},{s.payment_status}\n"
        )
    sio.seek(0)
    return StreamingResponse(sio, media_type="text/csv", headers={
        "Content-Disposition": "attachment; filename=sales_export.csv"
    })

@app.get("/api/sales/{sale_id}/invoice", response_class=HTMLResponse)
async def get_sale_invoice_html(sale_id: str, db: Session = Depends(get_db)):
    sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    items = db.query(SaleItem, Product).join(Product, SaleItem.product_id == Product.id).filter(SaleItem.sale_id == sale_id).all()
    rows = "".join([
        f"<tr><td>{prod.sku}</td><td>{prod.name}</td><td style='text-align:right'>{it.quantity}</td><td style='text-align:right'>{it.unit_price:.2f}</td><td style='text-align:right'>{it.total_price:.2f}</td></tr>"
        for it, prod in items
    ])
    html = f"""
    <html>
      <head>
        <meta charset='utf-8' />
        <title>Invoice {sale.id}</title>
        <style>
          body {{ font-family: Arial, sans-serif; padding: 24px; }}
          h1 {{ margin: 0 0 8px 0; }}
          table {{ width: 100%; border-collapse: collapse; margin-top: 16px; }}
          th, td {{ border: 1px solid #ddd; padding: 8px; }}
          th {{ background: #f7f7f7; text-align: left; }}
        </style>
      </head>
      <body>
        <h1>Sharkar Feed & Medicine</h1>
        <div>Invoice: {sale.id}</div>
        <div>Date: {sale.created_at}</div>
        <div>Customer: {sale.customer_name}</div>
        <table>
          <thead>
            <tr>
              <th>Code</th><th>Item</th><th style='text-align:right'>Qty</th><th style='text-align:right'>Unit Price</th><th style='text-align:right'>Total</th>
            </tr>
          </thead>
          <tbody>
            {rows}
          </tbody>
        </table>
        <h3 style='text-align:right'>Net Amount: {sale.net_amount:.2f}</h3>
      </body>
    </html>
    """
    return HTMLResponse(content=html)

""" CSV Import/Template Endpoints """
TEMPLATE_HEADERS = {
    "products": [
        "sku", "name", "unit_type", "unit_size", "purchase_price", "selling_price", "cost_price", "min_stock_threshold", "opening_qty"
    ],
    "suppliers": ["name", "contact_person", "phone", "email", "address", "payment_terms"],
    "customers": ["name", "email", "phone", "address", "company"],
    "opening_stock": ["product_sku", "qty"]
}

def _csv_stream(headers: list[str]):
    sio = StringIO()
    sio.write(",".join(headers) + "\n")
    sio.seek(0)
    return sio

@app.get("/api/import/templates/{kind}.csv", dependencies=[Depends(require_admin())])
async def download_template(kind: str):
    kind = kind.lower()
    if kind not in TEMPLATE_HEADERS:
        raise HTTPException(status_code=404, detail="Unknown template")
    sio = _csv_stream(TEMPLATE_HEADERS[kind])
    return StreamingResponse(sio, media_type="text/csv", headers={
        "Content-Disposition": f"attachment; filename={kind}_template.csv"
    })

@app.post("/api/import/products", dependencies=[Depends(require_admin())])
async def import_products(file: UploadFile = File(...), db: Session = Depends(get_db)):
    created = 0
    updated = 0
    with TextIOWrapper(file.file, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            sku = (row.get("sku") or "").strip()
            name = (row.get("name") or "").strip()
            if not sku or not name:
                continue
            prod = db.query(Product).filter(Product.sku == sku).first()
            values = {
                "name": name,
                "unit_type": row.get("unit_type") or None,
                "unit_size": row.get("unit_size") or None,
                "purchase_price": float(row.get("purchase_price") or 0) or None,
                "selling_price": float(row.get("selling_price") or 0) or None,
                "cost_price": float(row.get("cost_price") or 0),
                "min_stock_threshold": int(row.get("min_stock_threshold") or 0),
            }
            opening_qty = row.get("opening_qty")
            if prod:
                for k, v in values.items():
                    if v is not None:
                        setattr(prod, k, v)
                if opening_qty not in (None, ""):
                    try:
                        prod.stock_quantity = int(opening_qty)
                    except Exception:
                        pass
                updated += 1
            else:
                prod = Product(
                    id=str(uuid.uuid4()),
                    sku=sku,
                    unit_price=values["selling_price"] or 0,
                    **{k: v for k, v in values.items() if k != "selling_price"}
                )
                try:
                    if opening_qty not in (None, ""):
                        prod.stock_quantity = int(opening_qty)
                except Exception:
                    pass
                db.add(prod)
                created += 1
    db.commit()
    return {"created": created, "updated": updated}

@app.post("/api/import/suppliers", dependencies=[Depends(require_admin())])
async def import_suppliers(file: UploadFile = File(...), db: Session = Depends(get_db)):
    created = 0
    with TextIOWrapper(file.file, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            name = (row.get("name") or "").strip()
            if not name:
                continue
            sup = Supplier(
        id=str(uuid.uuid4()),
        name=name,
        contact_person=row.get("contact_person"),
        phone=row.get("phone"),
        email=row.get("email"),
        address=row.get("address"),
        payment_terms=row.get("payment_terms")
      )
            db.add(sup)
            created += 1
    db.commit()
    return {"created": created}

@app.post("/api/import/customers", dependencies=[Depends(require_admin())])
async def import_customers(file: UploadFile = File(...), db: Session = Depends(get_db)):
    created = 0
    with TextIOWrapper(file.file, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            name = (row.get("name") or "").strip()
            if not name:
                continue
            cust = Customer(
        id=str(uuid.uuid4()),
        name=name,
        email=row.get("email"),
        phone=row.get("phone"),
        address=row.get("address"),
        company=row.get("company")
      )
            db.add(cust)
            created += 1
    db.commit()
    return {"created": created}

@app.post("/api/import/opening-stock", dependencies=[Depends(require_admin())])
async def import_opening_stock(file: UploadFile = File(...), db: Session = Depends(get_db)):
    updated = 0
    with TextIOWrapper(file.file, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            sku = (row.get("product_sku") or "").strip()
            qty = row.get("qty")
            if not sku or qty in (None, ""):
                continue
            prod = db.query(Product).filter(Product.sku == sku).first()
            if not prod:
                continue
            try:
                prod.stock_quantity = int(qty)
                updated += 1
            except Exception:
                pass
    db.commit()
    return {"updated": updated}

""" Audit Logging """
def write_audit_log(db: Session, user_id: Optional[str], action: str, table_name: str, record_id: str, old_value: Optional[dict] = None, new_value: Optional[dict] = None):
    try:
        log = AuditLog(
            id=str(uuid.uuid4()),
            user_id=user_id,
            action=action,
            table_name=table_name,
            record_id=record_id,
            old_value=(str(old_value) if old_value is not None else None),
            new_value=(str(new_value) if new_value is not None else None),
        )
        db.add(log)
        db.commit()
    except Exception:
        db.rollback()
        # Don't block the request if audit logging fails
        pass

@app.get("/api/audit-logs", dependencies=[Depends(require_admin())])
async def list_audit_logs(db: Session = Depends(get_db), limit: int = 100):
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(max(1, min(limit, 1000))).all()
    return [
        {
            "id": l.id,
            "user_id": l.user_id,
            "action": l.action,
            "table_name": l.table_name,
            "record_id": l.record_id,
            "old_value": l.old_value,
            "new_value": l.new_value,
            "created_at": l.created_at,
        } for l in logs
    ]

@app.post("/api/sales/{sale_id}/payment")
async def record_sale_payment(
    sale_id: str,
    payment: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_user)
):
    sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")

    method = (payment.method or "").lower()
    requested_status = (payment.status or "").lower() if payment.status else None
    roles = get_roles_for_user(db, current_user.id)
    is_admin = "admin" in roles

    if method in ["card", "online", "bank"] and not is_admin:
        effective_status = "pending"
    elif method == "cash" and requested_status is None:
        effective_status = "cleared"
    else:
        effective_status = requested_status or "pending"

    pay = SalePayment(
        id=str(uuid.uuid4()),
        sale_id=sale_id,
        amount=payment.amount,
        method=method,
        status=effective_status,
        created_by=current_user.id,
        cleared_at=datetime.utcnow() if effective_status == "cleared" else None,
    )
    db.add(pay)

    if effective_status == "cleared":
        sale.payment_status = "completed"

    db.commit()
    db.refresh(pay)
    return {"id": pay.id, "status": pay.status}

@app.post("/api/payments/{payment_id}/clear", dependencies=[Depends(require_admin())])
async def clear_payment(payment_id: str, db: Session = Depends(get_db)):
    pay = db.query(SalePayment).filter(SalePayment.id == payment_id).first()
    if not pay:
        raise HTTPException(status_code=404, detail="Payment not found")
    if pay.status == "cleared":
        return {"id": pay.id, "status": pay.status}

    pay.status = "cleared"
    pay.cleared_at = datetime.utcnow()
    sale = db.query(Sale).filter(Sale.id == pay.sale_id).first()
    if sale:
        sale.payment_status = "completed"
    db.commit()
    return {"id": pay.id, "status": pay.status}

# Purchases + GRN
@app.get("/api/purchases", response_model=List[PurchaseResponse])
async def get_purchases(db: Session = Depends(get_db)):
    purchases = db.query(Purchase).order_by(Purchase.created_at.desc()).all()
    result = []
    for purchase in purchases:
        items = db.query(PurchaseItem).filter(PurchaseItem.purchase_id == purchase.id).all()
        purchase_dict = {
            "id": purchase.id,
            "supplier_id": purchase.supplier_id,
            "invoice_no": purchase.invoice_no,
            "date": purchase.date,
            "total_amount": purchase.total_amount,
            "payment_status": purchase.payment_status,
            "created_by": purchase.created_by,
            "store_id": purchase.store_id,
            "created_at": purchase.created_at,
            "items": [PurchaseItemResponse(
                id=it.id,
                purchase_id=it.purchase_id,
                product_id=it.product_id,
                qty=it.qty,
                unit=it.unit,
                unit_price=it.unit_price,
                total_price=it.total_price,
                batch_no=it.batch_no,
                expiry_date=it.expiry_date,
                mrp=it.mrp,
                gst_percent=it.gst_percent
            ) for it in items]
        }
        result.append(PurchaseResponse(**purchase_dict))
    return result

@app.get("/api/purchases/{purchase_id}", response_model=PurchaseResponse)
async def get_purchase(purchase_id: str, db: Session = Depends(get_db)):
    purchase = db.query(Purchase).filter(Purchase.id == purchase_id).first()
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")
    items = db.query(PurchaseItem).filter(PurchaseItem.purchase_id == purchase.id).all()
    purchase_dict = {
        "id": purchase.id,
        "supplier_id": purchase.supplier_id,
        "invoice_no": purchase.invoice_no,
        "date": purchase.date,
        "total_amount": purchase.total_amount,
        "payment_status": purchase.payment_status,
        "created_by": purchase.created_by,
        "store_id": purchase.store_id,
        "created_at": purchase.created_at,
        "items": [PurchaseItemResponse(
            id=it.id,
            purchase_id=it.purchase_id,
            product_id=it.product_id,
            qty=it.qty,
            unit=it.unit,
            unit_price=it.unit_price,
            total_price=it.total_price,
            batch_no=it.batch_no,
            expiry_date=it.expiry_date,
            mrp=it.mrp,
            gst_percent=it.gst_percent
        ) for it in items]
    }
    return PurchaseResponse(**purchase_dict)

@app.get("/api/grns", response_model=List[GRNResponse])
async def get_grns(db: Session = Depends(get_db)):
    return db.query(GRN).order_by(GRN.date.desc()).all()

@app.get("/api/grns/{grn_id}", response_model=GRNResponse)
async def get_grn(grn_id: str, db: Session = Depends(get_db)):
    grn = db.query(GRN).filter(GRN.id == grn_id).first()
    if not grn:
        raise HTTPException(status_code=404, detail="GRN not found")
    return grn

@app.post("/api/purchases", dependencies=[Depends(require_admin())])
async def create_purchase(payload: PurchaseCreate, db: Session = Depends(get_db)):
    if not payload.items or len(payload.items) == 0:
        raise HTTPException(status_code=400, detail="Purchase must include items")
    purchase_id = str(uuid.uuid4())
    total_amount = sum([it.qty * it.unit_price for it in payload.items])
    purchase = Purchase(
        id=purchase_id,
        supplier_id=payload.supplier_id,
        invoice_no=payload.invoice_no,
        date=payload.date or datetime.utcnow().date().isoformat(),
        total_amount=total_amount,
        payment_status=payload.payment_status or "pending",
        created_by=payload.created_by,
        store_id=payload.store_id,
    )
    db.add(purchase)
    for it in payload.items:
        db.add(PurchaseItem(
            id=str(uuid.uuid4()),
            purchase_id=purchase_id,
            product_id=it.product_id,
            qty=it.qty,
            unit=it.unit,
            unit_price=it.unit_price,
            total_price=it.qty * it.unit_price,
            batch_no=it.batch_no,
            expiry_date=it.expiry_date,
            mrp=it.mrp,
            gst_percent=it.gst_percent
        ))
    db.commit()
    return {"id": purchase_id, "total_amount": total_amount}

@app.post("/api/grn", dependencies=[Depends(require_admin())])
async def confirm_grn(payload: GRNCreate, db: Session = Depends(get_db)):
    purchase = db.query(Purchase).filter(Purchase.id == payload.purchase_id).first()
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")
    grn = GRN(
        id=str(uuid.uuid4()),
        purchase_id=purchase.id,
        date=payload.date or datetime.utcnow().date().isoformat(),
        created_by=payload.created_by,
    )
    db.add(grn)
    # load items and increment stock atomically
    items = db.query(PurchaseItem).filter(PurchaseItem.purchase_id == purchase.id).all()
    if not items:
        raise HTTPException(status_code=400, detail="No items to receive for this purchase")
    try:
        for it in items:
            product = db.query(Product).filter(Product.id == it.product_id).first()
            if not product:
                continue
            product.stock_quantity = (product.stock_quantity or 0) + int(it.qty)
            # update product_stock row if exists
            ps = db.query(ProductStock).filter(ProductStock.product_id == it.product_id).first()
            if ps:
                ps.current_qty = (ps.current_qty or 0) + float(it.qty)
        db.commit()
    except Exception:
        db.rollback()
        raise
    return {"grn_id": grn.id, "received_items": len(items)}

# Create database tables
@app.on_event("startup")
async def startup_event():
    Base.metadata.create_all(bind=engine)
    # Run SQL migrations (idempotent) for Postgres
    try:
        if "postgresql" in str(engine.url):
            migrations_dir = Path(__file__).parent / "migrations"
            migration_file = migrations_dir / "001_pharmacy_schema.sql"
            if migration_file.exists():
                # Skip if stores table already exists
                with engine.begin() as conn:
                    exists = conn.execute(text("""
                        SELECT EXISTS (
                          SELECT 1 FROM information_schema.tables 
                          WHERE table_schema='public' AND table_name='stores'
                        )
                    """)).scalar()
                if not exists:
                    with open(migration_file, "r", encoding="utf-8") as f:
                        sql = f.read()
                    # Execute statements one by one to avoid driver limitations
                    cleaned = []
                    skip = False
                    for line in sql.splitlines():
                        if line.strip().lower().startswith('do $$'):
                            skip = True
                            continue
                        if skip and line.strip().endswith('$$;'):
                            skip = False
                            continue
                        if not skip:
                            cleaned.append(line)
                    sql = '\n'.join(cleaned)
                    statements = [s.strip() for s in sql.split(';') if s.strip()]
                    with engine.begin() as conn:
                        for stmt in statements:
                            conn.execute(text(stmt))
                    print("Applied migration 001_pharmacy_schema.sql")
                else:
                    print("Migration skipped: stores table already exists")
    except Exception as e:
        print(f"Migration error: {e}")
    print("Pharmazine FastAPI server started")
    print("Database tables created")
    print("API Base URL: http://localhost:8000/api")

# New Stock Management API Endpoints

@app.post("/api/elc-receive-master", response_model=ElcReceiveMasterResponse)
async def create_elc_receive_master(receive: ElcReceiveMasterCreate, db: Session = Depends(get_db)):
    # Generate chalan number
    chalan_no = generate_chalan_number(receive.receive_type, db)
    
    db_receive = ElcReceiveMaster(
        chalan_no=chalan_no,
        category=receive.category,
        supplier_name=receive.supplier_name,
        product_model_number=receive.product_model_number,
        receive_type=receive.receive_type,
        au_entry_by=receive.au_entry_by
    )
    
    db.add(db_receive)
    db.commit()
    db.refresh(db_receive)
    
    return db_receive

@app.post("/api/elc-receive-details", response_model=ElcReceiveDetailsResponse)
async def create_elc_receive_details(detail: ElcReceiveDetailsCreate, db: Session = Depends(get_db)):
    db_detail = ElcReceiveDetails(
        receive_pk_no=detail.receive_pk_no,
        chalan_no=detail.chalan_no,
        item_barcode=detail.item_barcode,
        item_pk_no=detail.item_pk_no,
        item_name=detail.item_name,
        receive_quantity=detail.receive_quantity,
        unit_price=detail.unit_price,
        adj_reason=detail.adj_reason,
        adj_type=detail.adj_type,
        remarks=detail.remarks,
        au_entry_by=detail.au_entry_by
    )
    
    db.add(db_detail)
    db.commit()
    db.refresh(db_detail)
    
    return db_detail

@app.post("/api/elc-issue-master", response_model=ElcIssueMasterResponse)
async def create_elc_issue_master(issue: ElcIssueMasterCreate, db: Session = Depends(get_db)):
    # Generate chalan number
    chalan_no = generate_chalan_number(issue.issue_type, db)
    
    db_issue = ElcIssueMaster(
        chalan_no=chalan_no,
        category=issue.category,
        supplier_name=issue.supplier_name,
        product_model_number=issue.product_model_number,
        issue_type=issue.issue_type,
        au_entry_by=issue.au_entry_by
    )
    
    db.add(db_issue)
    db.commit()
    db.refresh(db_issue)
    
    return db_issue

@app.post("/api/elc-issue-details", response_model=ElcIssueDetailsResponse)
async def create_elc_issue_details(detail: ElcIssueDetailsCreate, db: Session = Depends(get_db)):
    db_detail = ElcIssueDetails(
        issue_pk_no=detail.issue_pk_no,
        chalan_no=detail.chalan_no,
        item_barcode=detail.item_barcode,
        item_pk_no=detail.item_pk_no,
        item_name=detail.item_name,
        issue_quantity=detail.issue_quantity,
        unit_price=detail.unit_price,
        adj_reason=detail.adj_reason,
        adj_type=detail.adj_type,
        remarks=detail.remarks,
        au_entry_by=detail.au_entry_by
    )
    
    db.add(db_detail)
    db.commit()
    db.refresh(db_detail)
    
    return db_detail

@app.get("/api/elc-receive-master", response_model=List[ElcReceiveMasterResponse])
async def get_elc_receive_master(db: Session = Depends(get_db)):
    return db.query(ElcReceiveMaster).all()

@app.get("/api/elc-receive-details", response_model=List[ElcReceiveDetailsResponse])
async def get_elc_receive_details(db: Session = Depends(get_db)):
    return db.query(ElcReceiveDetails).all()

@app.get("/api/elc-issue-master", response_model=List[ElcIssueMasterResponse])
async def get_elc_issue_master(db: Session = Depends(get_db)):
    return db.query(ElcIssueMaster).all()

@app.get("/api/elc-issue-details", response_model=List[ElcIssueDetailsResponse])
async def get_elc_issue_details(db: Session = Depends(get_db)):
    return db.query(ElcIssueDetails).all()

# Comprehensive Stock Management Endpoint
@app.post("/api/stock-management/opening-stock")
async def create_opening_stock(items: List[ElcReceiveDetailsCreate], db: Session = Depends(get_db)):
    """
    Create opening stock with master and details records
    """
    try:
        # Generate chalan number first
        chalan_no = generate_chalan_number("OP", db)
        
        # Create master receive record
        db_master = ElcReceiveMaster(
            chalan_no=chalan_no,
            category=None,
            supplier_name=None,
            product_model_number=None,
            receive_type="OP",
            au_entry_by=1
        )
        
        db.add(db_master)
        db.commit()
        db.refresh(db_master)
        
        # Create detail records
        detail_records = []
        for item in items:
            db_detail = ElcReceiveDetails(
                receive_pk_no=db_master.receive_pk_no,
                chalan_no=chalan_no,
                item_pk_no=item.item_pk_no,
                item_name=item.item_name,
                receive_quantity=item.receive_quantity,
                unit_price=item.unit_price,
                au_entry_by=1
            )
            db.add(db_detail)
            detail_records.append(db_detail)
        
        db.commit()
        
        return {
            "message": "Opening stock created successfully",
            "chalan_no": chalan_no,
            "master_id": db_master.receive_pk_no,
            "details_count": len(detail_records)
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating opening stock: {str(e)}")

@app.post("/api/stock-management/adjustment")
async def create_stock_adjustment(
    adjustment_type: str,  # "write_on" or "write_off"
    items: List[ElcReceiveDetailsCreate], 
    db: Session = Depends(get_db)
):
    """
    Create stock adjustment with write on/off logic
    """
    try:
        if adjustment_type == "write_on":
            # Generate chalan number first
            chalan_no = generate_chalan_number("ADJ", db)
            
            # Create master receive record for write on
            db_master = ElcReceiveMaster(
                chalan_no=chalan_no,
                receive_type="ADJ",
                au_entry_by=1
            )
            db.add(db_master)
            db.commit()
            db.refresh(db_master)
            
            # Create receive details
            for item in items:
                db_detail = ElcReceiveDetails(
                    receive_pk_no=db_master.receive_pk_no,
                    chalan_no=chalan_no,
                    item_pk_no=item.item_pk_no,
                    item_name=item.item_name,
                    receive_quantity=item.receive_quantity,
                    unit_price=item.unit_price,
                    adj_type="write_on",
                    adj_reason=item.adj_reason,
                    au_entry_by=1
                )
                db.add(db_detail)
            
            db.commit()
            
            return {
                "message": "Stock adjustment (write on) created successfully",
                "chalan_no": chalan_no,
                "type": "write_on"
            }
            
        elif adjustment_type == "write_off":
            # Generate chalan number first
            chalan_no = generate_chalan_number("ADJ", db)
            
            # Create issue master record for write off
            db_master = ElcIssueMaster(
                chalan_no=chalan_no,
                issue_type="ADJ",
                au_entry_by=1
            )
            db.add(db_master)
            db.commit()
            db.refresh(db_master)
            
            # Create issue details
            for item in items:
                db_detail = ElcIssueDetails(
                    issue_pk_no=db_master.issue_pk_no,
                    chalan_no=chalan_no,
                    item_pk_no=item.item_pk_no,
                    item_name=item.item_name,
                    issue_quantity=item.receive_quantity,
                    unit_price=item.unit_price,
                    adj_type="write_off",
                    adj_reason=item.adj_reason,
                    au_entry_by=1
                )
                db.add(db_detail)
            
            db.commit()
            
            return {
                "message": "Stock adjustment (write off) created successfully",
                "chalan_no": chalan_no,
                "type": "write_off"
            }
        
        else:
            raise HTTPException(status_code=400, detail="Invalid adjustment type. Use 'write_on' or 'write_off'")
            
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating stock adjustment: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
