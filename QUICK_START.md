# Quick Setup Guide - Sharkar Pharmacy Management System

## 🚀 Get Started in 5 Minutes

### Step 1: Prerequisites
- **PostgreSQL** installed and running
- **Node.js** 18+ installed
- **npm** or **yarn** package manager

### Step 2: Database Setup

**Option A: Automated Setup (Recommended)**
```bash
# Windows
setup_postgresql.bat

# macOS/Linux
chmod +x setup_postgresql.sh
./setup_postgresql.sh
```

**Option B: Manual Setup**
```bash
# 1. Create database
createdb pharmazine

# 2. Run setup script
psql -d pharmazine -f database_setup.sql

# 3. Create environment file
cp env.example .env.local
# Edit .env.local with your database credentials
```

### Step 3: Start the Application
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Step 4: Access the Application
Open your browser and go to: **http://localhost:5173**

### Step 5: Login with Demo Accounts
| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@sharkarpharmacy.com | admin123 |
| **Manager** | manager@sharkarpharmacy.com | manager123 |
| **Employee** | employee@sharkarpharmacy.com | employee123 |

## 🎯 What You'll See

- **Dashboard**: Overview of inventory and sales metrics
- **Inventory**: Product catalog with detailed specifications
- **Sales**: Complete sales management with EMI support
- **Users**: Role-based user management
- **Setup**: Configuration for categories, suppliers, customers
- **Reports**: Business analytics and reporting

## 📊 Sample Data Included

- **10 Products**: Smartphones, laptops, LED bulbs, fans, air conditioners
- **6 Users**: Different roles (admin, manager, employee)
- **6 Suppliers**: Electronics suppliers
- **8 Customers**: Sample customer data
- **5 Sales**: Sample transactions with different payment methods
- **Stock Transactions**: Complete inventory movement history

## 🔧 Troubleshooting

**Database Connection Issues:**
- Ensure PostgreSQL is running
- Check database credentials in `.env.local`
- Verify database exists: `psql -l`

**Port Already in Use:**
- Change port in `vite.config.ts`
- Or kill process using port 5173

**Missing Dependencies:**
- Run `npm install` again
- Clear node_modules and reinstall if needed

## 📚 Next Steps

1. **Explore the Interface**: Navigate through different sections
2. **Add Products**: Create new products in the inventory section
3. **Make Sales**: Process sales transactions
4. **Manage Users**: Add new users with appropriate roles
5. **Customize**: Modify categories, suppliers, and settings

## 🆘 Need Help?

- Check the main README.md for detailed documentation
- Review the database schema in `database_setup.sql`
- Open an issue in the repository for support

---

**Happy managing your electronics inventory! 🎉**
