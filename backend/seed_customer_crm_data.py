#!/usr/bin/env python3
"""
Seed Customer and CRM data into the database
"""
import psycopg2
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta
import random

load_dotenv()

db_url = os.getenv('DATABASE_URL', 'postgresql://postgres:pharmazine123@localhost:5432/pharmazine')

try:
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    
    print("[INFO] Updating existing customers with enhanced fields...")
    
    # Get existing customer IDs
    cur.execute("SELECT id, name FROM customers LIMIT 20")
    customers = cur.fetchall()
    
    # Sample data for enhancement
    customer_groups = ['Regular', 'VIP', 'Wholesale', 'Corporate', None]
    payment_terms = ['Cash', 'Credit 30 days', 'Credit 60 days', 'Credit 90 days']
    
    for idx, (customer_id, name) in enumerate(customers):
        email = f"{name.lower().replace(' ', '.')}@example.com"
        phone = f"+20-11{idx:02d}-{random.randint(100000, 999999)}"
        company = name if "Farm" in name or "Ltd" in name else None
        customer_group = random.choice(customer_groups)
        credit_limit = random.choice([5000, 10000, 25000, 50000, 100000])
        opening_balance = random.randint(0, 5000)
        current_balance = opening_balance + random.randint(-2000, 5000)
        discount_percentage = random.choice([0, 5, 10, 15])
        payment_term = random.choice(payment_terms)
        
        # Random birthday (age 25-65)
        age = random.randint(25, 65)
        birthday = (datetime.now() - timedelta(days=age*365 + random.randint(0, 365))).date()
        
        cur.execute("""
            UPDATE customers
            SET 
                email = %s,
                phone = %s,
                company = %s,
                customer_group = %s,
                credit_limit = %s,
                opening_balance = %s,
                current_balance = %s,
                birthday = %s,
                discount_percentage = %s,
                payment_terms = %s,
                is_active = true
            WHERE id = %s
        """, (email, phone, company, customer_group, credit_limit, opening_balance, 
              current_balance, birthday, discount_percentage, payment_term, customer_id))
    
    conn.commit()
    print(f"[OK] Updated {len(customers)} customers with enhanced fields")
    
    # Add loyalty points for some customers
    print("[INFO] Adding loyalty points for customers...")
    
    loyalty_transactions = []
    for customer_id, _ in customers[:10]:  # Add points for first 10 customers
        # Earn points from purchases
        for _ in range(random.randint(2, 8)):
            points = random.randint(20, 150)
            trans_type = random.choice(['earn', 'earn', 'earn', 'redeem'])
            ref_type = 'purchase' if trans_type == 'earn' else 'reward'
            loyalty_transactions.append((
                customer_id, points if trans_type == 'earn' else -points, 
                trans_type, ref_type, f"AUTO-{random.randint(1000, 9999)}",
                "Automatic loyalty points", datetime.now() - timedelta(days=random.randint(1, 180))
            ))
    
    cur.executemany("""
        INSERT INTO customer_loyalty_points 
        (customer_id, points, transaction_type, reference_type, reference_id, notes, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """, loyalty_transactions)
    
    conn.commit()
    print(f"[OK] Added {len(loyalty_transactions)} loyalty point transactions")
    
    # Verify the data
    cur.execute("""
        SELECT customer_name, total_points, tier, total_purchases
        FROM customer_loyalty_stats
        ORDER BY total_points DESC
        LIMIT 5
    """)
    top_customers = cur.fetchall()
    
    print("\n[OK] Top 5 loyalty customers:")
    for name, points, tier, purchases in top_customers:
        print(f"  - {name}: {points} points ({tier}) - {purchases} purchases")
    
    # Count active campaigns
    cur.execute("SELECT COUNT(*) FROM marketing_campaigns")
    campaign_count = cur.fetchone()[0]
    print(f"\n[OK] Active marketing campaigns: {campaign_count}")
    
    # Count available rewards
    cur.execute("SELECT COUNT(*) FROM loyalty_rewards WHERE is_active = true")
    reward_count = cur.fetchone()[0]
    print(f"[OK] Active rewards: {reward_count}")
    
    print("\n[SUCCESS] Customer and CRM data seeded successfully!")
    
    cur.close()
    conn.close()
    
except Exception as e:
    print(f'[ERROR] Seeding failed: {e}')
    if 'conn' in locals():
        conn.rollback()
        conn.close()
    raise

