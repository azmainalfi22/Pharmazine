#!/usr/bin/env python3
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

db_url = os.getenv('DATABASE_URL', 'postgresql://postgres:pharmazine123@localhost:5432/pharmazine')

try:
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    
    with open('migrations/013_enhance_customer_table.sql', 'r', encoding='utf-8') as f:
        sql = f.read()
        
    # Execute migration
    cur.execute(sql)
    conn.commit()
    
    print('[OK] Migration 013_enhance_customer_table.sql executed successfully')
    
    # Verify tables were created
    cur.execute("""
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name LIKE '%customer%' OR table_name LIKE '%loyalty%' OR table_name LIKE '%campaign%'
        ORDER BY table_name
    """)
    tables = cur.fetchall()
    print(f'[OK] Customer-related tables: {[t[0] for t in tables]}')
    
    cur.close()
    conn.close()
    
except Exception as e:
    print(f'[ERROR] Migration failed: {e}')
    if 'conn' in locals():
        conn.rollback()
        conn.close()
    raise

