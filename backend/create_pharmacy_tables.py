"""
Create pharmacy tables in database
"""
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
from pharmacy_models import Base

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:pharmazine123@localhost:5432/pharmazine")

print("=" * 70)
print("CREATING PHARMACY TABLES")
print("=" * 70)
print()

# Create engine
engine = create_engine(DATABASE_URL)

# Enable UUID extension for PostgreSQL
with engine.begin() as conn:
    try:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"))
        print("[OK] UUID extension enabled")
    except Exception as e:
        print(f"[INFO] UUID extension: {e}")

# Create all pharmacy tables
try:
    Base.metadata.create_all(bind=engine)
    print("[OK] Pharmacy tables created successfully!")
    print()
    print("Tables created:")
    print("  - medicine_categories")
    print("  - unit_types")
    print("  - medicine_types")
    print("  - manufacturers")
    print("  - medicine_batches")
    print("  - batch_stock_transactions")
    print("  - discount_configs")
    print("  - expired_medicines")
    print("  - waste_products")
    print("  - barcode_print_log")
    print()
except Exception as e:
    print(f"[ERROR] Failed to create tables: {e}")
    import traceback
    traceback.print_exc()

print("=" * 70)
print("PHARMACY TABLES SETUP COMPLETE")
print("=" * 70)

