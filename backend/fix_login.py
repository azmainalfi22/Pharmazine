"""
Complete fix for login issues - resets emails and passwords properly
"""

import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add the parent directory to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.main import Profile, get_password_hash, verify_password

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:pharmazine123@localhost:5432/pharmazine")

if "sqlite" in DATABASE_URL:
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def fix_all_users():
    db = SessionLocal()
    
    try:
        print("=" * 60)
        print("FIXING LOGIN CREDENTIALS")
        print("=" * 60)
        
        # Define users to fix
        users_to_fix = [
            {
                "email": "admin@sharkarpharmacy.com",
                "password": "admin123",
                "name": "Admin User"
            },
            {
                "email": "manager@sharkarpharmacy.com",
                "password": "manager123",
                "name": "Manager User"
            },
            {
                "email": "employee@sharkarpharmacy.com",
                "password": "employee123",
                "name": "Pharmacist User"
            }
        ]
        
        # First, find any users with old emails and update them
        old_emails = [
            ("admin@pharmazine.com", "admin@sharkarpharmacy.com"),
            ("manager@pharmazine.com", "manager@sharkarpharmacy.com"),
            ("employee@pharmazine.com", "employee@sharkarpharmacy.com"),
        ]
        
        for old_email, new_email in old_emails:
            user = db.query(Profile).filter(Profile.email == old_email).first()
            if user:
                user.email = new_email
                print(f"[OK] Updated email from {old_email} to {new_email}")
        
        db.commit()
        
        # Now fix each user
        for user_data in users_to_fix:
            user = db.query(Profile).filter(Profile.email == user_data["email"]).first()
            
            if not user:
                print(f"[WARNING] User not found: {user_data['email']}")
                continue
            
            # Reset password hash
            old_hash = user.password_hash
            user.password_hash = get_password_hash(user_data["password"])
            user.full_name = user_data["name"]
            
            # Verify the password works
            is_valid = verify_password(user_data["password"], user.password_hash)
            
            print(f"\nUser: {user_data['name']}")
            print(f"  Email: {user_data['email']}")
            print(f"  Password: {user_data['password']}")
            print(f"  Old Hash: {old_hash[:50]}...")
            print(f"  New Hash: {user.password_hash[:50]}...")
            print(f"  Verification: {'VALID' if is_valid else 'INVALID'}")
            
            if not is_valid:
                print(f"  [ERROR] Password verification failed!")
        
        db.commit()
        
        print("\n" + "=" * 60)
        print("[SUCCESS] All users fixed!")
        print("=" * 60)
        print("\nLogin Credentials:")
        print("-" * 60)
        for user_data in users_to_fix:
            print(f"  {user_data['name']:20} {user_data['email']:35} / {user_data['password']}")
        print("-" * 60)
        print("\nIMPORTANT: Restart your backend server after running this script!")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n[ERROR] {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_all_users()

