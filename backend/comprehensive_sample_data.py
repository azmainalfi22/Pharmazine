"""
Comprehensive Sample Data Loader for Sharkar Feed & Pharmacy
Loads realistic data for all modules to enable proper testing
"""

import psycopg2
from datetime import datetime, timedelta
import os
import random

# Database connection
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:pharmazine123@localhost:5432/pharmazine")

def get_connection():
    return psycopg2.connect(DATABASE_URL)

def load_all_data():
    conn = get_connection()
    cur = conn.cursor()
    
    print("🌱 Loading comprehensive sample data...")
    
    try:
        # 1. Load Categories
        print("📁 Loading categories...")
        cur.execute("""
            INSERT INTO categories (id, name, description) VALUES
                ('cat-pharma', 'Pharmacy & Medicine', 'Pharmaceutical products'),
                ('cat-feed', 'Animal Feed', 'Animal feed and supplements'),
                ('cat-poultry', 'Poultry Products', 'Poultry feed and medicine'),
                ('cat-cattle', 'Cattle Products', 'Cattle feed and supplements')
            ON CONFLICT (id) DO NOTHING
        """)
        
        # 2. Load Subcategories
        cur.execute("""
            INSERT INTO subcategories (id, name, category_id) VALUES
                ('sub-human-med', 'Human Medicine', 'cat-pharma'),
                ('sub-vet-med', 'Veterinary Medicine', 'cat-pharma'),
                ('sub-poultry-feed', 'Poultry Feed', 'cat-feed'),
                ('sub-cattle-feed', 'Cattle Feed', 'cat-feed')
            ON CONFLICT (id) DO NOTHING
        """)
        
        # 3. Load Suppliers
        print("🏭 Loading suppliers...")
        cur.execute("""
            INSERT INTO suppliers (id, name, email, phone, address, payment_terms) VALUES
                ('sup-001', 'Square Pharma Distributor', 'square@dist.com', '+880-1711-111111', 'Dhaka', 'Net 30'),
                ('sup-002', 'CP Feed Supplier', 'cp@feed.com', '+880-1722-222222', 'Gazipur', 'Net 30'),
                ('sup-003', 'Quality Feeds Supplier', 'quality@feeds.com', '+880-1733-333333', 'Narsingdi', 'Net 45')
            ON CONFLICT (id) DO NOTHING
        """)
        
        conn.commit()
        print(f"✅ Basic data loaded")
        
        # 4. Count existing data
        cur.execute("SELECT COUNT(*) FROM products")
        product_count = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(*) FROM customers")
        customer_count = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(*) FROM manufacturers")
        manufacturer_count = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(*) FROM medicine_batches")
        batch_count = cur.fetchone()[0]
        
        print(f"📊 Current data:")
        print(f"   Products: {product_count}")
        print(f"   Customers: {customer_count}")
        print(f"   Manufacturers: {manufacturer_count}")
        print(f"   Batches: {batch_count}")
        
        # 5. Create sample sales if needed
        if product_count > 0 and customer_count > 0:
            print("💰 Creating sample sales transactions...")
            
            # Get some products and customers
            cur.execute("SELECT id, name, selling_price, unit_price FROM products LIMIT 10")
            products = cur.fetchall()
            
            cur.execute("SELECT id, name FROM customers LIMIT 10")
            customers = cur.fetchall()
            
            # Create 20 sample sales over last 30 days
            payment_methods = ['cash', 'card', 'upi', 'bank_transfer']
            
            for i in range(20):
                sale_date = datetime.now() - timedelta(days=random.randint(0, 30))
                customer = random.choice(customers)
                num_items = random.randint(1, 5)
                
                total_amount = 0
                items_total = 0
                
                # Calculate totals
                for _ in range(num_items):
                    product = random.choice(products)
                    qty = random.randint(1, 10)
                    price = float(product[2] or product[3] or 10.0)
                    items_total += qty * price
                
                discount = items_total * random.choice([0, 0.05, 0.10])
                tax = (items_total - discount) * 0.05
                net_amount = items_total - discount + tax
                
                cur.execute("""
                    INSERT INTO sales (
                        id, customer_name, customer_phone, customer_id,
                        total_amount, discount, tax, net_amount,
                        payment_method, payment_status,
                        created_at, updated_at
                    ) VALUES (
                        uuid_generate_v4()::text, %s, '', %s,
                        %s, %s, %s, %s,
                        %s, 'completed',
                        %s, %s
                    )
                """, (
                    customer[1], customer[0],
                    items_total, discount, tax, net_amount,
                    random.choice(payment_methods),
                    sale_date, sale_date
                ))
            
            conn.commit()
            print(f"✅ Created 20 sample sales transactions")
        
        # Final counts
        cur.execute("""
            SELECT 
                (SELECT COUNT(*) FROM products) as products,
                (SELECT COUNT(*) FROM customers) as customers,
                (SELECT COUNT(*) FROM manufacturers) as manufacturers,
                (SELECT COUNT(*) FROM medicine_batches) as batches,
                (SELECT COUNT(*) FROM sales) as sales
        """)
        final = cur.fetchone()
        
        print("\n📊 Final data counts:")
        print(f"   Products: {final[0]}")
        print(f"   Customers: {final[1]}")
        print(f"   Manufacturers: {final[2]}")
        print(f"   Medicine Batches: {final[3]}")
        print(f"   Sales: {final[4]}")
        print("\n✅ All sample data loaded successfully!")
        
    except Exception as e:
        print(f"❌ Error loading data: {e}")
        conn.rollback()
        raise
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    load_all_data()


