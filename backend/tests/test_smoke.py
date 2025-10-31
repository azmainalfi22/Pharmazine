import os
import requests

BASE_URL = os.getenv("API_BASE", "http://127.0.0.1:9000/api")

def test_health():
    r = requests.get(f"{BASE_URL}/health", timeout=10)
    assert r.status_code == 200
    data = r.json()
    assert data.get("status") == "OK"


