"""
Test login authentication
"""

import requests
import json

def test_login():
    url = "http://localhost:9000/api/auth/login"
    
    test_users = [
        {"email": "admin@sharkarpharmacy.com", "password": "admin123"},
        {"email": "manager@sharkarpharmacy.com", "password": "manager123"},
        {"email": "employee@sharkarpharmacy.com", "password": "employee123"},
    ]
    
    print("Testing login endpoints...\n")
    
    for user in test_users:
        try:
            response = requests.post(url, json=user, timeout=5)
            print(f"Email: {user['email']}")
            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"SUCCESS! Token received: {data.get('access_token', '')[:50]}...")
            else:
                print(f"FAILED! Response: {response.text}")
            print("-" * 50)
        except requests.exceptions.ConnectionError:
            print(f"Email: {user['email']}")
            print("ERROR: Cannot connect to backend server!")
            print("Make sure the backend is running on http://localhost:9000")
            print("-" * 50)
            break
        except Exception as e:
            print(f"Email: {user['email']}")
            print(f"ERROR: {e}")
            print("-" * 50)

if __name__ == "__main__":
    test_login()

