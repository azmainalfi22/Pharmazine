"""
Reset passwords for all users to ensure they work with the login system
"""

import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add the parent directory to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.main import Profile, get_password_hash

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:pharmazine123@localhost:5432/pharmazine")

if "sqlite" in DATABASE_URL:
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def reset_passwords():
    db = SessionLocal()
    
    try:
        print("Resetting passwords for all users...\n")
        
        # Reset admin password
        admin = db.query(Profile).filter(Profile.email == "admin@sharkarpharmacy.com").first()
        if admin:
            admin.password_hash = get_password_hash("admin123")
            print("[OK] Reset admin password")
        else:
            print("[WARNING] Admin user not found!")
        
        # Reset manager password
        manager = db.query(Profile).filter(Profile.email == "manager@sharkarpharmacy.com").first()
        if manager:
            manager.password_hash = get_password_hash("manager123")
            print("[OK] Reset manager password")
        else:
            print("[WARNING] Manager user not found!")
        
        # Reset pharmacist password
        pharmacist = db.query(Profile).filter(Profile.email == "employee@sharkarpharmacy.com").first()
        if pharmacist:
            pharmacist.password_hash = get_password_hash("employee123")
            pharmacist.full_name = "Pharmacist User"
            print("[OK] Reset pharmacist password")
        else:
            print("[WARNING] Pharmacist user not found!")
        
        # Also check for old email format users
        old_admin = db.query(Profile).filter(Profile.email == "admin@pharmazine.com").first()
        if old_admin:
            old_admin.email = "admin@sharkarpharmacy.com"
            old_admin.password_hash = get_password_hash("admin123")
            print("[OK] Updated old admin email and password")
        
        old_manager = db.query(Profile).filter(Profile.email == "manager@pharmazine.com").first()
        if old_manager:
            old_manager.email = "manager@sharkarpharmacy.com"
            old_manager.password_hash = get_password_hash("manager123")
            print("[OK] Updated old manager email and password")
        
        old_employee = db.query(Profile).filter(Profile.email == "employee@pharmazine.com").first()
        if old_employee:
            old_employee.email = "employee@sharkarpharmacy.com"
            old_employee.password_hash = get_password_hash("employee123")
            old_employee.full_name = "Pharmacist User"
            print("[OK] Updated old pharmacist email and password")
        
        db.commit()
        print("\n[SUCCESS] All passwords reset successfully!")
        print("\n=== Login Credentials ===")
        print("Admin:      admin@sharkarpharmacy.com    / admin123")
        print("Manager:    manager@sharkarpharmacy.com  / manager123")
        print("Pharmacist: employee@sharkarpharmacy.com / employee123")
        print("=============================\n")
        
        # Verify users exist
        print("=== Verifying Users ===")
        all_users = db.query(Profile).all()
        for user in all_users:
            print(f"User: {user.full_name} | Email: {user.email}")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    reset_passwords()

