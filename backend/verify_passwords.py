"""
Verify passwords using the exact same method as backend authentication
"""

import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add the parent directory to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.main import Profile, verify_password

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:pharmazine123@localhost:5432/pharmazine")

if "sqlite" in DATABASE_URL:
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def verify_all_passwords():
    db = SessionLocal()
    
    try:
        print("Verifying passwords using backend authentication method...\n")
        
        test_cases = [
            ("admin@sharkarpharmacy.com", "admin123"),
            ("manager@sharkarpharmacy.com", "manager123"),
            ("employee@sharkarpharmacy.com", "employee123"),
        ]
        
        for email, password in test_cases:
            user = db.query(Profile).filter(Profile.email == email).first()
            if user:
                is_valid = verify_password(password, user.password_hash)
                status = "VALID" if is_valid else "INVALID"
                print(f"Email: {email}")
                print(f"Password: {password}")
                print(f"Hash: {user.password_hash[:50]}...")
                print(f"Verification: {status}")
                print("-" * 60)
            else:
                print(f"User not found: {email}")
                print("-" * 60)
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    verify_all_passwords()

