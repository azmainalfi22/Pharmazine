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
    __tablename__ = "leave_applications"
    
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    application_number = Column(String, unique=True)
    employee_id = Column(String, ForeignKey("employees.id"), nullable=False)
    leave_type_id = Column(UUID(as_uuid=True), ForeignKey("leave_types.id"))
    leave_type = Column(String)  # For backward compatibility
    from_date = Column(Date, nullable=False)
    to_date = Column(Date, nullable=False)
    total_days = Column(Numeric, nullable=False)
    reason = Column(Text, nullable=False)
    contact_during_leave = Column(Text)
    status = Column(String, default='pending')  # pending, approved, rejected, cancelled
    approved_by = Column(String)
    approved_at = Column(DateTime)
    rejection_reason = Column(Text)
    created_at = Column(DateTime, nullable=False, server_default=text("now()"))
    
    # Aliases for backward compatibility
    @property
    def start_date(self):
        return self.from_date
    
    @property
    def end_date(self):
        return self.to_date
    
    @property
    def applied_date(self):
        return self.created_at.date() if self.created_at else None
    
    @property
    def approved_date(self):
        return self.approved_at.date() if self.approved_at else None


class LeaveType(Base):
    __tablename__ = "leave_types"
    
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    name = Column(String, nullable=False, unique=True)
    code = Column(String, nullable=False, unique=True)
    annual_quota = Column(Integer, default=0)
    is_paid = Column(Boolean, default=True)
    is_carry_forward = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, nullable=False, server_default=text("now()"))


class EmployeeDocument(Base):
    __tablename__ = "employee_documents"
    
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    employee_id = Column(String, ForeignKey("employees.id"), nullable=False)
    document_type = Column(String, nullable=False)  # resume, id_proof, address_proof, education, experience, other
    document_name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_size = Column(Integer)
    uploaded_by = Column(String)
    uploaded_at = Column(DateTime, nullable=False, server_default=text("now()"))


class EmployeeLoan(Base):
    __tablename__ = "employee_loans"
    
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    loan_number = Column(String, unique=True, nullable=False)
    employee_id = Column(String, ForeignKey("employees.id"), nullable=False)
    loan_type = Column(String, nullable=False)  # advance, loan
    loan_amount = Column(Numeric, nullable=False)
    interest_rate = Column(Numeric, default=0)
    emi_amount = Column(Numeric, nullable=False)
    total_installments = Column(Integer, nullable=False)
    paid_installments = Column(Integer, default=0)
    remaining_amount = Column(Numeric)
    status = Column(String, default='active')  # active, paid, defaulted
    disbursement_date = Column(Date)
    approved_by = Column(String)
    notes = Column(Text)
    created_at = Column(DateTime, nullable=False, server_default=text("now()"))
    updated_at = Column(DateTime, nullable=False, server_default=text("now()"), onupdate=datetime.utcnow)


class SalaryComponent(Base):
    __tablename__ = "salary_components"
    
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    component_name = Column(String, nullable=False, unique=True)
    component_type = Column(String, nullable=False)  # earning, deduction
    calculation_type = Column(String, default='fixed')  # fixed, percentage, formula
    default_amount = Column(Numeric, default=0)
    is_taxable = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, nullable=False, server_default=text("now()"))


class Payroll(Base):
    __tablename__ = "payroll"
    
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    payroll_number = Column(String, unique=True)
    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id"), nullable=False)
    month = Column(Integer, nullable=False)
    year = Column(Integer, nullable=False)
    days_worked = Column(Numeric, default=0)
    days_absent = Column(Numeric, default=0)
    basic_salary = Column(Numeric, nullable=False)
    allowances = Column(Numeric, default=0)
    overtime_amount = Column(Numeric, default=0)
    bonuses = Column(Numeric, default=0)
    deductions = Column(Numeric, default=0)
    tax_deduction = Column(Numeric, default=0)
    gross_salary = Column(Numeric, nullable=False)
    total_deductions = Column(Numeric, default=0)
    net_salary = Column(Numeric, nullable=False)
    payment_date = Column(Date)
    payment_method = Column(String)  # bank_transfer, cash, cheque
    payment_status = Column(String, default='pending')  # pending, paid
    payment_reference = Column(String)
    processed_by = Column(String)
    processed_at = Column(DateTime)
    notes = Column(Text)
    created_at = Column(DateTime, nullable=False, server_default=text("now()"))
    updated_at = Column(DateTime, nullable=False, server_default=text("now()"), onupdate=datetime.utcnow)


class PayrollDetail(Base):
    __tablename__ = "payroll_details"
    
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    payroll_id = Column(UUID(as_uuid=True), ForeignKey("payroll.id"), nullable=False)
    component_id = Column(UUID(as_uuid=True), ForeignKey("salary_components.id"))
    component_name = Column(String, nullable=False)
    component_type = Column(String, nullable=False)
    amount = Column(Numeric, nullable=False)


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
    leave_type_id: Optional[str] = None
    leave_type: Optional[str] = None  # For backward compatibility
    from_date: date
    to_date: date
    total_days: float
    reason: str
    contact_during_leave: Optional[str] = None


class LeaveCreate(LeaveBase):
    pass


class LeaveUpdate(BaseModel):
    status: Optional[str] = None
    approved_by: Optional[str] = None
    rejection_reason: Optional[str] = None


class LeaveResponse(LeaveBase):
    id: str
    application_number: Optional[str]
    status: str
    approved_by: Optional[str]
    approved_at: Optional[datetime]
    rejection_reason: Optional[str]
    created_at: datetime
    
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


# Leave Types
class LeaveTypeBase(BaseModel):
    name: str
    code: str
    annual_quota: int = 0
    is_paid: bool = True
    is_carry_forward: bool = False
    is_active: bool = True


class LeaveTypeCreate(LeaveTypeBase):
    pass


class LeaveTypeResponse(LeaveTypeBase):
    id: str
    created_at: datetime
    
    class Config:
        from_attributes = True


# Employee Documents
class EmployeeDocumentBase(BaseModel):
    employee_id: str
    document_type: str
    document_name: str
    file_path: str
    file_size: Optional[int] = None
    uploaded_by: Optional[str] = None


class EmployeeDocumentCreate(EmployeeDocumentBase):
    pass


class EmployeeDocumentResponse(EmployeeDocumentBase):
    id: str
    uploaded_at: datetime
    
    class Config:
        from_attributes = True


# Employee Loans
class EmployeeLoanBase(BaseModel):
    employee_id: str
    loan_type: str
    loan_amount: Decimal
    interest_rate: Decimal = Decimal("0")
    emi_amount: Decimal
    total_installments: int
    disbursement_date: Optional[date] = None
    notes: Optional[str] = None


class EmployeeLoanCreate(EmployeeLoanBase):
    pass


class EmployeeLoanUpdate(BaseModel):
    paid_installments: Optional[int] = None
    remaining_amount: Optional[Decimal] = None
    status: Optional[str] = None


class EmployeeLoanResponse(EmployeeLoanBase):
    id: str
    loan_number: str
    paid_installments: int
    remaining_amount: Optional[Decimal]
    status: str
    approved_by: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Salary Components
class SalaryComponentBase(BaseModel):
    component_name: str
    component_type: str
    calculation_type: str = "fixed"
    default_amount: Decimal = Decimal("0")
    is_taxable: bool = True
    is_active: bool = True


class SalaryComponentCreate(SalaryComponentBase):
    pass


class SalaryComponentResponse(SalaryComponentBase):
    id: str
    created_at: datetime
    
    class Config:
        from_attributes = True


# Payroll Details
class PayrollDetailBase(BaseModel):
    payroll_id: str
    component_id: Optional[str] = None
    component_name: str
    component_type: str
    amount: Decimal


class PayrollDetailCreate(PayrollDetailBase):
    pass


class PayrollDetailResponse(PayrollDetailBase):
    id: str
    
    class Config:
        from_attributes = True

