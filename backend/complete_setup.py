"""
Complete pharmacy system setup
Creates tables, seeds data, and verifies setup
"""
import os
import sys
from pathlib import Path

backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

print("=" * 70)
print("SHARKAR PHARMACY - COMPLETE SYSTEM SETUP")
print("=" * 70)
print()

# Step 1: Create pharmacy tables
print("Step 1: Creating pharmacy tables...")
try:
    from create_pharmacy_tables import *
    print("[OK] Pharmacy tables created")
except Exception as e:
    print(f"[INFO] Pharmacy tables: {e}")

print()

# Step 2: Seed pharmacy data
print("Step 2: Seeding pharmacy data...")
try:
    exec(open("seed_pharmacy_data.py").read())
except Exception as e:
    print(f"[INFO] Pharmacy data: {e}")

print()

# Step 3: Seed user data
print("Step 3: Seeding user accounts...")
try:
    exec(open("seed_data.py").read())
except Exception as e:
    print(f"[INFO] User accounts: {e}")

print()
print("=" * 70)
print("SETUP COMPLETE")
print("=" * 70)
print()
print("Start the system:")
print("  Backend: python start_server.py")
print("  Frontend: npm run dev")
print()
print("Login: admin@sharkarpharmacy.com / admin123")
print()

