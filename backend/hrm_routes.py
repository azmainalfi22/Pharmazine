"""
HR Management API Routes
"""

from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from typing import List, Optional
from datetime import datetime, date
from decimal import Decimal
import uuid

from hrm_models import (
    Employee, Attendance, Leave, Payroll, LeaveType,
    EmployeeDocument, EmployeeLoan, SalaryComponent, PayrollDetail,
    EmployeeCreate, EmployeeUpdate, EmployeeResponse,
    AttendanceCreate, AttendanceResponse,
    LeaveCreate, LeaveUpdate, LeaveResponse,
    PayrollCreate, PayrollResponse,
    LeaveTypeCreate, LeaveTypeResponse,
    EmployeeDocumentCreate, EmployeeDocumentResponse,
    EmployeeLoanCreate, EmployeeLoanUpdate, EmployeeLoanResponse,
    SalaryComponentCreate, SalaryComponentResponse,
    PayrollDetailCreate, PayrollDetailResponse
)

router = APIRouter(prefix="/api/hrm", tags=["HR Management"])

# Placeholder dependencies
def get_db():
    from main import SessionLocal
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user():
    return {"id": "system", "email": "system@pharmazine.com"}


# ============================================
# EMPLOYEES
# ============================================

@router.get("/employees", response_model=List[EmployeeResponse])
def get_employees(
    skip: int = 0,
    limit: int = 100,
    is_active: Optional[bool] = None,
    department: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all employees"""
    query = db.query(Employee)
    
    if is_active is not None:
        query = query.filter(Employee.is_active == is_active)
    if department:
        query = query.filter(Employee.department == department)
    
    employees = query.order_by(Employee.full_name).offset(skip).limit(limit).all()
    return employees


@router.get("/employees/{employee_id}", response_model=EmployeeResponse)
def get_employee(employee_id: str, db: Session = Depends(get_db)):
    """Get employee by ID"""
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return employee


@router.post("/employees", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
def create_employee(
    employee: EmployeeCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a new employee"""
    existing = db.query(Employee).filter(Employee.employee_code == employee.employee_code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Employee code already exists")
    
    if employee.email:
        existing_email = db.query(Employee).filter(Employee.email == employee.email).first()
        if existing_email:
            raise HTTPException(status_code=400, detail="Email already exists")
    
    db_employee = Employee(
        id=uuid.uuid4(),
        **employee.model_dump()
    )
    db.add(db_employee)
    db.commit()
    db.refresh(db_employee)
    return db_employee


@router.put("/employees/{employee_id}", response_model=EmployeeResponse)
def update_employee(
    employee_id: str,
    employee: EmployeeUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update employee"""
    db_employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not db_employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    for key, value in employee.model_dump(exclude_unset=True).items():
        setattr(db_employee, key, value)
    
    db_employee.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_employee)
    return db_employee


@router.delete("/employees/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employee(
    employee_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Delete employee"""
    db_employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not db_employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    db.delete(db_employee)
    db.commit()
    return None


# ============================================
# ATTENDANCE
# ============================================

@router.get("/attendance", response_model=List[AttendanceResponse])
def get_attendance(
    skip: int = 0,
    limit: int = 100,
    employee_id: Optional[str] = None,
    attendance_date: Optional[date] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get attendance records"""
    query = db.query(Attendance)
    
    if employee_id:
        query = query.filter(Attendance.employee_id == employee_id)
    if attendance_date:
        query = query.filter(Attendance.attendance_date == attendance_date)
    if status:
        query = query.filter(Attendance.status == status)
    
    records = query.order_by(Attendance.attendance_date.desc()).offset(skip).limit(limit).all()
    return records


@router.post("/attendance", response_model=AttendanceResponse, status_code=status.HTTP_201_CREATED)
def create_attendance(
    attendance: AttendanceCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create attendance record"""
    # Check if attendance already exists for this employee on this date
    existing = db.query(Attendance).filter(
        and_(
            Attendance.employee_id == attendance.employee_id,
            Attendance.attendance_date == attendance.attendance_date
        )
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Attendance already marked for this date")
    
    db_attendance = Attendance(
        id=uuid.uuid4(),
        **attendance.model_dump()
    )
    db.add(db_attendance)
    db.commit()
    db.refresh(db_attendance)
    return db_attendance


@router.post("/attendance/check-in")
def check_in(
    employee_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Check in employee"""
    today = date.today()
    existing = db.query(Attendance).filter(
        and_(
            Attendance.employee_id == employee_id,
            Attendance.attendance_date == today
        )
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Already checked in today")
    
    db_attendance = Attendance(
        id=uuid.uuid4(),
        employee_id=employee_id,
        attendance_date=today,
        check_in_time=datetime.now(),
        status='present'
    )
    db.add(db_attendance)
    db.commit()
    db.refresh(db_attendance)
    return {"message": "Checked in successfully", "time": db_attendance.check_in_time}


@router.post("/attendance/check-out")
def check_out(
    employee_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Check out employee"""
    today = date.today()
    attendance = db.query(Attendance).filter(
        and_(
            Attendance.employee_id == employee_id,
            Attendance.attendance_date == today
        )
    ).first()
    
    if not attendance:
        raise HTTPException(status_code=404, detail="No check-in found for today")
    
    if attendance.check_out_time:
        raise HTTPException(status_code=400, detail="Already checked out")
    
    attendance.check_out_time = datetime.now()
    
    # Calculate working hours
    if attendance.check_in_time:
        delta = attendance.check_out_time - attendance.check_in_time
        hours = delta.total_seconds() / 3600
        attendance.working_hours = round(hours, 2)
        
        # Calculate overtime (more than 8 hours)
        if hours > 8:
            attendance.overtime_hours = round(hours - 8, 2)
    
    db.commit()
    db.refresh(attendance)
    return {"message": "Checked out successfully", "time": attendance.check_out_time, "hours": attendance.working_hours}


# ============================================
# LEAVES
# ============================================

@router.get("/leaves", response_model=List[LeaveResponse])
def get_leaves(
    skip: int = 0,
    limit: int = 100,
    employee_id: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get leave applications"""
    query = db.query(Leave)
    
    if employee_id:
        query = query.filter(Leave.employee_id == employee_id)
    if status:
        query = query.filter(Leave.status == status)
    
    leaves = query.order_by(Leave.created_at.desc()).offset(skip).limit(limit).all()
    return leaves


@router.post("/leaves", response_model=LeaveResponse, status_code=status.HTTP_201_CREATED)
def create_leave(
    leave: LeaveCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Apply for leave"""
    # Generate application number
    count = db.query(func.count(Leave.id)).scalar()
    application_number = f"LV{datetime.now().strftime('%Y%m')}{str(count + 1).zfill(4)}"
    
    db_leave = Leave(
        id=uuid.uuid4(),
        application_number=application_number,
        status='pending',
        **leave.model_dump()
    )
    db.add(db_leave)
    db.commit()
    db.refresh(db_leave)
    return db_leave


@router.put("/leaves/{leave_id}", response_model=LeaveResponse)
def update_leave(
    leave_id: str,
    leave: LeaveUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update leave application"""
    db_leave = db.query(Leave).filter(Leave.id == leave_id).first()
    if not db_leave:
        raise HTTPException(status_code=404, detail="Leave application not found")
    
    for key, value in leave.model_dump(exclude_unset=True).items():
        setattr(db_leave, key, value)
    
    if leave.status == 'approved':
        db_leave.approved_at = datetime.utcnow()
    
    db.commit()
    db.refresh(db_leave)
    return db_leave


@router.post("/leaves/{leave_id}/approve", response_model=LeaveResponse)
def approve_leave(
    leave_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Approve leave"""
    db_leave = db.query(Leave).filter(Leave.id == leave_id).first()
    if not db_leave:
        raise HTTPException(status_code=404, detail="Leave application not found")
    
    db_leave.status = 'approved'
    db_leave.approved_by = current_user.get('id')
    db_leave.approved_at = datetime.utcnow()
    db.commit()
    db.refresh(db_leave)
    return db_leave


@router.post("/leaves/{leave_id}/reject", response_model=LeaveResponse)
def reject_leave(
    leave_id: str,
    reason: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Reject leave"""
    db_leave = db.query(Leave).filter(Leave.id == leave_id).first()
    if not db_leave:
        raise HTTPException(status_code=404, detail="Leave application not found")
    
    db_leave.status = 'rejected'
    db_leave.rejection_reason = reason
    db.commit()
    db.refresh(db_leave)
    return db_leave


# ============================================
# PAYROLL
# ============================================

@router.get("/payroll", response_model=List[PayrollResponse])
def get_payroll(
    skip: int = 0,
    limit: int = 100,
    employee_id: Optional[str] = None,
    month: Optional[int] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Get payroll records"""
    query = db.query(Payroll)
    
    if employee_id:
        query = query.filter(Payroll.employee_id == employee_id)
    if month:
        query = query.filter(Payroll.month == month)
    if year:
        query = query.filter(Payroll.year == year)
    
    records = query.order_by(Payroll.year.desc(), Payroll.month.desc()).offset(skip).limit(limit).all()
    return records


@router.post("/payroll", response_model=PayrollResponse, status_code=status.HTTP_201_CREATED)
def create_payroll(
    payroll: PayrollCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Generate payroll"""
    # Check if payroll already exists
    existing = db.query(Payroll).filter(
        and_(
            Payroll.employee_id == payroll.employee_id,
            Payroll.month == payroll.month,
            Payroll.year == payroll.year
        )
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Payroll already generated for this period")
    
    # Calculate gross and net salary
    gross_salary = payroll.basic_salary + payroll.allowances + payroll.overtime_amount + payroll.bonuses
    net_salary = gross_salary - payroll.deductions - payroll.tax_deduction
    
    db_payroll = Payroll(
        id=uuid.uuid4(),
        gross_salary=gross_salary,
        net_salary=net_salary,
        payment_status='pending',
        **payroll.model_dump()
    )
    db.add(db_payroll)
    db.commit()
    db.refresh(db_payroll)
    return db_payroll


@router.post("/payroll/{payroll_id}/pay", response_model=PayrollResponse)
def mark_payroll_paid(
    payroll_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Mark payroll as paid"""
    db_payroll = db.query(Payroll).filter(Payroll.id == payroll_id).first()
    if not db_payroll:
        raise HTTPException(status_code=404, detail="Payroll record not found")
    
    db_payroll.payment_status = 'paid'
    db_payroll.payment_date = date.today()
    db_payroll.processed_by = current_user.get('id')
    db_payroll.processed_at = datetime.utcnow()
    db.commit()
    db.refresh(db_payroll)
    return db_payroll


# ============================================
# LEAVE TYPES
# ============================================

@router.get("/leave-types", response_model=List[LeaveTypeResponse])
def get_leave_types(
    skip: int = 0,
    limit: int = 100,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """Get all leave types"""
    query = db.query(LeaveType)
    
    if is_active is not None:
        query = query.filter(LeaveType.is_active == is_active)
    
    leave_types = query.offset(skip).limit(limit).all()
    return leave_types


@router.post("/leave-types", response_model=LeaveTypeResponse, status_code=status.HTTP_201_CREATED)
def create_leave_type(
    leave_type: LeaveTypeCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a new leave type"""
    existing = db.query(LeaveType).filter(
        or_(LeaveType.name == leave_type.name, LeaveType.code == leave_type.code)
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Leave type with this name or code already exists")
    
    db_leave_type = LeaveType(
        id=uuid.uuid4(),
        **leave_type.model_dump()
    )
    db.add(db_leave_type)
    db.commit()
    db.refresh(db_leave_type)
    return db_leave_type


# ============================================
# EMPLOYEE DOCUMENTS
# ============================================

@router.get("/employees/{employee_id}/documents", response_model=List[EmployeeDocumentResponse])
def get_employee_documents(
    employee_id: str,
    document_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all documents for an employee"""
    query = db.query(EmployeeDocument).filter(EmployeeDocument.employee_id == employee_id)
    
    if document_type:
        query = query.filter(EmployeeDocument.document_type == document_type)
    
    documents = query.order_by(EmployeeDocument.uploaded_at.desc()).all()
    return documents


@router.post("/employees/{employee_id}/documents", response_model=EmployeeDocumentResponse, status_code=status.HTTP_201_CREATED)
def upload_employee_document(
    employee_id: str,
    document: EmployeeDocumentCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Upload a document for an employee"""
    db_document = EmployeeDocument(
        id=uuid.uuid4(),
        uploaded_by=current_user.get('id'),
        **document.model_dump()
    )
    db.add(db_document)
    db.commit()
    db.refresh(db_document)
    return db_document


@router.delete("/documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employee_document(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Delete an employee document"""
    db_document = db.query(EmployeeDocument).filter(EmployeeDocument.id == document_id).first()
    if not db_document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Delete file if exists
    import os
    if os.path.exists(db_document.file_path):
        os.remove(db_document.file_path)
    
    db.delete(db_document)
    db.commit()
    return None


# ============================================
# EMPLOYEE LOANS
# ============================================

@router.get("/loans", response_model=List[EmployeeLoanResponse])
def get_employee_loans(
    skip: int = 0,
    limit: int = 100,
    employee_id: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all employee loans"""
    query = db.query(EmployeeLoan)
    
    if employee_id:
        query = query.filter(EmployeeLoan.employee_id == employee_id)
    if status:
        query = query.filter(EmployeeLoan.status == status)
    
    loans = query.order_by(EmployeeLoan.created_at.desc()).offset(skip).limit(limit).all()
    return loans


@router.post("/loans", response_model=EmployeeLoanResponse, status_code=status.HTTP_201_CREATED)
def create_employee_loan(
    loan: EmployeeLoanCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a new employee loan"""
    # Generate loan number
    count = db.query(func.count(EmployeeLoan.id)).scalar()
    loan_number = f"LOAN{datetime.now().strftime('%Y%m')}{str(count + 1).zfill(4)}"
    
    db_loan = EmployeeLoan(
        id=uuid.uuid4(),
        loan_number=loan_number,
        remaining_amount=loan.loan_amount,
        approved_by=current_user.get('id'),
        **loan.model_dump()
    )
    db.add(db_loan)
    db.commit()
    db.refresh(db_loan)
    return db_loan


@router.put("/loans/{loan_id}", response_model=EmployeeLoanResponse)
def update_employee_loan(
    loan_id: str,
    loan: EmployeeLoanUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update employee loan"""
    db_loan = db.query(EmployeeLoan).filter(EmployeeLoan.id == loan_id).first()
    if not db_loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    
    for key, value in loan.model_dump(exclude_unset=True).items():
        setattr(db_loan, key, value)
    
    db_loan.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_loan)
    return db_loan


@router.post("/loans/{loan_id}/pay-installment")
def pay_loan_installment(
    loan_id: str,
    amount: Decimal,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Pay a loan installment"""
    db_loan = db.query(EmployeeLoan).filter(EmployeeLoan.id == loan_id).first()
    if not db_loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    
    if db_loan.status != 'active':
        raise HTTPException(status_code=400, detail="Loan is not active")
    
    db_loan.paid_installments += 1
    db_loan.remaining_amount = max(0, float(db_loan.remaining_amount or 0) - float(amount))
    
    if db_loan.paid_installments >= db_loan.total_installments or db_loan.remaining_amount <= 0:
        db_loan.status = 'paid'
        db_loan.remaining_amount = 0
    
    db_loan.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_loan)
    
    return {
        "message": "Installment paid successfully",
        "paid_installments": db_loan.paid_installments,
        "remaining_amount": float(db_loan.remaining_amount or 0),
        "status": db_loan.status
    }


# ============================================
# SALARY COMPONENTS
# ============================================

@router.get("/salary-components", response_model=List[SalaryComponentResponse])
def get_salary_components(
    component_type: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """Get all salary components"""
    query = db.query(SalaryComponent)
    
    if component_type:
        query = query.filter(SalaryComponent.component_type == component_type)
    if is_active is not None:
        query = query.filter(SalaryComponent.is_active == is_active)
    
    components = query.all()
    return components


@router.post("/salary-components", response_model=SalaryComponentResponse, status_code=status.HTTP_201_CREATED)
def create_salary_component(
    component: SalaryComponentCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a new salary component"""
    existing = db.query(SalaryComponent).filter(
        SalaryComponent.component_name == component.component_name
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Salary component already exists")
    
    db_component = SalaryComponent(
        id=uuid.uuid4(),
        **component.model_dump()
    )
    db.add(db_component)
    db.commit()
    db.refresh(db_component)
    return db_component


# ============================================
# PAYROLL DETAILS
# ============================================

@router.get("/payroll/{payroll_id}/details", response_model=List[PayrollDetailResponse])
def get_payroll_details(
    payroll_id: str,
    db: Session = Depends(get_db)
):
    """Get payroll details (components breakdown)"""
    details = db.query(PayrollDetail).filter(PayrollDetail.payroll_id == payroll_id).all()
    return details


@router.post("/payroll/{payroll_id}/details", response_model=PayrollDetailResponse, status_code=status.HTTP_201_CREATED)
def add_payroll_detail(
    payroll_id: str,
    detail: PayrollDetailCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Add a component to payroll"""
    db_detail = PayrollDetail(
        id=uuid.uuid4(),
        **detail.model_dump()
    )
    db.add(db_detail)
    
    # Recalculate payroll totals
    payroll = db.query(Payroll).filter(Payroll.id == payroll_id).first()
    if payroll:
        details = db.query(PayrollDetail).filter(PayrollDetail.payroll_id == payroll_id).all()
        
        earnings = sum(float(d.amount) for d in details if d.component_type == 'earning')
        deductions = sum(float(d.amount) for d in details if d.component_type == 'deduction')
        
        payroll.gross_salary = earnings
        payroll.total_deductions = deductions
        payroll.net_salary = earnings - deductions
    
    db.commit()
    db.refresh(db_detail)
    return db_detail

