@echo off
REM Sharkar Pharmacy Management System - Quick PostgreSQL Setup for Windows
REM This script sets up PostgreSQL database with default credentials

echo 🚀 Sharkar Pharmacy Management System - Quick PostgreSQL Setup
echo =============================================

REM Database configuration
set DB_NAME=pharmazine
set DB_USER=postgres
set DB_HOST=localhost
set DB_PORT=5432
set DB_PASSWORD=password

echo 📋 Using default configuration:
echo    Database Name: %DB_NAME%
echo    User: %DB_USER%
echo    Password: %DB_PASSWORD%
echo.

REM Test connection
echo 🔍 Testing database connection...
echo SELECT version(); | psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d postgres -q
if %errorlevel% neq 0 (
    echo ❌ Database connection failed. Please check PostgreSQL installation.
    echo    Make sure PostgreSQL is installed and running.
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
echo # Sharkar Pharmacy Management System - Environment Configuration
echo # PostgreSQL Database Configuration
echo VITE_DATABASE_URL=postgresql://%DB_USER%:%DB_PASSWORD%@%DB_HOST%:%DB_PORT%/%DB_NAME%
echo VITE_DATABASE_HOST=%DB_HOST%
echo VITE_DATABASE_PORT=%DB_PORT%
echo VITE_DATABASE_NAME=%DB_NAME%
echo VITE_DATABASE_USER=%DB_USER%
echo VITE_DATABASE_PASSWORD=%DB_PASSWORD%
echo.
echo # API Configuration
echo VITE_API_BASE_URL=http://localhost:3001/api
echo.
echo # Application Configuration
echo VITE_APP_NAME=Sharkar Pharmacy Management System
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
echo 🎉 Sharkar Pharmacy Management System PostgreSQL setup completed successfully!
echo.
echo 📋 Next Steps:
echo    1. Start the full application: npm run dev:full
echo    2. Open your browser to: http://localhost:8080 (or the port shown)
echo    3. Login with demo credentials:
echo       - Admin: admin@sharkarpharmacy.com
echo       - Manager: manager@sharkarpharmacy.com
echo       - Employee: employee@sharkarpharmacy.com
echo.
echo Happy coding! 🚀
pause
