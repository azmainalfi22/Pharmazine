"""
Patient Medication History Tracking
Track customer purchases for better service and compliance
"""

from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Float, Integer
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from main import Base

class PatientMedicationHistory(Base):
    """Track customer medication purchases"""
    __tablename__ = "patient_medication_history"
    
    id = Column(String, primary_key=True)
    customer_id = Column(String, ForeignKey("customers.id"))
    product_id = Column(String, ForeignKey("products.id"))
    sale_id = Column(String, ForeignKey("sales.id"))
    
    product_name = Column(String, nullable=False)
    generic_name = Column(String)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float)
    
    prescription_number = Column(String)
    doctor_name = Column(String)
    
    dispensed_at = Column(DateTime, default=datetime.utcnow)
    next_refill_date = Column(DateTime)  # For chronic medications
    
    notes = Column(Text)
    

class PatientHistoryService:
    """Service for patient medication history"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def log_medication_sale(
        self,
        customer_id: str,
        product_id: str,
        sale_id: str,
        product_name: str,
        generic_name: str,
        quantity: int,
        unit_price: float,
        prescription_number: str = None,
        doctor_name: str = None,
        refill_days: int = None
    ):
        """Log a medication purchase"""
        import uuid
        
        next_refill = None
        if refill_days:
            next_refill = datetime.utcnow() + timedelta(days=refill_days)
        
        history = PatientMedicationHistory(
            id=str(uuid.uuid4()),
            customer_id=customer_id,
            product_id=product_id,
            sale_id=sale_id,
            product_name=product_name,
            generic_name=generic_name,
            quantity=quantity,
            unit_price=unit_price,
            prescription_number=prescription_number,
            doctor_name=doctor_name,
            dispensed_at=datetime.utcnow(),
            next_refill_date=next_refill
        )
        
        self.db.add(history)
        self.db.commit()
        return history
    
    def get_patient_history(
        self,
        customer_id: str,
        days: int = 365
    ) -> List[Dict]:
        """Get medication history for a patient"""
        start_date = datetime.utcnow() - timedelta(days=days)
        
        history = self.db.query(PatientMedicationHistory).filter(
            PatientMedicationHistory.customer_id == customer_id,
            PatientMedicationHistory.dispensed_at >= start_date
        ).order_by(PatientMedicationHistory.dispensed_at.desc()).all()
        
        return [
            {
                'id': h.id,
                'product_name': h.product_name,
                'generic_name': h.generic_name,
                'quantity': h.quantity,
                'unit_price': h.unit_price,
                'total_price': h.quantity * h.unit_price,
                'prescription_number': h.prescription_number,
                'doctor_name': h.doctor_name,
                'dispensed_at': h.dispensed_at.isoformat(),
                'next_refill_date': h.next_refill_date.isoformat() if h.next_refill_date else None
            }
            for h in history
        ]
    
    def get_refill_reminders(
        self,
        days_ahead: int = 7
    ) -> List[Dict]:
        """Get patients due for refill reminders"""
        from main import Customer
        
        reminder_date = datetime.utcnow() + timedelta(days=days_ahead)
        
        due_refills = self.db.query(
            PatientMedicationHistory, Customer
        ).join(
            Customer, PatientMedicationHistory.customer_id == Customer.id
        ).filter(
            PatientMedicationHistory.next_refill_date.isnot(None),
            PatientMedicationHistory.next_refill_date <= reminder_date,
            PatientMedicationHistory.next_refill_date >= datetime.utcnow()
        ).all()
        
        reminders = []
        for history, customer in due_refills:
            days_until = (history.next_refill_date - datetime.utcnow()).days
            
            reminders.append({
                'customer_id': customer.id,
                'customer_name': customer.name,
                'customer_phone': customer.phone,
                'customer_email': customer.email,
                'product_name': history.product_name,
                'generic_name': history.generic_name,
                'last_dispensed': history.dispensed_at.isoformat(),
                'next_refill_date': history.next_refill_date.isoformat(),
                'days_until_refill': days_until,
                'prescription_number': history.prescription_number,
                'doctor_name': history.doctor_name
            })
        
        return reminders
    
    def check_drug_interactions(
        self,
        customer_id: str,
        new_product_id: str
    ) -> Dict:
        """
        Check for potential drug interactions
        (Simplified - in production, integrate with drug interaction database)
        """
        # Get recent medications (last 90 days)
        recent_meds = self.get_patient_history(customer_id, days=90)
        
        # In production, you would:
        # 1. Get drug info for all recent medications
        # 2. Check against interaction database
        # 3. Return warnings
        
        return {
            'has_interactions': False,
            'warnings': [],
            'recent_medications': recent_meds[:5]  # Last 5 meds
        }
    
    def get_patient_statistics(self, customer_id: str) -> Dict:
        """Get statistics for a patient"""
        history = self.db.query(PatientMedicationHistory).filter(
            PatientMedicationHistory.customer_id == customer_id
        ).all()
        
        if not history:
            return {
                'total_purchases': 0,
                'total_spent': 0,
                'unique_medications': 0,
                'first_purchase': None,
                'last_purchase': None
            }
        
        from sqlalchemy import func
        
        total_spent = sum(h.quantity * h.unit_price for h in history)
        unique_meds = len(set(h.product_id for h in history))
        
        return {
            'total_purchases': len(history),
            'total_spent': total_spent,
            'unique_medications': unique_meds,
            'first_purchase': min(h.dispensed_at for h in history).isoformat(),
            'last_purchase': max(h.dispensed_at for h in history).isoformat(),
            'most_purchased': self._get_most_purchased(history)
        }
    
    def _get_most_purchased(self, history: List) -> Optional[str]:
        """Get most frequently purchased medication"""
        if not history:
            return None
        
        from collections import Counter
        product_counts = Counter(h.product_name for h in history)
        most_common = product_counts.most_common(1)
        
        return most_common[0][0] if most_common else None


def send_refill_reminders(db_session: Session):
    """Send refill reminders to patients (scheduled task)"""
    service = PatientHistoryService(db_session)
    reminders = service.get_refill_reminders(days_ahead=7)
    
    if not reminders:
        print("[OK] No refill reminders to send")
        return
    
    from notifications import SMSNotification
    
    for reminder in reminders:
        if reminder['customer_phone']:
            message = f"Hi {reminder['customer_name']}, your {reminder['product_name']} prescription may need a refill. Contact us to reorder. - Pharmazine"
            SMSNotification.send_sms(reminder['customer_phone'], message)
    
    print(f"[OK] Sent {len(reminders)} refill reminders")

