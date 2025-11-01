import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import uuid
from passlib.context import CryptContext

# Add the parent directory to the path so we can import from main
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.main import (
    Base, Profile, UserRole, Category, Subcategory, Country, Supplier, 
    Customer, Company, Product, StockTransaction, Sale, SaleItem
)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    try:
        return pwd_context.hash(password)
    except Exception:
        # Fallback to simple hash if bcrypt fails
        import hashlib
        return hashlib.sha256(password.encode()).hexdigest()

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:pharmazine123@localhost:5432/pharmazine")

def create_session():
    if "sqlite" in DATABASE_URL:
        engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
    else:
        engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return SessionLocal()

def seed_database():
    db = create_session()
    
    try:
        # Create tables first
        print("Creating database tables...")
        Base.metadata.create_all(bind=db.bind)
        
        # Check if users already exist
        existing_users = db.query(Profile).count()
        if existing_users > 0:
            print(f"Database already contains {existing_users} users. Skipping seed.")
            return
        
        print("Creating user accounts...")
        
        # Create Admin user
        admin_id = str(uuid.uuid4())
        admin = Profile(
            id=admin_id,
            full_name="Admin User",
            email="admin@sharkarpharmacy.com",
            password_hash=hash_password("admin123"),
            phone="+1234567890"
        )
        db.add(admin)
        
        admin_role = UserRole(
            id=str(uuid.uuid4()),
            user_id=admin_id,
            role="admin"
        )
        db.add(admin_role)
        print("[OK] Created Admin: admin@sharkarpharmacy.com / admin123")
        
        # Create Manager user
        manager_id = str(uuid.uuid4())
        manager = Profile(
            id=manager_id,
            full_name="Manager User",
            email="manager@sharkarpharmacy.com",
            password_hash=hash_password("manager123"),
            phone="+1234567891"
        )
        db.add(manager)
        
        manager_role = UserRole(
            id=str(uuid.uuid4()),
            user_id=manager_id,
            role="manager"
        )
        db.add(manager_role)
        print("[OK] Created Manager: manager@sharkarpharmacy.com / manager123")
        
        # Create Employee user
        employee_id = str(uuid.uuid4())
        employee = Profile(
            id=employee_id,
            full_name="Pharmacist User",
            email="employee@sharkarpharmacy.com",
            password_hash=hash_password("employee123"),
            phone="+1234567892"
        )
        db.add(employee)
        
        employee_role = UserRole(
            id=str(uuid.uuid4()),
            user_id=employee_id,
            role="employee"
        )
        db.add(employee_role)
        print("[OK] Created Pharmacist: employee@sharkarpharmacy.com / employee123")
        
        db.commit()
        print("\n[SUCCESS] Database seeded successfully with 3 user accounts!")
        print("\n=== Login Credentials ===")
        print("Admin:      admin@sharkarpharmacy.com    / admin123")
        print("Manager:    manager@sharkarpharmacy.com  / manager123")
        print("Pharmacist: employee@sharkarpharmacy.com / employee123")
        print("========================\n")
        
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
