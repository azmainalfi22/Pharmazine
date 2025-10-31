# Volt Dealer Suite - Setup Instructions

## 🚀 Quick Start Guide

The Volt Dealer Suite has been successfully converted from Supabase to PostgreSQL! Here's how to get it running:

### Current Status
✅ **Frontend**: Ready and configured  
✅ **Backend API**: Ready and configured  
❌ **PostgreSQL Database**: Needs to be set up  

### Step 1: Install PostgreSQL (if not already installed)

**Download PostgreSQL from**: https://www.postgresql.org/download/windows/

**During installation:**
- Remember the password you set for the `postgres` user
- Make sure to install PostgreSQL command line tools

### Step 2: Set Up the Database

**Option A: Using pgAdmin (GUI)**
1. Open pgAdmin
2. Connect to your PostgreSQL server
3. Right-click "Databases" → "Create" → "Database"
4. Name: `volt_dealer_suite`
5. Click "Save"

**Option B: Using Command Line**
1. Open Command Prompt as Administrator
2. Navigate to PostgreSQL bin directory (usually `C:\Program Files\PostgreSQL\15\bin`)
3. Run: `psql -U postgres`
4. Enter your password when prompted
5. Run: `CREATE DATABASE volt_dealer_suite;`
6. Run: `\q` to exit

### Step 3: Import Database Schema and Data

1. Open Command Prompt as Administrator
2. Navigate to your project directory: `cd W:\D_folder\volt-dealer-suite`
3. Run: `psql -U postgres -d volt_dealer_suite -f database_setup.sql`
4. Enter your password when prompted

### Step 4: Update Environment Configuration

The `.env.local` file has been created with default settings. If your PostgreSQL password is different from "password", update the `.env.local` file:

```
VITE_DATABASE_PASSWORD=your_actual_password
```

### Step 5: Start the Application

```bash
# Start both backend API and frontend
npm run dev:full

# Or start them separately:
# Terminal 1: npm run dev:server
# Terminal 2: npm run dev
```

### Step 6: Access the Application

- **Frontend**: http://localhost:8080 (or the port shown in terminal)
- **API**: http://localhost:3001/api

### Demo Login Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@voltdealer.com | Any password (demo mode) |
| **Manager** | manager1@voltdealer.com | Any password (demo mode) |
| **Employee** | employee1@voltdealer.com | Any password (demo mode) |

### Troubleshooting

**Database Connection Issues:**
- Ensure PostgreSQL service is running
- Check if the database `volt_dealer_suite` exists
- Verify password in `.env.local` file
- Test connection: `psql -U postgres -d volt_dealer_suite`

**Port Issues:**
- Frontend runs on port 8080 (or next available)
- API runs on port 3001
- Check if ports are available

**API Server Issues:**
- Check if `node server.js` runs without errors
- Verify environment variables in `.env.local`
- Test API: `curl http://localhost:3001/api/health`

### What's Included

The database includes comprehensive sample data:
- **6 users** with different roles
- **8 categories** and **12 subcategories**
- **6 suppliers** and **8 customers**
- **10 products** (smartphones, laptops, LED bulbs, fans, ACs)
- **5 sales transactions** with EMI support
- **Complete stock transaction history**

### Next Steps

Once everything is running:
1. Explore the dashboard and inventory
2. Try creating new products
3. Process sample sales transactions
4. Check user management features
5. Review reports and analytics

---

**Need Help?** Check the main README.md for detailed documentation or open an issue in the repository.
