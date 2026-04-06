-- Phase 6, 7, 8: Stock Management, Returns, Service Management (Combined)
-- Comprehensive stock reports, returns system, service management

-- ============================================
-- PHASE 6: STOCK MANAGEMENT ENHANCEMENTS
-- ============================================

-- Stock Valuation Report View
CREATE OR REPLACE VIEW v_stock_valuation AS
SELECT 
    p.id as product_id,
    p.sku,
    p.name,
    p.generic_name,
    p.brand_name,
    mc.name as category,
    m.name as manufacturer,
    SUM(mb.quantity_remaining) as total_stock,
    AVG(mb.purchase_price) as average_cost,
    SUM(mb.quantity_remaining * mb.purchase_price) as stock_value_at_cost,
    AVG(mb.selling_price) as average_selling_price,
    SUM(mb.quantity_remaining * mb.selling_price) as stock_value_at_selling,
    SUM(mb.quantity_remaining * (mb.selling_price - mb.purchase_price)) as potential_profit,
    COUNT(DISTINCT mb.id) as batch_count,
    MIN(mb.expiry_date) as nearest_expiry
FROM products p
LEFT JOIN medicine_batches mb ON p.id = mb.product_id AND mb.is_active = TRUE AND mb.quantity_remaining > 0
LEFT JOIN medicine_categories mc ON p.medicine_category_id = mc.id
LEFT JOIN manufacturers m ON p.manufacturer_id = m.id
GROUP BY p.id, p.sku, p.name, p.generic_name, p.brand_name, mc.name, m.name;

-- Batch-wise Stock Detail View
CREATE OR REPLACE VIEW v_batch_stock_details AS
SELECT 
    mb.id as batch_id,
    mb.batch_number,
    p.id as product_id,
    p.sku,
    p.name as product_name,
    p.generic_name,
    p.brand_name,
    mc.name as category,
    m.name as manufacturer,
    mb.manufacture_date,
    mb.expiry_date,
    CURRENT_DATE - mb.expiry_date as days_expired,
    mb.expiry_date - CURRENT_DATE as days_to_expiry,
    mb.quantity_received,
    mb.quantity_remaining,
    mb.quantity_sold,
    mb.quantity_returned,
    mb.quantity_damaged,
    mb.purchase_price,
    mb.mrp,
    mb.selling_price,
    mb.quantity_remaining * mb.purchase_price as batch_value,
    mb.rack_number,
    s.name as store_name,
    mb.is_active,
    mb.is_expired,
    CASE 
        WHEN mb.is_expired THEN 'expired'
        WHEN mb.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'critical'
        WHEN mb.expiry_date <= CURRENT_DATE + INTERVAL '90 days' THEN 'warning'
        ELSE 'good'
    END as expiry_status
FROM medicine_batches mb
JOIN products p ON mb.product_id = p.id
LEFT JOIN medicine_categories mc ON p.medicine_category_id = mc.id
LEFT JOIN manufacturers m ON p.manufacturer_id = m.id
LEFT JOIN stores s ON mb.store_id = s.id;

-- Fast Moving Items View (last 30 days)
CREATE OR REPLACE VIEW v_fast_moving_items AS
SELECT 
    p.id,
    p.sku,
    p.name,
    p.generic_name,
    mc.name as category,
    COUNT(DISTINCT si.sale_id) as order_count,
    SUM(si.quantity) as total_sold,
    SUM(si.quantity * si.unit_price) as total_revenue,
    SUM(si.quantity) / 30.0 as daily_average,
    COALESCE(SUM(mb.quantity_remaining), 0) as current_stock,
    CASE 
        WHEN SUM(si.quantity) / 30.0 > 0 THEN COALESCE(SUM(mb.quantity_remaining), 0) / (SUM(si.quantity) / 30.0)
        ELSE 999
    END as days_of_stock
FROM sales_items si
JOIN sales s ON si.sale_id = s.id
JOIN products p ON si.product_id = p.id
LEFT JOIN medicine_categories mc ON p.medicine_category_id = mc.id
LEFT JOIN medicine_batches mb ON p.id = mb.product_id AND mb.is_active = TRUE
WHERE s.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY p.id, p.sku, p.name, p.generic_name, mc.name
ORDER BY total_sold DESC;

-- Slow Moving Items View (last 90 days)
CREATE OR REPLACE VIEW v_slow_moving_items AS
SELECT 
    p.id,
    p.sku,
    p.name,
    p.generic_name,
    mc.name as category,
    COALESCE(SUM(mb.quantity_remaining), 0) as current_stock,
    COALESCE(SUM(si.quantity), 0) as sold_in_90_days,
    COALESCE(SUM(mb.quantity_remaining * mb.purchase_price), 0) as stock_value,
    MIN(mb.expiry_date) as nearest_expiry,
    CURRENT_DATE - MAX(s.created_at::DATE) as days_since_last_sale
FROM products p
LEFT JOIN medicine_batches mb ON p.id = mb.product_id AND mb.is_active = TRUE
LEFT JOIN sales_items si ON p.id = si.product_id
LEFT JOIN sales s ON si.sale_id = s.id AND s.created_at >= CURRENT_DATE - INTERVAL '90 days'
LEFT JOIN medicine_categories mc ON p.medicine_category_id = mc.id
GROUP BY p.id, p.sku, p.name, p.generic_name, mc.name
HAVING COALESCE(SUM(mb.quantity_remaining), 0) > 0
   AND COALESCE(SUM(si.quantity), 0) < 5
ORDER BY days_since_last_sale DESC NULLS FIRST;

-- Dead Stock View (no sales in 6 months)
CREATE OR REPLACE VIEW v_dead_stock AS
SELECT 
    p.id,
    p.sku,
    p.name,
    mc.name as category,
    COALESCE(SUM(mb.quantity_remaining), 0) as current_stock,
    COALESCE(SUM(mb.quantity_remaining * mb.purchase_price), 0) as locked_value,
    MIN(mb.expiry_date) as nearest_expiry,
    MAX(s.created_at::DATE) as last_sale_date
FROM products p
LEFT JOIN medicine_batches mb ON p.id = mb.product_id AND mb.is_active = TRUE
LEFT JOIN sales_items si ON p.id = si.product_id
LEFT JOIN sales s ON si.sale_id = s.id
LEFT JOIN medicine_categories mc ON p.medicine_category_id = mc.id
GROUP BY p.id, p.sku, p.name, mc.name
HAVING COALESCE(SUM(mb.quantity_remaining), 0) > 0
   AND (MAX(s.created_at) < CURRENT_DATE - INTERVAL '180 days' OR MAX(s.created_at) IS NULL)
ORDER BY locked_value DESC;

-- Stock Age Analysis View
CREATE OR REPLACE VIEW v_stock_age_analysis AS
SELECT 
    p.id,
    p.name,
    mb.batch_number,
    mb.quantity_remaining,
    mb.purchase_price,
    mb.quantity_remaining * mb.purchase_price as value,
    mb.created_at::DATE as received_date,
    CURRENT_DATE - mb.created_at::DATE as age_in_days,
    CASE 
        WHEN CURRENT_DATE - mb.created_at::DATE <= 30 THEN '0-30 days'
        WHEN CURRENT_DATE - mb.created_at::DATE <= 60 THEN '31-60 days'
        WHEN CURRENT_DATE - mb.created_at::DATE <= 90 THEN '61-90 days'
        WHEN CURRENT_DATE - mb.created_at::DATE <= 180 THEN '91-180 days'
        ELSE '180+ days'
    END as age_bracket
FROM medicine_batches mb
JOIN products p ON mb.product_id = p.id
WHERE mb.is_active = TRUE AND mb.quantity_remaining > 0;

-- ============================================
-- PHASE 7: RETURN MANAGEMENT (Enhanced)
-- Note: Sales returns and purchase returns already created in earlier phases
-- ============================================

-- Bulk Return Processing Table
CREATE TABLE IF NOT EXISTS bulk_return_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_number TEXT UNIQUE NOT NULL,
    return_type TEXT NOT NULL, -- 'customer_return', 'supplier_return', 'damaged', 'expired'
    total_items INTEGER DEFAULT 0,
    total_quantity NUMERIC DEFAULT 0,
    total_value NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'pending', -- pending, processing, completed, cancelled
    notes TEXT,
    created_by TEXT,
    approved_by TEXT,
    approved_at TIMESTAMPTZ,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bulk_return_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bulk_return_id UUID REFERENCES bulk_return_batches(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL,
    batch_id UUID REFERENCES medicine_batches(id),
    batch_number TEXT,
    quantity NUMERIC NOT NULL,
    unit_price NUMERIC NOT NULL,
    total_value NUMERIC NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'pending',
    processed BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_bulk_return_batches_status ON bulk_return_batches(status);
CREATE INDEX IF NOT EXISTS idx_bulk_return_items_batch ON bulk_return_items(bulk_return_id);

-- Return Analytics View
CREATE OR REPLACE VIEW v_return_analytics AS
SELECT 
    DATE_TRUNC('month', created_at) as return_month,
    return_type,
    COUNT(*) as return_count,
    SUM(total_amount) as total_value,
    AVG(total_amount) as average_value
FROM (
    SELECT created_at, return_type, total_amount FROM sales_returns
    UNION ALL
    SELECT created_at, return_type, total_amount FROM purchase_returns
) all_returns
GROUP BY DATE_TRUNC('month', created_at), return_type;

-- ============================================
-- PHASE 8: SERVICE MANAGEMENT SYSTEM
-- ============================================

-- Service Categories
CREATE TABLE IF NOT EXISTS service_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default service categories
INSERT INTO service_categories (name, description, display_order) VALUES
('Home Delivery', 'Medicine home delivery service', 1),
('Health Checkup', 'Health checkup packages', 2),
('Lab Tests', 'Laboratory testing services', 3),
('Doctor Consultation', 'Doctor consultation services', 4),
('Vaccination', 'Vaccination services', 5),
('Medical Equipment Rental', 'Rent medical equipment', 6),
('Physiotherapy', 'Physiotherapy sessions', 7),
('Nursing Services', 'Home nursing care', 8),
('Other Services', 'Other healthcare services', 99)
ON CONFLICT (name) DO NOTHING;

-- Services Master
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_code TEXT UNIQUE NOT NULL,
    category_id UUID REFERENCES service_categories(id),
    name TEXT NOT NULL,
    description TEXT,
    base_price NUMERIC NOT NULL,
    vat_percentage NUMERIC DEFAULT 0,
    cgst_percentage NUMERIC DEFAULT 0,
    sgst_percentage NUMERIC DEFAULT 0,
    igst_percentage NUMERIC DEFAULT 0,
    hsn_code TEXT,
    duration_minutes INTEGER,
    is_home_service BOOLEAN DEFAULT FALSE,
    travel_charges NUMERIC DEFAULT 0,
    min_advance_booking_hours INTEGER DEFAULT 0,
    max_bookings_per_day INTEGER,
    terms_and_conditions TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_services_category ON services(category_id);
CREATE INDEX IF NOT EXISTS idx_services_code ON services(service_code);

-- Service Invoices
CREATE TABLE IF NOT EXISTS service_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number TEXT UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id),
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    customer_email TEXT,
    customer_address TEXT,
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    service_date DATE,
    service_time TIME,
    subtotal NUMERIC DEFAULT 0,
    discount_percentage NUMERIC DEFAULT 0,
    discount_amount NUMERIC DEFAULT 0,
    vat_amount NUMERIC DEFAULT 0,
    cgst_amount NUMERIC DEFAULT 0,
    sgst_amount NUMERIC DEFAULT 0,
    igst_amount NUMERIC DEFAULT 0,
    total_tax NUMERIC DEFAULT 0,
    travel_charges NUMERIC DEFAULT 0,
    other_charges NUMERIC DEFAULT 0,
    round_off NUMERIC DEFAULT 0,
    grand_total NUMERIC NOT NULL,
    payment_method TEXT,
    payment_status TEXT DEFAULT 'pending',
    paid_amount NUMERIC DEFAULT 0,
    balance_amount NUMERIC DEFAULT 0,
    notes TEXT,
    status TEXT DEFAULT 'draft', -- draft, confirmed, in_progress, completed, cancelled
    created_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_service_invoices_number ON service_invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_service_invoices_customer ON service_invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_service_invoices_date ON service_invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_service_invoices_status ON service_invoices(status);

-- Service Invoice Items
CREATE TABLE IF NOT EXISTS service_invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES service_invoices(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id),
    service_code TEXT,
    service_name TEXT NOT NULL,
    description TEXT,
    quantity NUMERIC NOT NULL DEFAULT 1,
    unit_price NUMERIC NOT NULL,
    discount_percentage NUMERIC DEFAULT 0,
    discount_amount NUMERIC DEFAULT 0,
    vat_percentage NUMERIC DEFAULT 0,
    vat_amount NUMERIC DEFAULT 0,
    cgst_percentage NUMERIC DEFAULT 0,
    cgst_amount NUMERIC DEFAULT 0,
    sgst_percentage NUMERIC DEFAULT 0,
    sgst_amount NUMERIC DEFAULT 0,
    igst_percentage NUMERIC DEFAULT 0,
    igst_amount NUMERIC DEFAULT 0,
    total_price NUMERIC NOT NULL,
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_service_invoice_items_invoice ON service_invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_service_invoice_items_service ON service_invoice_items(service_id);

-- Service Bookings/Appointments
CREATE TABLE IF NOT EXISTS service_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_number TEXT UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id),
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_address TEXT,
    service_id UUID REFERENCES services(id),
    service_name TEXT NOT NULL,
    booking_date DATE NOT NULL,
    booking_time TIME NOT NULL,
    duration_minutes INTEGER,
    status TEXT DEFAULT 'pending', -- pending, confirmed, in_progress, completed, cancelled, no_show
    service_invoice_id UUID REFERENCES service_invoices(id),
    advance_paid NUMERIC DEFAULT 0,
    notes TEXT,
    special_instructions TEXT,
    assigned_to TEXT,
    confirmed_by TEXT,
    confirmed_at TIMESTAMPTZ,
    cancelled_by TEXT,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    created_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_service_bookings_number ON service_bookings(booking_number);
CREATE INDEX IF NOT EXISTS idx_service_bookings_customer ON service_bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_service_bookings_date ON service_bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_service_bookings_status ON service_bookings(status);

-- Service Packages
CREATE TABLE IF NOT EXISTS service_packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    package_code TEXT UNIQUE NOT NULL,
    package_name TEXT NOT NULL,
    description TEXT,
    services JSONB NOT NULL, -- Array of service IDs with quantities
    package_price NUMERIC NOT NULL,
    discount_percentage NUMERIC DEFAULT 0,
    validity_days INTEGER DEFAULT 365,
    terms TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Service Reviews & Ratings
CREATE TABLE IF NOT EXISTS service_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES service_bookings(id),
    customer_id UUID REFERENCES customers(id),
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review_text TEXT,
    response_text TEXT,
    responded_by TEXT,
    responded_at TIMESTAMPTZ,
    is_verified BOOLEAN DEFAULT FALSE,
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_service_reviews_service ON service_reviews(service_id);
CREATE INDEX IF NOT EXISTS idx_service_reviews_customer ON service_reviews(customer_id);

-- ============================================
-- VIEWS FOR SERVICE MANAGEMENT
-- ============================================

-- Service Invoice Details View
CREATE OR REPLACE VIEW v_service_invoice_details AS
SELECT 
    si.id,
    si.invoice_number,
    si.invoice_date,
    si.customer_name,
    si.customer_phone,
    si.service_date,
    si.subtotal,
    si.discount_amount,
    si.total_tax,
    si.grand_total,
    si.payment_status,
    si.status,
    COUNT(sii.id) as item_count,
    SUM(sii.quantity) as total_services,
    si.created_at
FROM service_invoices si
LEFT JOIN service_invoice_items sii ON si.id = sii.invoice_id
GROUP BY si.id;

-- Upcoming Service Bookings View
CREATE OR REPLACE VIEW v_upcoming_bookings AS
SELECT 
    sb.id,
    sb.booking_number,
    sb.customer_name,
    sb.customer_phone,
    sb.booking_date,
    sb.booking_time,
    s.name as service_name,
    s.duration_minutes,
    sb.status,
    sb.assigned_to
FROM service_bookings sb
LEFT JOIN services s ON sb.service_id = s.id
WHERE sb.booking_date >= CURRENT_DATE
    AND sb.status IN ('pending', 'confirmed')
ORDER BY sb.booking_date, sb.booking_time;

-- Service Performance View
CREATE OR REPLACE VIEW v_service_performance AS
SELECT 
    s.id,
    s.service_code,
    s.name,
    sc.name as category,
    COUNT(DISTINCT sb.id) as total_bookings,
    COUNT(DISTINCT CASE WHEN sb.status = 'completed' THEN sb.id END) as completed_bookings,
    SUM(CASE WHEN sb.status = 'completed' THEN s.base_price ELSE 0 END) as total_revenue,
    AVG(sr.rating) as average_rating,
    COUNT(sr.id) as review_count
FROM services s
LEFT JOIN service_categories sc ON s.category_id = sc.id
LEFT JOIN service_bookings sb ON s.id = sb.service_id
LEFT JOIN service_reviews sr ON s.id = sr.service_id
WHERE s.is_active = TRUE
GROUP BY s.id, s.service_code, s.name, sc.name;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function: Generate Service Invoice Number
CREATE OR REPLACE FUNCTION generate_service_invoice_number()
RETURNS TEXT AS $$
DECLARE
    v_year TEXT;
    v_month TEXT;
    v_sequence INTEGER;
    v_number TEXT;
BEGIN
    v_year := TO_CHAR(CURRENT_DATE, 'YY');
    v_month := TO_CHAR(CURRENT_DATE, 'MM');
    
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(invoice_number FROM 'SRV' || v_year || v_month || '(\d+)') AS INTEGER)
    ), 0) + 1 INTO v_sequence
    FROM service_invoices
    WHERE invoice_number LIKE 'SRV' || v_year || v_month || '%';
    
    v_number := 'SRV' || v_year || v_month || LPAD(v_sequence::TEXT, 5, '0');
    
    RETURN v_number;
END;
$$ LANGUAGE plpgsql;

-- Function: Calculate Service Invoice Totals
CREATE OR REPLACE FUNCTION calculate_service_invoice_totals()
RETURNS TRIGGER AS $$
DECLARE
    v_subtotal NUMERIC;
    v_vat NUMERIC;
    v_cgst NUMERIC;
    v_sgst NUMERIC;
    v_igst NUMERIC;
BEGIN
    SELECT 
        COALESCE(SUM(total_price), 0),
        COALESCE(SUM(vat_amount), 0),
        COALESCE(SUM(cgst_amount), 0),
        COALESCE(SUM(sgst_amount), 0),
        COALESCE(SUM(igst_amount), 0)
    INTO v_subtotal, v_vat, v_cgst, v_sgst, v_igst
    FROM service_invoice_items
    WHERE invoice_id = NEW.invoice_id;
    
    UPDATE service_invoices
    SET subtotal = v_subtotal,
        vat_amount = v_vat,
        cgst_amount = v_cgst,
        sgst_amount = v_sgst,
        igst_amount = v_igst,
        total_tax = v_vat + v_cgst + v_sgst + v_igst,
        grand_total = v_subtotal - COALESCE(discount_amount, 0) + v_vat + v_cgst + v_sgst + v_igst + COALESCE(travel_charges, 0) + COALESCE(other_charges, 0) + COALESCE(round_off, 0),
        balance_amount = v_subtotal - COALESCE(discount_amount, 0) + v_vat + v_cgst + v_sgst + v_igst + COALESCE(travel_charges, 0) + COALESCE(other_charges, 0) + COALESCE(round_off, 0) - COALESCE(paid_amount, 0)
    WHERE id = NEW.invoice_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-calculate service invoice totals
DROP TRIGGER IF EXISTS trigger_calculate_service_invoice_totals ON service_invoice_items;
CREATE TRIGGER trigger_calculate_service_invoice_totals
    AFTER INSERT OR UPDATE ON service_invoice_items
    FOR EACH ROW
    EXECUTE FUNCTION calculate_service_invoice_totals();

-- ============================================
-- COMPLETION MESSAGE
-- ============================================
DO $$
BEGIN
    RAISE NOTICE 'Phase 6, 7, 8: Stock Management, Returns, Service Management - COMPLETE!';
    RAISE NOTICE 'Phase 6: Created views for stock valuation, batch details, fast/slow/dead stock analysis';
    RAISE NOTICE 'Phase 7: Enhanced return management with bulk returns processing';
    RAISE NOTICE 'Phase 8: Complete service management with bookings, invoices, packages, reviews';
END $$;

