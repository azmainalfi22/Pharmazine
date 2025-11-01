"""
Update user email addresses to @sharkarpharmacy.com
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from main import Profile

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:pharmazine123@localhost:5432/pharmazine")

if "sqlite" in DATABASE_URL:
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def update_emails():
    db = SessionLocal()
    
    try:
        # Update admin email
        admin = db.query(Profile).filter(Profile.email == "admin@pharmazine.com").first()
        if admin:
            admin.email = "admin@sharkarpharmacy.com"
            print("[OK] Updated admin email to: admin@sharkarpharmacy.com")
        
        # Update manager email
        manager = db.query(Profile).filter(Profile.email == "manager@pharmazine.com").first()
        if manager:
            manager.email = "manager@sharkarpharmacy.com"
            print("[OK] Updated manager email to: manager@sharkarpharmacy.com")
        
        # Update employee email
        employee = db.query(Profile).filter(Profile.email == "employee@pharmazine.com").first()
        if employee:
            employee.email = "employee@sharkarpharmacy.com"
            employee.full_name = "Pharmacist User"
            print("[OK] Updated pharmacist email to: employee@sharkarpharmacy.com")
        
        db.commit()
        print("\n[SUCCESS] Email addresses updated successfully!")
        print("\n=== New Login Credentials ===")
        print("Admin:      admin@sharkarpharmacy.com    / admin123")
        print("Manager:    manager@sharkarpharmacy.com  / manager123")
        print("Pharmacist: employee@sharkarpharmacy.com / employee123")
        print("=============================\n")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    update_emails()

