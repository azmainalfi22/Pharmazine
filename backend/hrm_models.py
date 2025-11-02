"""
HR Management Models and Schemas
"""

from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, Text, ForeignKey, Date, Numeric, text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal

from sqlalchemy.ext.declarative import declarative_base
Base = declarative_base()

# ============================================
# SQLALCHEMY MODELS
# ============================================

class Employee(Base):
    __tablename__ = "employees"
    
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    employee_code = Column(String, unique=True, nullable=False)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True)
    phone = Column(String, nullable=False)
    date_of_birth = Column(Date)
    gender = Column(String)
    address = Column(Text)
    city = Column(String)
    state = Column(String)
    postal_code = Column(String)
    national_id = Column(String)
    designation = Column(String)
    department = Column(String)
    employment_type = Column(String)  # full_time, part_time, contract
    joining_date = Column(Date, nullable=False)
    leaving_date = Column(Date)
    basic_salary = Column(Numeric, default=0)
    allowances = Column(Numeric, default=0)
    bank_name = Column(String)
    bank_account_number = Column(String)
    emergency_contact_name = Column(String)
    emergency_contact_phone = Column(String)
    photo_url = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, nullable=False, server_default=text("now()"))
    updated_at = Column(DateTime, nullable=False, server_default=text("now()"), onupdate=datetime.utcnow)


class Attendance(Base):
    __tablename__ = "attendance"
    
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id"), nullable=False)
    attendance_date = Column(Date, nullable=False)
    check_in_time = Column(DateTime)
    check_out_time = Column(DateTime)
    status = Column(String, default='present')  # present, absent, half_day, leave
    working_hours = Column(Float, default=0)
    overtime_hours = Column(Float, default=0)
    notes = Column(Text)
    created_at = Column(DateTime, nullable=False, server_default=text("now()"))
    updated_at = Column(DateTime, nullable=False, server_default=text("now()"), onupdate=datetime.utcnow)


class Leave(Base):
    __tablename__ = "leaves"
    
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id"), nullable=False)
    leave_type = Column(String, nullable=False)  # sick, casual, annual, unpaid
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    total_days = Column(Float, nullable=False)
    reason = Column(Text)
    status = Column(String, default='pending')  # pending, approved, rejected
    applied_date = Column(Date, default=date.today)
    approved_by = Column(String)
    approved_date = Column(Date)
    rejection_reason = Column(Text)
    created_at = Column(DateTime, nullable=False, server_default=text("now()"))
    updated_at = Column(DateTime, nullable=False, server_default=text("now()"), onupdate=datetime.utcnow)


class Payroll(Base):
    __tablename__ = "payroll"
    
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id"), nullable=False)
    month = Column(Integer, nullable=False)
    year = Column(Integer, nullable=False)
    basic_salary = Column(Numeric, nullable=False)
    allowances = Column(Numeric, default=0)
    overtime_amount = Column(Numeric, default=0)
    bonuses = Column(Numeric, default=0)
    deductions = Column(Numeric, default=0)
    tax_deduction = Column(Numeric, default=0)
    gross_salary = Column(Numeric, nullable=False)
    net_salary = Column(Numeric, nullable=False)
    payment_date = Column(Date)
    payment_method = Column(String)  # bank_transfer, cash, cheque
    payment_status = Column(String, default='pending')  # pending, paid
    notes = Column(Text)
    created_at = Column(DateTime, nullable=False, server_default=text("now()"))
    updated_at = Column(DateTime, nullable=False, server_default=text("now()"), onupdate=datetime.utcnow)


# ============================================
# PYDANTIC SCHEMAS
# ============================================

class EmployeeBase(BaseModel):
    employee_code: str
    full_name: str
    email: Optional[EmailStr] = None
    phone: str
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    national_id: Optional[str] = None
    designation: Optional[str] = None
    department: Optional[str] = None
    employment_type: str = "full_time"
    joining_date: date
    basic_salary: Decimal = Decimal("0")
    allowances: Decimal = Decimal("0")
    bank_name: Optional[str] = None
    bank_account_number: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    is_active: bool = True

class EmployeeCreate(EmployeeBase):
    pass

class EmployeeUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    designation: Optional[str] = None
    department: Optional[str] = None
    basic_salary: Optional[Decimal] = None
    allowances: Optional[Decimal] = None
    is_active: Optional[bool] = None

class EmployeeResponse(EmployeeBase):
    id: str
    leaving_date: Optional[date]
    photo_url: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class AttendanceBase(BaseModel):
    employee_id: str
    attendance_date: date
    check_in_time: Optional[datetime] = None
    check_out_time: Optional[datetime] = None
    status: str = "present"
    working_hours: float = 0
    overtime_hours: float = 0
    notes: Optional[str] = None

class AttendanceCreate(AttendanceBase):
    pass

class AttendanceResponse(AttendanceBase):
    id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class LeaveBase(BaseModel):
    employee_id: str
    leave_type: str
    start_date: date
    end_date: date
    total_days: float
    reason: Optional[str] = None

class LeaveCreate(LeaveBase):
    pass

class LeaveUpdate(BaseModel):
    status: Optional[str] = None
    approved_by: Optional[str] = None
    rejection_reason: Optional[str] = None

class LeaveResponse(LeaveBase):
    id: str
    status: str
    applied_date: date
    approved_by: Optional[str]
    approved_date: Optional[date]
    rejection_reason: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class PayrollBase(BaseModel):
    employee_id: str
    month: int
    year: int
    basic_salary: Decimal
    allowances: Decimal = Decimal("0")
    overtime_amount: Decimal = Decimal("0")
    bonuses: Decimal = Decimal("0")
    deductions: Decimal = Decimal("0")
    tax_deduction: Decimal = Decimal("0")
    payment_method: Optional[str] = None
    notes: Optional[str] = None

class PayrollCreate(PayrollBase):
    pass

class PayrollResponse(PayrollBase):
    id: str
    gross_salary: Decimal
    net_salary: Decimal
    payment_date: Optional[date]
    payment_status: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

