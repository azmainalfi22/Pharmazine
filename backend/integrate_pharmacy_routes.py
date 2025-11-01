"""
Script to test pharmacy routes integration
"""
import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

try:
    from pharmacy_routes import router as pharmacy_router
    from pharmacy_models import (
        MedicineCategory, UnitType, MedicineType, 
        Manufacturer, MedicineBatch
    )
    
    print("[OK] Pharmacy routes imported successfully!")
    print(f"[OK] Router prefix: {pharmacy_router.prefix}")
    print(f"[OK] Number of routes: {len(pharmacy_router.routes)}")
    print("\n[OK] Available endpoints:")
    
    for route in pharmacy_router.routes[:10]:
        print(f"  - {route.methods} {route.path}")
    
    print(f"\n[OK] Total pharmacy endpoints: {len(pharmacy_router.routes)}")
    print("\n[SUCCESS] Pharmacy integration ready!")
    
except Exception as e:
    print(f"[ERROR] Failed to import pharmacy routes: {e}")
    import traceback
    traceback.print_exc()

