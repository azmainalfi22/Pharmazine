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
    Employee, Attendance, Leave, Payroll,
    EmployeeCreate, EmployeeUpdate, EmployeeResponse,
    AttendanceCreate, AttendanceResponse,
    LeaveCreate, LeaveUpdate, LeaveResponse,
    PayrollCreate, PayrollResponse
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
        **employee.dict()
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
    
    for key, value in employee.dict(exclude_unset=True).items():
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
        **attendance.dict()
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
    
    leaves = query.order_by(Leave.applied_date.desc()).offset(skip).limit(limit).all()
    return leaves


@router.post("/leaves", response_model=LeaveResponse, status_code=status.HTTP_201_CREATED)
def create_leave(
    leave: LeaveCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Apply for leave"""
    db_leave = Leave(
        id=uuid.uuid4(),
        status='pending',
        applied_date=date.today(),
        **leave.dict()
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
    
    for key, value in leave.dict(exclude_unset=True).items():
        setattr(db_leave, key, value)
    
    if leave.status == 'approved':
        db_leave.approved_date = date.today()
    
    db_leave.updated_at = datetime.utcnow()
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
    db_leave.approved_date = date.today()
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
        **payroll.dict()
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
    db.commit()
    db.refresh(db_payroll)
    return db_payroll

