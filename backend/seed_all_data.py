"""
Seed data for Service and HRM modules
"""

import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime, date, time
import uuid

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:pharmazine123@localhost:5432/pharmazine")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def seed_service_data():
    """Seed service categories and sample services"""
    from service_models import ServiceCategory, Service
    
    db = SessionLocal()
    try:
        # Check if data already exists
        existing_categories = db.query(ServiceCategory).count()
        if existing_categories > 0:
            print("[INFO] Service categories already exist, skipping...")
            return
        
        # Sample services
        services_data = [
            {
                "service_code": "HC001",
                "name": "Blood Pressure Check",
                "description": "Complete blood pressure monitoring",
                "base_price": 200.00,
                "duration_minutes": 15,
                "is_home_service": True,
                "travel_charges": 100.00
            },
            {
                "service_code": "HC002",
                "name": "Blood Sugar Test",
                "description": "Fasting blood sugar test",
                "base_price": 300.00,
                "duration_minutes": 10,
                "is_home_service": True,
                "travel_charges": 100.00
            },
            {
                "service_code": "VAC001",
                "name": "COVID-19 Vaccination",
                "description": "COVID-19 vaccine administration",
                "base_price": 500.00,
                "duration_minutes": 20,
                "is_home_service": False,
                "travel_charges": 0
            },
            {
                "service_code": "DEL001",
                "name": "Medicine Home Delivery",
                "description": "Same-day medicine delivery",
                "base_price": 50.00,
                "duration_minutes": 30,
                "is_home_service": True,
                "travel_charges": 50.00
            }
        ]
        
        for service_data in services_data:
            service = Service(
                id=uuid.uuid4(),
                **service_data,
                is_active=True
            )
            db.add(service)
        
        db.commit()
        print(f"[OK] Created {len(services_data)} sample services")
        
    except Exception as e:
        print(f"[ERROR] Failed to seed service data: {e}")
        db.rollback()
    finally:
        db.close()


def seed_employee_data():
    """Seed sample employees"""
    from hrm_models import Employee
    
    db = SessionLocal()
    try:
        # Check if data already exists
        existing_employees = db.query(Employee).count()
        if existing_employees > 0:
            print("[INFO] Employees already exist, skipping...")
            return
        
        employees_data = [
            {
                "employee_code": "EMP001",
                "full_name": "Dr. Ahmed Rahman",
                "email": "ahmed@sharkarpharmacy.com",
                "phone": "01711111111",
                "designation": "Pharmacist",
                "department": "Pharmacy",
                "employment_type": "full_time",
                "joining_date": date(2023, 1, 15),
                "basic_salary": 50000.00
            },
            {
                "employee_code": "EMP002",
                "full_name": "Fatima Khan",
                "email": "fatima@sharkarpharmacy.com",
                "phone": "01722222222",
                "designation": "Sales Associate",
                "department": "Sales",
                "employment_type": "full_time",
                "joining_date": date(2023, 3, 1),
                "basic_salary": 30000.00
            },
            {
                "employee_code": "EMP003",
                "full_name": "Mohammad Ali",
                "email": "ali@sharkarpharmacy.com",
                "phone": "01733333333",
                "designation": "Store Manager",
                "department": "Operations",
                "employment_type": "full_time",
                "joining_date": date(2022, 6, 1),
                "basic_salary": 45000.00
            }
        ]
        
        for emp_data in employees_data:
            employee = Employee(
                id=uuid.uuid4(),
                **emp_data,
                is_active=True
            )
            db.add(employee)
        
        db.commit()
        print(f"[OK] Created {len(employees_data)} sample employees")
        
    except Exception as e:
        print(f"[ERROR] Failed to seed employee data: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    print("Seeding Service and HRM data...")
    seed_service_data()
    seed_employee_data()
    print("\n[SUCCESS] All sample data created!")

