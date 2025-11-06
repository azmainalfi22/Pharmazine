#!/bin/bash
# Database Initialization Script for Docker
# Runs all migrations and loads sample data

echo "🔧 Initializing Sharkar Pharmacy Database..."

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL..."
until pg_isready -h postgres -U postgres; do
  sleep 2
done

echo "✅ PostgreSQL is ready"

# Run migrations in order
echo "📋 Running migrations..."

psql -U postgres -d pharmazine -f /app/backend/migrations/000_init_extensions.sql
psql -U postgres -d pharmazine -f /app/backend/migrations/001_pharmacy_schema.sql
psql -U postgres -d pharmazine -f /app/backend/migrations/002_add_indexes.sql
psql -U postgres -d pharmazine -f /app/backend/migrations/003_pharmacy_medicine_system.sql
psql -U postgres -d pharmazine -f /app/backend/migrations/004_phase2_customer_manufacturer.sql
psql -U postgres -d pharmazine -f /app/backend/migrations/005_phase3_advanced_purchase.sql
psql -U postgres -d pharmazine -f /app/backend/migrations/006_phase4_reporting_system.sql
psql -U postgres -d pharmazine -f /app/backend/migrations/007_phase5_enhanced_invoice.sql
psql -U postgres -d pharmazine -f /app/backend/migrations/008_phase678_stock_returns_service.sql
psql -U postgres -d pharmazine -f /app/backend/migrations/009_phase9_accounts_management.sql
psql -U postgres -d pharmazine -f /app/backend/migrations/010_phase10_to_13_final_features.sql

echo "✅ Migrations completed"

# Load sample data
echo "🌱 Loading sample data..."
python /app/backend/load_sample_data.py

echo "✅ Database initialization complete!"


