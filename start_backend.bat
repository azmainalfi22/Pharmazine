@echo off
REM FastAPI Backend Startup Script for Volt Dealer Suite (Windows)

echo 🚀 Starting Volt Dealer Suite FastAPI Backend...

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed. Please install Python 3.8 or higher.
    pause
    exit /b 1
)

REM Check if pip is installed
pip --version >nul 2>&1
if errorlevel 1 (
    echo ❌ pip is not installed. Please install pip.
    pause
    exit /b 1
)

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    echo 📦 Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo 🔧 Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
echo 📥 Installing dependencies...
pip install -r requirements.txt

REM Set environment variables
set DATABASE_URL=postgresql://postgres:password@localhost:5432/volt_dealer_suite

REM Check if PostgreSQL is running
echo 🔍 Checking PostgreSQL connection...
python -c "import psycopg2; psycopg2.connect('postgresql://postgres:password@localhost:5432/volt_dealer_suite')" 2>nul
if errorlevel 1 (
    echo ❌ Cannot connect to PostgreSQL database.
    echo Please ensure PostgreSQL is running and the database 'volt_dealer_suite' exists.
    echo You can create the database with: createdb volt_dealer_suite
    pause
    exit /b 1
)

REM Seed the database
echo 🌱 Seeding database with sample data...
python backend\seed_data.py

REM Start the FastAPI server
echo 🚀 Starting FastAPI server on http://localhost:8000
echo 📊 API Documentation available at http://localhost:8000/docs
echo 🌐 API Base URL: http://localhost:8000/api
echo.
echo Press Ctrl+C to stop the server

uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
