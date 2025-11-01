"""
Comprehensive server startup script for Pharmazine
"""
import uvicorn
import sys
from pathlib import Path

# Ensure backend directory is in path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

print("=" * 70)
print("SHARKAR PHARMACY MANAGEMENT SYSTEM")
print("=" * 70)
print()
print("Starting FastAPI server...")
print("API Base URL: http://localhost:8000/api")
print("Health Check: http://localhost:8000/api/health")
print("Pharmacy API: http://localhost:8000/api/pharmacy")
print()
print("Login Credentials:")
print("  Admin:      admin@sharkarpharmacy.com    / admin123")
print("  Manager:    manager@sharkarpharmacy.com  / manager123")
print("  Pharmacist: employee@sharkarpharmacy.com / employee123")
print()
print("=" * 70)
print()

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )

