# 🌐 LOCAL ACCESS GUIDE - SHARKAR FEED & MEDICINE

## ✅ **PROJECT IS LIVE AND RUNNING!**

**Status:** 🟢 **ALL SYSTEMS OPERATIONAL**  
**Date:** October 31, 2025  
**Time:** 12:55 PM

---

## 🚀 **ACCESS YOUR APPLICATION**

### 🎯 **MAIN APPLICATION (FRONTEND)**
```
🌐 URL: http://localhost
```
**This is your main application interface!**
- Modern, responsive UI
- Login page ready
- All features accessible

---

## 🔐 **LOGIN CREDENTIALS**

### **Admin Account (Full Access)**
```
Email:    admin@voltdealer.com
Password: admin123
```
✅ Can access all features including:
- Dashboard
- Inventory Management
- Purchases & GRN
- Sales/POS
- Requisitions (create & approve)
- Payments (record & clear)
- Finance Module
- Audit Logs
- Import Tools
- User Management
- Setup & Configuration

---

### **Manager Account (Limited Admin)**
```
Email:    manager1@voltdealer.com
Password: manager123
```
✅ Can access:
- Dashboard
- Inventory
- Purchases & GRN
- Sales/POS
- Requisitions (create & approve)
- Payments (record only)

---

### **Salesman/Employee Account (Sales Only)**
```
Email:    employee1@voltdealer.com
Password: employee123
```
✅ Can access:
- Dashboard
- Inventory (view only)
- Sales/POS
- Requisitions (create only)
- Payments (record only)

❌ Cannot access:
- Finance Module
- Audit Logs
- Import Tools
- User Management
- Setup & Configuration

---

## 🛠️ **DEVELOPER TOOLS**

### **Backend API Documentation**
```
🌐 Swagger UI: http://localhost:9000/docs
🌐 ReDoc:      http://localhost:9000/redoc
```
Interactive API documentation with:
- All endpoints listed
- Try-it-out functionality
- Request/response schemas
- Authentication testing

---

### **Database Management (PgAdmin)**
```
🌐 URL: http://localhost:8082

Login:
  Email:    admin@admin.com
  Password: admin
```
**Connect to Database:**
- Host: postgres
- Port: 5432
- Database: dealer_db
- Username: dealer_user
- Password: dealer_password

---

### **Redis Cache Management**
```
🌐 URL: http://localhost:8081
```
View and manage Redis cache data:
- Session data
- Cached queries
- Real-time monitoring

---

## 📊 **DOCKER CONTAINERS STATUS**

### **Running Services:**
```
✅ Frontend (Nginx)         → Port 80
✅ Backend (FastAPI)        → Port 9000
✅ PostgreSQL Database      → Port 5432
✅ Redis Cache              → Port 6379
✅ PgAdmin                  → Port 8082
✅ Redis Commander          → Port 8081
```

### **Check Container Status:**
```powershell
docker ps
```

### **View Container Logs:**
```powershell
# Frontend logs
docker logs volt-dealer-frontend

# Backend logs
docker logs volt-dealer-backend

# Database logs
docker logs volt-dealer-postgres
```

### **Restart All Services:**
```powershell
docker compose restart
```

### **Stop All Services:**
```powershell
docker compose down
```

### **Start All Services:**
```powershell
docker compose up -d
```

---

## 🧪 **QUICK TEST WORKFLOW** (5 Minutes)

### **Test 1: Login & Dashboard**
1. Open http://localhost
2. Login with admin credentials
3. View dashboard statistics

### **Test 2: Create a Product**
1. Navigate to "Products"
2. Click "Add New Product"
3. Fill in details
4. Save

### **Test 3: Create a Purchase Order**
1. Navigate to "Purchases & GRN"
2. Select a supplier
3. Add products
4. Click "Confirm GRN (Quick)"
5. Verify stock updated

### **Test 4: Make a Sale (POS)**
1. Navigate to "Sales"
2. Add products to cart
3. Enter customer details
4. Select payment method
5. Complete sale
6. Download PDF invoice

### **Test 5: Create a Requisition**
1. Logout, login as salesman
2. Navigate to "Requisitions"
3. Click "Create Requisition"
4. Add products
5. Submit

### **Test 6: Approve Requisition**
1. Logout, login as admin
2. Navigate to "Requisitions"
3. Click "Approve" on pending requisition
4. Verify status changed

### **Test 7: View Finance Reports**
1. Navigate to "Finance"
2. View Profit & Loss
3. View Trial Balance
4. Export to Excel

### **Test 8: Audit Logs**
1. Navigate to "Audit Logs"
2. View all activities
3. Filter by action type
4. Export to CSV

---

## 📁 **IMPORT SAMPLE DATA**

### **Step 1: Download CSV Templates**
1. Login as admin
2. Navigate to "Import Data"
3. Download templates for:
   - Products
   - Suppliers
   - Customers
   - Opening Stock

### **Step 2: Fill Templates**
1. Open templates in Excel
2. Fill with your data
3. Save as CSV

### **Step 3: Upload & Import**
1. Select import type
2. Choose CSV file
3. Upload
4. Verify import results

---

## 🔍 **TROUBLESHOOTING**

### **Problem: Can't access http://localhost**
**Solution:**
```powershell
# Check if frontend is running
docker ps | findstr frontend

# Restart frontend
docker restart volt-dealer-frontend

# Check logs
docker logs volt-dealer-frontend
```

### **Problem: Login not working**
**Solution:**
```powershell
# Check backend is running
docker ps | findstr backend

# Check backend logs
docker logs volt-dealer-backend

# Test API health
Invoke-WebRequest -Uri http://localhost:9000/api/health
```

### **Problem: Database connection error**
**Solution:**
```powershell
# Check database is running
docker ps | findstr postgres

# Restart database
docker restart volt-dealer-postgres
```

### **Problem: Containers showing as "unhealthy"**
**Solution:**
This is usually a health check timing issue. If the application is accessible, you can ignore it.

```powershell
# Restart specific container
docker restart volt-dealer-backend
docker restart volt-dealer-frontend
```

---

## 🎯 **RECOMMENDED FIRST STEPS**

### **For First-Time Setup:**
1. ✅ Access http://localhost
2. ✅ Login as admin
3. ✅ Navigate to "Setup" → Add categories
4. ✅ Navigate to "Setup" → Add suppliers
5. ✅ Navigate to "Products" → Add products
6. ✅ Navigate to "Purchases & GRN" → Add stock
7. ✅ Navigate to "Sales" → Make first sale
8. ✅ Test all features

### **For Development:**
1. ✅ Access API docs at http://localhost:9000/docs
2. ✅ Test API endpoints
3. ✅ Check database via PgAdmin
4. ✅ Monitor Redis cache
5. ✅ Review Docker logs

---

## 📞 **SUPPORT & DOCUMENTATION**

### **Documentation Files:**
- `README.md` - Project overview
- `PHARMACY_README.md` - Feature specifications
- `COMPLETE_FEATURE_LIST.md` - All features detailed
- `DEPLOYMENT_COMPLETE.md` - Deployment guide
- `docs/ERD.md` - Database schema

### **API Documentation:**
- Swagger: http://localhost:9000/docs
- ReDoc: http://localhost:9000/redoc

---

## 🎉 **YOU'RE ALL SET!**

### **✅ Application Running:**
- Frontend: http://localhost
- Backend: http://localhost:9000
- Database: Running
- Cache: Running

### **✅ Ready to Use:**
- 50+ Features
- 15+ Pages
- 80+ API Endpoints
- PDF & Excel Exports
- Audit Logging
- Role-Based Access

### **✅ Test Accounts:**
- Admin, Manager, Salesman credentials provided

---

## 🚀 **START USING YOUR APPLICATION NOW!**

**👉 Open your browser and go to:**
```
http://localhost
```

**Login with admin credentials and explore all features!**

---

**🎊 ENJOY YOUR NEW PHARMACY & FEED MANAGEMENT SYSTEM! 🎊**


