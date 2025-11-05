"""
Seed script to populate the database with comprehensive test data
for Sharkar Feed & Medicine pharmacy system.
"""

import requests
import random
from datetime import datetime, timedelta

BASE_URL = "http://localhost:9000/api"

# Test credentials
ADMIN_EMAIL = "admin@sharkarpharmacy.com"
ADMIN_PASSWORD = "admin123"

# Sample data
CATEGORIES = [
    {"name": "Medicine", "description": "Pharmaceutical products"},
    {"name": "Animal Feed", "description": "Feed products for livestock and poultry"},
    {"name": "Supplements", "description": "Vitamins and supplements"},
    {"name": "Veterinary Supplies", "description": "Veterinary equipment and supplies"},
    {"name": "Pet Care", "description": "Pet food and care products"},
]

SUPPLIERS = [
    {"name": "ABC Pharma", "contact_person": "John Doe", "email": "john@abcpharma.com", "phone": "+880171234567", "address": "123 Pharma Street, Dhaka"},
    {"name": "Feed Masters Ltd", "contact_person": "Sarah Smith", "email": "sarah@feedmasters.com", "phone": "+880171234568", "address": "456 Feed Avenue, Chittagong"},
    {"name": "Vet Supply Co", "contact_person": "Mike Johnson", "email": "mike@vetsupply.com", "phone": "+880171234569", "address": "789 Vet Road, Sylhet"},
    {"name": "Global Meds", "contact_person": "Emily Davis", "email": "emily@globalmeds.com", "phone": "+880171234570", "address": "321 Medical Plaza, Rajshahi"},
    {"name": "Agro Feed Ltd", "contact_person": "Robert Brown", "email": "robert@agrofeed.com", "phone": "+880171234571", "address": "654 Farm Lane, Khulna"},
]

CUSTOMERS = [
    {"name": "Ali Khan", "email": "ali@example.com", "phone": "+880181234567", "address": "House 10, Road 5, Dhanmondi, Dhaka"},
    {"name": "Fatima Rahman", "email": "fatima@example.com", "phone": "+880181234568", "address": "Plot 15, Block C, Gulshan, Dhaka"},
    {"name": "Mohammad Islam", "email": "mohammad@example.com", "phone": "+880181234569", "address": "Flat 4B, Banani, Dhaka"},
    {"name": "Ayesha Begum", "email": "ayesha@example.com", "phone": "+880181234570", "address": "House 20, Uttara, Dhaka"},
    {"name": "Karim Ahmed", "email": "karim@example.com", "phone": "+880181234571", "address": "123 Main Road, Mirpur, Dhaka"},
    {"name": "Nazma Akter", "email": "nazma@example.com", "phone": "+880181234572", "address": "House 5, Mohammadpur, Dhaka"},
    {"name": "Rahim Mia", "email": "rahim@example.com", "phone": "+880181234573", "address": "Plot 7, Bashundhara, Dhaka"},
    {"name": "Sultana Khatun", "email": "sultana@example.com", "phone": "+880181234574", "address": "House 12, Baridhara, Dhaka"},
]

PRODUCTS = [
    # Medicines
    {"name": "Paracetamol 500mg", "sku": "MED001", "category": "Medicine", "unit_type": "piece", "unit_size": "100", "purchase_price": 5.50, "selling_price": 8.00, "min_stock_threshold": 100},
    {"name": "Amoxicillin 250mg", "sku": "MED002", "category": "Medicine", "unit_type": "piece", "unit_size": "50", "purchase_price": 12.00, "selling_price": 18.00, "min_stock_threshold": 50},
    {"name": "Ibuprofen 400mg", "sku": "MED003", "category": "Medicine", "unit_type": "piece", "unit_size": "100", "purchase_price": 8.00, "selling_price": 12.00, "min_stock_threshold": 80},
    {"name": "Cetirizine 10mg", "sku": "MED004", "category": "Medicine", "unit_type": "piece", "unit_size": "50", "purchase_price": 3.50, "selling_price": 6.00, "min_stock_threshold": 60},
    {"name": "Omeprazole 20mg", "sku": "MED005", "category": "Medicine", "unit_type": "piece", "unit_size": "50", "purchase_price": 15.00, "selling_price": 22.00, "min_stock_threshold": 40},
    
    # Animal Feed
    {"name": "Broiler Starter Feed", "sku": "FEED001", "category": "Animal Feed", "unit_type": "kg", "unit_size": "50", "purchase_price": 35.00, "selling_price": 45.00, "min_stock_threshold": 20},
    {"name": "Layer Mash Feed", "sku": "FEED002", "category": "Animal Feed", "unit_type": "kg", "unit_size": "50", "purchase_price": 32.00, "selling_price": 42.00, "min_stock_threshold": 25},
    {"name": "Cattle Feed Pellets", "sku": "FEED003", "category": "Animal Feed", "unit_type": "kg", "unit_size": "50", "purchase_price": 40.00, "selling_price": 52.00, "min_stock_threshold": 15},
    {"name": "Fish Feed Floating", "sku": "FEED004", "category": "Animal Feed", "unit_type": "kg", "unit_size": "25", "purchase_price": 55.00, "selling_price": 70.00, "min_stock_threshold": 10},
    {"name": "Goat Feed Concentrate", "sku": "FEED005", "category": "Animal Feed", "unit_type": "kg", "unit_size": "50", "purchase_price": 38.00, "selling_price": 50.00, "min_stock_threshold": 18},
    
    # Supplements
    {"name": "Vitamin C 1000mg", "sku": "SUPP001", "category": "Supplements", "unit_type": "piece", "unit_size": "60", "purchase_price": 18.00, "selling_price": 28.00, "min_stock_threshold": 30},
    {"name": "Multivitamin Complex", "sku": "SUPP002", "category": "Supplements", "unit_type": "piece", "unit_size": "100", "purchase_price": 25.00, "selling_price": 38.00, "min_stock_threshold": 25},
    {"name": "Calcium + D3", "sku": "SUPP003", "category": "Supplements", "unit_type": "piece", "unit_size": "90", "purchase_price": 22.00, "selling_price": 35.00, "min_stock_threshold": 20},
    
    # Veterinary Supplies
    {"name": "Disposable Syringe 5ml", "sku": "VET001", "category": "Veterinary Supplies", "unit_type": "piece", "unit_size": "100", "purchase_price": 0.50, "selling_price": 1.00, "min_stock_threshold": 200},
    {"name": "Antibiotic Injection 10ml", "sku": "VET002", "category": "Veterinary Supplies", "unit_type": "piece", "unit_size": "10", "purchase_price": 45.00, "selling_price": 65.00, "min_stock_threshold": 15},
    {"name": "Wound Spray", "sku": "VET003", "category": "Veterinary Supplies", "unit_type": "piece", "unit_size": "200ml", "purchase_price": 28.00, "selling_price": 42.00, "min_stock_threshold": 10},
    
    # Pet Care
    {"name": "Dog Food Premium 10kg", "sku": "PET001", "category": "Pet Care", "unit_type": "kg", "unit_size": "10", "purchase_price": 120.00, "selling_price": 165.00, "min_stock_threshold": 8},
    {"name": "Cat Litter 5kg", "sku": "PET002", "category": "Pet Care", "unit_type": "kg", "unit_size": "5", "purchase_price": 35.00, "selling_price": 52.00, "min_stock_threshold": 12},
    {"name": "Pet Shampoo 500ml", "sku": "PET003", "category": "Pet Care", "unit_type": "litre", "unit_size": "0.5", "purchase_price": 18.00, "selling_price": 28.00, "min_stock_threshold": 15},
]


class DataSeeder:
    def __init__(self):
        self.token = None
        self.headers = {}
        self.category_ids = {}
        self.supplier_ids = []
        self.customer_ids = []
        self.product_ids = []
        
    def login(self):
        """Authenticate and get access token"""
        print("Logging in as admin...")
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        if response.status_code == 200:
            self.token = response.json()["access_token"]
            self.headers = {"Authorization": f"Bearer {self.token}"}
            print("[OK] Logged in successfully")
        else:
            print(f"[ERROR] Login failed: {response.text}")
            raise Exception("Login failed")
    
    def seed_categories(self):
        """Create product categories"""
        print("\n📁 Creating categories...")
        for category in CATEGORIES:
            try:
                response = requests.post(
                    f"{BASE_URL}/categories",
                    headers=self.headers,
                    json=category
                )
                if response.status_code in [200, 201]:
                    cat_data = response.json()
                    self.category_ids[category["name"]] = cat_data["id"]
                    print(f"✅ Created category: {category['name']}")
                else:
                    print(f"⚠️  Category {category['name']} might already exist")
            except Exception as e:
                print(f"❌ Error creating category {category['name']}: {e}")
    
    def seed_suppliers(self):
        """Create suppliers"""
        print("\n🏭 Creating suppliers...")
        for supplier in SUPPLIERS:
            try:
                response = requests.post(
                    f"{BASE_URL}/suppliers",
                    headers=self.headers,
                    json=supplier
                )
                if response.status_code in [200, 201]:
                    supplier_data = response.json()
                    self.supplier_ids.append(supplier_data["id"])
                    print(f"✅ Created supplier: {supplier['name']}")
                else:
                    print(f"⚠️  Supplier {supplier['name']} might already exist")
            except Exception as e:
                print(f"❌ Error creating supplier {supplier['name']}: {e}")
    
    def seed_customers(self):
        """Create customers"""
        print("\n👥 Creating customers...")
        for customer in CUSTOMERS:
            try:
                response = requests.post(
                    f"{BASE_URL}/customers",
                    headers=self.headers,
                    json=customer
                )
                if response.status_code in [200, 201]:
                    customer_data = response.json()
                    self.customer_ids.append(customer_data["id"])
                    print(f"✅ Created customer: {customer['name']}")
                else:
                    print(f"⚠️  Customer {customer['name']} might already exist")
            except Exception as e:
                print(f"❌ Error creating customer {customer['name']}: {e}")
    
    def seed_products(self):
        """Create products"""
        print("\n📦 Creating products...")
        for product in PRODUCTS:
            try:
                # Get category ID
                category_id = self.category_ids.get(product["category"])
                if not category_id:
                    print(f"⚠️  Category not found for {product['name']}, skipping")
                    continue
                
                product_data = {
                    "name": product["name"],
                    "sku": product["sku"],
                    "category_id": category_id,
                    "unit_type": product["unit_type"],
                    "unit_size": product["unit_size"],
                    "purchase_price": product["purchase_price"],
                    "selling_price": product["selling_price"],
                    "unit_price": product["selling_price"],  # For compatibility
                    "min_stock_threshold": product["min_stock_threshold"],
                    "stock_quantity": random.randint(50, 500),  # Random initial stock
                    "description": f"{product['name']} - High quality product"
                }
                
                response = requests.post(
                    f"{BASE_URL}/products",
                    headers=self.headers,
                    json=product_data
                )
                if response.status_code in [200, 201]:
                    prod_data = response.json()
                    self.product_ids.append(prod_data["id"])
                    print(f"✅ Created product: {product['name']}")
                else:
                    print(f"⚠️  Product {product['name']} might already exist: {response.text}")
            except Exception as e:
                print(f"❌ Error creating product {product['name']}: {e}")
    
    def seed_purchases(self):
        """Create sample purchases"""
        print("\n🛒 Creating sample purchases...")
        if not self.supplier_ids or not self.product_ids:
            print("⚠️  No suppliers or products available, skipping purchases")
            return
        
        for i in range(5):  # Create 5 sample purchases
            try:
                supplier_id = random.choice(self.supplier_ids)
                num_items = random.randint(2, 5)
                selected_products = random.sample(self.product_ids, min(num_items, len(self.product_ids)))
                
                items = []
                total_amount = 0
                for product_id in selected_products:
                    qty = random.randint(10, 100)
                    unit_price = random.uniform(10, 50)
                    total_price = qty * unit_price
                    total_amount += total_price
                    
                    items.append({
                        "product_id": product_id,
                        "qty": qty,
                        "unit": "piece",
                        "unit_price": unit_price,
                        "total_price": total_price
                    })
                
                purchase_data = {
                    "supplier_id": supplier_id,
                    "invoice_no": f"PUR-{datetime.now().strftime('%Y%m%d')}-{i+1:03d}",
                    "date": (datetime.now() - timedelta(days=random.randint(1, 30))).strftime('%Y-%m-%d'),
                    "total_amount": total_amount,
                    "payment_status": random.choice(["pending", "paid"]),
                    "items": items
                }
                
                response = requests.post(
                    f"{BASE_URL}/purchases",
                    headers=self.headers,
                    json=purchase_data
                )
                if response.status_code in [200, 201]:
                    print(f"✅ Created purchase: {purchase_data['invoice_no']}")
                else:
                    print(f"⚠️  Error creating purchase: {response.text}")
            except Exception as e:
                print(f"❌ Error creating purchase: {e}")
    
    def seed_sales(self):
        """Create sample sales"""
        print("\n💰 Creating sample sales...")
        if not self.customer_ids or not self.product_ids:
            print("⚠️  No customers or products available, skipping sales")
            return
        
        for i in range(10):  # Create 10 sample sales
            try:
                customer_id = random.choice(self.customer_ids)
                num_items = random.randint(1, 4)
                selected_products = random.sample(self.product_ids, min(num_items, len(self.product_ids)))
                
                sale_data = {
                    "customer_id": customer_id,
                    "invoice_no": f"INV-{datetime.now().strftime('%Y%m%d')}-{i+1:04d}",
                    "gross_amount": 0,
                    "discount": 0,
                    "net_amount": 0,
                    "payment_type": random.choice(["cash", "card", "online"]),
                    "payment_status": random.choice(["paid", "pending"])
                }
                
                response = requests.post(
                    f"{BASE_URL}/sales",
                    headers=self.headers,
                    json=sale_data
                )
                if response.status_code in [200, 201]:
                    sale_id = response.json()["id"]
                    
                    # Add items to sale
                    for product_id in selected_products:
                        item_data = {
                            "sale_id": sale_id,
                            "product_id": product_id,
                            "quantity": random.randint(1, 10),
                            "unit_price": random.uniform(10, 100),
                            "discount": random.uniform(0, 5)
                        }
                        requests.post(
                            f"{BASE_URL}/sales/items",
                            headers=self.headers,
                            json=item_data
                        )
                    
                    print(f"✅ Created sale: {sale_data['invoice_no']}")
                else:
                    print(f"⚠️  Error creating sale: {response.text}")
            except Exception as e:
                print(f"❌ Error creating sale: {e}")
    
    def run(self):
        """Run all seeding operations"""
        print("Starting database seeding for Sharkar Feed & Medicine")
        print("=" * 60)
        
        try:
            self.login()
            self.seed_categories()
            self.seed_suppliers()
            self.seed_customers()
            self.seed_products()
            self.seed_purchases()
            self.seed_sales()
            
            print("\n" + "=" * 60)
            print("SUCCESS: Database seeding completed successfully!")
            print(f"Summary:")
            print(f"   - Categories: {len(CATEGORIES)}")
            print(f"   - Suppliers: {len(self.supplier_ids)}")
            print(f"   - Customers: {len(self.customer_ids)}")
            print(f"   - Products: {len(self.product_ids)}")
            print(f"   - Sample purchases: 5")
            print(f"   - Sample sales: 10")
            print("=" * 60)
            
        except Exception as e:
            print(f"\n❌ Seeding failed: {e}")


if __name__ == "__main__":
    seeder = DataSeeder()
    seeder.run()

