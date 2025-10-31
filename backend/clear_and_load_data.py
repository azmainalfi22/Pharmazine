"""
Clear all existing data and load pharmacy sample data
"""

import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Database connection
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/volt_dealer_suite")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

def clear_all_data(session):
    """Clear all data in correct order to avoid foreign key constraints"""
    print("\n" + "="*60)
    print("CLEARING ALL EXISTING DATA")
    print("="*60)
    
    try:
        # Delete in reverse order of dependencies
        print("\n[1/15] Deleting sales items...")
        session.execute(text("DELETE FROM sales_items"))
        
        print("[2/15] Deleting sales...")
        session.execute(text("DELETE FROM sales"))
        
        print("[3/15] Deleting requisition items...")
        session.execute(text("DELETE FROM requisition_items"))
        
        print("[4/15] Deleting requisitions...")
        session.execute(text("DELETE FROM requisitions"))
        
        print("[5/15] Deleting purchase items...")
        session.execute(text("DELETE FROM purchase_items"))
        
        print("[6/15] Deleting GRNs...")
        session.execute(text("DELETE FROM grns"))
        
        print("[7/15] Deleting purchases...")
        session.execute(text("DELETE FROM purchases"))
        
        print("[8/15] Deleting product stock...")
        session.execute(text("DELETE FROM product_stock"))
        
        print("[9/15] Deleting stock transactions...")
        session.execute(text("DELETE FROM stock_transactions"))
        
        print("[10/15] Deleting transactions...")
        session.execute(text("DELETE FROM transactions"))
        
        print("[11/15] Deleting expenses...")
        session.execute(text("DELETE FROM expenses"))
        
        print("[12/15] Deleting audit logs...")
        session.execute(text("DELETE FROM audit_logs"))
        
        print("[13/15] Deleting products...")
        session.execute(text("DELETE FROM products"))
        
        print("[14/15] Deleting customers...")
        session.execute(text("DELETE FROM customers"))
        
        print("[15/15] Deleting suppliers...")
        session.execute(text("DELETE FROM suppliers"))
        
        session.commit()
        print("\n[OK] All existing data cleared successfully!")
        
    except Exception as e:
        print(f"\n[ERROR] Failed to clear data: {e}")
        session.rollback()
        raise

def main():
    """Main function"""
    session = SessionLocal()
    
    try:
        # Clear all data
        clear_all_data(session)
        
        print("\n" + "="*60)
        print("DATA CLEARED - NOW LOADING SAMPLE DATA")
        print("="*60)
        
        # Close this session
        session.close()
        
        # Now run the load_sample_data script
        print("\nRunning sample data loader...\n")
        
        # Import and run the loader
        sys.path.insert(0, os.path.dirname(__file__))
        from load_sample_data import main as load_main
        load_main()
        
    except Exception as e:
        print(f"\n[ERROR] Operation failed: {e}")
        session.rollback()
        session.close()
        sys.exit(1)

if __name__ == "__main__":
    main()

