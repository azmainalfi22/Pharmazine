"""
Service Management Models and Schemas
"""

from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, Text, ForeignKey, Date, Time, Numeric, text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
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
    id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ServiceBase(BaseModel):
    service_code: str
    category_id: Optional[str] = None
    name: str
    description: Optional[str] = None
    base_price: Decimal
    vat_percentage: Decimal = Decimal("0")
    cgst_percentage: Decimal = Decimal("0")
    sgst_percentage: Decimal = Decimal("0")
    igst_percentage: Decimal = Decimal("0")
    hsn_code: Optional[str] = None
    duration_minutes: Optional[int] = None
    is_home_service: bool = False
    travel_charges: Decimal = Decimal("0")
    min_advance_booking_hours: int = 0
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
    id: str
    created_by: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ServiceBookingBase(BaseModel):
    customer_id: Optional[str] = None
    customer_name: str
    customer_phone: str
    customer_address: Optional[str] = None
    service_id: str
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
    id: str
    booking_number: str
    status: str
    service_invoice_id: Optional[str]
    assigned_to: Optional[str]
    confirmed_by: Optional[str]
    confirmed_at: Optional[datetime]
    cancelled_by: Optional[str]
    cancelled_at: Optional[datetime]
    cancellation_reason: Optional[str]
    created_by: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

