"""
Service Management Models and Schemas
"""

from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, Text, ForeignKey, Date, Time, Numeric, text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from pydantic import BaseModel, Field, field_serializer
from typing import Optional, List, Dict, Any
from datetime import datetime, date, time
from decimal import Decimal

from sqlalchemy.ext.declarative import declarative_base
Base = declarative_base()

# ============================================
# SQLALCHEMY MODELS
# ============================================

class ServiceCategory(Base):
    __tablename__ = "service_categories"
    
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    name = Column(String, nullable=False, unique=True)
    description = Column(Text)
    display_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, nullable=False, server_default=text("now()"))
    updated_at = Column(DateTime, nullable=False, server_default=text("now()"), onupdate=datetime.utcnow)


class Service(Base):
    __tablename__ = "services"
    
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    service_code = Column(String, unique=True, nullable=False)
    category_id = Column(UUID(as_uuid=True), ForeignKey("service_categories.id"))
    name = Column(String, nullable=False)
    description = Column(Text)
    base_price = Column(Numeric, nullable=False)
    vat_percentage = Column(Numeric, default=0)
    cgst_percentage = Column(Numeric, default=0)
    sgst_percentage = Column(Numeric, default=0)
    igst_percentage = Column(Numeric, default=0)
    hsn_code = Column(String)
    duration_minutes = Column(Integer)
    is_home_service = Column(Boolean, default=False)
    travel_charges = Column(Numeric, default=0)
    min_advance_booking_hours = Column(Integer, default=0)
    max_bookings_per_day = Column(Integer)
    terms_and_conditions = Column(Text)
    is_active = Column(Boolean, default=True)
    created_by = Column(String)
    created_at = Column(DateTime, nullable=False, server_default=text("now()"))
    updated_at = Column(DateTime, nullable=False, server_default=text("now()"), onupdate=datetime.utcnow)


class ServiceBooking(Base):
    __tablename__ = "service_bookings"
    
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    booking_number = Column(String, unique=True, nullable=False)
    customer_id = Column(UUID(as_uuid=True))
    customer_name = Column(String, nullable=False)
    customer_phone = Column(String, nullable=False)
    customer_address = Column(Text)
    service_id = Column(UUID(as_uuid=True), ForeignKey("services.id"))
    service_name = Column(String, nullable=False)
    booking_date = Column(Date, nullable=False)
    booking_time = Column(Time, nullable=False)
    duration_minutes = Column(Integer)
    status = Column(String, default='pending')
    service_invoice_id = Column(UUID(as_uuid=True))
    advance_paid = Column(Numeric, default=0)
    notes = Column(Text)
    special_instructions = Column(Text)
    assigned_to = Column(String)
    confirmed_by = Column(String)
    confirmed_at = Column(DateTime)
    cancelled_by = Column(String)
    cancelled_at = Column(DateTime)
    cancellation_reason = Column(Text)
    created_by = Column(String)
    created_at = Column(DateTime, nullable=False, server_default=text("now()"))
    updated_at = Column(DateTime, nullable=False, server_default=text("now()"), onupdate=datetime.utcnow)


class ServiceInvoice(Base):
    __tablename__ = "service_invoices"
    
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    invoice_number = Column(String, unique=True, nullable=False)
    customer_id = Column(UUID(as_uuid=True))
    customer_name = Column(String, nullable=False)
    customer_phone = Column(String)
    customer_email = Column(String)
    customer_address = Column(Text)
    invoice_date = Column(Date, nullable=False)
    service_date = Column(Date)
    service_time = Column(Time)
    subtotal = Column(Numeric, default=0)
    discount_percentage = Column(Numeric, default=0)
    discount_amount = Column(Numeric, default=0)
    vat_amount = Column(Numeric, default=0)
    cgst_amount = Column(Numeric, default=0)
    sgst_amount = Column(Numeric, default=0)
    igst_amount = Column(Numeric, default=0)
    total_tax = Column(Numeric, default=0)
    travel_charges = Column(Numeric, default=0)
    other_charges = Column(Numeric, default=0)
    round_off = Column(Numeric, default=0)
    grand_total = Column(Numeric, nullable=False)
    payment_method = Column(String)
    payment_status = Column(String, default='pending')
    paid_amount = Column(Numeric, default=0)
    balance_amount = Column(Numeric, default=0)
    notes = Column(Text)
    terms_conditions = Column(Text)
    created_by = Column(String)
    created_at = Column(DateTime, nullable=False, server_default=text("now()"))
    updated_at = Column(DateTime, nullable=False, server_default=text("now()"), onupdate=datetime.utcnow)


class ServiceInvoiceItem(Base):
    __tablename__ = "service_invoice_items"
    
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    invoice_id = Column(UUID(as_uuid=True), ForeignKey("service_invoices.id"), nullable=False)
    service_id = Column(UUID(as_uuid=True), ForeignKey("services.id"))
    service_code = Column(String)
    service_name = Column(String, nullable=False)
    description = Column(Text)
    quantity = Column(Numeric, default=1)
    unit_price = Column(Numeric, nullable=False)
    subtotal = Column(Numeric, nullable=False)
    discount_percentage = Column(Numeric, default=0)
    discount_amount = Column(Numeric, default=0)
    vat_amount = Column(Numeric, default=0)
    cgst_amount = Column(Numeric, default=0)
    sgst_amount = Column(Numeric, default=0)
    igst_amount = Column(Numeric, default=0)
    total = Column(Numeric, nullable=False)


class ServicePackage(Base):
    __tablename__ = "service_packages"
    
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    package_code = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text)
    total_services = Column(Integer, default=0)
    package_price = Column(Numeric, nullable=False)
    discount_percentage = Column(Numeric, default=0)
    validity_days = Column(Integer)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, nullable=False, server_default=text("now()"))
    updated_at = Column(DateTime, nullable=False, server_default=text("now()"), onupdate=datetime.utcnow)


class ServiceReview(Base):
    __tablename__ = "service_reviews"
    
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    service_id = Column(UUID(as_uuid=True), ForeignKey("services.id"))
    booking_id = Column(UUID(as_uuid=True), ForeignKey("service_bookings.id"))
    customer_id = Column(UUID(as_uuid=True))
    customer_name = Column(String)
    rating = Column(Integer, nullable=False)  # 1-5
    review_text = Column(Text)
    service_quality = Column(Integer)  # 1-5
    staff_behavior = Column(Integer)  # 1-5
    value_for_money = Column(Integer)  # 1-5
    is_published = Column(Boolean, default=True)
    created_at = Column(DateTime, nullable=False, server_default=text("now()"))


# ============================================
# PYDANTIC SCHEMAS
# ============================================

class ServiceCategoryBase(BaseModel):
    name: str
    description: Optional[str] = None
    display_order: int = 0
    is_active: bool = True

class ServiceCategoryCreate(ServiceCategoryBase):
    pass

class ServiceCategoryResponse(ServiceCategoryBase):
    id: Any  # Accept UUID or str
    created_at: datetime
    updated_at: datetime
    
    @field_serializer('id')
    def serialize_id(self, value: Any, _info):
        return str(value) if value else None
    
    class Config:
        from_attributes = True


class ServiceBase(BaseModel):
    service_code: str
    category_id: Optional[Any] = None  # Accept UUID or str
    name: str
    description: Optional[str] = None
    base_price: Decimal
    vat_percentage: Optional[Decimal] = Decimal("0")
    cgst_percentage: Optional[Decimal] = Decimal("0")
    sgst_percentage: Optional[Decimal] = Decimal("0")
    igst_percentage: Optional[Decimal] = Decimal("0")
    hsn_code: Optional[str] = None
    duration_minutes: Optional[int] = None
    is_home_service: bool = False
    travel_charges: Optional[Decimal] = Decimal("0")
    min_advance_booking_hours: Optional[int] = 0
    max_bookings_per_day: Optional[int] = None
    terms_and_conditions: Optional[str] = None
    is_active: bool = True

class ServiceCreate(ServiceBase):
    pass

class ServiceUpdate(BaseModel):
    service_code: Optional[str] = None
    category_id: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    base_price: Optional[Decimal] = None
    vat_percentage: Optional[Decimal] = None
    cgst_percentage: Optional[Decimal] = None
    sgst_percentage: Optional[Decimal] = None
    igst_percentage: Optional[Decimal] = None
    hsn_code: Optional[str] = None
    duration_minutes: Optional[int] = None
    is_home_service: Optional[bool] = None
    travel_charges: Optional[Decimal] = None
    min_advance_booking_hours: Optional[int] = None
    max_bookings_per_day: Optional[int] = None
    terms_and_conditions: Optional[str] = None
    is_active: Optional[bool] = None

class ServiceResponse(ServiceBase):
    id: Any  # Accept UUID or str
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    @field_serializer('id', 'category_id')
    def serialize_uuid(self, value: Any, _info):
        return str(value) if value else None
    
    class Config:
        from_attributes = True


class ServiceBookingBase(BaseModel):
    customer_id: Optional[Any] = None  # Accept UUID or str
    customer_name: str
    customer_phone: str
    customer_address: Optional[str] = None
    service_id: Any  # Accept UUID or str
    service_name: str
    booking_date: date
    booking_time: time
    duration_minutes: Optional[int] = None
    advance_paid: Decimal = Decimal("0")
    notes: Optional[str] = None
    special_instructions: Optional[str] = None

class ServiceBookingCreate(ServiceBookingBase):
    pass

class ServiceBookingUpdate(BaseModel):
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_address: Optional[str] = None
    booking_date: Optional[date] = None
    booking_time: Optional[time] = None
    status: Optional[str] = None
    advance_paid: Optional[Decimal] = None
    notes: Optional[str] = None
    special_instructions: Optional[str] = None
    assigned_to: Optional[str] = None

class ServiceBookingResponse(ServiceBookingBase):
    id: Any  # Accept UUID or str
    booking_number: str
    status: str
    service_invoice_id: Optional[Any] = None
    assigned_to: Optional[str] = None
    confirmed_by: Optional[str] = None
    confirmed_at: Optional[datetime] = None
    cancelled_by: Optional[str] = None
    cancelled_at: Optional[datetime] = None
    cancellation_reason: Optional[str] = None
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    @field_serializer('id', 'customer_id', 'service_id', 'service_invoice_id')
    def serialize_uuid(self, value: Any, _info):
        return str(value) if value else None
    
    class Config:
        from_attributes = True


# Service Invoice Models
class ServiceInvoiceBase(BaseModel):
    customer_id: Optional[Any] = None
    customer_name: str
    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None
    customer_address: Optional[str] = None
    invoice_date: date
    service_date: Optional[date] = None
    service_time: Optional[time] = None
    subtotal: Decimal = Decimal("0")
    discount_percentage: Decimal = Decimal("0")
    discount_amount: Decimal = Decimal("0")
    grand_total: Decimal
    payment_method: Optional[str] = None
    payment_status: str = "pending"
    notes: Optional[str] = None


class ServiceInvoiceCreate(ServiceInvoiceBase):
    pass


class ServiceInvoiceResponse(ServiceInvoiceBase):
    id: Any
    invoice_number: str
    vat_amount: Decimal
    cgst_amount: Decimal
    sgst_amount: Decimal
    igst_amount: Decimal
    total_tax: Decimal
    travel_charges: Decimal
    other_charges: Decimal
    round_off: Decimal
    paid_amount: Decimal
    balance_amount: Decimal
    created_by: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    @field_serializer('id', 'customer_id')
    def serialize_uuid(self, value: Any, _info):
        return str(value) if value else None
    
    class Config:
        from_attributes = True


# Service Package Models
class ServicePackageBase(BaseModel):
    package_code: str
    name: str
    description: Optional[str] = None
    total_services: int = 0
    package_price: Decimal
    discount_percentage: Decimal = Decimal("0")
    validity_days: Optional[int] = None
    is_active: bool = True


class ServicePackageCreate(ServicePackageBase):
    pass


class ServicePackageResponse(ServicePackageBase):
    id: Any
    created_at: datetime
    updated_at: datetime
    
    @field_serializer('id')
    def serialize_uuid(self, value: Any, _info):
        return str(value) if value else None
    
    class Config:
        from_attributes = True


# Service Review Models
class ServiceReviewBase(BaseModel):
    service_id: Any
    booking_id: Optional[Any] = None
    customer_id: Optional[Any] = None
    customer_name: Optional[str] = None
    rating: int = Field(..., ge=1, le=5)
    review_text: Optional[str] = None
    service_quality: Optional[int] = Field(None, ge=1, le=5)
    staff_behavior: Optional[int] = Field(None, ge=1, le=5)
    value_for_money: Optional[int] = Field(None, ge=1, le=5)
    is_published: bool = True


class ServiceReviewCreate(ServiceReviewBase):
    pass


class ServiceReviewResponse(ServiceReviewBase):
    id: Any
    created_at: datetime
    
    @field_serializer('id', 'service_id', 'booking_id', 'customer_id')
    def serialize_uuid(self, value: Any, _info):
        return str(value) if value else None
    
    class Config:
        from_attributes = True

