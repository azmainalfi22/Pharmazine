#!/bin/bash

# FastAPI Backend Startup Script for Volt Dealer Suite

echo "🚀 Starting Volt Dealer Suite FastAPI Backend..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 is not installed. Please install pip3."
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install -r requirements.txt

# Set environment variables
export DATABASE_URL="postgresql://postgres:password@localhost:5432/volt_dealer_suite"

# Check if PostgreSQL is running
echo "🔍 Checking PostgreSQL connection..."
if ! python3 -c "import psycopg2; psycopg2.connect('postgresql://postgres:password@localhost:5432/volt_dealer_suite')" 2>/dev/null; then
    echo "❌ Cannot connect to PostgreSQL database."
    echo "Please ensure PostgreSQL is running and the database 'volt_dealer_suite' exists."
    echo "You can create the database with: createdb volt_dealer_suite"
    exit 1
fi

# Seed the database
echo "🌱 Seeding database with sample data..."
python3 backend/seed_data.py

# Start the FastAPI server
echo "🚀 Starting FastAPI server on http://localhost:8000"
echo "📊 API Documentation available at http://localhost:8000/docs"
echo "🌐 API Base URL: http://localhost:8000/api"
echo ""
echo "Press Ctrl+C to stop the server"

uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
