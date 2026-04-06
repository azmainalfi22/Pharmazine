"""
Service Management API Routes
"""

from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from typing import List, Optional
from datetime import datetime, date
import uuid

from service_models import (
    ServiceCategory, Service, ServiceBooking, ServiceInvoice,
    ServicePackage, ServiceReview,
    ServiceCategoryCreate, ServiceCategoryResponse,
    ServiceCreate, ServiceUpdate, ServiceResponse,
    ServiceBookingCreate, ServiceBookingUpdate, ServiceBookingResponse,
    ServiceInvoiceCreate, ServiceInvoiceResponse,
    ServicePackageCreate, ServicePackageResponse,
    ServiceReviewCreate, ServiceReviewResponse
)

router = APIRouter(prefix="/api/services", tags=["Services"])

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
# SERVICE CATEGORIES
# ============================================

@router.get("/categories", response_model=List[ServiceCategoryResponse])
def get_service_categories(
    skip: int = 0,
    limit: int = 100,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """Get all service categories"""
    query = db.query(ServiceCategory)
    if is_active is not None:
        query = query.filter(ServiceCategory.is_active == is_active)
    categories = query.order_by(ServiceCategory.display_order).offset(skip).limit(limit).all()
    return categories


@router.post("/categories", response_model=ServiceCategoryResponse, status_code=status.HTTP_201_CREATED)
def create_service_category(
    category: ServiceCategoryCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a new service category"""
    existing = db.query(ServiceCategory).filter(ServiceCategory.name == category.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Service category already exists")
    
    db_category = ServiceCategory(
        id=uuid.uuid4(),
        **category.model_dump()
    )
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category


# ============================================
# SERVICES
# ============================================

@router.get("", response_model=List[ServiceResponse])
def get_services(
    skip: int = 0,
    limit: int = 100,
    category_id: Optional[str] = None,
    is_active: Optional[bool] = None,
    is_home_service: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """Get all services"""
    query = db.query(Service)
    
    if category_id:
        query = query.filter(Service.category_id == category_id)
    if is_active is not None:
        query = query.filter(Service.is_active == is_active)
    if is_home_service is not None:
        query = query.filter(Service.is_home_service == is_home_service)
    
    services = query.order_by(Service.name).offset(skip).limit(limit).all()
    return services


@router.get("/{service_id}", response_model=ServiceResponse)
def get_service(service_id: str, db: Session = Depends(get_db)):
    """Get service by ID"""
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    return service


@router.post("", response_model=ServiceResponse, status_code=status.HTTP_201_CREATED)
def create_service(
    service: ServiceCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a new service"""
    existing = db.query(Service).filter(Service.service_code == service.service_code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Service code already exists")
    
    db_service = Service(
        id=uuid.uuid4(),
        created_by=current_user.get('id'),
        **service.model_dump()
    )
    db.add(db_service)
    db.commit()
    db.refresh(db_service)
    return db_service


@router.put("/{service_id}", response_model=ServiceResponse)
def update_service(
    service_id: str,
    service: ServiceUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update service"""
    db_service = db.query(Service).filter(Service.id == service_id).first()
    if not db_service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    for key, value in service.model_dump(exclude_unset=True).items():
        setattr(db_service, key, value)
    
    db_service.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_service)
    return db_service


@router.delete("/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_service(
    service_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Delete service"""
    db_service = db.query(Service).filter(Service.id == service_id).first()
    if not db_service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    db.delete(db_service)
    db.commit()
    return None


# ============================================
# SERVICE BOOKINGS
# ============================================

@router.get("/bookings/all", response_model=List[ServiceBookingResponse])
def get_service_bookings(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    booking_date: Optional[date] = None,
    customer_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all service bookings"""
    query = db.query(ServiceBooking)
    
    if status:
        query = query.filter(ServiceBooking.status == status)
    if booking_date:
        query = query.filter(ServiceBooking.booking_date == booking_date)
    if customer_id:
        query = query.filter(ServiceBooking.customer_id == customer_id)
    
    bookings = query.order_by(ServiceBooking.booking_date.desc(), ServiceBooking.booking_time.desc()).offset(skip).limit(limit).all()
    return bookings


@router.get("/bookings/{booking_id}", response_model=ServiceBookingResponse)
def get_service_booking(booking_id: str, db: Session = Depends(get_db)):
    """Get booking by ID"""
    booking = db.query(ServiceBooking).filter(ServiceBooking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking


@router.post("/bookings", response_model=ServiceBookingResponse, status_code=status.HTTP_201_CREATED)
def create_service_booking(
    booking: ServiceBookingCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a new service booking"""
    # Generate booking number
    count = db.query(func.count(ServiceBooking.id)).scalar()
    booking_number = f"SB{datetime.now().strftime('%Y%m%d')}{str(count + 1).zfill(4)}"
    
    db_booking = ServiceBooking(
        id=uuid.uuid4(),
        booking_number=booking_number,
        status='pending',
        created_by=current_user.get('id'),
        **booking.model_dump()
    )
    db.add(db_booking)
    db.commit()
    db.refresh(db_booking)
    return db_booking


@router.put("/bookings/{booking_id}", response_model=ServiceBookingResponse)
def update_service_booking(
    booking_id: str,
    booking: ServiceBookingUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update service booking"""
    db_booking = db.query(ServiceBooking).filter(ServiceBooking.id == booking_id).first()
    if not db_booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    for key, value in booking.model_dump(exclude_unset=True).items():
        setattr(db_booking, key, value)
    
    db_booking.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_booking)
    return db_booking


@router.post("/bookings/{booking_id}/confirm", response_model=ServiceBookingResponse)
def confirm_booking(
    booking_id: str,
    assigned_to: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Confirm a service booking"""
    db_booking = db.query(ServiceBooking).filter(ServiceBooking.id == booking_id).first()
    if not db_booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    db_booking.status = 'confirmed'
    db_booking.confirmed_by = current_user.get('id')
    db_booking.confirmed_at = datetime.utcnow()
    if assigned_to:
        db_booking.assigned_to = assigned_to
    
    db.commit()
    db.refresh(db_booking)
    return db_booking


@router.post("/bookings/{booking_id}/cancel", response_model=ServiceBookingResponse)
def cancel_booking(
    booking_id: str,
    reason: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Cancel a service booking"""
    db_booking = db.query(ServiceBooking).filter(ServiceBooking.id == booking_id).first()
    if not db_booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    db_booking.status = 'cancelled'
    db_booking.cancelled_by = current_user.get('id')
    db_booking.cancelled_at = datetime.utcnow()
    db_booking.cancellation_reason = reason
    
    db.commit()
    db.refresh(db_booking)
    return db_booking


@router.post("/bookings/{booking_id}/complete", response_model=ServiceBookingResponse)
def complete_booking(
    booking_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Mark booking as completed"""
    db_booking = db.query(ServiceBooking).filter(ServiceBooking.id == booking_id).first()
    if not db_booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    db_booking.status = 'completed'
    db_booking.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(db_booking)
    return db_booking


@router.delete("/bookings/{booking_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_booking(
    booking_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Delete service booking"""
    db_booking = db.query(ServiceBooking).filter(ServiceBooking.id == booking_id).first()
    if not db_booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    db.delete(db_booking)
    db.commit()
    return None


# ============================================
# SERVICE INVOICES
# ============================================

@router.get("/invoices", response_model=List[ServiceInvoiceResponse])
def get_service_invoices(
    skip: int = 0,
    limit: int = 100,
    payment_status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all service invoices"""
    query = db.query(ServiceInvoice)
    
    if payment_status:
        query = query.filter(ServiceInvoice.payment_status == payment_status)
    
    invoices = query.order_by(ServiceInvoice.created_at.desc()).offset(skip).limit(limit).all()
    return invoices


@router.get("/invoices/{invoice_id}", response_model=ServiceInvoiceResponse)
def get_service_invoice(invoice_id: str, db: Session = Depends(get_db)):
    """Get service invoice by ID"""
    invoice = db.query(ServiceInvoice).filter(ServiceInvoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice


@router.post("/invoices", response_model=ServiceInvoiceResponse, status_code=status.HTTP_201_CREATED)
def create_service_invoice(
    invoice: ServiceInvoiceCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a new service invoice"""
    # Generate invoice number
    count = db.query(func.count(ServiceInvoice.id)).scalar()
    invoice_number = f"SI{datetime.now().strftime('%Y%m%d')}{str(count + 1).zfill(4)}"
    
    db_invoice = ServiceInvoice(
        id=uuid.uuid4(),
        invoice_number=invoice_number,
        balance_amount=invoice.grand_total,
        created_by=current_user.get('id'),
        **invoice.model_dump()
    )
    db.add(db_invoice)
    db.commit()
    db.refresh(db_invoice)
    return db_invoice


# ============================================
# SERVICE PACKAGES
# ============================================

@router.get("/packages", response_model=List[ServicePackageResponse])
def get_service_packages(
    skip: int = 0,
    limit: int = 100,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """Get all service packages"""
    query = db.query(ServicePackage)
    
    if is_active is not None:
        query = query.filter(ServicePackage.is_active == is_active)
    
    packages = query.offset(skip).limit(limit).all()
    return packages


@router.post("/packages", response_model=ServicePackageResponse, status_code=status.HTTP_201_CREATED)
def create_service_package(
    package: ServicePackageCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a new service package"""
    existing = db.query(ServicePackage).filter(ServicePackage.package_code == package.package_code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Package code already exists")
    
    db_package = ServicePackage(
        id=uuid.uuid4(),
        **package.model_dump()
    )
    db.add(db_package)
    db.commit()
    db.refresh(db_package)
    return db_package


# ============================================
# SERVICE REVIEWS
# ============================================

@router.get("/reviews", response_model=List[ServiceReviewResponse])
def get_service_reviews(
    service_id: Optional[str] = None,
    is_published: Optional[bool] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all service reviews"""
    query = db.query(ServiceReview)
    
    if service_id:
        query = query.filter(ServiceReview.service_id == service_id)
    if is_published is not None:
        query = query.filter(ServiceReview.is_published == is_published)
    
    reviews = query.order_by(ServiceReview.created_at.desc()).offset(skip).limit(limit).all()
    return reviews


@router.post("/reviews", response_model=ServiceReviewResponse, status_code=status.HTTP_201_CREATED)
def create_service_review(
    review: ServiceReviewCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a new service review"""
    db_review = ServiceReview(
        id=uuid.uuid4(),
        **review.model_dump()
    )
    db.add(db_review)
    db.commit()
    db.refresh(db_review)
    return db_review


@router.get("/reviews/average/{service_id}")
def get_service_average_rating(
    service_id: str,
    db: Session = Depends(get_db)
):
    """Get average rating for a service"""
    reviews = db.query(ServiceReview).filter(
        and_(
            ServiceReview.service_id == service_id,
            ServiceReview.is_published == True
        )
    ).all()
    
    if not reviews:
        return {"average_rating": 0, "total_reviews": 0}
    
    avg_rating = sum(r.rating for r in reviews) / len(reviews)
    avg_quality = sum(r.service_quality or 0 for r in reviews) / len([r for r in reviews if r.service_quality])
    avg_behavior = sum(r.staff_behavior or 0 for r in reviews) / len([r for r in reviews if r.staff_behavior])
    avg_value = sum(r.value_for_money or 0 for r in reviews) / len([r for r in reviews if r.value_for_money])
    
    return {
        "service_id": service_id,
        "average_rating": round(avg_rating, 2),
        "total_reviews": len(reviews),
        "average_quality": round(avg_quality, 2) if avg_quality else 0,
        "average_behavior": round(avg_behavior, 2) if avg_behavior else 0,
        "average_value": round(avg_value, 2) if avg_value else 0
    }

