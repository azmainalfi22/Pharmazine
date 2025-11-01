"""
Run Pharmacy Management System Migration
Phase 1: Medicine Management System

This script runs the pharmacy database migration
"""

import os
import psycopg2
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
load_dotenv()

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:pharmazine123@localhost:5432/pharmazine")

def parse_connection_string(url):
    """Parse PostgreSQL connection string"""
    # Remove postgresql:// prefix
    url = url.replace("postgresql://", "").replace("postgres://", "")
    
    # Split user:password@host:port/database
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

def run_migration():
    """Run the pharmacy migration SQL script"""
    print("=" * 70)
    print("PHARMAZINE - PHASE 1 MIGRATION")
    print("Medicine Management System")
    print("=" * 70)
    print()
    
    # Parse connection
    try:
        conn_params = parse_connection_string(DATABASE_URL)
        print(f"Connecting to database: {conn_params['database']}")
        print(f"Host: {conn_params['host']}:{conn_params['port']}")
        print()
    except Exception as e:
        print(f"Error parsing connection string: {e}")
        return False
    
    # Read migration file
    migration_file = Path(__file__).parent / "migrations" / "003_pharmacy_medicine_system.sql"
    
    if not migration_file.exists():
        print(f"❌ Migration file not found: {migration_file}")
        return False
    
    print(f"Reading migration file: {migration_file.name}")
    with open(migration_file, 'r', encoding='utf-8') as f:
        migration_sql = f.read()
    
    print(f"Migration file size: {len(migration_sql)} characters")
    print()
    
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
    
    # Run migration
    try:
        print("Running migration...")
        print("-" * 70)
        cursor.execute(migration_sql)
        print("-" * 70)
        print("✓ Migration completed successfully!")
        print()
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        conn.rollback()
        return False
    finally:
        cursor.close()
        conn.close()
    
    # Print summary
    print("=" * 70)
    print("MIGRATION SUMMARY")
    print("=" * 70)
    print()
    print("✅ Created Tables:")
    print("   • medicine_categories (dosage forms)")
    print("   • unit_types (measurement units)")
    print("   • medicine_types (therapeutic categories)")
    print("   • manufacturers (suppliers)")
    print("   • medicine_batches (batch tracking)")
    print("   • batch_stock_transactions (stock movements)")
    print("   • discount_configs (discount rules)")
    print("   • expired_medicines (expiry log)")
    print("   • waste_products (waste log)")
    print("   • barcode_print_log (barcode printing)")
    print()
    print("✅ Enhanced Tables:")
    print("   • products (added pharmacy fields)")
    print("   • purchase_items (added batch tracking)")
    print("   • sales_items (added batch tracking)")
    print("   • customers (added pharmacy fields)")
    print()
    print("✅ Created Views:")
    print("   • v_medicines_with_stock")
    print("   • v_expiring_medicines")
    print("   • v_low_stock_medicines")
    print()
    print("✅ Created Functions:")
    print("   • update_batch_quantity()")
    print("   • check_expired_batches()")
    print()
    print("✅ Predefined Data Loaded:")
    print("   • 15 Medicine Categories")
    print("   • 15 Unit Types")
    print("   • 23 Medicine Types")
    print("   • 3 Expiry Alert Settings")
    print()
    print("=" * 70)
    print("🎉 PHASE 1 MIGRATION COMPLETED SUCCESSFULLY!")
    print("=" * 70)
    print()
    print("Next Steps:")
    print("1. Install Python dependencies: pip install -r requirements.txt")
    print("2. Restart the backend server")
    print("3. Access pharmacy endpoints: /api/pharmacy/*")
    print("4. Start implementing frontend components")
    print()
    
    return True

if __name__ == "__main__":
    success = run_migration()
    exit(0 if success else 1)

