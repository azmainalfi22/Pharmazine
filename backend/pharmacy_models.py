"""
Pharmazine - Medicine Management System
Phase 1: Database Models for Medicine Management

This module contains all pharmacy-specific SQLAlchemy models and Pydantic schemas
"""

from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, Text, ForeignKey, ARRAY, Date, Numeric, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.dialects.postgresql import UUID, JSONB
from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal

Base = declarative_base()

# ============================================
# SQLALCHEMY MODELS
# ============================================

class MedicineCategory(Base):
    """Medicine dosage forms: tablet, syrup, injection, etc."""
    __tablename__ = "medicine_categories"
    
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    name = Column(String, nullable=False, unique=True)
    description = Column(Text)
    display_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, nullable=False, server_default=text("now()"))
    updated_at = Column(DateTime, nullable=False, server_default=text("now()"), onupdate=datetime.utcnow)


class UnitType(Base):
    """Measurement units: mg, ml, piece, strip, etc."""
    __tablename__ = "unit_types"
    
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    name = Column(String, nullable=False, unique=True)
    abbreviation = Column(String, nullable=False)
    category = Column(String)  # 'weight', 'volume', 'quantity'
    display_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, nullable=False, server_default=text("now()"))
    updated_at = Column(DateTime, nullable=False, server_default=text("now()"), onupdate=datetime.utcnow)


class MedicineType(Base):
    """Therapeutic categories: painkiller, antibiotic, etc."""
    __tablename__ = "medicine_types"
    
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    name = Column(String, nullable=False, unique=True)
    description = Column(Text)
    display_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, nullable=False, server_default=text("now()"))
    updated_at = Column(DateTime, nullable=False, server_default=text("now()"), onupdate=datetime.utcnow)


class Manufacturer(Base):
    """Medicine manufacturers and suppliers"""
    __tablename__ = "manufacturers"
    
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    name = Column(String, nullable=False)
    code = Column(String, unique=True)
    contact_person = Column(String)
    phone = Column(String)
    email = Column(String)
    address = Column(Text)
    city = Column(String)
    state = Column(String)
    country = Column(String)
    postal_code = Column(String)
    tax_number = Column(String)
    payment_terms = Column(String)
    credit_limit = Column(Numeric, default=0)
    opening_balance = Column(Numeric, default=0)
    current_balance = Column(Numeric, default=0)
    website = Column(String)
    notes = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, nullable=False, server_default=text("now()"))
    updated_at = Column(DateTime, nullable=False, server_default=text("now()"), onupdate=datetime.utcnow)


class MedicineBatch(Base):
    """Individual medicine batches with expiry tracking"""
    __tablename__ = "medicine_batches"
    
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    product_id = Column(String, nullable=False)
    batch_number = Column(String, nullable=False)
    manufacture_date = Column(Date)
    expiry_date = Column(Date, nullable=False)
    manufacturer_id = Column(UUID(as_uuid=True), ForeignKey("manufacturers.id"))
    purchase_id = Column(UUID(as_uuid=True))
    quantity_received = Column(Numeric, nullable=False, default=0)
    quantity_remaining = Column(Numeric, nullable=False, default=0)
    quantity_sold = Column(Numeric, default=0)
    quantity_returned = Column(Numeric, default=0)
    quantity_damaged = Column(Numeric, default=0)
    purchase_price = Column(Numeric, nullable=False)
    mrp = Column(Numeric)
    selling_price = Column(Numeric)
    discount_percentage = Column(Numeric, default=0)
    store_id = Column(UUID(as_uuid=True))
    rack_number = Column(String)
    is_active = Column(Boolean, default=True)
    is_expired = Column(Boolean, default=False)
    notes = Column(Text)
    created_at = Column(DateTime, nullable=False, server_default=text("now()"))
    updated_at = Column(DateTime, nullable=False, server_default=text("now()"), onupdate=datetime.utcnow)


class BatchStockTransaction(Base):
    """Stock movements at batch level"""
    __tablename__ = "batch_stock_transactions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    batch_id = Column(UUID(as_uuid=True), ForeignKey("medicine_batches.id"), nullable=False)
    transaction_type = Column(String, nullable=False)
    quantity = Column(Numeric, nullable=False)
    reference_id = Column(UUID(as_uuid=True))
    reference_type = Column(String)
    notes = Column(Text)
    created_by = Column(String)
    created_at = Column(DateTime, nullable=False, server_default=text("now()"))


class DiscountConfig(Base):
    """Configurable discount rules"""
    __tablename__ = "discount_configs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    name = Column(String, nullable=False)
    description = Column(Text)
    discount_type = Column(String, nullable=False)
    discount_percentage = Column(Numeric)
    discount_amount = Column(Numeric)
    min_quantity = Column(Numeric)
    max_quantity = Column(Numeric)
    category_id = Column(UUID(as_uuid=True))
    medicine_category_id = Column(UUID(as_uuid=True), ForeignKey("medicine_categories.id"))
    product_id = Column(String)
    customer_type = Column(String)
    valid_from = Column(Date)
    valid_to = Column(Date)
    is_active = Column(Boolean, default=True)
    priority = Column(Integer, default=0)
    created_at = Column(DateTime, nullable=False, server_default=text("now()"))
    updated_at = Column(DateTime, nullable=False, server_default=text("now()"), onupdate=datetime.utcnow)


class ExpiredMedicine(Base):
    """Log of expired medicines"""
    __tablename__ = "expired_medicines"
    
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    batch_id = Column(UUID(as_uuid=True), ForeignKey("medicine_batches.id"), nullable=False)
    product_id = Column(String, nullable=False)
    batch_number = Column(String, nullable=False)
    expiry_date = Column(Date, nullable=False)
    quantity = Column(Numeric, nullable=False)
    purchase_value = Column(Numeric)
    disposal_method = Column(String)
    disposal_date = Column(Date)
    disposal_notes = Column(Text)
    handled_by = Column(String)
    created_at = Column(DateTime, nullable=False, server_default=text("now()"))


class WasteProduct(Base):
    """Log of damaged or wasted products"""
    __tablename__ = "waste_products"
    
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    batch_id = Column(UUID(as_uuid=True), ForeignKey("medicine_batches.id"))
    product_id = Column(String, nullable=False)
    batch_number = Column(String)
    quantity = Column(Numeric, nullable=False)
    reason = Column(String, nullable=False)
    value_loss = Column(Numeric)
    store_id = Column(UUID(as_uuid=True))
    reported_by = Column(String)
    approved_by = Column(String)
    disposal_method = Column(String)
    notes = Column(Text)
    created_at = Column(DateTime, nullable=False, server_default=text("now()"))


class BarcodePrintLog(Base):
    """Log of barcode printing"""
    __tablename__ = "barcode_print_log"
    
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    product_id = Column(String, nullable=False)
    batch_id = Column(UUID(as_uuid=True), ForeignKey("medicine_batches.id"))
    quantity_printed = Column(Integer, nullable=False)
    printer_name = Column(String)
    paper_size = Column(String)
    printed_by = Column(String)
    printed_at = Column(DateTime, nullable=False, server_default=text("now()"))


# ============================================
# PYDANTIC SCHEMAS (Request/Response Models)
# ============================================

class MedicineCategoryBase(BaseModel):
    name: str
    description: Optional[str] = None
    display_order: int = 0
    is_active: bool = True


class MedicineCategoryCreate(MedicineCategoryBase):
    pass


class MedicineCategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None


class MedicineCategoryResponse(MedicineCategoryBase):
    id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class UnitTypeBase(BaseModel):
    name: str
    abbreviation: str
    category: Optional[str] = None
    display_order: int = 0
    is_active: bool = True


class UnitTypeCreate(UnitTypeBase):
    pass


class UnitTypeUpdate(BaseModel):
    name: Optional[str] = None
    abbreviation: Optional[str] = None
    category: Optional[str] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None


class UnitTypeResponse(UnitTypeBase):
    id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class MedicineTypeBase(BaseModel):
    name: str
    description: Optional[str] = None
    display_order: int = 0
    is_active: bool = True


class MedicineTypeCreate(MedicineTypeBase):
    pass


class MedicineTypeUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None


class MedicineTypeResponse(MedicineTypeBase):
    id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ManufacturerBase(BaseModel):
    name: str
    code: Optional[str] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    tax_number: Optional[str] = None
    payment_terms: Optional[str] = None
    credit_limit: Decimal = Decimal("0")
    opening_balance: Decimal = Decimal("0")
    website: Optional[str] = None
    notes: Optional[str] = None
    is_active: bool = True


class ManufacturerCreate(ManufacturerBase):
    pass


class ManufacturerUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    tax_number: Optional[str] = None
    payment_terms: Optional[str] = None
    credit_limit: Optional[Decimal] = None
    current_balance: Optional[Decimal] = None
    website: Optional[str] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None


class ManufacturerResponse(BaseModel):
    id: str
    name: str
    code: Optional[str] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    tax_number: Optional[str] = None
    payment_terms: Optional[str] = None
    credit_limit: float = 0.0
    current_balance: float = 0.0
    website: Optional[str] = None
    notes: Optional[str] = None
    is_active: bool = True
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class MedicineBatchBase(BaseModel):
    product_id: str
    batch_number: str
    manufacture_date: Optional[date] = None
    expiry_date: date
    manufacturer_id: Optional[str] = None
    purchase_id: Optional[str] = None
    quantity_received: Decimal
    purchase_price: Decimal
    mrp: Optional[Decimal] = None
    selling_price: Optional[Decimal] = None
    discount_percentage: Decimal = Decimal("0")
    store_id: Optional[str] = None
    rack_number: Optional[str] = None
    notes: Optional[str] = None


class MedicineBatchCreate(MedicineBatchBase):
    pass


class MedicineBatchUpdate(BaseModel):
    batch_number: Optional[str] = None
    manufacture_date: Optional[date] = None
    expiry_date: Optional[date] = None
    manufacturer_id: Optional[str] = None
    quantity_remaining: Optional[Decimal] = None
    purchase_price: Optional[Decimal] = None
    mrp: Optional[Decimal] = None
    selling_price: Optional[Decimal] = None
    discount_percentage: Optional[Decimal] = None
    rack_number: Optional[str] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None


class MedicineBatchResponse(BaseModel):
    id: str
    product_id: str
    batch_number: str
    manufacture_date: Optional[date] = None
    expiry_date: date
    manufacturer_id: Optional[str] = None
    purchase_id: Optional[str] = None
    quantity_received: float
    quantity_remaining: float
    quantity_sold: float = 0.0
    quantity_returned: float = 0.0
    quantity_damaged: float = 0.0
    purchase_price: float
    mrp: float = 0.0
    selling_price: float = 0.0
    discount_percentage: float = 0.0
    store_id: Optional[str] = None
    rack_number: Optional[str] = None
    notes: Optional[str] = None
    is_active: bool
    is_expired: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class BatchStockTransactionBase(BaseModel):
    batch_id: str
    transaction_type: str
    quantity: Decimal
    reference_id: Optional[str] = None
    reference_type: Optional[str] = None
    notes: Optional[str] = None
    created_by: Optional[str] = None


class BatchStockTransactionCreate(BatchStockTransactionBase):
    pass


class BatchStockTransactionResponse(BatchStockTransactionBase):
    id: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class DiscountConfigBase(BaseModel):
    name: str
    description: Optional[str] = None
    discount_type: str
    discount_percentage: Optional[Decimal] = None
    discount_amount: Optional[Decimal] = None
    min_quantity: Optional[Decimal] = None
    max_quantity: Optional[Decimal] = None
    category_id: Optional[str] = None
    medicine_category_id: Optional[str] = None
    product_id: Optional[str] = None
    customer_type: Optional[str] = None
    valid_from: Optional[date] = None
    valid_to: Optional[date] = None
    is_active: bool = True
    priority: int = 0


class DiscountConfigCreate(DiscountConfigBase):
    pass


class DiscountConfigUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    discount_type: Optional[str] = None
    discount_percentage: Optional[Decimal] = None
    discount_amount: Optional[Decimal] = None
    min_quantity: Optional[Decimal] = None
    max_quantity: Optional[Decimal] = None
    valid_from: Optional[date] = None
    valid_to: Optional[date] = None
    is_active: Optional[bool] = None
    priority: Optional[int] = None


class DiscountConfigResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    discount_type: str
    discount_percentage: float = 0.0
    discount_amount: float = 0.0
    min_quantity: float = 0.0
    max_quantity: float = 0.0
    category_id: Optional[str] = None
    medicine_category_id: Optional[str] = None
    product_id: Optional[str] = None
    customer_type: Optional[str] = None
    valid_from: Optional[date] = None
    valid_to: Optional[date] = None
    applicable_to: Optional[str] = None
    is_active: bool = True
    priority: int = 0
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class WasteProductBase(BaseModel):
    batch_id: Optional[str] = None
    product_id: str
    batch_number: Optional[str] = None
    quantity: float
    reason: str
    value_loss: float = 0.0
    store_id: Optional[str] = None
    reported_by: Optional[str] = None
    approved_by: Optional[str] = None
    disposal_method: Optional[str] = None
    notes: Optional[str] = None


class WasteProductCreate(WasteProductBase):
    pass


class WasteProductResponse(WasteProductBase):
    id: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class ExpiredMedicineResponse(BaseModel):
    id: str
    batch_id: str
    product_id: str
    batch_number: str
    expiry_date: date
    quantity: Decimal
    purchase_value: Optional[Decimal]
    disposal_method: Optional[str]
    disposal_date: Optional[date]
    disposal_notes: Optional[str]
    handled_by: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


class BarcodePrintRequest(BaseModel):
    product_id: str
    batch_id: Optional[str] = None
    quantity: int = 1
    printer_name: Optional[str] = None
    paper_size: str = "label"  # 'label', 'a4', 'a5', 'a6'


class BarcodePrintResponse(BaseModel):
    success: bool
    message: str
    barcode_data: Optional[str] = None
    qr_code_data: Optional[str] = None


# ============================================
# EXPIRY ALERT MODELS
# ============================================

class ExpiryAlertResponse(BaseModel):
    batch_id: str
    batch_number: str
    product_id: str
    product_name: str
    generic_name: Optional[str]
    brand_name: Optional[str]
    expiry_date: date
    quantity_remaining: float
    purchase_price: float
    value_at_risk: float
    manufacturer: Optional[str]
    store: Optional[str]
    days_to_expiry: int
    alert_level: str  # 'expired', 'critical', 'warning', 'info'
    
    class Config:
        from_attributes = True


class LowStockAlertResponse(BaseModel):
    product_id: str
    product_name: str
    generic_name: Optional[str]
    brand_name: Optional[str]
    current_stock: float
    reorder_level: float
    stock_percentage: float
    total_value: float
    alert_level: str
    
    class Config:
        from_attributes = True


# ============================================
# ENHANCED PRODUCT MODELS FOR PHARMACY
# ============================================

class PharmacyProductUpdate(BaseModel):
    """Update schema for pharmacy-specific product fields"""
    generic_name: Optional[str] = None
    brand_name: Optional[str] = None
    medicine_category_id: Optional[str] = None
    medicine_type_id: Optional[str] = None
    manufacturer_id: Optional[str] = None
    strength: Optional[str] = None
    composition: Optional[str] = None
    barcode: Optional[str] = None
    qr_code: Optional[str] = None
    unit_type_id: Optional[str] = None
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
    vat_percentage: Optional[Decimal] = None
    cgst_percentage: Optional[Decimal] = None
    sgst_percentage: Optional[Decimal] = None
    igst_percentage: Optional[Decimal] = None
    hsn_code: Optional[str] = None
    reorder_level: Optional[int] = None
    max_discount_percentage: Optional[Decimal] = None
    is_narcotic: Optional[bool] = None
    rack_number: Optional[str] = None
    shelf_number: Optional[str] = None


# ============================================
# STATISTICS & DASHBOARD MODELS
# ============================================

class MedicineStatistics(BaseModel):
    total_medicines: int
    total_batches: int
    expiring_soon_count: int  # Within 90 days
    expired_count: int
    low_stock_count: int
    total_inventory_value: Decimal
    expiring_value_at_risk: Decimal


class ManufacturerStatistics(BaseModel):
    total_manufacturers: int
    active_manufacturers: int
    total_outstanding: Decimal
    total_purchases_this_month: Decimal
    top_manufacturers: List[dict] = []

