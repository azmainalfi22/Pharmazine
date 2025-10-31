@echo off
REM Volt Dealer Suite - PostgreSQL Setup Script for Windows
REM This script helps set up PostgreSQL database for the Volt Dealer Suite

echo 🚀 Volt Dealer Suite - PostgreSQL Database Setup
echo ==================================================

REM Check if PostgreSQL is installed
where psql >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ PostgreSQL is not installed. Please install PostgreSQL first.
    echo    Visit: https://www.postgresql.org/download/
    pause
    exit /b 1
)

echo ✅ PostgreSQL is installed

REM Check if PostgreSQL service is running
pg_isready -q
if %errorlevel% neq 0 (
    echo ❌ PostgreSQL service is not running. Please start PostgreSQL service.
    echo    Start PostgreSQL service from Windows Services or run: net start postgresql-x64-14
    pause
    exit /b 1
)

echo ✅ PostgreSQL service is running

REM Database configuration
set DB_NAME=volt_dealer_suite
set DB_USER=postgres
set DB_HOST=localhost
set DB_PORT=5432

echo.
echo 📋 Database Configuration:
echo    Database Name: %DB_NAME%
echo    User: %DB_USER%
echo    Host: %DB_HOST%
echo    Port: %DB_PORT%
echo.

REM Prompt for database password
set /p DB_PASSWORD="Enter PostgreSQL password for user '%DB_USER%': "

REM Test connection
echo 🔍 Testing database connection...
echo SELECT version(); | psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d postgres -q
if %errorlevel% neq 0 (
    echo ❌ Database connection failed. Please check your credentials.
    pause
    exit /b 1
)

echo ✅ Database connection successful

REM Create database if it doesn't exist
echo 🗄️  Creating database '%DB_NAME%'...
echo CREATE DATABASE %DB_NAME%; | psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d postgres -q
if %errorlevel% equ 0 (
    echo ✅ Database '%DB_NAME%' created successfully
) else (
    echo SELECT 1; | psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -q
    if %errorlevel% equ 0 (
        echo ✅ Database '%DB_NAME%' already exists
    ) else (
        echo ❌ Failed to create database '%DB_NAME%'
        pause
        exit /b 1
    )
)

REM Run the database setup script
echo 📊 Setting up database schema and sample data...
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f database_setup.sql
if %errorlevel% neq 0 (
    echo ❌ Failed to set up database schema
    pause
    exit /b 1
)

echo ✅ Database schema and sample data created successfully

REM Create environment file
echo 📝 Creating environment configuration file...
(
echo # Volt Dealer Suite - Environment Configuration
echo # PostgreSQL Database Configuration
echo VITE_DATABASE_URL=postgresql://%DB_USER%:%DB_PASSWORD%@%DB_HOST%:%DB_PORT%/%DB_NAME%
echo VITE_DATABASE_HOST=%DB_HOST%
echo VITE_DATABASE_PORT=%DB_PORT%
echo VITE_DATABASE_NAME=%DB_NAME%
echo VITE_DATABASE_USER=%DB_USER%
echo VITE_DATABASE_PASSWORD=%DB_PASSWORD%
echo.
echo # Application Configuration
echo VITE_APP_NAME=Volt Dealer Suite
echo VITE_APP_VERSION=1.0.0
echo VITE_APP_DESCRIPTION=Electronics and Electrical Products Inventory Management System
echo.
echo # Development Configuration
echo VITE_NODE_ENV=development
echo VITE_DEBUG=true
) > .env.local

echo ✅ Environment configuration file created (.env.local)

REM Verify the setup
echo 🔍 Verifying database setup...
for /f %%i in ('psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"') do set TABLES_COUNT=%%i
for /f %%i in ('psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -t -c "SELECT COUNT(*) FROM products;"') do set PRODUCTS_COUNT=%%i
for /f %%i in ('psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -t -c "SELECT COUNT(*) FROM profiles;"') do set USERS_COUNT=%%i

echo    📊 Database Statistics:
echo    - Tables created: %TABLES_COUNT%
echo    - Sample products: %PRODUCTS_COUNT%
echo    - Sample users: %USERS_COUNT%

echo.
echo 🎉 Volt Dealer Suite PostgreSQL setup completed successfully!
echo.
echo 📋 Next Steps:
echo    1. Start the development server: npm run dev
echo    2. Open your browser to: http://localhost:5173
echo    3. Login with demo credentials:
echo       - Admin: admin@voltdealer.com
echo       - Manager: manager1@voltdealer.com
echo       - Employee: employee1@voltdealer.com
echo.
echo 🔧 Database Management:
echo    - Connect to database: psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME%
echo    - View tables: \dt
echo    - View sample data: SELECT * FROM products LIMIT 5;
echo.
echo 📚 Sample Data Includes:
echo    - 6 user accounts with different roles
echo    - 8 product categories and subcategories
echo    - 6 suppliers and 8 customers
echo    - 10 sample products (smartphones, laptops, LED bulbs, fans, ACs)
echo    - 5 sample sales transactions
echo    - Stock transactions and inventory data
echo.
echo Happy coding! 🚀
pause
