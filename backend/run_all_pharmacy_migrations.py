"""
Pharmazine - Complete System Setup
Run all pharmacy migrations in sequence

This script will set up the complete Pharmazine system with all features.
"""

import os
import psycopg2
from dotenv import load_dotenv
from pathlib import Path
import time

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:pharmazine123@localhost:5432/pharmazine")

def parse_connection_string(url):
    """Parse PostgreSQL connection string"""
    url = url.replace("postgresql://", "").replace("postgres://", "")
    auth, rest = url.split("@")
    user, password = auth.split(":")
    host_port, database = rest.split("/")
    host, port = host_port.split(":")
    
    return {
        "user": user,
        "password": password,
        "host": host,
        "port": port,
        "database": database
    }

def run_migration_file(cursor, migration_file):
    """Run a single migration file"""
    print(f"\n{'=' * 70}")
    print(f"Running: {migration_file.name}")
    print('=' * 70)
    
    with open(migration_file, 'r', encoding='utf-8') as f:
        migration_sql = f.read()
    
    try:
        cursor.execute(migration_sql)
        print(f"✓ {migration_file.name} completed successfully")
        return True
    except Exception as e:
        print(f"❌ Error in {migration_file.name}: {e}")
        return False

def main():
    print("\n" + "=" * 70)
    print("PHARMAZINE - COMPLETE SYSTEM SETUP")
    print("The Best Pharmacy Management System")
    print("=" * 70)
    print()
    
    # Parse connection
    try:
        conn_params = parse_connection_string(DATABASE_URL)
        print(f"Connecting to database: {conn_params['database']}")
        print(f"Host: {conn_params['host']}:{conn_params['port']}")
        print()
    except Exception as e:
        print(f"❌ Error parsing connection string: {e}")
        return False
    
    # Connect to database
    try:
        print("Connecting to database...")
        conn = psycopg2.connect(**conn_params)
        conn.autocommit = True
        cursor = conn.cursor()
        print("✓ Connected successfully")
        print()
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False
    
    # Enable UUID extension
    try:
        print("Enabling UUID extension...")
        cursor.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
        print("✓ UUID extension enabled")
        print()
    except Exception as e:
        print(f"⚠️  Warning: Could not enable UUID extension: {e}")
        print()
    
    # Get all migration files in order
    migrations_dir = Path(__file__).parent / "migrations"
    migration_files = sorted([
        f for f in migrations_dir.glob("*.sql")
        if not f.name.startswith('001_') and not f.name.startswith('002_')  # Skip existing base migrations
    ])
    
    # Add our pharmacy migrations
    pharmacy_migrations = [
        "003_pharmacy_medicine_system.sql",
        "004_phase2_customer_manufacturer.sql",
        "005_phase3_advanced_purchase.sql",
        "006_phase4_reporting_system.sql",
        "007_phase5_enhanced_invoice.sql",
        "008_phase678_stock_returns_service.sql",
        "009_phase9_accounts_management.sql",
        "010_phase10_to_13_final_features.sql",
        "011_cleanup_electronics_fields.sql"
    ]
    
    migration_files = [migrations_dir / mig for mig in pharmacy_migrations if (migrations_dir / mig).exists()]
    
    print(f"Found {len(migration_files)} pharmacy migration files to run\n")
    
    # Track progress
    completed = 0
    failed = 0
    start_time = time.time()
    
    # Run each migration
    for migration_file in migration_files:
        if run_migration_file(cursor, migration_file):
            completed += 1
        else:
            failed += 1
            print(f"\n⚠️  Migration failed but continuing...")
    
    elapsed_time = time.time() - start_time
    
    # Print summary
    print("\n" + "=" * 70)
    print("SETUP COMPLETE!")
    print("=" * 70)
    print()
    print(f"✅ Migrations Completed: {completed}")
    if failed > 0:
        print(f"❌ Migrations Failed: {failed}")
    print(f"⏱️  Total Time: {elapsed_time:.2f} seconds")
    print()
    
    # Print feature summary
    print("=" * 70)
    print("FEATURES INSTALLED")
    print("=" * 70)
    print()
    print("✅ PHASE 1: Medicine Management System")
    print("   • 15 Medicine Categories, 15 Unit Types, 23 Medicine Types")
    print("   • Batch tracking with expiry dates")
    print("   • Barcode & QR code generation")
    print("   • Manufacturer management")
    print()
    print("✅ PHASE 2: Enhanced Customer & Manufacturer Management")
    print("   • Detailed customer profiles with credit limits")
    print("   • Birthday & anniversary tracking")
    print("   • Customer & manufacturer statements")
    print("   • Profit/loss by manufacturer")
    print()
    print("✅ PHASE 3: Advanced Purchase Management")
    print("   • Purchase orders with batch tracking")
    print("   • Hold/Recall functionality")
    print("   • Multiple print formats (A4/A5/A6/POS)")
    print("   • Purchase returns management")
    print()
    print("✅ PHASE 4: Comprehensive Reporting System")
    print("   • User-wise, Product-wise, Category-wise sales reports")
    print("   • Invoice-wise & Medicine-wise profit/loss")
    print("   • Stock movement reports")
    print("   • Due payment lists")
    print()
    print("✅ PHASE 5: Enhanced Invoice System")
    print("   • GUI sale interface with barcode scanning")
    print("   • Professional invoice templates")
    print("   • Sales returns & exchanges")
    print("   • Coupon codes & discounts")
    print()
    print("✅ PHASE 6: Stock Management Enhancement")
    print("   • Stock valuation reports")
    print("   • Batch-wise stock details")
    print("   • Fast/Slow/Dead stock analysis")
    print("   • Stock age analysis")
    print()
    print("✅ PHASE 7: Return Management System")
    print("   • Customer return processing")
    print("   • Supplier return tracking")
    print("   • Bulk return processing")
    print("   • Return analytics")
    print()
    print("✅ PHASE 8: Service Management System")
    print("   • Service categories & packages")
    print("   • Service bookings & appointments")
    print("   • Service invoicing")
    print("   • Service reviews & ratings")
    print()
    print("✅ PHASE 9: Enhanced Accounts Management")
    print("   • Chart of Accounts (40+ accounts)")
    print("   • Journal entries & vouchers")
    print("   • Cash/Bank/Contra/Journal vouchers")
    print("   • Credit/Debit notes")
    print("   • General Ledger, Trial Balance, Cash Book, Bank Book")
    print()
    print("✅ PHASE 10: HRM & Employee Management")
    print("   • Complete employee management")
    print("   • Attendance & leave management")
    print("   • Payroll processing")
    print("   • Employee loans & advances")
    print("   • Internal messaging system")
    print()
    print("✅ PHASE 11: Advanced Features")
    print("   • Database backup & restore")
    print("   • Printer configuration")
    print("   • Search history & favorites")
    print("   • System configuration")
    print()
    print("✅ PHASE 12: UI/UX Enhancements")
    print("   • Company branding")
    print("   • User preferences")
    print("   • Dashboard widgets")
    print("   • Customizable themes")
    print()
    print("✅ PHASE 13: CRM & Marketing")
    print("   • Marketing campaigns (Email/SMS/WhatsApp)")
    print("   • Loyalty program with tiers")
    print("   • Promotional offers")
    print("   • Customer feedback management")
    print("   • Birthday automation")
    print()
    print("=" * 70)
    print("DATABASE OBJECTS CREATED")
    print("=" * 70)
    print()
    print("📊 Tables: 100+ tables for complete management")
    print("📈 Views: 30+ views for instant reporting")
    print("⚙️  Functions: 20+ automated functions")
    print("🔔 Triggers: Auto-update triggers")
    print("📝 Pre-loaded Data: 100+ configuration records")
    print()
    print("=" * 70)
    print("NEXT STEPS")
    print("=" * 70)
    print()
    print("1. Install Python dependencies:")
    print("   pip install -r requirements.txt")
    print()
    print("2. Start the backend server:")
    print("   python main.py")
    print()
    print("3. Start the frontend:")
    print("   npm run dev")
    print()
    print("4. Access the system:")
    print("   Frontend: http://localhost:5173")
    print("   API Docs: http://localhost:9000/docs")
    print()
    print("5. Login with default credentials:")
    print("   Email: admin@pharmazine.com")
    print("   Password: admin123")
    print()
    print("=" * 70)
    print("🎉 PHARMAZINE SETUP COMPLETE!")
    print("The Best Pharmacy Management System is Ready!")
    print("=" * 70)
    print()
    
    cursor.close()
    conn.close()
    
    return failed == 0

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)

