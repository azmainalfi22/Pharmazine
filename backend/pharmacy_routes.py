"""
Pharmazine - Medicine Management System
Phase 1: API Routes for Medicine Management

This module contains all pharmacy-specific API endpoints
"""

from fastapi import APIRouter, HTTPException, Depends, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, case, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from typing import List, Optional
from datetime import datetime, date, timedelta
import uuid
import barcode
from barcode.writer import ImageWriter
from io import BytesIO
import qrcode
import base64
import os
from dotenv import load_dotenv

load_dotenv()

from pharmacy_models import (
    MedicineCategory, UnitType, MedicineType, Manufacturer, MedicineBatch,
    BatchStockTransaction, DiscountConfig, WasteProduct, ExpiredMedicine,
    BarcodePrintLog,
    MedicineCategoryCreate, MedicineCategoryUpdate, MedicineCategoryResponse,
    UnitTypeCreate, UnitTypeUpdate, UnitTypeResponse,
    MedicineTypeCreate, MedicineTypeUpdate, MedicineTypeResponse,
    ManufacturerCreate, ManufacturerUpdate, ManufacturerResponse,
    MedicineBatchCreate, MedicineBatchUpdate, MedicineBatchResponse,
    BatchStockTransactionCreate, BatchStockTransactionResponse,
    DiscountConfigCreate, DiscountConfigUpdate, DiscountConfigResponse,
    WasteProductCreate, WasteProductResponse,
    ExpiredMedicineResponse,
    BarcodePrintRequest, BarcodePrintResponse,
    ExpiryAlertResponse, LowStockAlertResponse,
    MedicineStatistics, ManufacturerStatistics,
    PharmacyProductUpdate
)

# Database setup for pharmacy routes (avoiding circular import)
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:pharmazine123@localhost:5432/pharmazine")
if "sqlite" in DATABASE_URL:
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Placeholder for current user - will be overridden by dependency injection
def get_current_user():
    return {"id": "system", "email": "system@pharmazine.com"}

router = APIRouter(prefix="/api/pharmacy", tags=["Pharmacy Management"])

# ============================================
# MEDICINE CATEGORIES ENDPOINTS
# ============================================

@router.get("/medicine-categories", response_model=List[MedicineCategoryResponse])
def get_medicine_categories(
    skip: int = 0,
    limit: int = 100,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """Get all medicine categories (tablet, syrup, injection, etc.)"""
    query = db.query(MedicineCategory)
    
    if is_active is not None:
        query = query.filter(MedicineCategory.is_active == is_active)
    
    categories = query.order_by(MedicineCategory.display_order).offset(skip).limit(limit).all()
    
    # Convert UUID to string for response
    result = []
    for cat in categories:
        cat_dict = {
            "id": str(cat.id),
            "name": cat.name,
            "description": cat.description,
            "display_order": cat.display_order,
            "is_active": cat.is_active if cat.is_active is not None else True,
            "created_at": cat.created_at,
            "updated_at": cat.updated_at
        }
        result.append(MedicineCategoryResponse(**cat_dict))
    
    return result


@router.post("/medicine-categories", response_model=MedicineCategoryResponse, status_code=status.HTTP_201_CREATED)
def create_medicine_category(
    category: MedicineCategoryCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a new medicine category"""
    # Check if category already exists
    existing = db.query(MedicineCategory).filter(MedicineCategory.name == category.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Medicine category already exists")
    
    db_category = MedicineCategory(
        id=uuid.uuid4(),
        **category.dict()
    )
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category


@router.put("/medicine-categories/{category_id}", response_model=MedicineCategoryResponse)
def update_medicine_category(
    category_id: str,
    category: MedicineCategoryUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update medicine category"""
    db_category = db.query(MedicineCategory).filter(MedicineCategory.id == category_id).first()
    if not db_category:
        raise HTTPException(status_code=404, detail="Medicine category not found")
    
    for key, value in category.dict(exclude_unset=True).items():
        setattr(db_category, key, value)
    
    db_category.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_category)
    return db_category


@router.delete("/medicine-categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_medicine_category(
    category_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Delete medicine category"""
    db_category = db.query(MedicineCategory).filter(MedicineCategory.id == category_id).first()
    if not db_category:
        raise HTTPException(status_code=404, detail="Medicine category not found")
    
    db.delete(db_category)
    db.commit()
    return None


# ============================================
# UNIT TYPES ENDPOINTS
# ============================================

@router.get("/unit-types", response_model=List[UnitTypeResponse])
def get_unit_types(
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """Get all unit types (mg, ml, piece, strip, etc.)"""
    query = db.query(UnitType)
    
    if category:
        query = query.filter(UnitType.category == category)
    
    if is_active is not None:
        query = query.filter(UnitType.is_active == is_active)
    
    units = query.order_by(UnitType.display_order).offset(skip).limit(limit).all()
    
    # Convert UUID to string for response
    result = []
    for unit in units:
        unit_dict = {
            "id": str(unit.id),
            "name": unit.name,
            "abbreviation": unit.abbreviation,
            "category": unit.category,
            "display_order": unit.display_order,
            "is_active": unit.is_active if unit.is_active is not None else True,
            "created_at": unit.created_at,
            "updated_at": unit.updated_at
        }
        result.append(UnitTypeResponse(**unit_dict))
    
    return result


@router.post("/unit-types", response_model=UnitTypeResponse, status_code=status.HTTP_201_CREATED)
def create_unit_type(
    unit: UnitTypeCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a new unit type"""
    existing = db.query(UnitType).filter(UnitType.name == unit.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Unit type already exists")
    
    db_unit = UnitType(
        id=uuid.uuid4(),
        **unit.dict()
    )
    db.add(db_unit)
    db.commit()
    db.refresh(db_unit)
    return db_unit


@router.put("/unit-types/{unit_id}", response_model=UnitTypeResponse)
def update_unit_type(
    unit_id: str,
    unit: UnitTypeUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update unit type"""
    db_unit = db.query(UnitType).filter(UnitType.id == unit_id).first()
    if not db_unit:
        raise HTTPException(status_code=404, detail="Unit type not found")
    
    for key, value in unit.dict(exclude_unset=True).items():
        setattr(db_unit, key, value)
    
    db_unit.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_unit)
    return db_unit


# ============================================
# MEDICINE TYPES ENDPOINTS
# ============================================

@router.get("/medicine-types", response_model=List[MedicineTypeResponse])
def get_medicine_types(
    skip: int = 0,
    limit: int = 100,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """Get all medicine types (painkiller, antibiotic, etc.)"""
    query = db.query(MedicineType)
    
    if is_active is not None:
        query = query.filter(MedicineType.is_active == is_active)
    
    types = query.order_by(MedicineType.display_order).offset(skip).limit(limit).all()
    
    # Convert UUID to string for response
    result = []
    for mt in types:
        mt_dict = {
            "id": str(mt.id),
            "name": mt.name,
            "description": mt.description,
            "display_order": mt.display_order,
            "is_active": mt.is_active if mt.is_active is not None else True,
            "created_at": mt.created_at,
            "updated_at": mt.updated_at
        }
        result.append(MedicineTypeResponse(**mt_dict))
    
    return result


@router.post("/medicine-types", response_model=MedicineTypeResponse, status_code=status.HTTP_201_CREATED)
def create_medicine_type(
    med_type: MedicineTypeCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a new medicine type"""
    existing = db.query(MedicineType).filter(MedicineType.name == med_type.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Medicine type already exists")
    
    db_type = MedicineType(
        id=uuid.uuid4(),
        **med_type.dict()
    )
    db.add(db_type)
    db.commit()
    db.refresh(db_type)
    return db_type


@router.put("/medicine-types/{type_id}", response_model=MedicineTypeResponse)
def update_medicine_type(
    type_id: str,
    med_type: MedicineTypeUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update medicine type"""
    db_type = db.query(MedicineType).filter(MedicineType.id == type_id).first()
    if not db_type:
        raise HTTPException(status_code=404, detail="Medicine type not found")
    
    for key, value in med_type.dict(exclude_unset=True).items():
        setattr(db_type, key, value)
    
    db_type.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_type)
    return db_type


# ============================================
# MANUFACTURERS ENDPOINTS
# ============================================

@router.get("/manufacturers", response_model=List[ManufacturerResponse])
def get_manufacturers(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """Get all manufacturers"""
    query = db.query(Manufacturer)
    
    if search:
        query = query.filter(
            or_(
                Manufacturer.name.ilike(f"%{search}%"),
                Manufacturer.code.ilike(f"%{search}%"),
                Manufacturer.phone.ilike(f"%{search}%")
            )
        )
    
    if is_active is not None:
        query = query.filter(Manufacturer.is_active == is_active)
    
    manufacturers = query.order_by(Manufacturer.name).offset(skip).limit(limit).all()
    
    # Convert UUID to string for response
    result = []
    for mfr in manufacturers:
        mfr_dict = {
            "id": str(mfr.id),
            "code": mfr.code,
            "name": mfr.name,
            "contact_person": mfr.contact_person,
            "email": mfr.email,
            "phone": mfr.phone,
            "address": mfr.address,
            "city": mfr.city,
            "state": mfr.state,
            "country": mfr.country,
            "postal_code": mfr.postal_code,
            "website": mfr.website,
            "tax_number": mfr.tax_number,
            "payment_terms": mfr.payment_terms,
            "credit_limit": float(mfr.credit_limit) if mfr.credit_limit else 0,
            "current_balance": float(mfr.current_balance) if mfr.current_balance else 0,
            "is_active": mfr.is_active if mfr.is_active is not None else True,
            "notes": mfr.notes,
            "created_at": mfr.created_at,
            "updated_at": mfr.updated_at
        }
        result.append(ManufacturerResponse(**mfr_dict))
    
    return result


@router.get("/manufacturers/{manufacturer_id}", response_model=ManufacturerResponse)
def get_manufacturer(manufacturer_id: str, db: Session = Depends(get_db)):
    """Get manufacturer by ID"""
    manufacturer = db.query(Manufacturer).filter(Manufacturer.id == manufacturer_id).first()
    if not manufacturer:
        raise HTTPException(status_code=404, detail="Manufacturer not found")
    return manufacturer


@router.post("/manufacturers", response_model=ManufacturerResponse, status_code=status.HTTP_201_CREATED)
def create_manufacturer(
    manufacturer: ManufacturerCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a new manufacturer"""
    # Generate code if not provided
    code = manufacturer.code
    if not code:
        # Generate code from name
        code = ''.join(c.upper() for c in manufacturer.name if c.isalnum())[:6]
        # Check uniqueness
        existing = db.query(Manufacturer).filter(Manufacturer.code == code).first()
        if existing:
            code = f"{code}{uuid.uuid4().hex[:4].upper()}"
    
    db_manufacturer = Manufacturer(
        id=uuid.uuid4(),
        code=code,
        current_balance=manufacturer.opening_balance,
        **manufacturer.dict(exclude={'code'})
    )
    db.add(db_manufacturer)
    db.commit()
    db.refresh(db_manufacturer)
    return db_manufacturer


@router.put("/manufacturers/{manufacturer_id}", response_model=ManufacturerResponse)
def update_manufacturer(
    manufacturer_id: str,
    manufacturer: ManufacturerUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update manufacturer"""
    db_manufacturer = db.query(Manufacturer).filter(Manufacturer.id == manufacturer_id).first()
    if not db_manufacturer:
        raise HTTPException(status_code=404, detail="Manufacturer not found")
    
    for key, value in manufacturer.dict(exclude_unset=True).items():
        setattr(db_manufacturer, key, value)
    
    db_manufacturer.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_manufacturer)
    return db_manufacturer


# ============================================
# MEDICINE BATCHES ENDPOINTS
# ============================================

@router.get("/batches", response_model=List[MedicineBatchResponse])
def get_medicine_batches(
    skip: int = 0,
    limit: int = 100,
    product_id: Optional[str] = None,
    batch_number: Optional[str] = None,
    is_active: Optional[bool] = None,
    is_expired: Optional[bool] = None,
    store_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get medicine batches with filters"""
    query = db.query(MedicineBatch)
    
    if product_id:
        query = query.filter(MedicineBatch.product_id == product_id)
    
    if batch_number:
        query = query.filter(MedicineBatch.batch_number.ilike(f"%{batch_number}%"))
    
    if is_active is not None:
        query = query.filter(MedicineBatch.is_active == is_active)
    
    if is_expired is not None:
        query = query.filter(MedicineBatch.is_expired == is_expired)
    
    if store_id:
        query = query.filter(MedicineBatch.store_id == store_id)
    
    batches = query.order_by(MedicineBatch.expiry_date).offset(skip).limit(limit).all()
    
    # Convert UUID to string for response
    result = []
    for batch in batches:
        batch_dict = {
            "id": str(batch.id),
            "product_id": batch.product_id,
            "batch_number": batch.batch_number,
            "manufacture_date": batch.manufacture_date,
            "expiry_date": batch.expiry_date,
            "manufacturer_id": str(batch.manufacturer_id) if batch.manufacturer_id else None,
            "purchase_id": str(batch.purchase_id) if batch.purchase_id else None,
            "quantity_received": float(batch.quantity_received) if batch.quantity_received else 0.0,
            "quantity_remaining": float(batch.quantity_remaining) if batch.quantity_remaining else 0.0,
            "quantity_sold": float(batch.quantity_sold) if batch.quantity_sold else 0.0,
            "quantity_returned": float(batch.quantity_returned) if batch.quantity_returned else 0.0,
            "quantity_damaged": float(batch.quantity_damaged) if batch.quantity_damaged else 0.0,
            "purchase_price": float(batch.purchase_price) if batch.purchase_price else 0.0,
            "mrp": float(batch.mrp) if batch.mrp else 0.0,
            "selling_price": float(batch.selling_price) if batch.selling_price else 0.0,
            "discount_percentage": float(batch.discount_percentage) if batch.discount_percentage else 0.0,
            "rack_number": batch.rack_number,
            "store_id": str(batch.store_id) if batch.store_id else None,
            "notes": batch.notes,
            "is_active": batch.is_active if batch.is_active is not None else True,
            "is_expired": batch.is_expired if batch.is_expired is not None else False,
            "created_at": batch.created_at,
            "updated_at": batch.updated_at
        }
        result.append(MedicineBatchResponse(**batch_dict))
    
    return result


@router.get("/batches/{batch_id}", response_model=MedicineBatchResponse)
def get_medicine_batch(batch_id: str, db: Session = Depends(get_db)):
    """Get batch by ID"""
    batch = db.query(MedicineBatch).filter(MedicineBatch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    return batch


@router.post("/batches", response_model=MedicineBatchResponse, status_code=status.HTTP_201_CREATED)
def create_medicine_batch(
    batch: MedicineBatchCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a new medicine batch"""
    # Check if batch already exists
    existing = db.query(MedicineBatch).filter(
        and_(
            MedicineBatch.product_id == batch.product_id,
            MedicineBatch.batch_number == batch.batch_number,
            MedicineBatch.store_id == batch.store_id
        )
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Batch already exists for this product and store")
    
    # Check if already expired
    is_expired = batch.expiry_date < date.today()
    
    db_batch = MedicineBatch(
        id=uuid.uuid4(),
        quantity_remaining=batch.quantity_received,
        is_expired=is_expired,
        is_active=not is_expired,
        **batch.dict()
    )
    db.add(db_batch)
    
    # Create batch stock transaction
    transaction = BatchStockTransaction(
        id=uuid.uuid4(),
        batch_id=db_batch.id,
        transaction_type='purchase',
        quantity=batch.quantity_received,
        reference_id=batch.purchase_id,
        reference_type='purchase',
        created_by=current_user.get('id'),
        notes=f"Initial stock for batch {batch.batch_number}"
    )
    db.add(transaction)
    
    db.commit()
    db.refresh(db_batch)
    return db_batch


@router.put("/batches/{batch_id}", response_model=MedicineBatchResponse)
def update_medicine_batch(
    batch_id: str,
    batch: MedicineBatchUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update medicine batch"""
    db_batch = db.query(MedicineBatch).filter(MedicineBatch.id == batch_id).first()
    if not db_batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    
    for key, value in batch.dict(exclude_unset=True).items():
        setattr(db_batch, key, value)
    
    db_batch.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_batch)
    return db_batch


# ============================================
# EXPIRY ALERTS ENDPOINTS
# ============================================

@router.get("/expiry-alerts", response_model=List[ExpiryAlertResponse])
def get_expiry_alerts(
    days: int = Query(90, description="Days to check for expiry"),
    alert_level: Optional[str] = Query(None, description="Filter by alert level: expired, critical, warning, info"),
    db: Session = Depends(get_db)
):
    """Get medicines expiring within specified days"""
    query = db.execute(f"""
        SELECT * FROM v_expiring_medicines 
        WHERE days_to_expiry <= {days}
        {f"AND alert_level = '{alert_level}'" if alert_level else ""}
        ORDER BY expiry_date ASC
    """)
    
    results = query.fetchall()
    return [dict(row) for row in results]


@router.get("/low-stock-alerts", response_model=List[LowStockAlertResponse])
def get_low_stock_alerts(db: Session = Depends(get_db)):
    """Get medicines with low stock"""
    from main import Product
    
    # Query products with stock calculation
    query = db.query(Product).filter(Product.reorder_level > 0).all()
    
    results = []
    for product in query:
        # Calculate current stock from batches
        batches = db.query(MedicineBatch).filter(
            MedicineBatch.product_id == product.id,
            MedicineBatch.is_active == True
        ).all()
        
        current_stock = sum(float(b.quantity_remaining or 0) for b in batches)
        reorder_level = float(product.reorder_level or 0)
        
        if current_stock <= reorder_level:
            stock_percentage = (current_stock / reorder_level * 100) if reorder_level > 0 else 0
            
            # Determine alert level
            if stock_percentage < 25:
                alert_level = "critical"
            elif stock_percentage < 50:
                alert_level = "warning"
            else:
                alert_level = "info"
            
            total_value = sum(float(b.quantity_remaining or 0) * float(b.purchase_price or 0) for b in batches)
            
            results.append({
                "product_id": product.id,
                "product_name": product.name,
                "generic_name": product.generic_name,
                "brand_name": product.brand_name,
                "current_stock": current_stock,
                "reorder_level": reorder_level,
                "stock_percentage": stock_percentage,
                "total_value": total_value,
                "alert_level": alert_level
            })
    
    return results


# ============================================
# BARCODE & QR CODE GENERATION
# ============================================

@router.post("/generate-barcode", response_model=BarcodePrintResponse)
def generate_barcode(
    request: BarcodePrintRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Generate barcode for medicine"""
    # Get product
    from main import Product
    product = db.query(Product).filter(Product.id == request.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Generate barcode
    barcode_data = product.barcode or product.sku
    
    # Generate barcode image (EAN13 format)
    try:
        EAN = barcode.get_barcode_class('ean13')
        ean = EAN(barcode_data.zfill(12), writer=ImageWriter())
        buffer = BytesIO()
        ean.write(buffer)
        barcode_image = base64.b64encode(buffer.getvalue()).decode()
    except Exception as e:
        barcode_image = None
    
    # Generate QR code
    try:
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(barcode_data)
        qr.make(fit=True)
        qr_img = qr.make_image(fill_color="black", back_color="white")
        qr_buffer = BytesIO()
        qr_img.save(qr_buffer, format='PNG')
        qr_code_image = base64.b64encode(qr_buffer.getvalue()).decode()
    except Exception as e:
        qr_code_image = None
    
    # Log barcode print
    log = BarcodePrintLog(
        id=uuid.uuid4(),
        product_id=request.product_id,
        batch_id=request.batch_id,
        quantity_printed=request.quantity,
        printer_name=request.printer_name,
        paper_size=request.paper_size,
        printed_by=current_user.get('id')
    )
    db.add(log)
    db.commit()
    
    return BarcodePrintResponse(
        success=True,
        message=f"Barcode generated for {product.name}",
        barcode_data=barcode_image,
        qr_code_data=qr_code_image
    )


# ============================================
# WASTE PRODUCTS ENDPOINTS
# ============================================

@router.post("/waste-products", response_model=WasteProductResponse, status_code=status.HTTP_201_CREATED)
def create_waste_product(
    waste: WasteProductCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Record waste product (damaged, expired, etc.)"""
    db_waste = WasteProduct(
        id=uuid.uuid4(),
        reported_by=current_user.get('id'),
        **waste.dict()
    )
    db.add(db_waste)
    
    # If batch_id provided, create batch transaction
    if waste.batch_id:
        transaction = BatchStockTransaction(
            id=uuid.uuid4(),
            batch_id=waste.batch_id,
            transaction_type='damage',
            quantity=waste.quantity,
            notes=waste.notes or f"Waste: {waste.reason}",
            created_by=current_user.get('id')
        )
        db.add(transaction)
    
    db.commit()
    db.refresh(db_waste)
    return db_waste


@router.get("/waste-products", response_model=List[WasteProductResponse])
def get_waste_products(
    skip: int = 0,
    limit: int = 100,
    reason: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get waste products log"""
    query = db.query(WasteProduct)
    
    if reason:
        query = query.filter(WasteProduct.reason == reason)
    
    waste = query.order_by(WasteProduct.created_at.desc()).offset(skip).limit(limit).all()
    return waste


# ============================================
# EXPIRED MEDICINES ENDPOINTS
# ============================================

@router.get("/expired-medicines", response_model=List[ExpiredMedicineResponse])
def get_expired_medicines(
    skip: int = 0,
    limit: int = 100,
    disposal_method: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get expired medicines log"""
    query = db.query(ExpiredMedicine)
    
    if disposal_method:
        query = query.filter(ExpiredMedicine.disposal_method == disposal_method)
    
    expired = query.order_by(ExpiredMedicine.created_at.desc()).offset(skip).limit(limit).all()
    return expired


@router.post("/check-expired-batches")
def check_expired_batches(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Manually trigger expired batch check"""
    db.execute("SELECT check_expired_batches()")
    db.commit()
    return {"message": "Expired batches checked and logged"}


# ============================================
# STATISTICS ENDPOINTS
# ============================================

@router.get("/statistics/medicines", response_model=MedicineStatistics)
def get_medicine_statistics(db: Session = Depends(get_db)):
    """Get medicine statistics for dashboard"""
    from main import Product
    
    total_medicines = db.query(func.count(Product.id)).scalar()
    total_batches = db.query(func.count(MedicineBatch.id)).filter(MedicineBatch.is_active == True).scalar()
    
    # Expiring soon (within 90 days)
    expiring_soon = db.query(func.count(MedicineBatch.id)).filter(
        and_(
            MedicineBatch.is_active == True,
            MedicineBatch.expiry_date <= date.today() + timedelta(days=90),
            MedicineBatch.expiry_date > date.today()
        )
    ).scalar()
    
    # Expired
    expired_count = db.query(func.count(MedicineBatch.id)).filter(
        and_(
            MedicineBatch.is_expired == True,
            MedicineBatch.quantity_remaining > 0
        )
    ).scalar()
    
    # Low stock count (from view)
    low_stock = db.execute("SELECT COUNT(*) FROM v_low_stock_medicines").scalar()
    
    # Total inventory value
    inventory_value = db.query(
        func.sum(MedicineBatch.quantity_remaining * MedicineBatch.purchase_price)
    ).filter(MedicineBatch.is_active == True).scalar() or 0
    
    # Expiring value at risk
    expiring_value = db.query(
        func.sum(MedicineBatch.quantity_remaining * MedicineBatch.purchase_price)
    ).filter(
        and_(
            MedicineBatch.is_active == True,
            MedicineBatch.expiry_date <= date.today() + timedelta(days=90)
        )
    ).scalar() or 0
    
    return MedicineStatistics(
        total_medicines=total_medicines,
        total_batches=total_batches,
        expiring_soon_count=expiring_soon,
        expired_count=expired_count,
        low_stock_count=low_stock,
        total_inventory_value=inventory_value,
        expiring_value_at_risk=expiring_value
    )


@router.get("/statistics/manufacturers", response_model=ManufacturerStatistics)
def get_manufacturer_statistics(db: Session = Depends(get_db)):
    """Get manufacturer statistics"""
    total = db.query(func.count(Manufacturer.id)).scalar()
    active = db.query(func.count(Manufacturer.id)).filter(Manufacturer.is_active == True).scalar()
    
    outstanding = db.query(func.sum(Manufacturer.current_balance)).scalar() or 0
    
    # This month purchases from Purchase table
    from main import Purchase
    from datetime import date
    first_day_of_month = date.today().replace(day=1)
    this_month_purchases = db.query(func.sum(Purchase.total_amount)).filter(
        Purchase.date >= first_day_of_month.isoformat()
    ).scalar() or 0
    
    return ManufacturerStatistics(
        total_manufacturers=total,
        active_manufacturers=active,
        total_outstanding=outstanding,
        total_purchases_this_month=this_month_purchases,
        top_manufacturers=[]
    )


# ============================================
# DISCOUNT CONFIGS ENDPOINTS
# ============================================

@router.get("/discount-configs", response_model=List[DiscountConfigResponse])
def get_discount_configs(
    skip: int = 0,
    limit: int = 100,
    is_active: Optional[bool] = None,
    discount_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get discount configurations"""
    query = db.query(DiscountConfig)
    
    if is_active is not None:
        query = query.filter(DiscountConfig.is_active == is_active)
    
    if discount_type:
        query = query.filter(DiscountConfig.discount_type == discount_type)
    
    configs = query.order_by(DiscountConfig.priority.desc()).offset(skip).limit(limit).all()
    
    # Convert to response format
    result = []
    for config in configs:
        # Determine applicable_to based on what's set
        applicable_to = "all"
        if config.product_id:
            applicable_to = "product"
        elif config.medicine_category_id:
            applicable_to = "category"
        
        config_dict = {
            "id": str(config.id),
            "name": config.name,
            "description": config.description,
            "discount_type": config.discount_type,
            "discount_percentage": float(config.discount_percentage or 0),
            "discount_amount": float(config.discount_amount or 0),
            "min_quantity": float(config.min_quantity or 0),
            "max_quantity": float(config.max_quantity or 0),
            "category_id": str(config.category_id) if config.category_id else None,
            "medicine_category_id": str(config.medicine_category_id) if config.medicine_category_id else None,
            "product_id": config.product_id,
            "customer_type": config.customer_type,
            "valid_from": config.valid_from,
            "valid_to": config.valid_to,
            "applicable_to": applicable_to,
            "is_active": config.is_active if config.is_active is not None else True,
            "priority": config.priority or 0,
            "created_at": config.created_at,
            "updated_at": config.updated_at
        }
        result.append(DiscountConfigResponse(**config_dict))
    
    return result


@router.post("/discount-configs", response_model=DiscountConfigResponse, status_code=status.HTTP_201_CREATED)
def create_discount_config(
    config: DiscountConfigCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create discount configuration"""
    db_config = DiscountConfig(
        id=uuid.uuid4(),
        **config.dict()
    )
    db.add(db_config)
    db.commit()
    db.refresh(db_config)
    return db_config


@router.put("/discount-configs/{config_id}", response_model=DiscountConfigResponse)
def update_discount_config(
    config_id: str,
    config: DiscountConfigUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update discount configuration"""
    db_config = db.query(DiscountConfig).filter(DiscountConfig.id == config_id).first()
    if not db_config:
        raise HTTPException(status_code=404, detail="Discount configuration not found")
    
    for key, value in config.dict(exclude_unset=True).items():
        setattr(db_config, key, value)
    
    db_config.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_config)
    return db_config


@router.delete("/discount-configs/{config_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_discount_config(
    config_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Delete discount configuration"""
    db_config = db.query(DiscountConfig).filter(DiscountConfig.id == config_id).first()
    if not db_config:
        raise HTTPException(status_code=404, detail="Discount configuration not found")
    
    db.delete(db_config)
    db.commit()
    return None


# ============================================
# BATCH TRANSACTIONS ENDPOINTS
# ============================================

@router.get("/batch-transactions", response_model=List[BatchStockTransactionResponse])
def get_batch_transactions(
    skip: int = 0,
    limit: int = 100,
    transaction_type: Optional[str] = None,
    batch_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all batch stock transactions"""
    query = db.query(BatchStockTransaction)
    
    if transaction_type:
        query = query.filter(BatchStockTransaction.transaction_type == transaction_type)
    
    if batch_id:
        query = query.filter(BatchStockTransaction.batch_id == batch_id)
    
    transactions = query.order_by(BatchStockTransaction.created_at.desc()).offset(skip).limit(limit).all()
    
    # Convert to response format
    result = []
    for txn in transactions:
        txn_dict = {
            "id": str(txn.id),
            "batch_id": str(txn.batch_id),
            "transaction_type": txn.transaction_type,
            "quantity": txn.quantity,
            "reference_type": txn.reference_type,
            "reference_id": str(txn.reference_id) if txn.reference_id else None,
            "notes": txn.notes,
            "created_at": txn.created_at,
            "created_by": txn.created_by
        }
        result.append(BatchStockTransactionResponse(**txn_dict))
    
    return result


@router.post("/batch-transactions", response_model=BatchStockTransactionResponse, status_code=status.HTTP_201_CREATED)
def create_batch_transaction(
    transaction: BatchStockTransactionCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a new batch stock transaction"""
    db_transaction = BatchStockTransaction(
        id=uuid.uuid4(),
        created_by=current_user.get("id"),
        **transaction.dict()
    )
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction


# ============================================
# HELPER FUNCTIONS
# ============================================

def get_db():
    """Database session dependency"""
    # This should be imported from main.py
    from main import SessionLocal
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user():
    """Get current authenticated user"""
    # This should be imported from main.py
    # For now, placeholder
    return {"id": "admin", "role": "admin"}

