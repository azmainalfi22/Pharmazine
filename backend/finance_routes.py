"""
Pharmazine - Finance & Accounting Module
API Routes for Payments, Vouchers, Receivables, Payables, and Accounting

This module handles all finance-related operations
"""

from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, create_engine
from sqlalchemy.orm import sessionmaker
from typing import List, Optional
from datetime import datetime, date
import uuid
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/api/finance", tags=["Finance & Accounting"])

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:pharmazine123@localhost:5432/pharmazine")
if "sqlite" in DATABASE_URL:
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user():
    return {"id": "system", "email": "system@pharmazine.com"}

# ============================================
# PAYMENT COLLECTION ENDPOINTS
# ============================================

@router.get("/payments/summary")
def get_payment_summary(
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get payment collection summary"""
    try:
        # Query sales for payment data
        from main import Sale
        query = db.query(Sale)
        
        if from_date:
            query = query.filter(Sale.created_at >= from_date)
        if to_date:
            query = query.filter(Sale.created_at <= to_date)
        
        sales = query.all()
        
        total_collected = sum(float(s.net_amount or 0) for s in sales if s.payment_status == "completed")
        pending_payments = sum(float(s.net_amount or 0) for s in sales if s.payment_status != "completed")
        
        # Group by payment method
        cash_sales = sum(float(s.net_amount or 0) for s in sales if s.payment_method == "cash")
        card_sales = sum(float(s.net_amount or 0) for s in sales if s.payment_method == "card")
        online_sales = sum(float(s.net_amount or 0) for s in sales if s.payment_method in ["upi", "online"])
        
        return {
            "total_collected": total_collected,
            "pending_payments": pending_payments,
            "cash_payments": cash_sales,
            "card_payments": card_sales,
            "online_payments": online_sales,
            "total_transactions": len(sales)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# ACCOUNTS RECEIVABLE ENDPOINTS
# ============================================

@router.get("/receivables")
def get_accounts_receivable(
    db: Session = Depends(get_db)
):
    """Get all accounts receivable (customer dues)"""
    try:
        from main import Sale
        
        # Get sales with pending payments
        pending_sales = db.query(Sale).filter(
            or_(
                Sale.payment_status == "pending",
                Sale.payment_status == "partial"
            )
        ).all()
        
        receivables = []
        for sale in pending_sales:
            receivables.append({
                "invoice_id": sale.id,
                "invoice_no": sale.invoice_no,
                "customer_name": sale.customer_name or "Walk-in",
                "invoice_date": sale.created_at.isoformat(),
                "amount": float(sale.net_amount or 0),
                "paid_amount": 0,
                "balance": float(sale.net_amount or 0),
                "status": sale.payment_status
            })
        
        total = sum(r["balance"] for r in receivables)
        
        return {
            "receivables": receivables,
            "total_receivable": total,
            "count": len(receivables)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# ACCOUNTS PAYABLE ENDPOINTS
# ============================================

@router.get("/payables")
def get_accounts_payable(
    db: Session = Depends(get_db)
):
    """Get all accounts payable (supplier/manufacturer dues)"""
    try:
        from pharmacy_models import Manufacturer
        
        # Get manufacturers with outstanding balance
        manufacturers = db.query(Manufacturer).filter(
            Manufacturer.current_balance > 0
        ).all()
        
        payables = []
        for mfr in manufacturers:
            payables.append({
                "supplier_id": str(mfr.id),
                "supplier_name": mfr.name,
                "credit_limit": float(mfr.credit_limit or 0),
                "balance": float(mfr.current_balance or 0),
                "status": "exceeded" if float(mfr.current_balance or 0) > float(mfr.credit_limit or 0) else "normal"
            })
        
        total = sum(p["balance"] for p in payables)
        
        return {
            "payables": payables,
            "total_payable": total,
            "count": len(payables)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# CASH FLOW ENDPOINTS
# ============================================

@router.get("/cashflow/summary")
def get_cashflow_summary(
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get cash flow summary"""
    try:
        from main import Sale
        
        query = db.query(Sale)
        
        if from_date:
            query = query.filter(Sale.created_at >= from_date)
        if to_date:
            query = query.filter(Sale.created_at <= to_date)
        
        sales = query.all()
        
        cash_inflow = sum(float(s.net_amount or 0) for s in sales if s.payment_status == "completed")
        
        # Cash outflow would come from purchases/expenses (simplified for now)
        cash_outflow = 0
        
        return {
            "opening_balance": 0,
            "total_cash_in": cash_inflow,
            "total_cash_out": cash_outflow,
            "net_cash_flow": cash_inflow - cash_outflow,
            "closing_balance": cash_inflow - cash_outflow
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/cashflow/daily")
def get_daily_cashflow(
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get daily cash flow breakdown"""
    try:
        from main import Sale
        from sqlalchemy import func, cast, Date
        
        query = db.query(
            cast(Sale.created_at, Date).label('date'),
            func.sum(Sale.net_amount).label('cash_in'),
            func.count(Sale.id).label('transaction_count')
        ).filter(Sale.payment_status == "completed")
        
        if from_date:
            query = query.filter(Sale.created_at >= from_date)
        if to_date:
            query = query.filter(Sale.created_at <= to_date)
        
        results = query.group_by(cast(Sale.created_at, Date)).all()
        
        daily_flow = []
        for row in results:
            daily_flow.append({
                "date": row.date.isoformat(),
                "cash_in": float(row.cash_in or 0),
                "cash_out": 0,  # Would calculate from purchases
                "net_flow": float(row.cash_in or 0),
                "transaction_count": row.transaction_count
            })
        
        return {"daily_flow": daily_flow, "count": len(daily_flow)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# FINANCIAL DASHBOARD ENDPOINTS
# ============================================

@router.get("/dashboard")
def get_financial_dashboard(db: Session = Depends(get_db)):
    """Get comprehensive financial dashboard data"""
    try:
        from main import Sale
        from pharmacy_models import Manufacturer
        from datetime import timedelta
        
        today = datetime.utcnow().date()
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)
        
        # Sales data
        all_sales = db.query(Sale).all()
        today_sales = [s for s in all_sales if s.created_at.date() == today]
        week_sales = [s for s in all_sales if s.created_at.date() >= week_ago]
        month_sales = [s for s in all_sales if s.created_at.date() >= month_ago]
        
        # Receivables
        receivables = sum(float(s.net_amount or 0) for s in all_sales if s.payment_status != "completed")
        
        # Payables
        manufacturers = db.query(Manufacturer).all()
        payables = sum(float(m.current_balance or 0) for m in manufacturers)
        
        # Cash calculations
        today_revenue = sum(float(s.net_amount or 0) for s in today_sales if s.payment_status == "completed")
        week_revenue = sum(float(s.net_amount or 0) for s in week_sales if s.payment_status == "completed")
        month_revenue = sum(float(s.net_amount or 0) for s in month_sales if s.payment_status == "completed")
        
        cash_in_hand = sum(float(s.net_amount or 0) for s in today_sales if s.payment_method == "cash")
        
        return {
            "cash_in_hand": cash_in_hand,
            "bank_balance": 0,  # Would come from bank accounts
            "total_receivables": receivables,
            "total_payables": payables,
            "today_revenue": today_revenue,
            "today_expenses": 0,  # Would calculate from expenses
            "week_revenue": week_revenue,
            "month_revenue": month_revenue,
            "profit_margin": 40.0  # Estimated, would calculate from actual data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# HELPER FUNCTIONS
# ============================================

def calculate_profit_margin(revenue: float, cost: float) -> float:
    """Calculate profit margin percentage"""
    if revenue == 0:
        return 0
    return ((revenue - cost) / revenue) * 100



