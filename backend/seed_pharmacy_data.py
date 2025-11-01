"""
Seed pharmacy sample data
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
from pharmacy_models import MedicineCategory, UnitType, MedicineType, Manufacturer
import uuid

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:pharmazine123@localhost:5432/pharmazine")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

print("=" * 70)
print("SEEDING PHARMACY DATA")
print("=" * 70)
print()

db = SessionLocal()

try:
    # Check if data already exists
    existing_categories = db.query(MedicineCategory).count()
    if existing_categories > 0:
        print(f"[INFO] Database already has {existing_categories} categories. Skipping seed.")
        db.close()
        exit(0)

    # Medicine Categories
    categories = [
        {"name": "Tablet", "description": "Oral solid dosage form", "display_order": 1},
        {"name": "Capsule", "description": "Gelatin shell dosage form", "display_order": 2},
        {"name": "Syrup", "description": "Liquid oral dosage form", "display_order": 3},
        {"name": "Injection", "description": "Parenteral dosage form", "display_order": 4},
        {"name": "Cream", "description": "Topical semi-solid dosage form", "display_order": 5},
        {"name": "Ointment", "description": "Topical oil-based dosage form", "display_order": 6},
        {"name": "Drops", "description": "Liquid drops for eye, ear, or nose", "display_order": 7},
        {"name": "Inhaler", "description": "Respiratory dosage form", "display_order": 8},
    ]

    for cat in categories:
        db.add(MedicineCategory(id=uuid.uuid4(), **cat))
    
    print(f"[OK] Added {len(categories)} medicine categories")

    # Unit Types
    units = [
        {"name": "Milligram", "abbreviation": "mg", "category": "weight", "display_order": 1},
        {"name": "Gram", "abbreviation": "g", "category": "weight", "display_order": 2},
        {"name": "Milliliter", "abbreviation": "ml", "category": "volume", "display_order": 3},
        {"name": "Liter", "abbreviation": "L", "category": "volume", "display_order": 4},
        {"name": "Piece", "abbreviation": "pc", "category": "quantity", "display_order": 5},
        {"name": "Strip", "abbreviation": "strip", "category": "quantity", "display_order": 6},
        {"name": "Box", "abbreviation": "box", "category": "quantity", "display_order": 7},
        {"name": "Bottle", "abbreviation": "btl", "category": "quantity", "display_order": 8},
    ]

    for unit in units:
        db.add(UnitType(id=uuid.uuid4(), **unit))
    
    print(f"[OK] Added {len(units)} unit types")

    # Medicine Types
    types = [
        {"name": "Painkiller", "description": "Analgesic medications", "display_order": 1},
        {"name": "Antibiotic", "description": "Antibacterial medications", "display_order": 2},
        {"name": "Antipyretic", "description": "Fever-reducing medications", "display_order": 3},
        {"name": "Antacid", "description": "Stomach acid neutralizers", "display_order": 4},
        {"name": "Antihistamine", "description": "Allergy medications", "display_order": 5},
        {"name": "Antihypertensive", "description": "Blood pressure medications", "display_order": 6},
        {"name": "Antidiabetic", "description": "Diabetes medications", "display_order": 7},
        {"name": "Vitamin", "description": "Nutritional supplements", "display_order": 8},
    ]

    for med_type in types:
        db.add(MedicineType(id=uuid.uuid4(), **med_type))
    
    print(f"[OK] Added {len(types)} medicine types")

    # Manufacturers
    manufacturers = [
        {
            "name": "Pfizer Inc.", "code": "PFZ",
            "contact_person": "John Smith", "phone": "+1-212-733-2323",
            "email": "contact@pfizer.com", "city": "New York",
            "state": "NY", "country": "USA", "payment_terms": "Net 30"
        },
        {
            "name": "GlaxoSmithKline", "code": "GSK",
            "contact_person": "Emma Wilson", "phone": "+44-20-8047-5000",
            "email": "contact@gsk.com", "city": "London",
            "country": "UK", "payment_terms": "Net 45"
        },
        {
            "name": "Cipla Limited", "code": "CPL",
            "contact_person": "Rajesh Kumar", "phone": "+91-22-2482-1000",
            "email": "contact@cipla.com", "city": "Mumbai",
            "country": "India", "payment_terms": "Net 60"
        },
        {
            "name": "Novartis AG", "code": "NVS",
            "contact_person": "Hans Mueller", "phone": "+41-61-324-1111",
            "email": "contact@novartis.com", "city": "Basel",
            "country": "Switzerland", "payment_terms": "Net 30"
        },
    ]

    for mfr in manufacturers:
        db.add(Manufacturer(id=uuid.uuid4(), **mfr))
    
    print(f"[OK] Added {len(manufacturers)} manufacturers")

    db.commit()
    print()
    print("=" * 70)
    print("PHARMACY DATA SEEDED SUCCESSFULLY")
    print("=" * 70)

except Exception as e:
    print(f"[ERROR] Seeding failed: {e}")
    db.rollback()
    import traceback
    traceback.print_exc()
finally:
    db.close()

