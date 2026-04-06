-- Patient Medication History and Advanced Features
-- Date: 2025-11-03

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PATIENT MEDICATION HISTORY
-- ============================================

CREATE TABLE IF NOT EXISTS patient_medication_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
    
    product_name TEXT NOT NULL,
    generic_name TEXT,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(10, 2),
    
    prescription_number TEXT,
    doctor_name TEXT,
    
    dispensed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    next_refill_date TIMESTAMPTZ,
    
    notes TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_patient_history_customer ON patient_medication_history(customer_id);
CREATE INDEX IF NOT EXISTS idx_patient_history_product ON patient_medication_history(product_id);
CREATE INDEX IF NOT EXISTS idx_patient_history_dispensed ON patient_medication_history(dispensed_at DESC);
CREATE INDEX IF NOT EXISTS idx_patient_history_refill ON patient_medication_history(next_refill_date) WHERE next_refill_date IS NOT NULL;

-- ============================================
-- NOTIFICATION LOG
-- ============================================

CREATE TABLE IF NOT EXISTS notification_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notification_type TEXT NOT NULL, -- low_stock, expiry, daily_summary, refill_reminder
    recipient_email TEXT,
    recipient_phone TEXT,
    subject TEXT,
    message TEXT,
    status TEXT DEFAULT 'pending', -- pending, sent, failed
    sent_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notification_log_type ON notification_log(notification_type);
CREATE INDEX IF NOT EXISTS idx_notification_log_status ON notification_log(status);
CREATE INDEX IF NOT EXISTS idx_notification_log_created ON notification_log(created_at DESC);

-- ============================================
-- AUTO-REORDER LOG
-- ============================================

CREATE TABLE IF NOT EXISTS auto_reorder_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    
    current_stock INTEGER NOT NULL,
    reorder_point INTEGER NOT NULL,
    recommended_order_qty INTEGER NOT NULL,
    avg_daily_sales NUMERIC(10, 2),
    days_of_supply NUMERIC(10, 2),
    priority TEXT, -- CRITICAL, HIGH, MEDIUM
    abc_class TEXT, -- A, B, C
    
    status TEXT DEFAULT 'pending', -- pending, po_created, ordered, received, cancelled
    purchase_order_id UUID,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auto_reorder_product ON auto_reorder_log(product_id);
CREATE INDEX IF NOT EXISTS idx_auto_reorder_status ON auto_reorder_log(status);
CREATE INDEX IF NOT EXISTS idx_auto_reorder_priority ON auto_reorder_log(priority);

-- ============================================
-- BACKUP LOG
-- ============================================

CREATE TABLE IF NOT EXISTS backup_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size_mb NUMERIC(10, 2),
    backup_type TEXT DEFAULT 'automatic', -- automatic, manual
    status TEXT DEFAULT 'success', -- success, failed
    error_message TEXT,
    created_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_backup_log_created ON backup_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_backup_log_status ON backup_log(status);

-- ============================================
-- DASHBOARD REAL-TIME STATS VIEW
-- ============================================

CREATE OR REPLACE VIEW v_realtime_dashboard AS
SELECT 
    -- Today's sales
    (SELECT COALESCE(SUM(net_amount), 0) FROM sales WHERE created_at::DATE = CURRENT_DATE) as today_sales,
    (SELECT COUNT(*) FROM sales WHERE created_at::DATE = CURRENT_DATE) as today_transactions,
    (SELECT COUNT(DISTINCT customer_name) FROM sales WHERE created_at::DATE = CURRENT_DATE) as today_customers,
    
    -- This week
    (SELECT COALESCE(SUM(net_amount), 0) FROM sales WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as week_sales,
    
    -- This month
    (SELECT COALESCE(SUM(net_amount), 0) FROM sales WHERE EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE)) as month_sales,
    
    -- Inventory alerts
    (SELECT COUNT(*) FROM products WHERE stock_quantity <= min_stock_level) as low_stock_count,
    (SELECT COUNT(*) FROM products WHERE stock_quantity = 0) as out_of_stock_count,
    (SELECT COUNT(*) FROM products WHERE expiry_date IS NOT NULL AND expiry_date <= CURRENT_DATE + INTERVAL '30 days' AND stock_quantity > 0) as expiring_soon_count,
    
    -- Pending items
    (SELECT COUNT(*) FROM requisitions WHERE status = 'pending') as pending_requisitions,
    
    -- Total inventory value
    (SELECT COALESCE(SUM(stock_quantity * cost_price), 0) FROM products) as total_inventory_value;

-- ============================================
-- TOP PRODUCTS VIEW (Real-time)
-- ============================================

CREATE OR REPLACE VIEW v_top_products_today AS
SELECT 
    p.id,
    p.sku,
    p.name,
    p.generic_name,
    SUM(si.quantity) as quantity_sold,
    COUNT(DISTINCT si.sale_id) as order_count,
    SUM(si.quantity * si.unit_price) as revenue,
    p.stock_quantity as current_stock
FROM sales_items si
JOIN products p ON si.product_id = p.id
JOIN sales s ON si.sale_id = s.id
WHERE s.created_at::DATE = CURRENT_DATE
GROUP BY p.id, p.sku, p.name, p.generic_name, p.stock_quantity
ORDER BY revenue DESC
LIMIT 10;

-- ============================================
-- HOURLY SALES TREND
-- ============================================

CREATE OR REPLACE VIEW v_hourly_sales_today AS
SELECT 
    EXTRACT(HOUR FROM created_at)::INTEGER as hour,
    COUNT(*) as transaction_count,
    COALESCE(SUM(net_amount), 0) as total_sales,
    COALESCE(AVG(net_amount), 0) as avg_transaction
FROM sales
WHERE created_at::DATE = CURRENT_DATE
GROUP BY EXTRACT(HOUR FROM created_at)
ORDER BY hour;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE patient_medication_history IS 'Customer medication purchase history for refill tracking and compliance';
COMMENT ON TABLE notification_log IS 'Log of all system notifications (email/SMS)';
COMMENT ON TABLE auto_reorder_log IS 'History of auto-reorder recommendations and actions';
COMMENT ON TABLE backup_log IS 'Database backup history and verification';

