#!/bin/bash

# Sharkar Pharmacy Management System - PostgreSQL Setup Script
# This script helps set up PostgreSQL database for the Sharkar Pharmacy Management System

echo "🚀 Sharkar Pharmacy Management System - PostgreSQL Database Setup"
echo "=================================================="

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install PostgreSQL first."
    echo "   Visit: https://www.postgresql.org/download/"
    exit 1
fi

echo "✅ PostgreSQL is installed"

# Check if PostgreSQL service is running
if ! pg_isready -q; then
    echo "❌ PostgreSQL service is not running. Please start PostgreSQL service."
    echo "   On Windows: Start PostgreSQL service from Services"
    echo "   On macOS: brew services start postgresql"
    echo "   On Linux: sudo systemctl start postgresql"
    exit 1
fi

echo "✅ PostgreSQL service is running"

# Database configuration
DB_NAME="pharmazine"
DB_USER="postgres"
DB_HOST="localhost"
DB_PORT="5432"

echo ""
echo "📋 Database Configuration:"
echo "   Database Name: $DB_NAME"
echo "   User: $DB_USER"
echo "   Host: $DB_HOST"
echo "   Port: $DB_PORT"
echo ""

# Prompt for database password
read -s -p "Enter PostgreSQL password for user '$DB_USER': " DB_PASSWORD
echo ""

# Test connection
echo "🔍 Testing database connection..."
if PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "SELECT version();" &> /dev/null; then
    echo "✅ Database connection successful"
else
    echo "❌ Database connection failed. Please check your credentials."
    exit 1
fi

# Create database if it doesn't exist
echo "🗄️  Creating database '$DB_NAME'..."
if PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME;" 2>/dev/null; then
    echo "✅ Database '$DB_NAME' created successfully"
elif PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1;" &> /dev/null; then
    echo "✅ Database '$DB_NAME' already exists"
else
    echo "❌ Failed to create database '$DB_NAME'"
    exit 1
fi

# Run the database setup script
echo "📊 Setting up database schema and sample data..."
if PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f database_setup.sql; then
    echo "✅ Database schema and sample data created successfully"
else
    echo "❌ Failed to set up database schema"
    exit 1
fi

# Create environment file
echo "📝 Creating environment configuration file..."
cat > .env.local << EOF
# Sharkar Pharmacy Management System - Environment Configuration
# PostgreSQL Database Configuration
VITE_DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME
VITE_DATABASE_HOST=$DB_HOST
VITE_DATABASE_PORT=$DB_PORT
VITE_DATABASE_NAME=$DB_NAME
VITE_DATABASE_USER=$DB_USER
VITE_DATABASE_PASSWORD=$DB_PASSWORD

# Application Configuration
VITE_APP_NAME=Sharkar Pharmacy Management System
VITE_APP_VERSION=1.0.0
VITE_APP_DESCRIPTION=Electronics and Electrical Products Inventory Management System

# Development Configuration
VITE_NODE_ENV=development
VITE_DEBUG=true
EOF

echo "✅ Environment configuration file created (.env.local)"

# Verify the setup
echo "🔍 Verifying database setup..."
TABLES_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | tr -d ' ')
PRODUCTS_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM products;" | tr -d ' ')
USERS_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM profiles;" | tr -d ' ')

echo "   📊 Database Statistics:"
echo "   - Tables created: $TABLES_COUNT"
echo "   - Sample products: $PRODUCTS_COUNT"
echo "   - Sample users: $USERS_COUNT"

echo ""
echo "🎉 Sharkar Pharmacy Management System PostgreSQL setup completed successfully!"
echo ""
echo "📋 Next Steps:"
echo "   1. Start the development server: npm run dev"
echo "   2. Open your browser to: http://localhost:5173"
echo "   3. Login with demo credentials:"
echo "      - Admin: admin@sharkarpharmacy.com"
echo "      - Manager: manager@sharkarpharmacy.com"
echo "      - Employee: employee@sharkarpharmacy.com"
echo ""
echo "🔧 Database Management:"
echo "   - Connect to database: psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME"
echo "   - View tables: \dt"
echo "   - View sample data: SELECT * FROM products LIMIT 5;"
echo ""
echo "📚 Sample Data Includes:"
echo "   - 6 user accounts with different roles"
echo "   - 8 product categories and subcategories"
echo "   - 6 suppliers and 8 customers"
echo "   - 10 sample products (smartphones, laptops, LED bulbs, fans, ACs)"
echo "   - 5 sample sales transactions"
echo "   - Stock transactions and inventory data"
echo ""
echo "Happy coding! 🚀"
