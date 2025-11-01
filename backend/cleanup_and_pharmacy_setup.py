"""
Sharkar Pharmacy - Complete Cleanup and Setup
Remove all electronics-related data and set up pharmacy system

This script:
1. Removes any old electronics categories/subcategories
2. Cleans up product data
3. Sets up pharmacy-specific categories
4. Loads pharmacy sample data
"""

import os
import psycopg2
from psycopg2 import sql
from dotenv import load_dotenv

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

def main():
    print("\n" + "=" * 70)
    print("SHARKAR PHARMACY - CLEANUP & SETUP")
    print("Removing Electronics Data, Setting Up Pharmacy System")
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
    
    # Connect
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
    
    try:
        print("Step 1: Cleaning up old electronics categories...")
        print("-" * 70)
        
        # Delete electronics-related categories
        electronics_categories = [
            'Electronics', 'Mobile Phones', 'Computers', 'Laptops',
            'TV & Audio', 'Home Appliances', 'LED Bulbs', 'Fans',
            'Air Conditioners', 'Refrigerators', 'Washing Machines'
        ]
        
        for cat in electronics_categories:
            cursor.execute("""
                DELETE FROM categories WHERE name = %s
            """, (cat,))
            print(f"  Removed category: {cat}")
        
        print("✓ Electronics categories removed")
        print()
        
        print("Step 2: Cleaning up old subcategories...")
        print("-" * 70)
        
        # Delete old subcategories not related to pharmacy
        electronics_subcategories = [
            'Smartphones', 'Feature Phones', 'Tablets',
            'Desktop', 'Gaming Laptop', 'Business Laptop',
            'Smart TV', 'LED TV', 'Soundbar',
            'Ceiling Fan', 'Table Fan', 'Exhaust Fan',
            'Split AC', 'Window AC', 'Portable AC',
            'Single Door', 'Double Door', 'Side by Side'
        ]
        
        for subcat in electronics_subcategories:
            cursor.execute("""
                DELETE FROM subcategories WHERE name = %s
            """, (subcat,))
            print(f"  Removed subcategory: {subcat}")
        
        print("✓ Electronics subcategories removed")
        print()
        
        print("Step 3: Setting up pharmacy categories...")
        print("-" * 70)
        
        # Insert pharmacy categories if they don't exist
        pharmacy_categories = [
            ('Medicine', 'Pharmaceutical medicines and drugs'),
            ('Animal Feed', 'Animal feed and nutrition'),
            ('Animal Supplement', 'Vitamins and supplements for animals'),
            ('Veterinary Medicine', 'Medicines for animals'),
            ('Accessories', 'Pharmacy and farm accessories'),
            ('Medical Equipment', 'Medical devices and equipment'),
            ('OTC Products', 'Over-the-counter products'),
            ('Ayurvedic', 'Ayurvedic and herbal medicines'),
            ('Homeopathic', 'Homeopathic medicines'),
        ]
        
        for cat_name, cat_desc in pharmacy_categories:
            cursor.execute("""
                INSERT INTO categories (id, name, description, created_at, updated_at)
                VALUES (gen_random_uuid()::text, %s, %s, NOW(), NOW())
                ON CONFLICT (name) DO NOTHING
            """, (cat_name, cat_desc))
            print(f"  Added category: {cat_name}")
        
        print("✓ Pharmacy categories created")
        print()
        
        print("Step 4: Setting up pharmacy subcategories...")
        print("-" * 70)
        
        # Get category IDs
        cursor.execute("SELECT id, name FROM categories")
        cat_map = {name: id for id, name in cursor.fetchall()}
        
        # Insert pharmacy subcategories
        pharmacy_subcategories = [
            ('Medicine', 'Tablets', 'Tablet form medications'),
            ('Medicine', 'Capsules', 'Capsule form medications'),
            ('Medicine', 'Syrup', 'Liquid oral medications'),
            ('Medicine', 'Injection', 'Injectable medications'),
            ('Medicine', 'Drops', 'Eye/Ear/Nasal drops'),
            ('Medicine', 'Ointment', 'Topical ointments'),
            ('Medicine', 'Vitamins', 'Vitamin supplements'),
            ('Medicine', 'Sanitizer', 'Hand sanitizers and disinfectants'),
            ('Medicine', 'PPE', 'Personal protective equipment'),
            ('Medicine', 'Equipment', 'Medical equipment'),
            ('Animal Feed', 'Poultry Feed', 'Feed for chickens and ducks'),
            ('Animal Feed', 'Cattle Feed', 'Feed for cows and buffaloes'),
            ('Animal Feed', 'Fish Feed', 'Feed for fish farming'),
            ('Animal Feed', 'Goat Feed', 'Feed for goats'),
            ('Animal Feed', 'Horse Feed', 'Feed for horses'),
            ('Animal Feed', 'Duck Feed', 'Feed for ducks'),
            ('Animal Feed', 'Rabbit Feed', 'Feed for rabbits'),
            ('Animal Supplement', 'Vitamins', 'Vitamin supplements'),
            ('Animal Supplement', 'Minerals', 'Mineral supplements'),
            ('Animal Supplement', 'Protein', 'Protein supplements'),
            ('Animal Supplement', 'Electrolytes', 'Electrolyte supplements'),
            ('Animal Supplement', 'Probiotics', 'Probiotic supplements'),
            ('Veterinary Medicine', 'Injection', 'Injectable vet medicines'),
            ('Veterinary Medicine', 'Tablets', 'Tablet vet medicines'),
            ('Veterinary Medicine', 'Spray', 'Spray medications'),
            ('Veterinary Medicine', 'Ointment', 'Topical ointments'),
            ('Accessories', 'Feeding Equipment', 'Feeding tools'),
            ('Accessories', 'Containers', 'Storage containers'),
            ('Accessories', 'Tools', 'Farm and medical tools'),
            ('Accessories', 'Grooming', 'Grooming supplies'),
            ('Accessories', 'Medical Equipment', 'Medical devices'),
        ]
        
        for cat_name, subcat_name, subcat_desc in pharmacy_subcategories:
            if cat_name in cat_map:
                cursor.execute("""
                    INSERT INTO subcategories (id, name, description, category_id, created_at, updated_at)
                    VALUES (gen_random_uuid()::text, %s, %s, %s, NOW(), NOW())
                    ON CONFLICT (name, category_id) DO NOTHING
                """, (subcat_name, subcat_desc, cat_map[cat_name]))
                print(f"  Added: {cat_name} → {subcat_name}")
        
        print("✓ Pharmacy subcategories created")
        print()
        
        print("=" * 70)
        print("CLEANUP COMPLETE!")
        print("=" * 70)
        print()
        print("✅ Removed all electronics-related data")
        print("✅ Set up pharmacy-specific categories")
        print("✅ Set up pharmacy-specific subcategories")
        print("✅ Database is now 100% pharmacy-focused")
        print()
        print("Next Steps:")
        print("1. Load sample pharmacy data: python backend/load_sample_data.py")
        print("2. Start backend: python backend/main.py")
        print("3. Start frontend: npm run dev")
        print()
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Error during cleanup: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)

