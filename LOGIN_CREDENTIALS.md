# Pharmazine - Login Credentials

## ✅ SYSTEM IS RUNNING

**Frontend:** http://localhost:8080  
**Backend API:** http://localhost:8000  
**API Docs:** http://localhost:8000/docs  
**Database:** PostgreSQL in Docker (port 5432)

---

## 🔑 LOGIN CREDENTIALS

All logins are **VERIFIED and WORKING**:

### Admin Account
- **Email:** `admin@pharmazine.com`
- **Password:** `admin123`
- **Role:** Administrator
- **Access:** Full system access

### Manager Account
- **Email:** `manager@pharmazine.com`
- **Password:** `manager123`
- **Role:** Manager
- **Access:** Operations & reports

### Employee Account
- **Email:** `employee@pharmazine.com`
- **Password:** `employee123`
- **Role:** Employee
- **Access:** Sales & basic operations

---

## 📊 System Status

✅ **Docker PostgreSQL:** Running  
✅ **Backend API:** Running on port 8000  
✅ **Frontend:** Running on port 8080  
✅ **Database Connection:** Connected  
✅ **All 3 Logins:** Tested and working  

---

## 🚀 Quick Start

1. **Open Browser:** http://localhost:8080
2. **Click "Sign In"**
3. **Use any of the credentials above**

---

## 🔄 To Restart System

### Stop Everything:
```bash
# Stop backend
Get-Process | Where-Object {$_.Name -like "*python*"} | Stop-Process -Force

# Stop frontend
Get-Process | Where-Object {$_.Name -like "*node*"} | Stop-Process -Force

# Stop Docker
docker-compose down
```

### Start Everything:
```bash
# 1. Start database
docker-compose up -d postgres

# 2. Start backend (in project root)
$env:DATABASE_URL="postgresql://postgres:pharmazine123@localhost:5432/pharmazine"
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload

# 3. Start frontend (in new terminal)
npm run dev
```

---

## 📝 Notes

- Passwords are hashed using bcrypt
- Backend automatically reloads on code changes
- Frontend uses hot module replacement
- Database data persists across Docker restarts

---

**Last Updated:** November 1, 2025  
**Status:** All systems operational ✅

