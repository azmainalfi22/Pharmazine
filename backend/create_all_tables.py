"""
Create all tables for the complete pharmacy system
Includes: Main tables, Pharmacy, Service, HRM modules
"""

import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:pharmazine123@localhost:5432/pharmazine")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def create_all_tables():
    """Create all tables in the system"""
    print("Creating all system tables...")
    
    # Import all models to ensure they're registered
    from main import Base as MainBase
    from pharmacy_models import Base as PharmacyBase
    from service_models import Base as ServiceBase
    from hrm_models import Base as HRMBase
    
    try:
        # Enable UUID extension
        with engine.begin() as conn:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\""))
        print("[OK] UUID extension enabled")
        
        # Create all main tables
        MainBase.metadata.create_all(bind=engine)
        print("[OK] Main tables created")
        
        # Create pharmacy tables
        PharmacyBase.metadata.create_all(bind=engine)
        print("[OK] Pharmacy tables created")
        
        # Create service tables
        ServiceBase.metadata.create_all(bind=engine)
        print("[OK] Service tables created")
        
        # Create HRM tables
        HRMBase.metadata.create_all(bind=engine)
        print("[OK] HRM tables created")
        
        print("\n[SUCCESS] All tables created successfully!")
        
        # Verify critical tables
        db = SessionLocal()
        try:
            result = db.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name IN (
                    'medicine_categories', 'unit_types', 'manufacturers', 'medicine_batches',
                    'service_categories', 'services', 'service_bookings',
                    'employees', 'attendance', 'leaves', 'payroll'
                )
                ORDER BY table_name
            """))
            tables = [row[0] for row in result]
            print(f"\n[VERIFICATION] Found {len(tables)} critical tables:")
            for table in tables:
                print(f"  [OK] {table}")
        finally:
            db.close()
            
    except Exception as e:
        print(f"[ERROR] Failed to create tables: {e}")
        raise

if __name__ == "__main__":
    create_all_tables()

