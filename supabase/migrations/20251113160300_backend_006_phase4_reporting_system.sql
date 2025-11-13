-- Phase 4: Comprehensive Reporting System
-- User-wise, product-wise, category-wise reports, profit/loss analysis, due payments

-- ============================================
-- SALES REPORTS MATERIALIZED VIEWS
-- ============================================

-- User-wise Sales Report View
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_user_sales_report AS
SELECT 
    s.created_by as user_id,
    u.full_name as user_name,
    DATE_TRUNC('day', s.created_at) as sale_date,
    DATE_TRUNC('month', s.created_at) as sale_month,
    DATE_TRUNC('year', s.created_at) as sale_year,
    COUNT(DISTINCT s.id) as transaction_count,
    SUM(s.total_amount) as total_sales,
    SUM(s.discount) as total_discount,
    SUM(s.tax) as total_tax,
    SUM(s.net_amount) as net_sales,
    AVG(s.net_amount) as average_sale_value,
    SUM(CASE WHEN s.payment_method = 'cash' THEN s.net_amount ELSE 0 END) as cash_sales,
    SUM(CASE WHEN s.payment_method IN ('visa', 'bank_transfer') THEN s.net_amount ELSE 0 END) as card_sales,
    SUM(CASE WHEN s.payment_method IN ('bkash', 'upay') THEN s.net_amount ELSE 0 END) as mobile_sales,
    COUNT(DISTINCT s.customer_name) as unique_customers
FROM sales s
LEFT JOIN profiles u ON s.created_by = u.id
GROUP BY s.created_by, u.full_name, DATE_TRUNC('day', s.created_at), 
         DATE_TRUNC('month', s.created_at), DATE_TRUNC('year', s.created_at);

CREATE INDEX IF NOT EXISTS idx_mv_user_sales_user ON mv_user_sales_report(user_id);
CREATE INDEX IF NOT EXISTS idx_mv_user_sales_date ON mv_user_sales_report(sale_date);

-- Product-wise Sales Report View
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_product_sales_report AS
SELECT 
    p.id as product_id,
    p.sku,
    p.name as product_name,
    p.generic_name,
    p.brand_name,
    mc.name as medicine_category,
    mt.name as medicine_type,
    m.name as manufacturer,
    DATE_TRUNC('day', s.created_at) as sale_date,
    DATE_TRUNC('month', s.created_at) as sale_month,
    COUNT(DISTINCT s.id) as transaction_count,
    SUM(si.quantity) as total_quantity_sold,
    SUM(si.quantity * si.unit_price) as total_sales_value,
    AVG(si.unit_price) as average_selling_price,
    SUM(si.discount) as total_discount,
    SUM((si.quantity * si.unit_price) - si.discount) as net_sales_value
FROM sales_items si
JOIN sales s ON si.sale_id = s.id
JOIN products p ON si.product_id = p.id
LEFT JOIN medicine_categories mc ON p.medicine_category_id = mc.id
LEFT JOIN medicine_types mt ON p.medicine_type_id = mt.id
LEFT JOIN manufacturers m ON p.manufacturer_id = m.id
GROUP BY p.id, p.sku, p.name, p.generic_name, p.brand_name, 
         mc.name, mt.name, m.name, 
         DATE_TRUNC('day', s.created_at), DATE_TRUNC('month', s.created_at);

CREATE INDEX IF NOT EXISTS idx_mv_product_sales_product ON mv_product_sales_report(product_id);
CREATE INDEX IF NOT EXISTS idx_mv_product_sales_date ON mv_product_sales_report(sale_date);

-- Category-wise Sales Report View
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_category_sales_report AS
SELECT 
    mc.id as category_id,
    mc.name as category_name,
    DATE_TRUNC('day', s.created_at) as sale_date,
    DATE_TRUNC('month', s.created_at) as sale_month,
    COUNT(DISTINCT s.id) as transaction_count,
    COUNT(DISTINCT si.product_id) as products_sold,
    SUM(si.quantity) as total_quantity,
    SUM(si.quantity * si.unit_price) as total_sales,
    SUM(si.discount) as total_discount,
    AVG(si.unit_price) as average_price
FROM sales_items si
JOIN sales s ON si.sale_id = s.id
JOIN products p ON si.product_id = p.id
LEFT JOIN medicine_categories mc ON p.medicine_category_id = mc.id
WHERE mc.id IS NOT NULL
GROUP BY mc.id, mc.name, DATE_TRUNC('day', s.created_at), DATE_TRUNC('month', s.created_at);

CREATE INDEX IF NOT EXISTS idx_mv_category_sales_category ON mv_category_sales_report(category_id);
CREATE INDEX IF NOT EXISTS idx_mv_category_sales_date ON mv_category_sales_report(sale_date);

-- ============================================
-- PROFIT/LOSS TRACKING TABLES
-- ============================================

-- Invoice-wise Profit/Loss
CREATE TABLE IF NOT EXISTS invoice_profit_loss (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL,
    invoice_type TEXT NOT NULL, -- 'sale', 'purchase'
    invoice_number TEXT,
    invoice_date DATE NOT NULL,
    customer_id UUID,
    supplier_id UUID REFERENCES suppliers(id),
    total_revenue NUMERIC DEFAULT 0,
    total_cost NUMERIC DEFAULT 0,
    gross_profit NUMERIC DEFAULT 0,
    gross_margin_percentage NUMERIC DEFAULT 0,
    discount_given NUMERIC DEFAULT 0,
    tax_collected NUMERIC DEFAULT 0,
    net_profit NUMERIC DEFAULT 0,
    net_margin_percentage NUMERIC DEFAULT 0,
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoice_pl_invoice ON invoice_profit_loss(invoice_id, invoice_type);
CREATE INDEX IF NOT EXISTS idx_invoice_pl_date ON invoice_profit_loss(invoice_date);

-- Medicine-wise Profit/Loss
CREATE TABLE IF NOT EXISTS medicine_profit_loss (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    opening_stock NUMERIC DEFAULT 0,
    purchases_qty NUMERIC DEFAULT 0,
    purchases_value NUMERIC DEFAULT 0,
    sales_qty NUMERIC DEFAULT 0,
    sales_value NUMERIC DEFAULT 0,
    closing_stock NUMERIC DEFAULT 0,
    cost_of_goods_sold NUMERIC DEFAULT 0,
    gross_profit NUMERIC DEFAULT 0,
    gross_margin_percentage NUMERIC DEFAULT 0,
    returns_qty NUMERIC DEFAULT 0,
    returns_value NUMERIC DEFAULT 0,
    damaged_qty NUMERIC DEFAULT 0,
    damaged_value NUMERIC DEFAULT 0,
    expired_qty NUMERIC DEFAULT 0,
    expired_value NUMERIC DEFAULT 0,
    net_profit NUMERIC DEFAULT 0,
    net_margin_percentage NUMERIC DEFAULT 0,
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_medicine_pl_product ON medicine_profit_loss(product_id);
CREATE INDEX IF NOT EXISTS idx_medicine_pl_period ON medicine_profit_loss(period_start, period_end);

-- ============================================
-- DUE PAYMENTS TRACKING
-- ============================================

-- Sales Due Payments View
CREATE OR REPLACE VIEW v_sales_due_payments AS
SELECT 
    s.id as sale_id,
    s.created_at::DATE as sale_date,
    s.customer_name,
    s.customer_phone,
    s.customer_email,
    c.id as customer_id,
    c.credit_limit,
    c.payment_deadline_days,
    s.net_amount as total_amount,
    s.payment_status,
    COALESCE(
        (SELECT SUM(amount) FROM customer_credit_transactions 
         WHERE customer_id = c.id AND transaction_type = 'payment' 
         AND reference_id = s.id),
        0
    ) as paid_amount,
    s.net_amount - COALESCE(
        (SELECT SUM(amount) FROM customer_credit_transactions 
         WHERE customer_id = c.id AND transaction_type = 'payment' 
         AND reference_id = s.id),
        0
    ) as due_amount,
    (s.created_at::DATE + (COALESCE(c.payment_deadline_days, 0) * INTERVAL '1 day')) as due_date,
    CASE
        WHEN s.created_at::DATE + (COALESCE(c.payment_deadline_days, 0) * INTERVAL '1 day') < CURRENT_DATE 
        THEN DATE_PART('day', CURRENT_DATE - (s.created_at::DATE + (COALESCE(c.payment_deadline_days, 0) * INTERVAL '1 day')))::INTEGER
        ELSE 0
    END as days_overdue
FROM sales s
LEFT JOIN customers c ON s.customer_name = c.name OR s.customer_phone = c.phone
WHERE s.payment_status IN ('pending', 'partial')
ORDER BY s.created_at DESC;

-- Purchase Due Payments View (already created in phase 3)

-- ============================================
-- STOCK MOVEMENT REPORTS
-- ============================================

-- Stock Movement Summary View
CREATE OR REPLACE VIEW v_stock_movement_summary AS
SELECT 
    p.id as product_id,
    p.sku,
    p.name,
    p.generic_name,
    DATE_TRUNC('day', bst.created_at) as movement_date,
    DATE_TRUNC('month', bst.created_at) as movement_month,
    bst.transaction_type,
    COUNT(*) as transaction_count,
    SUM(CASE WHEN bst.transaction_type IN ('purchase', 'return_customer', 'adjustment', 'transfer_in') 
        THEN bst.quantity ELSE 0 END) as total_in,
    SUM(CASE WHEN bst.transaction_type IN ('sale', 'return_supplier', 'damage', 'transfer_out', 'expired') 
        THEN bst.quantity ELSE 0 END) as total_out,
    SUM(CASE WHEN bst.transaction_type IN ('purchase', 'return_customer', 'adjustment', 'transfer_in') 
        THEN bst.quantity 
        WHEN bst.transaction_type IN ('sale', 'return_supplier', 'damage', 'transfer_out', 'expired') 
        THEN -bst.quantity 
        ELSE 0 END) as net_movement
FROM batch_stock_transactions bst
JOIN medicine_batches mb ON bst.batch_id = mb.id
JOIN products p ON mb.product_id = p.id
GROUP BY p.id, p.sku, p.name, p.generic_name, 
         DATE_TRUNC('day', bst.created_at), 
         DATE_TRUNC('month', bst.created_at),
         bst.transaction_type;

-- ============================================
-- REMAINDER PACKAGES / SUBSCRIPTION TRACKING
-- ============================================

CREATE TABLE IF NOT EXISTS recurring_prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    prescription_name TEXT NOT NULL,
    doctor_name TEXT,
    diagnosis TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    recurrence_frequency TEXT NOT NULL, -- daily, weekly, biweekly, monthly
    recurrence_day INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS recurring_prescription_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prescription_id UUID REFERENCES recurring_prescriptions(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    dosage TEXT,
    frequency TEXT,
    quantity_per_refill NUMERIC NOT NULL,
    instructions TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS prescription_reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prescription_id UUID REFERENCES recurring_prescriptions(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    reminder_date DATE NOT NULL,
    reminder_sent BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMPTZ,
    reminder_method TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recurring_prescriptions_customer ON recurring_prescriptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_prescription_reminders_date ON prescription_reminders(reminder_date);

-- ============================================
-- REPORT SCHEDULES
-- ============================================

CREATE TABLE IF NOT EXISTS report_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_name TEXT NOT NULL,
    report_type TEXT NOT NULL, -- sales, purchase, stock, profit_loss, customer, manufacturer
    schedule_frequency TEXT NOT NULL, -- daily, weekly, monthly, quarterly, yearly
    schedule_day INTEGER,
    schedule_time TIME,
    report_format TEXT DEFAULT 'pdf', -- pdf, excel, csv
    recipients TEXT[], -- email addresses
    is_active BOOLEAN DEFAULT TRUE,
    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ,
    created_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS report_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    schedule_id UUID REFERENCES report_schedules(id) ON DELETE SET NULL,
    report_type TEXT NOT NULL,
    report_name TEXT NOT NULL,
    period_start DATE,
    period_end DATE,
    file_path TEXT,
    file_size INTEGER,
    generated_by TEXT,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    sent_to TEXT[],
    sent_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_report_history_type ON report_history(report_type);
CREATE INDEX IF NOT EXISTS idx_report_history_date ON report_history(generated_at);

-- ============================================
-- DASHBOARD ANALYTICS
-- ============================================

-- Daily Sales Summary
CREATE OR REPLACE VIEW v_daily_sales_summary AS
SELECT
    DATE_TRUNC('day', created_at)::DATE as sale_date,
    COUNT(DISTINCT id) as transaction_count,
    COUNT(DISTINCT customer_name) as unique_customers,
    SUM(total_amount) as gross_sales,
    SUM(discount) as total_discount,
    SUM(tax) as total_tax,
    SUM(net_amount) as net_sales,
    AVG(net_amount) as average_transaction,
    SUM(CASE WHEN payment_method = 'cash' THEN net_amount ELSE 0 END) as cash_sales,
    SUM(CASE WHEN payment_method IN ('visa', 'bank_transfer') THEN net_amount ELSE 0 END) as card_sales,
    SUM(CASE WHEN payment_method IN ('bkash', 'upay') THEN net_amount ELSE 0 END) as mobile_sales
FROM sales
GROUP BY DATE_TRUNC('day', created_at)::DATE
ORDER BY sale_date DESC;

-- Top Selling Products
CREATE OR REPLACE VIEW v_top_selling_products AS
SELECT 
    p.id,
    p.sku,
    p.name,
    p.generic_name,
    p.brand_name,
    mc.name as category,
    SUM(si.quantity) as total_quantity_sold,
    COUNT(DISTINCT si.sale_id) as order_count,
    SUM(si.quantity * si.unit_price) as total_revenue,
    AVG(si.unit_price) as average_price
FROM sales_items si
JOIN products p ON si.product_id = p.id
LEFT JOIN medicine_categories mc ON p.medicine_category_id = mc.id
JOIN sales s ON si.sale_id = s.id
WHERE s.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY p.id, p.sku, p.name, p.generic_name, p.brand_name, mc.name
ORDER BY total_quantity_sold DESC
LIMIT 50;

-- Customer Purchase Analysis
CREATE OR REPLACE VIEW v_customer_purchase_analysis AS
SELECT 
    c.id,
    c.name,
    c.customer_type,
    c.loyalty_tier,
    c.purchase_count,
    c.total_purchases,
    c.current_balance,
    c.last_purchase_date,
    c.first_purchase_date,
    CASE 
        WHEN c.purchase_count > 0 THEN c.total_purchases / c.purchase_count
        ELSE 0
    END as average_purchase_value,
    CASE
        WHEN c.last_purchase_date IS NOT NULL 
        THEN (CURRENT_DATE - c.last_purchase_date)::INTEGER
        ELSE NULL
    END as days_since_last_purchase,
    CASE
        WHEN c.last_purchase_date >= CURRENT_DATE - INTERVAL '30 days' THEN 'active'
        WHEN c.last_purchase_date >= CURRENT_DATE - INTERVAL '90 days' THEN 'at_risk'
        WHEN c.last_purchase_date >= CURRENT_DATE - INTERVAL '180 days' THEN 'dormant'
        WHEN c.last_purchase_date IS NOT NULL THEN 'lost'
        ELSE 'new'
    END as customer_status
FROM customers c
WHERE c.is_active = TRUE;

-- ============================================
-- FUNCTIONS FOR REPORT GENERATION
-- ============================================

-- Function: Refresh all materialized views
CREATE OR REPLACE FUNCTION refresh_sales_reports()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_user_sales_report;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_product_sales_report;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_category_sales_report;
END;
$$ LANGUAGE plpgsql;

-- Function: Calculate invoice profit/loss
CREATE OR REPLACE FUNCTION calculate_invoice_profit_loss(p_sale_id UUID)
RETURNS UUID AS $$
DECLARE
    v_pl_id UUID;
    v_revenue NUMERIC;
    v_cost NUMERIC;
    v_discount NUMERIC;
    v_tax NUMERIC;
BEGIN
    -- Get sale details
    SELECT 
        SUM(si.quantity * si.unit_price),
        SUM(si.quantity * COALESCE(mb.purchase_price, p.cost_price, 0)),
        SUM(si.discount),
        SUM(si.vat_amount + si.cgst_amount + si.sgst_amount)
    INTO v_revenue, v_cost, v_discount, v_tax
    FROM sales_items si
    JOIN products p ON si.product_id = p.id
    LEFT JOIN medicine_batches mb ON si.batch_id = mb.id
    WHERE si.sale_id = p_sale_id;
    
    -- Insert profit/loss record
    INSERT INTO invoice_profit_loss (
        invoice_id, invoice_type, invoice_date,
        total_revenue, total_cost, gross_profit, gross_margin_percentage,
        discount_given, tax_collected, net_profit, net_margin_percentage
    )
    SELECT 
        s.id,
        'sale',
        s.created_at::DATE,
        v_revenue,
        v_cost,
        v_revenue - v_cost,
        CASE WHEN v_revenue > 0 THEN ((v_revenue - v_cost) / v_revenue * 100) ELSE 0 END,
        v_discount,
        v_tax,
        v_revenue - v_cost - v_discount,
        CASE WHEN v_revenue > 0 THEN ((v_revenue - v_cost - v_discount) / v_revenue * 100) ELSE 0 END
    FROM sales s
    WHERE s.id = p_sale_id
    RETURNING id INTO v_pl_id;
    
    RETURN v_pl_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Generate medicine profit/loss report
CREATE OR REPLACE FUNCTION calculate_medicine_profit_loss(
    p_product_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS UUID AS $$
DECLARE
    v_pl_id UUID;
BEGIN
    INSERT INTO medicine_profit_loss (
        product_id, period_start, period_end,
        purchases_qty, sales_qty, cost_of_goods_sold, sales_value
    )
    SELECT 
        p_product_id,
        p_start_date,
        p_end_date,
        COALESCE(SUM(purchases.qty), 0) as purchases_qty,
        COALESCE(SUM(sales.qty), 0) as sales_qty,
        COALESCE(SUM(sales.qty * sales.cost), 0) as cogs,
        COALESCE(SUM(sales.qty * sales.price), 0) as sales_value
    FROM (
        SELECT 
            pi.qty,
            pi.unit_price as cost
        FROM purchase_items pi
        JOIN purchases p ON pi.purchase_id = p.id
        WHERE pi.product_id = p_product_id
            AND p.date BETWEEN p_start_date AND p_end_date
    ) purchases
    FULL OUTER JOIN (
        SELECT 
            si.quantity as qty,
            si.unit_price as price,
            COALESCE(mb.purchase_price, pr.cost_price) as cost
        FROM sales_items si
        JOIN sales s ON si.sale_id = s.id
        JOIN products pr ON si.product_id = pr.id
        LEFT JOIN medicine_batches mb ON si.batch_id = mb.id
        WHERE si.product_id = p_product_id
            AND s.created_at::DATE BETWEEN p_start_date AND p_end_date
    ) sales ON TRUE
    RETURNING id INTO v_pl_id;
    
    -- Update calculated fields
    UPDATE medicine_profit_loss
    SET gross_profit = sales_value - cost_of_goods_sold,
        gross_margin_percentage = CASE 
            WHEN sales_value > 0 THEN ((sales_value - cost_of_goods_sold) / sales_value * 100) 
            ELSE 0 
        END,
        net_profit = sales_value - cost_of_goods_sold,
        net_margin_percentage = CASE 
            WHEN sales_value > 0 THEN ((sales_value - cost_of_goods_sold) / sales_value * 100) 
            ELSE 0 
        END
    WHERE id = v_pl_id;
    
    RETURN v_pl_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMPLETION MESSAGE
-- ============================================
DO $$
BEGIN
    RAISE NOTICE 'Phase 4: Comprehensive Reporting System - COMPLETE!';
    RAISE NOTICE 'Created Materialized Views: mv_user_sales_report, mv_product_sales_report, mv_category_sales_report';
    RAISE NOTICE 'Created Tables: invoice_profit_loss, medicine_profit_loss, recurring_prescriptions';
    RAISE NOTICE 'Created Views: v_sales_due_payments, v_stock_movement_summary, v_daily_sales_summary';
    RAISE NOTICE 'Created Functions: calculate_invoice_profit_loss(), calculate_medicine_profit_loss()';
END $$;

