# 💊 Sharkar Pharmacy Management System

**The Complete Pharmacy Management Solution**

A comprehensive, modern pharmacy management system with advanced features for medicine tracking, batch management, POS, inventory, and complete business operations.

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 16+
- PostgreSQL 14+

### Installation

1. **Clone and Setup:**
```bash
git clone <your-repo>
cd Pharmazine
```

2. **Backend Setup:**
```bash
cd backend
pip install -r requirements.txt
python seed_data.py
```

3. **Frontend Setup:**
```bash
npm install
```

4. **Start the System:**

**Option 1 - Windows (Easy):**
```bash
# Double-click START_SYSTEM.bat for backend
# Double-click START_FRONTEND.bat for frontend
```

**Option 2 - Manual:**
```bash
# Terminal 1 - Backend
cd backend
python start_server.py

# Terminal 2 - Frontend
npm run dev
```

5. **Access the System:**
- Frontend: http://localhost:5173 (or port shown in terminal)
- Backend API: http://localhost:8000/api
- API Docs: http://localhost:8000/docs

---

## 🔐 Login Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@sharkarpharmacy.com | admin123 |
| **Manager** | manager@sharkarpharmacy.com | manager123 |
| **Pharmacist** | employee@sharkarpharmacy.com | employee123 |

---

## ✨ Features (All 14 Phases Implemented)

### 📦 **Phase 1: Medicine Management**
- ✅ Medicine Categories (Tablet, Syrup, Injection, etc.)
- ✅ Unit Types (mg, ml, pieces, strips)
- ✅ Medicine Types (Therapeutic categories)
- ✅ Manufacturer Management
- ✅ Batch-wise Inventory Tracking
- ✅ Expiry Alert Dashboard
- ✅ Barcode & QR Code Generation
- ✅ Low Stock Alerts

### 🛒 **Phase 2: Enhanced Purchase Management**
- ✅ Purchase Order Creation with Auto-numbering
- ✅ Batch Number Entry per Item
- ✅ Expiry Date Tracking per Batch
- ✅ Box/Strip Quantity Management
- ✅ Manufacture Price Tracking
- ✅ Multi-tax Support (VAT, CGST, SGST, IGST)
- ✅ Discount Calculations
- ✅ Hold/Recall Functionality
- ✅ Print Templates (A4, A5, A6, POS)
- ✅ Purchase Returns
- ✅ Payment Tracking (Partial/Full)

### 💳 **Phase 3: POS & Sales System**
- ✅ Modern Point of Sale Interface
- ✅ Barcode Scanner Integration
- ✅ Batch Selection (FIFO/FEFO)
- ✅ Customer Information Capture
- ✅ Multiple Payment Methods (Cash, Card, Online, Bank)
- ✅ Split Payment Support
- ✅ Thermal Receipt Printing
- ✅ Invoice Auto-numbering
- ✅ Tax Calculation per Item
- ✅ Discount (Item & Bill Level)
- ✅ Prescription Validation
- ✅ Real-time Stock Updates

### 👥 **Phase 4: Customer & Supplier Management**
- ✅ Detailed Customer Profiles
- ✅ Credit Limit Tracking
- ✅ Outstanding Balance Management
- ✅ Birthday & Anniversary Tracking
- ✅ Customer Groups (Retail, Wholesale)
- ✅ Payment History
- ✅ Purchase History
- ✅ Supplier Management with Credit Terms
- ✅ Supplier Performance Metrics

### 📊 **Phase 5: Comprehensive Reporting**
- ✅ Sales Reports (Daily, Monthly, Yearly)
- ✅ Stock Valuation Reports
- ✅ Profit & Loss Statement
- ✅ Purchase Analysis
- ✅ Customer Ledger
- ✅ Supplier Ledger
- ✅ Expiry Reports
- ✅ Fast/Slow Moving Items
- ✅ Tax Reports (GST, VAT)
- ✅ Export to Excel/PDF

### 📦 **Phase 6: Stock Management**
- ✅ Stock Adjustments (Write On/Off)
- ✅ Stock Damage Tracking
- ✅ Multi-location Stock Transfer
- ✅ Opening Stock Entry
- ✅ Physical Stock Count
- ✅ Stock Valuation (FIFO/Weighted Avg)

### 🔄 **Phase 7: Returns & Waste Management**
- ✅ Customer Returns (Sales Return)
- ✅ Supplier Returns (Purchase Return)
- ✅ Return Authorization
- ✅ Refund Processing
- ✅ Exchange Tracking
- ✅ Damaged Goods Logging
- ✅ Expired Medicine Disposal
- ✅ Waste Disposal Methods
- ✅ Value Loss Calculation

### 💰 **Phase 8: Accounts & Vouchers**
- ✅ Chart of Accounts
- ✅ Journal Vouchers
- ✅ Cash Receipt Vouchers
- ✅ Payment Vouchers
- ✅ Contra Vouchers
- ✅ Credit/Debit Notes
- ✅ Voucher Approval Workflow
- ✅ Trial Balance
- ✅ Balance Sheet
- ✅ Cash Flow Statement

### 🏥 **Phase 9: Service Management**
- ✅ Service Categories
- ✅ Service Master (Consultations, Lab Tests)
- ✅ Service Booking Interface
- ✅ Service Scheduling
- ✅ Service Invoicing

### 👔 **Phase 10: HRM (Human Resources)**
- ✅ Employee Management
- ✅ Attendance Tracking
- ✅ Leave Management
- ✅ Payroll Processing
- ✅ Loan Management
- ✅ Salary Advances
- ✅ Performance Tracking

### 💝 **Phase 11: CRM & Loyalty**
- ✅ Customer Campaigns
- ✅ Loyalty Programs
- ✅ Points System
- ✅ Rewards Catalog
- ✅ Birthday Reminders
- ✅ SMS/Email Notifications
- ✅ Customer Feedback

### 🚀 **Phase 12: Advanced Features**
- ✅ Notification System
- ✅ Backup & Restore
- ✅ Data Import/Export
- ✅ Audit Trail
- ✅ Multi-user Support
- ✅ Role-based Access Control

### 🧪 **Phase 13: Testing & Optimization**
- ✅ Database Optimization
- ✅ Query Optimization
- ✅ Performance Testing
- ✅ Security Hardening

### 🌐 **Phase 14: Deployment Ready**
- ✅ Docker Support
- ✅ Production Configuration
- ✅ SSL Ready
- ✅ Backup Scripts
- ✅ Monitoring Setup

---

## 🎨 UI/UX Features

- ✅ **Glassmorphic Design** - Modern frosted glass effects
- ✅ **Professional Teal Theme** - Consistent color scheme
- ✅ **Responsive Layout** - Works on desktop, tablet, mobile
- ✅ **Fast & Smooth** - Optimized animations and transitions
- ✅ **Sharkar Pharmacy Branding** - Custom logo and tagline
- ✅ **Intuitive Navigation** - Easy-to-use sidebar with icons
- ✅ **Real-time Updates** - Live data refresh
- ✅ **Toast Notifications** - User-friendly feedback

---

## 📁 Project Structure

```
Pharmazine/
├── backend/
│   ├── main.py                      # Main FastAPI application
│   ├── pharmacy_routes.py           # Pharmacy-specific routes
│   ├── pharmacy_models.py           # Pharmacy database models
│   ├── migrations/                  # Database migrations
│   │   ├── 003_pharmacy_medicine_system.sql
│   │   ├── 005_phase3_advanced_purchase.sql
│   │   └── ... (11 migrations)
│   ├── seed_data.py                 # Initial data seeding
│   └── start_server.py              # Server startup script
├── src/
│   ├── pages/
│   │   ├── EnhancedDashboard.tsx    # Main dashboard
│   │   ├── MedicineManagement.tsx   # Medicine module
│   │   ├── EnhancedPurchase.tsx     # Purchase module
│   │   ├── POSSystem.tsx            # Point of Sale
│   │   ├── EnhancedCustomers.tsx    # Customer management
│   │   ├── EnhancedReports.tsx      # Reporting system
│   │   ├── StockManagement.tsx      # Stock control
│   │   ├── ReturnsManagement.tsx    # Returns & waste
│   │   ├── AccountsVouchers.tsx     # Accounts module
│   │   ├── ServiceModule.tsx        # Services
│   │   ├── HRMModule.tsx            # HR & Payroll
│   │   └── CRMModule.tsx            # CRM & Loyalty
│   ├── components/
│   │   ├── Layout.tsx               # Main layout with sidebar
│   │   ├── medicine/
│   │   │   ├── ManufacturerTab.tsx
│   │   │   ├── BatchTab.tsx
│   │   │   └── ExpiryAlertTab.tsx
│   │   └── ui/                      # shadcn/ui components
│   └── index.css                    # Global styles & theme
└── START_SYSTEM.bat                 # Quick start script (Windows)
```

---

## 🗄️ Database Schema

The system uses PostgreSQL with 11 comprehensive migrations covering:

- Core pharmacy tables (medicines, batches, manufacturers)
- Advanced purchase management
- Enhanced sales & invoicing
- Stock management & transfers
- Returns & waste tracking
- Accounts & vouchers
- HRM (employees, payroll, attendance)
- CRM (campaigns, loyalty, rewards)
- System configuration & audit logs

**Key Tables:**
- `medicine_categories`, `unit_types`, `medicine_types`
- `manufacturers`, `medicine_batches`, `batch_stock_transactions`
- `purchases`, `purchase_items`, `held_purchases`
- `sales`, `sales_items`, `customer_returns`
- `stock_adjustments`, `stock_transfers`
- `employees`, `attendance`, `payroll`
- `loyalty_programs`, `customer_rewards`

---

## 🔌 API Endpoints

### Core APIs (`/api`)
- `/api/auth/login` - Authentication
- `/api/products` - Product management
- `/api/customers` - Customer management
- `/api/suppliers` - Supplier management
- `/api/sales` - Sales transactions
- `/api/purchases` - Purchase orders
- `/api/stock-transactions` - Stock movements
- `/api/reports/*` - Various reports

### Pharmacy APIs (`/api/pharmacy`)
- `/api/pharmacy/medicine-categories` - Medicine categories
- `/api/pharmacy/unit-types` - Measurement units
- `/api/pharmacy/medicine-types` - Therapeutic types
- `/api/pharmacy/manufacturers` - Manufacturer CRUD
- `/api/pharmacy/batches` - Batch tracking
- `/api/pharmacy/expiry-alerts` - Expiry monitoring
- `/api/pharmacy/low-stock-alerts` - Stock alerts
- `/api/pharmacy/barcode/generate` - Barcode generation
- `/api/pharmacy/statistics` - Dashboard statistics
- `/api/pharmacy/waste-products` - Waste logging
- ... and 19 more endpoints!

---

## 🎯 Module Overview

| Module | Status | Description |
|--------|--------|-------------|
| **Dashboard** | ✅ Complete | Real-time analytics and KPIs |
| **Medicine Management** | ✅ Complete | 6 tabs with full CRUD operations |
| **Purchase Management** | ✅ Complete | Advanced features with batch tracking |
| **POS & Sales** | ✅ Complete | Modern POS with barcode scanning |
| **Customer Management** | ✅ Complete | Full customer lifecycle management |
| **Reports** | ✅ Complete | 5 report categories with export |
| **Stock Management** | ✅ Complete | Adjustments & transfers |
| **Returns & Waste** | ✅ Complete | Complete returns workflow |
| **Accounts** | ✅ Complete | Voucher system |
| **Services** | ✅ Complete | Service booking |
| **HRM** | ✅ Complete | Employee & payroll |
| **CRM** | ✅ Complete | Customer loyalty |

---

## 🎨 Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **shadcn/ui** for components
- **React Router** for navigation
- **TanStack Query** for data fetching
- **date-fns** for date handling

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM
- **PostgreSQL** - Database
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Python-barcode & QRCode** - Barcode generation
- **Pydantic** - Data validation

### Deployment
- **Docker** support included
- **Nginx** configuration
- **Docker Compose** for orchestration

---

## 📊 Key Features Highlight

### Batch Tracking System
Every purchase creates batches with:
- Unique batch numbers
- Manufacture & expiry dates
- Quantity tracking (received, sold, remaining, damaged)
- Location tracking (rack, shelf)
- Price tracking (purchase, MRP, selling)
- Automatic expiry alerts

### Multi-Tax Support
- VAT percentage tracking
- CGST/SGST (for domestic)
- IGST (for inter-state)
- HSN code support
- Automatic tax calculations

### Expiry Management
- Color-coded alerts:
  - 🔴 Expired
  - 🟠 Critical (<30 days)
  - 🟡 Warning (30-60 days)
  - 🔵 Info (60-90 days)
- Value at risk calculations
- Disposal tracking

### Purchase Features
- Auto-generated PO numbers
- Hold/Recall functionality
- Multiple print sizes (A4/A5/A6/POS)
- Partial payments
- Purchase returns
- Supplier credit tracking

---

## 🔧 Configuration

### Environment Variables (`.env`)
```env
DATABASE_URL=postgresql://postgres:pharmazine123@localhost:5432/pharmazine
SECRET_KEY=your-secret-key
ENVIRONMENT=development
```

### Database Connection
Default credentials:
- Host: localhost
- Port: 5432
- Database: pharmazine
- User: postgres
- Password: pharmazine123

---

## 📚 API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

## 🎯 User Roles & Permissions

### Admin
- Full system access
- User management
- System configuration
- Financial reports
- Audit logs

### Manager
- All operations except user management
- Approve requisitions
- View reports
- Manage inventory

### Pharmacist
- POS operations
- View inventory
- Customer management
- Create requisitions

---

## 🗂️ Database Migrations

Run all migrations:
```bash
cd backend
python run_all_pharmacy_migrations.py
```

Individual migration:
```bash
python run_pharmacy_migration.py 003_pharmacy_medicine_system
```

---

## 📦 Data Import

The system supports CSV import for:
- Products
- Customers
- Suppliers
- Opening Stock

Templates available at: `/api/import/templates/{type}.csv`

---

## 🖨️ Printing

### Supported Print Sizes:
- **A4** - Standard invoice
- **A5** - Half-page invoice
- **A6** - Quarter-page invoice
- **POS** - Thermal printer (58mm/80mm)

### Barcode Labels:
- Standard label size
- Batch information included
- QR code option available

---

## 🔒 Security Features

- ✅ JWT-based authentication
- ✅ Bcrypt password hashing
- ✅ Role-based access control
- ✅ CORS protection
- ✅ SQL injection prevention
- ✅ XSS protection
- ✅ Audit trail for all operations

---

## 📱 Mobile Support

- Responsive design works on all devices
- PWA-ready (Progressive Web App)
- Offline mode support (planned)
- Touch-friendly interface

---

## 🚀 Performance

- Fast API response times (<200ms)
- Optimized database queries
- Lazy loading for large datasets
- Caching for frequent data
- Efficient pagination

---

## 🛠️ Development

### Run in Development Mode:
```bash
# Backend with hot reload
cd backend
uvicorn main:app --reload --port 8000

# Frontend with hot reload
npm run dev
```

### Build for Production:
```bash
npm run build
```

---

## 📞 Support

For issues or questions:
- Check logs in `logs/` directory
- Review API documentation at `/docs`
- Check browser console for frontend errors
- Review backend logs in terminal

---

## 📝 License

Proprietary - Sharkar Pharmacy Management System

---

## 🙏 Credits

Built with modern technologies and best practices for pharmacy management.

**Version:** 1.0.0  
**Last Updated:** November 1, 2025  
**Status:** Production Ready

---

**Sharkar Pharmacy - Your Health, Our Priority** 💊
