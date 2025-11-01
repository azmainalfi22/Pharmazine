# 🔧 Backend Server Restart Instructions

## The Issue
CORS error - Frontend on `http://localhost:8082` couldn't connect to backend on `http://localhost:8000`

## The Fix
Added port 8082 to the CORS allowed origins in `backend/main.py`

## ✅ Steps to Apply the Fix:

### 1. Stop the current backend server
- If running in a terminal, press `Ctrl+C`
- If running in the background, find and kill the process

### 2. Start the backend server again

**Option A - Using Python directly:**
```bash
cd backend
python main.py
```

**Option B - Using uvicorn:**
```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Verify backend is running
Open in browser: `http://localhost:8000/api/health`

Should return: `{"status": "OK", "database": "Connected"}`

### 4. Try logging in again

**Login Credentials:**
- **Admin:** admin@sharkarpharmacy.com / admin123
- **Manager:** manager@sharkarpharmacy.com / manager123  
- **Pharmacist:** employee@sharkarpharmacy.com / employee123

---

**After restarting the backend, your login should work! 🎉**

