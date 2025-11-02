"""
Comprehensive API endpoint test
Tests all critical endpoints to verify system completion
"""

import requests
import json

BASE_URL = "http://localhost:8000/api"
TOKEN = None

def test_endpoint(method, endpoint, data=None, description=""):
    """Test an API endpoint"""
    headers = {"Content-Type": "application/json"}
    if TOKEN:
        headers["Authorization"] = f"Bearer {TOKEN}"
    
    try:
        if method == "GET":
            response = requests.get(f"{BASE_URL}{endpoint}", headers=headers, timeout=5)
        elif method == "POST":
            response = requests.post(f"{BASE_URL}{endpoint}", headers=headers, json=data, timeout=5)
        
        status = "OK" if response.status_code < 400 else "FAIL"
        print(f"[{status}] {method:6} {endpoint:50} | {response.status_code}")
        return response.status_code < 400
    except Exception as e:
        print(f"[ERROR] {method:6} {endpoint:50} | {str(e)[:30]}")
        return False

def main():
    global TOKEN
    
    print("=" * 80)
    print("SHARKAR PHARMACY - COMPLETE SYSTEM TEST")
    print("=" * 80)
    
    # Test authentication
    print("\n--- AUTHENTICATION ---")
    response = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "admin@sharkarpharmacy.com",
        "password": "admin123"
    })
    if response.status_code == 200:
        TOKEN = response.json().get("access_token")
        print(f"[OK] Login successful - Token obtained")
    else:
        print("[FAIL] Login failed - Cannot proceed with tests")
        return
    
    # Test Core APIs
    print("\n--- CORE APIs ---")
    test_endpoint("GET", "/products", description="Get all products")
    test_endpoint("GET", "/sales", description="Get all sales")
    test_endpoint("GET", "/customers", description="Get all customers")
    test_endpoint("GET", "/suppliers", description="Get all suppliers")
    test_endpoint("GET", "/categories", description="Get all categories")
    
    # Test Pharmacy APIs
    print("\n--- PHARMACY APIs ---")
    test_endpoint("GET", "/pharmacy/medicine-categories")
    test_endpoint("GET", "/pharmacy/unit-types")
    test_endpoint("GET", "/pharmacy/medicine-types")
    test_endpoint("GET", "/pharmacy/manufacturers")
    test_endpoint("GET", "/pharmacy/batches")
    test_endpoint("GET", "/pharmacy/expiry-alerts?days=30")
    test_endpoint("GET", "/pharmacy/low-stock-alerts")
    test_endpoint("GET", "/pharmacy/statistics/medicines")
    test_endpoint("GET", "/pharmacy/waste-products")
    
    # Test Service APIs
    print("\n--- SERVICE APIs ---")
    test_endpoint("GET", "/services/categories")
    test_endpoint("GET", "/services")
    test_endpoint("GET", "/services/bookings/all")
    
    # Test HRM APIs
    print("\n--- HRM APIs ---")
    test_endpoint("GET", "/hrm/employees")
    test_endpoint("GET", "/hrm/attendance")
    test_endpoint("GET", "/hrm/leaves")
    test_endpoint("GET", "/hrm/payroll")
    
    # Test Purchase APIs
    print("\n--- PURCHASE APIs ---")
    test_endpoint("GET", "/purchases")
    test_endpoint("GET", "/grns")
    
    # Test Finance APIs
    print("\n--- FINANCE APIs ---")
    test_endpoint("GET", "/transactions")
    test_endpoint("GET", "/expenses")
    test_endpoint("GET", "/reports/profit-loss")
    
    # Test Stock Management
    print("\n--- STOCK MANAGEMENT ---")
    test_endpoint("GET", "/stock-transactions")
    
    print("\n" + "=" * 80)
    print("TEST COMPLETE")
    print("=" * 80)

if __name__ == "__main__":
    main()

