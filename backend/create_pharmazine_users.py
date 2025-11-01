import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import uuid
from passlib.context import CryptContext

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from backend.main import Base, Profile, UserRole

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

DATABASE_URL = "postgresql://postgres:pharmazine123@localhost:5432/pharmazine"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def create_users():
    db = SessionLocal()
    try:
        Base.metadata.create_all(bind=engine)
        
        users_to_create = [
            {
                "email": "admin@pharmazine.com",
                "name": "Admin User",
                "password": "admin123",
                "role": "admin"
            },
            {
                "email": "manager@pharmazine.com",
                "name": "Manager User",
                "password": "manager123",
                "role": "manager"
            },
            {
                "email": "employee@pharmazine.com",
                "name": "Employee User",
                "password": "employee123",
                "role": "employee"
            }
        ]
        
        print("\n=== Creating Pharmazine Users ===\n")
        
        for user_data in users_to_create:
            # Check if user exists
            existing = db.query(Profile).filter(Profile.email == user_data["email"]).first()
            
            if existing:
                # Update password
                existing.password_hash = pwd_context.hash(user_data["password"])
                db.commit()
                print(f"[UPDATED] {user_data['email']:30} | Password: {user_data['password']}")
            else:
                # Create new user
                user_id = str(uuid.uuid4())
                user = Profile(
                    id=user_id,
                    full_name=user_data["name"],
                    email=user_data["email"],
                    password_hash=pwd_context.hash(user_data["password"]),
                    phone=None
                )
                db.add(user)
                db.flush()
                
                # Add role
                role = UserRole(
                    id=str(uuid.uuid4()),
                    user_id=user_id,
                    role=user_data["role"]
                )
                db.add(role)
                db.commit()
                print(f"[CREATED] {user_data['email']:30} | Password: {user_data['password']}")
        
        print("\n=== Login Credentials ===")
        print(f"Admin:    admin@pharmazine.com     | admin123")
        print(f"Manager:  manager@pharmazine.com   | manager123")
        print(f"Employee: employee@pharmazine.com  | employee123")
        print("=========================\n")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_users()

