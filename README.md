# Sharkar Pharmacy - The Best Pharmacy Management System

A comprehensive, professional-grade pharmacy management system with complete automation, modern invoicing, revenue management, inventory tracking, and business intelligence. Built with React, TypeScript, FastAPI, and PostgreSQL.

## 🏆 Complete Feature Set

### Core Modules (All 14 Phases Implemented)
- ✅ **Medicine Management**: Batch tracking, expiry alerts, barcode/QR generation
- ✅ **Customer & Manufacturer Management**: Credit limits, statements, profit/loss tracking
- ✅ **Advanced Purchase System**: Hold/recall, batch tracking, multiple print formats
- ✅ **Comprehensive Reporting**: User/Product/Category-wise reports, profit/loss analysis
- ✅ **Enhanced Invoice System**: Barcode scanning, professional templates, coupons
- ✅ **Stock Management**: Valuation, batch details, fast/slow/dead stock analysis
- ✅ **Return Management**: Customer & supplier returns, bulk processing
- ✅ **Service Management**: Bookings, packages, reviews, ratings
- ✅ **Accounts Management**: Chart of Accounts, vouchers, journal entries, trial balance
- ✅ **HRM**: Attendance, leaves, payroll, loans, internal messaging
- ✅ **Advanced Features**: Auto-backup, printer config, search history
- ✅ **Branding & UI**: Custom themes, dashboard widgets, user preferences
- ✅ **CRM & Marketing**: Campaigns, loyalty program, offers, birthday automation
- ✅ **Complete Automation**: Automated alerts, reminders, and scheduled tasks

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Components**: shadcn/ui, Tailwind CSS
- **Database**: PostgreSQL
- **State Management**: React Context API
- **Routing**: React Router DOM
- **Forms**: React Hook Form with Zod validation

## 🚀 Quick Start (Complete System)

### Prerequisites

- Node.js 18+ 
- PostgreSQL 12+
- Python 3.9+ (for backend)
- npm or yarn

### Complete Setup (5 Minutes)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Pharmazine
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. **Run Complete Pharmacy Migration**
   ```bash
   # This will set up ALL 14 phases of the system
   python run_all_pharmacy_migrations.py
   ```

4. **Start backend server**
   ```bash
   python main.py
   # Backend will run on http://localhost:9000
   ```

5. **Install frontend dependencies & start**
   ```bash
   cd ..
   npm install
   npm run dev
   # Frontend will run on http://localhost:5173
   ```

6. **Access the system**
   - Frontend: http://localhost:5173
   - API Docs: http://localhost:9000/docs
   - Medicine Management: http://localhost:5173/medicine-management

## 🏆 All 14 Phases Implemented

1. ✅ Medicine Management - Categories, batches, expiry tracking, barcode/QR
2. ✅ Customer & Manufacturer - Credit limits, birthdays, statements
3. ✅ Advanced Purchase - Hold/recall, batch tracking, print formats
4. ✅ Comprehensive Reporting - User/product/category reports, P&L
5. ✅ Enhanced Invoice - Barcode scanning, templates, coupons
6. ✅ Stock Management - Valuation, fast/slow/dead stock analysis
7. ✅ Return Management - Customer & supplier returns, bulk processing
8. ✅ Service Management - Bookings, packages, invoices
9. ✅ Accounts Management - Chart of Accounts, vouchers, trial balance
10. ✅ HRM - Attendance, leaves, payroll, internal messaging
11. ✅ Advanced Features - Auto-backup, printer config, search
12. ✅ Branding & UI - Professional teal theme, dashboard widgets
13. ✅ CRM & Marketing - Campaigns, loyalty program, birthday automation
14. ✅ Complete System - 100+ tables, 30+ views, 20+ functions

## Login Credentials

The system comes with pre-configured user accounts:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@sharkarpharmacy.com | admin123 |
| Manager | manager@sharkarpharmacy.com | manager123 |
| Pharmacist | employee@sharkarpharmacy.com | employee123 |

## Database Schema

The system includes the following main entities:

### Core Pharmacy Tables:
- **Users & Roles**: User management with role-based permissions
- **Products/Medicines**: Complete medicine catalog with batch tracking
- **Medicine Categories**: Dosage forms (Tablet, Syrup, Injection, etc.)
- **Medicine Types**: Therapeutic categories (Painkiller, Antibiotic, etc.)
- **Medicine Batches**: Individual batches with expiry tracking
- **Manufacturers**: Medicine suppliers and manufacturers
- **Customers**: Patient and customer management
- **Sales & Sales Items**: POS and invoice management
- **Purchases**: Medicine procurement with batch tracking
- **Stock Transactions**: Complete inventory movement tracking
- **Service Management**: Healthcare services and bookings
- **Accounts**: Complete double-entry accounting system
- **HRM**: Employee, payroll, and attendance management

## Sample Data

The database includes comprehensive pharmacy sample data:

- **3 user accounts** (Admin, Manager, Pharmacist)
- **15 medicine categories** (Tablet, Syrup, Injection, etc.)
- **23 medicine types** (Painkiller, Antibiotic, Diabetes, etc.)
- **15 unit types** (mg, ml, piece, strip, etc.)
- **50+ sample medicines** including common drugs and supplements
- **15 suppliers** (Pharmaceutical distributors)
- **30+ customers** (Pharmacies, hospitals, clinics, individuals)
- **Sample batches** with expiry tracking
- **Chart of Accounts** (40+ accounts)
- **Service categories** (Home delivery, health checkups, etc.)

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── inventory/      # Inventory-specific components
│   └── setup/          # Setup and configuration components
├── contexts/           # React contexts (Auth, etc.)
├── hooks/              # Custom React hooks
├── integrations/       # External service integrations
│   └── postgresql/     # PostgreSQL client and types
├── lib/                # Utility functions
├── pages/              # Page components
└── main.tsx           # Application entry point
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Environment Variables

Create a `.env.local` file with the following variables:

```env
# PostgreSQL Database Configuration
DATABASE_URL=postgresql://postgres:pharmazine123@localhost:5432/pharmazine
VITE_DATABASE_HOST=localhost
VITE_DATABASE_PORT=5432
VITE_DATABASE_NAME=pharmazine
VITE_DATABASE_USER=postgres
VITE_DATABASE_PASSWORD=pharmazine123

# Application Configuration
VITE_APP_NAME=Pharmazine
VITE_APP_VERSION=1.0.0
VITE_NODE_ENV=development
VITE_DEBUG=true
```

## Features Overview

### Dashboard
- Overview of key metrics
- Recent sales and inventory alerts
- Quick access to common tasks

### Inventory Management
- Product catalog with detailed specifications
- Stock level monitoring
- Low stock alerts
- Stock transaction history

### Sales Management
- Complete sales workflow
- EMI (Equated Monthly Installment) support
- Multiple payment methods
- Sales reporting

### User Management
- Role-based access control
- User profile management
- Permission management

### Setup & Configuration
- Category and subcategory management
- Supplier and customer management
- Country reference data
- System configuration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository.

---

**Sharkar Pharmacy** - Professional pharmacy management system with comprehensive business solutions powered by Pharmazine technology.