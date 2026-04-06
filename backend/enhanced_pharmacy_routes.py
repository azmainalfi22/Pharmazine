"""
Enhanced Pharmacy API Routes
New endpoints for drug interactions, prescriptions, and refill reminders
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy import text, create_engine
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, date
import uuid
import os
from dotenv import load_dotenv

load_dotenv()

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

router = APIRouter(prefix="/api/pharmacy/enhanced", tags=["Pharmacy Enhanced"])

# Pydantic Models
class DrugInteractionCreate(BaseModel):
    medicine_a_id: str
    medicine_b_id: str
    interaction_type: str
    description: Optional[str] = None
    severity_level: int = 1
    recommended_action: Optional[str] = None

class PrescriptionCreate(BaseModel):
    prescription_number: str
    customer_id: str
    doctor_name: Optional[str] = None
    doctor_license: Optional[str] = None
    diagnosis: Optional[str] = None
    prescription_date: date
    valid_until: Optional[date] = None
    refills_allowed: int = 0
    notes: Optional[str] = None

class PrescriptionItemCreate(BaseModel):
    product_id: str
    product_name: str
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    duration_days: Optional[int] = None
    quantity_prescribed: int
    instructions: Optional[str] = None

class RefillReminderCreate(BaseModel):
    customer_id: str
    product_id: str
    product_name: str
    last_purchase_date: date
    next_refill_date: date

class InsuranceClaimCreate(BaseModel):
    claim_number: str
    sale_id: str
    customer_id: str
    insurance_provider: str
    policy_number: str
    claim_amount: float
    submitted_date: date

# Drug Interactions
@router.post("/drug-interactions")
async def create_drug_interaction(interaction: DrugInteractionCreate, db: Session = Depends(get_db)):
    """Create a drug interaction record"""
    
    interaction_id = str(uuid.uuid4())
    db.execute(text("""
        INSERT INTO drug_interactions (
            id, medicine_a_id, medicine_b_id, interaction_type,
            description, severity_level, recommended_action
        ) VALUES (
            :id, :med_a, :med_b, :type, :desc, :severity, :action
        )
    """), {
        'id': interaction_id,
        'med_a': interaction.medicine_a_id,
        'med_b': interaction.medicine_b_id,
        'type': interaction.interaction_type,
        'desc': interaction.description,
        'severity': interaction.severity_level,
        'action': interaction.recommended_action
    })
    db.commit()
    
    return {"id": interaction_id, "message": "Drug interaction created successfully"}

@router.get("/drug-interactions/check")
async def check_drug_interactions(medicine_ids: str, db: Session = Depends(get_db)):
    """Check for drug interactions in a list of medicines"""
    from sqlalchemy import text
    
    med_list = medicine_ids.split(',')
    
    interactions = []
    for i, med_a in enumerate(med_list):
        for med_b in med_list[i+1:]:
            result = db.execute(text("""
                SELECT interaction_type, description, severity_level, recommended_action
                FROM drug_interactions
                WHERE (medicine_a_id = :med_a AND medicine_b_id = :med_b)
                   OR (medicine_a_id = :med_b AND medicine_b_id = :med_a)
            """), {'med_a': med_a, 'med_b': med_b}).fetchone()
            
            if result:
                interactions.append({
                    'medicine_a': med_a,
                    'medicine_b': med_b,
                    'type': result[0],
                    'description': result[1],
                    'severity': result[2],
                    'action': result[3]
                })
    
    return {'interactions': interactions, 'has_interactions': len(interactions) > 0}

# Prescriptions
@router.post("/prescriptions")
async def create_prescription(prescription: PrescriptionCreate, db: Session = Depends(get_db)):
    """Create a new prescription record"""
    from sqlalchemy import text
    
    rx_id = str(uuid.uuid4())
    db.execute(text("""
        INSERT INTO prescription_records (
            id, prescription_number, customer_id, doctor_name, doctor_license,
            diagnosis, prescription_date, valid_until, refills_allowed, notes
        ) VALUES (
            :id, :number, :customer, :doctor, :license,
            :diagnosis, :rx_date, :valid_until, :refills, :notes
        )
    """), {
        'id': rx_id,
        'number': prescription.prescription_number,
        'customer': prescription.customer_id,
        'doctor': prescription.doctor_name,
        'license': prescription.doctor_license,
        'diagnosis': prescription.diagnosis,
        'rx_date': prescription.prescription_date,
        'valid_until': prescription.valid_until,
        'refills': prescription.refills_allowed,
        'notes': prescription.notes
    })
    db.commit()
    
    return {"id": rx_id, "message": "Prescription created successfully"}

@router.get("/prescriptions/{customer_id}")
async def get_customer_prescriptions(customer_id: str, db: Session = Depends(get_db)):
    """Get all prescriptions for a customer"""
    from sqlalchemy import text
    
    result = db.execute(text("""
        SELECT id, prescription_number, doctor_name, prescription_date,
               valid_until, refills_allowed, refills_used, is_active
        FROM prescription_records
        WHERE customer_id = :customer_id
        ORDER BY prescription_date DESC
    """), {'customer_id': customer_id}).fetchall()
    
    prescriptions = []
    for row in result:
        prescriptions.append({
            'id': row[0],
            'prescription_number': row[1],
            'doctor_name': row[2],
            'prescription_date': str(row[3]),
            'valid_until': str(row[4]) if row[4] else None,
            'refills_allowed': row[5],
            'refills_used': row[6],
            'is_active': row[7]
        })
    
    return prescriptions

# Refill Reminders
@router.post("/refill-reminders")
async def create_refill_reminder(reminder: RefillReminderCreate, db: Session = Depends(get_db)):
    """Create a refill reminder"""
    from sqlalchemy import text
    
    reminder_id = str(uuid.uuid4())
    db.execute(text("""
        INSERT INTO refill_reminders (
            id, customer_id, product_id, product_name,
            last_purchase_date, next_refill_date
        ) VALUES (
            :id, :customer, :product, :name, :last_date, :next_date
        )
    """), {
        'id': reminder_id,
        'customer': reminder.customer_id,
        'product': reminder.product_id,
        'name': reminder.product_name,
        'last_date': reminder.last_purchase_date,
        'next_date': reminder.next_refill_date
    })
    db.commit()
    
    return {"id": reminder_id, "message": "Refill reminder created successfully"}

@router.get("/refill-reminders/due")
async def get_due_refills(db: Session = Depends(get_db)):
    """Get refill reminders that are due"""
    from sqlalchemy import text
    
    result = db.execute(text("""
        SELECT r.id, r.customer_id, c.name as customer_name, c.phone,
               r.product_name, r.next_refill_date
        FROM refill_reminders r
        JOIN customers c ON r.customer_id = c.id
        WHERE r.next_refill_date <= CURRENT_DATE + INTERVAL '7 days'
          AND r.status = 'pending'
          AND r.reminder_sent = FALSE
        ORDER BY r.next_refill_date
    """)).fetchall()
    
    reminders = []
    for row in result:
        reminders.append({
            'id': row[0],
            'customer_id': row[1],
            'customer_name': row[2],
            'phone': row[3],
            'product_name': row[4],
            'refill_date': str(row[5])
        })
    
    return reminders

# Insurance Claims
@router.post("/insurance-claims")
async def create_insurance_claim(claim: InsuranceClaimCreate, db: Session = Depends(get_db)):
    """Create an insurance claim"""
    from sqlalchemy import text
    
    claim_id = str(uuid.uuid4())
    db.execute(text("""
        INSERT INTO insurance_claims (
            id, claim_number, sale_id, customer_id, insurance_provider,
            policy_number, claim_amount, submitted_date
        ) VALUES (
            :id, :number, :sale, :customer, :provider, :policy, :amount, :date
        )
    """), {
        'id': claim_id,
        'number': claim.claim_number,
        'sale': claim.sale_id,
        'customer': claim.customer_id,
        'provider': claim.insurance_provider,
        'policy': claim.policy_number,
        'amount': claim.claim_amount,
        'date': claim.submitted_date
    })
    db.commit()
    
    return {"id": claim_id, "message": "Insurance claim submitted successfully"}

@router.get("/insurance-claims/pending")
async def get_pending_claims(db: Session = Depends(get_db)):
    """Get pending insurance claims"""
    from sqlalchemy import text
    
    result = db.execute(text("""
        SELECT id, claim_number, customer_id, insurance_provider,
               claim_amount, submitted_date, claim_status
        FROM insurance_claims
        WHERE claim_status IN ('pending', 'approved')
        ORDER BY submitted_date DESC
    """)).fetchall()
    
    claims = []
    for row in result:
        claims.append({
            'id': row[0],
            'claim_number': row[1],
            'customer_id': row[2],
            'provider': row[3],
            'amount': float(row[4]),
            'submitted_date': str(row[5]),
            'status': row[6]
        })
    
    return claims

# Import get_db from main
# This will be imported when included in main.py
