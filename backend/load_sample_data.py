"""
Sample Data Loader for Feed and Medicine
Loads realistic sample data for testing and demonstration
"""

import csv
import os
from datetime import datetime, timedelta
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import random
import uuid

# Database connection
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://dealer_user:dealer_password@localhost:5432/dealer_db")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

def load_csv_data(filename):
    """Load data from CSV file"""
    filepath = os.path.join('backend/sample_data', filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        return list(reader)

def clear_existing_data(session):
    """Clear existing sample data (optional - be careful in production!)"""
    print("WARNING: Clearing existing data...")
    try:
        # Clear in reverse order of dependencies
        session.execute(text("DELETE FROM sales_items WHERE 1=1"))
        session.execute(text("DELETE FROM sales WHERE 1=1"))
        session.execute(text("DELETE FROM requisition_items WHERE 1=1"))
        session.execute(text("DELETE FROM requisitions WHERE 1=1"))
        session.execute(text("DELETE FROM purchase_items WHERE 1=1"))
        session.execute(text("DELETE FROM grns WHERE 1=1"))
        session.execute(text("DELETE FROM purchases WHERE 1=1"))
        session.execute(text("DELETE FROM product_stock WHERE 1=1"))
        session.execute(text("DELETE FROM products WHERE id > 1"))  # Keep seed products
        session.execute(text("DELETE FROM customers WHERE id > 1"))
        session.execute(text("DELETE FROM suppliers WHERE id > 1"))
        session.execute(text("DELETE FROM transactions WHERE 1=1"))
        session.execute(text("DELETE FROM expenses WHERE 1=1"))
        session.commit()
        print("[OK] Existing data cleared")
    except Exception as e:
        print(f"[WARNING] Error clearing data: {e}")
        session.rollback()

def load_suppliers(session):
    """Load supplier data"""
    print("\n[1/5] Loading Suppliers...")
    suppliers = load_csv_data('suppliers_sample.csv')
    
    for supplier in suppliers:
        try:
            session.execute(text("""
                INSERT INTO suppliers (id, name, contact_person, email, phone, address, created_at)
                VALUES (:id, :name, :contact_person, :email, :phone, :address, :created_at)
            """), {
                'id': str(uuid.uuid4()),
                'name': supplier['name'],
                'contact_person': supplier['contact_person'],
                'email': supplier['email'],
                'phone': supplier['phone'],
                'address': supplier['address'],
                'created_at': datetime.utcnow()
            })
        except Exception as e:
            print(f"   [ERROR] Error loading supplier {supplier['name']}: {e}")
    
    session.commit()
    print(f"[OK] Loaded {len(suppliers)} suppliers")

def load_customers(session):
    """Load customer data"""
    print("\n[2/5] Loading Customers...")
    customers = load_csv_data('customers_sample.csv')
    
    for customer in customers:
        try:
            session.execute(text("""
                INSERT INTO customers (id, name, email, phone, address, created_at)
                VALUES (:id, :name, :email, :phone, :address, :created_at)
            """), {
                'id': str(uuid.uuid4()),
                'name': customer['name'],
                'email': customer['email'],
                'phone': customer['phone'],
                'address': customer['address'],
                'created_at': datetime.utcnow()
            })
        except Exception as e:
            print(f"   [ERROR] Error loading customer {customer['name']}: {e}")
    
    session.commit()
    print(f"[OK] Loaded {len(customers)} customers")

def load_products(session):
    """Load product data"""
    print("\n[3/5] Loading Products...")
    products = load_csv_data('products_sample.csv')
    
    # Get category, subcategory, supplier IDs
    categories = {}
    subcategories = {}
    suppliers_map = {}
    
    # Get existing data
    cat_result = session.execute(text("SELECT id, name FROM categories"))
    for row in cat_result:
        categories[row[1]] = row[0]
    
    subcat_result = session.execute(text("SELECT id, name FROM subcategories"))
    for row in subcat_result:
        subcategories[row[1]] = row[0]
    
    sup_result = session.execute(text("SELECT id, name FROM suppliers"))
    for row in sup_result:
        suppliers_map[row[1]] = row[0]
    
    # Create missing categories
    for product in products:
        cat_name = product['category']
        if cat_name and cat_name not in categories:
            cat_id = str(uuid.uuid4())
            session.execute(text("""
                INSERT INTO categories (id, name, description, created_at)
                VALUES (:id, :name, :description, :created_at)
            """), {
                'id': cat_id,
                'name': cat_name,
                'description': f'{cat_name} products',
                'created_at': datetime.utcnow()
            })
            categories[cat_name] = cat_id
            session.commit()
    
    # Create missing subcategories
    for product in products:
        subcat_name = product['subcategory']
        cat_name = product['category']
        if subcat_name and subcat_name not in subcategories and cat_name in categories:
            subcat_id = str(uuid.uuid4())
            session.execute(text("""
                INSERT INTO subcategories (id, name, category_id, created_at)
                VALUES (:id, :name, :category_id, :created_at)
            """), {
                'id': subcat_id,
                'name': subcat_name,
                'category_id': categories[cat_name],
                'created_at': datetime.utcnow()
            })
            subcategories[subcat_name] = subcat_id
            session.commit()
    
    # Load products
    loaded_count = 0
    for product in products:
        try:
            cat_id = categories.get(product['category'])
            subcat_id = subcategories.get(product['subcategory'])
            sup_id = suppliers_map.get(product['supplier'])
            
            # Map CSV columns to database columns
            purchase_price = float(product['purchase_price']) if product['purchase_price'] else 0
            selling_price = float(product['selling_price']) if product['selling_price'] else 0
            
            session.execute(text("""
                INSERT INTO products (
                    id, sku, name, description, category_id, subcategory_id, brand, 
                    supplier_id, unit_type, unit_size, unit_multiplier,
                    cost_price, unit_price, min_stock_threshold,
                    stock_quantity, image_url, created_at
                )
                VALUES (
                    :id, :sku, :name, :description, :category_id, :subcategory_id, :brand,
                    :supplier_id, :unit_type, :unit_size, :unit_multiplier,
                    :cost_price, :unit_price, :min_stock_threshold,
                    0, :image_url, :created_at
                )
            """), {
                'id': str(uuid.uuid4()),
                'sku': product['sku'],
                'name': product['name'],
                'description': product['description'],
                'category_id': cat_id,
                'subcategory_id': subcat_id,
                'brand': product['brand'],
                'supplier_id': sup_id,
                'unit_type': product['unit_type'],
                'unit_size': product['unit_size'] if product['unit_size'] else '1',
                'unit_multiplier': float(product['unit_multiplier']) if product['unit_multiplier'] else 1,
                'cost_price': purchase_price,
                'unit_price': selling_price,
                'min_stock_threshold': int(float(product['min_stock_threshold'])) if product['min_stock_threshold'] else 0,
                'image_url': product.get('image_url', ''),
                'created_at': datetime.utcnow()
            })
            loaded_count += 1
        except Exception as e:
            print(f"   [ERROR] Error loading product {product['sku']}: {e}")
    
    session.commit()
    print(f"[OK] Loaded {loaded_count} products")

def load_opening_stock(session):
    """Load opening stock data"""
    print("\n[4/5] Loading Opening Stock...")
    stocks = load_csv_data('opening_stock_sample.csv')
    
    # Get store ID
    store_result = session.execute(text("SELECT id FROM stores WHERE name = :name"), {'name': 'Main Store'})
    store_row = store_result.fetchone()
    if not store_row:
        # Create main store
        store_id = str(uuid.uuid4())
        session.execute(text("""
            INSERT INTO stores (id, name, created_at)
            VALUES (:id, :name, :created_at)
        """), {
            'id': store_id,
            'name': 'Main Store',
            'created_at': datetime.utcnow()
        })
        session.commit()
    else:
        store_id = store_row[0]
    
    loaded_count = 0
    for stock in stocks:
        try:
            # Get product ID
            prod_result = session.execute(text("SELECT id FROM products WHERE sku = :sku"), {'sku': stock['sku']})
            prod_row = prod_result.fetchone()
            
            if prod_row:
                product_id = prod_row[0]
                opening_qty = float(stock['opening_qty'])
                
                # Update product stock_quantity
                session.execute(text("""
                    UPDATE products SET stock_quantity = :qty WHERE id = :id
                """), {'qty': opening_qty, 'id': product_id})
                
                # Insert into product_stock
                session.execute(text("""
                    INSERT INTO product_stock (
                        id, product_id, store_id, opening_qty, current_qty, reserved_qty, created_at
                    ) VALUES (
                        :id, :product_id, :store_id, :opening_qty, :current_qty, 0, :created_at
                    )
                """), {
                    'id': str(uuid.uuid4()),
                    'product_id': product_id,
                    'store_id': store_id,
                    'opening_qty': opening_qty,
                    'current_qty': opening_qty,
                    'created_at': datetime.utcnow()
                })
                loaded_count += 1
        except Exception as e:
            print(f"   [ERROR] Error loading stock for {stock['sku']}: {e}")
    
    session.commit()
    print(f"[OK] Loaded opening stock for {loaded_count} products")

def create_sample_transactions(session):
    """Create sample sales and purchases for demonstration"""
    print("\n[5/5] Creating Sample Transactions...")
    
    # Get some products
    products = session.execute(text("""
        SELECT id, name, unit_price, cost_price 
        FROM products 
        WHERE stock_quantity > 0 
        LIMIT 20
    """)).fetchall()
    
    # Get some customers
    customers = session.execute(text("SELECT id FROM customers LIMIT 10")).fetchall()
    
    # Skip sample transactions if users table doesn't exist
    try:
        admin = session.execute(text("SELECT id FROM users WHERE email = 'admin@sharkarpharmacy.com'")).fetchone()
        admin_id = admin[0] if admin else None
    except:
        print("[WARNING] Users table not found, skipping sample transactions")
        return
    
    # Create 10 sample sales
    for i in range(10):
        try:
            sale_date = datetime.utcnow() - timedelta(days=random.randint(1, 30))
            customer_id = random.choice(customers)[0] if customers else None
            payment_type = random.choice(['cash', 'card', 'online'])
            
            # Select 2-5 random products
            sale_products = random.sample(list(products), random.randint(2, 5))
            
            subtotal = 0
            for prod in sale_products:
                quantity = random.randint(1, 5)
                subtotal += prod[2] * quantity
            
            discount = random.choice([0, 5, 10])
            discount_amount = subtotal * discount / 100
            tax_amount = (subtotal - discount_amount) * 0.05
            total = subtotal - discount_amount + tax_amount
            
            # Create sale
            result = session.execute(text("""
                INSERT INTO sales (
                    customer_name, customer_email, customer_phone,
                    subtotal, discount, tax, total, payment_method,
                    payment_type, customer_id, status, created_by, created_at
                ) VALUES (
                    :customer_name, :customer_email, :customer_phone,
                    :subtotal, :discount, :tax, :total, :payment_method,
                    :payment_type, :customer_id, :status, :created_by, :created_at
                ) RETURNING id
            """), {
                'customer_name': f'Customer {i+1}',
                'customer_email': f'customer{i+1}@example.com',
                'customer_phone': f'+880-171{i:07d}',
                'subtotal': subtotal,
                'discount': discount,
                'tax': tax_amount,
                'total': total,
                'payment_method': payment_type,
                'payment_type': payment_type,
                'customer_id': customer_id,
                'status': 'completed' if payment_type == 'cash' else 'pending',
                'created_by': admin_id,
                'created_at': sale_date
            })
            sale_id = result.fetchone()[0]
            
            # Create sale items
            for prod in sale_products:
                quantity = random.randint(1, 5)
                session.execute(text("""
                    INSERT INTO sales_items (
                        sale_id, product_id, product_name, quantity, 
                        unit_price, discount, total, created_at
                    ) VALUES (
                        :sale_id, :product_id, :product_name, :quantity,
                        :unit_price, :discount, :total, :created_at
                    )
                """), {
                    'sale_id': sale_id,
                    'product_id': prod[0],
                    'product_name': prod[1],
                    'quantity': quantity,
                    'unit_price': prod[2],
                    'discount': 0,
                    'total': prod[2] * quantity,
                    'created_at': sale_date
                })
            
        except Exception as e:
            print(f"   [ERROR] Error creating sample sale: {e}")
    
    session.commit()
    print(f"[OK] Created 10 sample sales")

def main():
    """Main function to load all sample data"""
    print("\n" + "="*60)
    print("SHARKAR FEED & MEDICINE - SAMPLE DATA LOADER")
    print("="*60)
    
    session = SessionLocal()
    
    try:
        # Optional: Clear existing data (comment out if you want to keep existing data)
        # clear_existing_data(session)
        
        # Load data in order
        load_suppliers(session)
        load_customers(session)
        load_products(session)
        load_opening_stock(session)
        create_sample_transactions(session)
        
        print("\n" + "="*60)
        print("ALL SAMPLE DATA LOADED SUCCESSFULLY!")
        print("="*60)
        print("\nSummary:")
        
        # Get counts
        sup_count = session.execute(text("SELECT COUNT(*) FROM suppliers")).scalar()
        cust_count = session.execute(text("SELECT COUNT(*) FROM customers")).scalar()
        prod_count = session.execute(text("SELECT COUNT(*) FROM products")).scalar()
        stock_count = session.execute(text("SELECT COUNT(*) FROM product_stock")).scalar()
        sale_count = session.execute(text("SELECT COUNT(*) FROM sales")).scalar()
        
        print(f"   - Suppliers: {sup_count}")
        print(f"   - Customers: {cust_count}")
        print(f"   - Products: {prod_count}")
        print(f"   - Stock Records: {stock_count}")
        print(f"   - Sample Sales: {sale_count}")
        
        print("\nYour database is now populated with realistic sample data!")
        print("Visit http://localhost to see it in action!")
        print("\n")
        
    except Exception as e:
        print(f"\nError loading sample data: {e}")
        session.rollback()
    finally:
        session.close()

if __name__ == "__main__":
    main()

