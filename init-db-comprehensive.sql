-- Comprehensive Database Initialization for Sharkar Pharmacy
-- Runs all migrations and loads sample data

\echo 'Starting Sharkar Pharmacy Database Initialization...'

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\echo 'Extensions created'

-- Run migrations in order
\echo 'Running migration 001: Pharmacy Schema...'
\i /docker-entrypoint-initdb.d/migrations/001_pharmacy_schema.sql

\echo 'Running migration 002: Indexes...'
\i /docker-entrypoint-initdb.d/migrations/002_add_indexes.sql

\echo 'Running migration 003: Medicine System...'
\i /docker-entrypoint-initdb.d/migrations/003_pharmacy_medicine_system.sql

\echo 'Running migration 004: Customer & Manufacturer...'
\i /docker-entrypoint-initdb.d/migrations/004_phase2_customer_manufacturer.sql

\echo 'Running migration 005: Advanced Purchase...'
\i /docker-entrypoint-initdb.d/migrations/005_phase3_advanced_purchase.sql

\echo 'Running migration 006: Reporting System...'
\i /docker-entrypoint-initdb.d/migrations/006_phase4_reporting_system.sql

\echo 'Running migration 007: Enhanced Invoice...'
\i /docker-entrypoint-initdb.d/migrations/007_phase5_enhanced_invoice.sql

\echo 'Running migration 008: Stock, Returns, Service...'
\i /docker-entrypoint-initdb.d/migrations/008_phase678_stock_returns_service.sql

\echo 'Running migration 009: Accounts Management...'
\i /docker-entrypoint-initdb.d/migrations/009_phase9_accounts_management.sql

\echo 'Running migration 010: Final Features...'
\i /docker-entrypoint-initdb.d/migrations/010_phase10_to_13_final_features.sql

\echo 'All migrations completed!'

-- Display table counts
\echo 'Checking created tables...'
SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

\echo 'Database initialization complete!'


