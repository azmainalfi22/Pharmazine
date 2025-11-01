-- Phase 1: Medicine Management System Migration
-- Comprehensive pharmacy-specific schema
-- Created: October 31, 2025

-- ============================================
-- MEDICINE CATEGORIES
-- ============================================
CREATE TABLE IF NOT EXISTS medicine_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Predefined medicine categories
INSERT INTO medicine_categories (name, description, display_order) VALUES
    ('Tablet', 'Solid dosage form - Tablets', 1),
    ('Capsule', 'Capsule form medications', 2),
    ('Syrup', 'Liquid oral medications', 3),
    ('Injection', 'Injectable medications', 4),
    ('Suspension', 'Liquid suspension medications', 5),
    ('Ointment', 'Topical ointments and creams', 6),
    ('Drops', 'Eye/Ear/Nasal drops', 7),
    ('Powder', 'Powder form medications', 8),
    ('Inhaler', 'Inhalation medications', 9),
    ('Suppository', 'Rectal/Vaginal suppositories', 10),
    ('Gel', 'Topical gels', 11),
    ('Lotion', 'Topical lotions', 12),
    ('Spray', 'Spray medications', 13),
    ('Solution', 'Solution form', 14),
    ('Other', 'Other forms', 99)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- UNIT TYPES
-- ============================================
CREATE TABLE IF NOT EXISTS unit_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    abbreviation TEXT NOT NULL,
    category TEXT, -- 'weight', 'volume', 'quantity'
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Predefined unit types
INSERT INTO unit_types (name, abbreviation, category, display_order) VALUES
    ('Milligram', 'mg', 'weight', 1),
    ('Gram', 'g', 'weight', 2),
    ('Kilogram', 'kg', 'weight', 3),
    ('Milliliter', 'ml', 'volume', 4),
    ('Liter', 'l', 'volume', 5),
    ('Piece', 'pc', 'quantity', 6),
    ('Strip', 'strip', 'quantity', 7),
    ('Box', 'box', 'quantity', 8),
    ('Bottle', 'btl', 'quantity', 9),
    ('Tube', 'tube', 'quantity', 10),
    ('Vial', 'vial', 'quantity', 11),
    ('Ampoule', 'amp', 'quantity', 12),
    ('Sachet', 'sachet', 'quantity', 13),
    ('Packet', 'pkt', 'quantity', 14),
    ('Roll', 'roll', 'quantity', 15)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- MEDICINE TYPES (Therapeutic Categories)
-- ============================================
CREATE TABLE IF NOT EXISTS medicine_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Predefined medicine types (therapeutic categories)
INSERT INTO medicine_types (name, description, display_order) VALUES
    ('Painkiller', 'Analgesics and pain relief', 1),
    ('Antibiotic', 'Antibacterial medications', 2),
    ('Antiviral', 'Antiviral medications', 3),
    ('Antifungal', 'Antifungal medications', 4),
    ('Heart Disease', 'Cardiovascular medications', 5),
    ('Diabetes', 'Antidiabetic medications', 6),
    ('Blood Pressure', 'Antihypertensive medications', 7),
    ('Fever & Cold', 'Antipyretic and cold medications', 8),
    ('Allergy', 'Antihistamine and antiallergic', 9),
    ('Vitamin & Supplement', 'Vitamins and nutritional supplements', 10),
    ('Antacid', 'Digestive and antacid medications', 11),
    ('Antiemetic', 'Anti-nausea medications', 12),
    ('Laxative', 'Laxatives and constipation relief', 13),
    ('Antidiarrheal', 'Diarrhea medications', 14),
    ('Cough & Asthma', 'Respiratory medications', 15),
    ('Skin Care', 'Dermatological medications', 16),
    ('Eye Care', 'Ophthalmic medications', 17),
    ('Contraceptive', 'Contraceptive medications', 18),
    ('Hormone', 'Hormone replacement therapy', 19),
    ('Mental Health', 'Psychiatric medications', 20),
    ('Anticoagulant', 'Blood thinning medications', 21),
    ('Anesthetic', 'Anesthetic medications', 22),
    ('Other', 'Other medications', 99)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- MANUFACTURERS (Enhanced supplier for pharmacy)
-- ============================================
CREATE TABLE IF NOT EXISTS manufacturers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT UNIQUE,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT,
    postal_code TEXT,
    tax_number TEXT,
    payment_terms TEXT,
    credit_limit NUMERIC DEFAULT 0,
    opening_balance NUMERIC DEFAULT 0,
    current_balance NUMERIC DEFAULT 0,
    website TEXT,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- ENHANCED PRODUCTS TABLE FOR MEDICINES
-- ============================================
-- Add pharmacy-specific columns to existing products table
ALTER TABLE IF EXISTS products
    ADD COLUMN IF NOT EXISTS generic_name TEXT,
    ADD COLUMN IF NOT EXISTS brand_name TEXT,
    ADD COLUMN IF NOT EXISTS medicine_category_id UUID REFERENCES medicine_categories(id),
    ADD COLUMN IF NOT EXISTS medicine_type_id UUID REFERENCES medicine_types(id),
    ADD COLUMN IF NOT EXISTS manufacturer_id UUID REFERENCES manufacturers(id),
    ADD COLUMN IF NOT EXISTS strength TEXT, -- e.g., "500mg", "10ml"
    ADD COLUMN IF NOT EXISTS composition TEXT,
    ADD COLUMN IF NOT EXISTS barcode TEXT UNIQUE,
    ADD COLUMN IF NOT EXISTS qr_code TEXT,
    ADD COLUMN IF NOT EXISTS unit_type_id UUID REFERENCES unit_types(id),
    ADD COLUMN IF NOT EXISTS shelf_life_days INTEGER, -- Shelf life in days
    ADD COLUMN IF NOT EXISTS storage_condition TEXT,
    ADD COLUMN IF NOT EXISTS is_prescription_required BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS is_schedule_drug BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS schedule_category TEXT, -- H, H1, X, etc.
    ADD COLUMN IF NOT EXISTS side_effects TEXT,
    ADD COLUMN IF NOT EXISTS dosage_info TEXT,
    ADD COLUMN IF NOT EXISTS pack_size INTEGER DEFAULT 1, -- Units per pack
    ADD COLUMN IF NOT EXISTS strip_size INTEGER DEFAULT 1, -- Units per strip
    ADD COLUMN IF NOT EXISTS box_size INTEGER DEFAULT 1, -- Strips per box
    ADD COLUMN IF NOT EXISTS vat_percentage NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS cgst_percentage NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS sgst_percentage NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS igst_percentage NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS hsn_code TEXT, -- HSN code for GST
    ADD COLUMN IF NOT EXISTS reorder_level INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS max_discount_percentage NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS is_narcotic BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS rack_number TEXT,
    ADD COLUMN IF NOT EXISTS shelf_number TEXT;

-- ============================================
-- MEDICINE BATCHES (Critical for pharmacy)
-- ============================================
CREATE TABLE IF NOT EXISTS medicine_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id TEXT NOT NULL, -- Reference to products table
    batch_number TEXT NOT NULL,
    manufacture_date DATE,
    expiry_date DATE NOT NULL,
    manufacturer_id UUID REFERENCES manufacturers(id),
    purchase_id UUID REFERENCES purchases(id),
    quantity_received NUMERIC NOT NULL DEFAULT 0,
    quantity_remaining NUMERIC NOT NULL DEFAULT 0,
    quantity_sold NUMERIC DEFAULT 0,
    quantity_returned NUMERIC DEFAULT 0,
    quantity_damaged NUMERIC DEFAULT 0,
    purchase_price NUMERIC NOT NULL,
    mrp NUMERIC,
    selling_price NUMERIC,
    discount_percentage NUMERIC DEFAULT 0,
    store_id UUID REFERENCES stores(id),
    rack_number TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_expired BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(product_id, batch_number, store_id)
);

-- Index for quick expiry checks
CREATE INDEX IF NOT EXISTS idx_batches_expiry ON medicine_batches(expiry_date, is_active);
CREATE INDEX IF NOT EXISTS idx_batches_product ON medicine_batches(product_id);
CREATE INDEX IF NOT EXISTS idx_batches_store ON medicine_batches(store_id);

-- ============================================
-- BATCH STOCK TRANSACTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS batch_stock_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID NOT NULL REFERENCES medicine_batches(id),
    transaction_type TEXT NOT NULL, -- 'purchase', 'sale', 'return_customer', 'return_supplier', 'damage', 'adjustment', 'transfer_in', 'transfer_out', 'expired'
    quantity NUMERIC NOT NULL,
    reference_id UUID, -- ID of sale, purchase, return, etc.
    reference_type TEXT, -- 'sale', 'purchase', 'return', etc.
    notes TEXT,
    created_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_batch_transactions_batch ON batch_stock_transactions(batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_transactions_type ON batch_stock_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_batch_transactions_date ON batch_stock_transactions(created_at);

-- ============================================
-- ENHANCED PURCHASE ITEMS (with batch tracking)
-- ============================================
ALTER TABLE IF EXISTS purchase_items
    ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES medicine_batches(id),
    ADD COLUMN IF NOT EXISTS batch_number TEXT,
    ADD COLUMN IF NOT EXISTS expiry_date DATE,
    ADD COLUMN IF NOT EXISTS mrp NUMERIC,
    ADD COLUMN IF NOT EXISTS discount_percentage NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS vat_percentage NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS vat_amount NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS cgst_percentage NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS cgst_amount NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS sgst_percentage NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS sgst_amount NUMERIC DEFAULT 0;

-- ============================================
-- ENHANCED SALES ITEMS (with batch tracking)
-- ============================================
ALTER TABLE IF EXISTS sales_items
    ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES medicine_batches(id),
    ADD COLUMN IF NOT EXISTS batch_number TEXT,
    ADD COLUMN IF NOT EXISTS expiry_date DATE,
    ADD COLUMN IF NOT EXISTS unit_price NUMERIC,
    ADD COLUMN IF NOT EXISTS discount_percentage NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS vat_percentage NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS vat_amount NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS cgst_percentage NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS cgst_amount NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS sgst_percentage NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS sgst_amount NUMERIC DEFAULT 0;

-- ============================================
-- ENHANCED CUSTOMERS (with pharmacy-specific fields)
-- ============================================
ALTER TABLE IF EXISTS customers
    ADD COLUMN IF NOT EXISTS customer_code TEXT UNIQUE,
    ADD COLUMN IF NOT EXISTS email TEXT,
    ADD COLUMN IF NOT EXISTS phone2 TEXT,
    ADD COLUMN IF NOT EXISTS date_of_birth DATE,
    ADD COLUMN IF NOT EXISTS gender TEXT,
    ADD COLUMN IF NOT EXISTS blood_group TEXT,
    ADD COLUMN IF NOT EXISTS allergies TEXT,
    ADD COLUMN IF NOT EXISTS credit_limit NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS payment_terms TEXT,
    ADD COLUMN IF NOT EXISTS opening_balance NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS current_balance NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS tax_number TEXT,
    ADD COLUMN IF NOT EXISTS customer_type TEXT DEFAULT 'retail', -- 'retail', 'wholesale', 'hospital'
    ADD COLUMN IF NOT EXISTS discount_percentage NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS loyalty_points INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS notes TEXT,
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- ============================================
-- DISCOUNT CONFIGURATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS discount_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    discount_type TEXT NOT NULL, -- 'category', 'product', 'customer_type', 'quantity_based', 'seasonal'
    discount_percentage NUMERIC,
    discount_amount NUMERIC,
    min_quantity NUMERIC,
    max_quantity NUMERIC,
    category_id UUID,
    medicine_category_id UUID REFERENCES medicine_categories(id),
    product_id TEXT,
    customer_type TEXT,
    valid_from DATE,
    valid_to DATE,
    is_active BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- BARCODE PRINT LOG
-- ============================================
CREATE TABLE IF NOT EXISTS barcode_print_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id TEXT NOT NULL,
    batch_id UUID REFERENCES medicine_batches(id),
    quantity_printed INTEGER NOT NULL,
    printer_name TEXT,
    paper_size TEXT, -- 'label', 'a4', 'a5', 'a6'
    printed_by TEXT,
    printed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- EXPIRED MEDICINES LOG
-- ============================================
CREATE TABLE IF NOT EXISTS expired_medicines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID NOT NULL REFERENCES medicine_batches(id),
    product_id TEXT NOT NULL,
    batch_number TEXT NOT NULL,
    expiry_date DATE NOT NULL,
    quantity NUMERIC NOT NULL,
    purchase_value NUMERIC,
    disposal_method TEXT, -- 'return_to_supplier', 'destroy', 'donate'
    disposal_date DATE,
    disposal_notes TEXT,
    handled_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- WASTE PRODUCTS LOG
-- ============================================
CREATE TABLE IF NOT EXISTS waste_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID REFERENCES medicine_batches(id),
    product_id TEXT NOT NULL,
    batch_number TEXT,
    quantity NUMERIC NOT NULL,
    reason TEXT NOT NULL, -- 'damaged', 'expired', 'contaminated', 'returned_damaged', 'quality_issue'
    value_loss NUMERIC,
    store_id UUID REFERENCES stores(id),
    reported_by TEXT,
    approved_by TEXT,
    disposal_method TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- EXPIRY ALERTS CONFIGURATION
-- ============================================
CREATE TABLE IF NOT EXISTS expiry_alert_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_days_before INTEGER NOT NULL DEFAULT 90, -- Alert 90 days before expiry
    alert_level TEXT NOT NULL, -- 'info', 'warning', 'critical'
    notification_method TEXT[], -- ['email', 'sms', 'system']
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default alert settings
INSERT INTO expiry_alert_settings (alert_days_before, alert_level, notification_method) VALUES
    (90, 'info', ARRAY['system']),
    (60, 'warning', ARRAY['system', 'email']),
    (30, 'critical', ARRAY['system', 'email', 'sms'])
ON CONFLICT DO NOTHING;

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- View: Products with current stock and batch info
CREATE OR REPLACE VIEW v_medicines_with_stock AS
SELECT 
    p.id,
    p.sku,
    p.name,
    p.generic_name,
    p.brand_name,
    p.barcode,
    mc.name as medicine_category,
    mt.name as medicine_type,
    m.name as manufacturer,
    ut.name as unit_type,
    ut.abbreviation as unit_abbr,
    p.strength,
    p.selling_price,
    p.purchase_price,
    p.mrp,
    p.vat_percentage,
    p.is_prescription_required,
    p.reorder_level,
    COALESCE(SUM(mb.quantity_remaining), 0) as total_stock,
    COUNT(DISTINCT mb.id) as batch_count,
    MIN(mb.expiry_date) as nearest_expiry,
    p.created_at,
    p.updated_at
FROM products p
LEFT JOIN medicine_categories mc ON p.medicine_category_id = mc.id
LEFT JOIN medicine_types mt ON p.medicine_type_id = mt.id
LEFT JOIN manufacturers m ON p.manufacturer_id = m.id
LEFT JOIN unit_types ut ON p.unit_type_id = ut.id
LEFT JOIN medicine_batches mb ON p.id = mb.product_id AND mb.is_active = TRUE
GROUP BY p.id, mc.name, mt.name, m.name, ut.name, ut.abbreviation;

-- View: Expiring medicines (within 90 days)
CREATE OR REPLACE VIEW v_expiring_medicines AS
SELECT 
    mb.id as batch_id,
    mb.batch_number,
    p.id as product_id,
    p.name as product_name,
    p.generic_name,
    p.brand_name,
    p.barcode,
    mb.expiry_date,
    mb.quantity_remaining,
    mb.purchase_price,
    (mb.quantity_remaining * mb.purchase_price) as value_at_risk,
    m.name as manufacturer,
    s.name as store,
    (mb.expiry_date - CURRENT_DATE) as days_to_expiry,
    CASE 
        WHEN (mb.expiry_date - CURRENT_DATE) <= 0 THEN 'expired'
        WHEN (mb.expiry_date - CURRENT_DATE) <= 30 THEN 'critical'
        WHEN (mb.expiry_date - CURRENT_DATE) <= 60 THEN 'warning'
        WHEN (mb.expiry_date - CURRENT_DATE) <= 90 THEN 'info'
        ELSE 'safe'
    END as alert_level
FROM medicine_batches mb
JOIN products p ON mb.product_id = p.id
LEFT JOIN manufacturers m ON p.manufacturer_id = m.id
LEFT JOIN stores s ON mb.store_id = s.id
WHERE mb.is_active = TRUE 
    AND mb.quantity_remaining > 0
    AND (mb.expiry_date - CURRENT_DATE) <= 90
ORDER BY mb.expiry_date ASC;

-- View: Low stock medicines
CREATE OR REPLACE VIEW v_low_stock_medicines AS
SELECT 
    p.id,
    p.sku,
    p.name,
    p.generic_name,
    p.brand_name,
    p.reorder_level,
    COALESCE(SUM(mb.quantity_remaining), 0) as current_stock,
    p.reorder_level - COALESCE(SUM(mb.quantity_remaining), 0) as shortage,
    m.name as manufacturer,
    m.phone as manufacturer_phone
FROM products p
LEFT JOIN medicine_batches mb ON p.id = mb.product_id AND mb.is_active = TRUE
LEFT JOIN manufacturers m ON p.manufacturer_id = m.id
WHERE p.reorder_level > 0
GROUP BY p.id, m.name, m.phone
HAVING COALESCE(SUM(mb.quantity_remaining), 0) <= p.reorder_level
ORDER BY shortage DESC;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function: Update batch quantity after transaction
CREATE OR REPLACE FUNCTION update_batch_quantity()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.transaction_type IN ('sale', 'return_supplier', 'damage', 'transfer_out', 'expired') THEN
        -- Decrease quantity
        UPDATE medicine_batches 
        SET quantity_remaining = quantity_remaining - NEW.quantity,
            quantity_sold = quantity_sold + CASE WHEN NEW.transaction_type = 'sale' THEN NEW.quantity ELSE 0 END,
            quantity_returned = quantity_returned + CASE WHEN NEW.transaction_type = 'return_supplier' THEN NEW.quantity ELSE 0 END,
            quantity_damaged = quantity_damaged + CASE WHEN NEW.transaction_type IN ('damage', 'expired') THEN NEW.quantity ELSE 0 END,
            updated_at = now()
        WHERE id = NEW.batch_id;
    ELSIF NEW.transaction_type IN ('purchase', 'return_customer', 'adjustment', 'transfer_in') THEN
        -- Increase quantity
        UPDATE medicine_batches 
        SET quantity_remaining = quantity_remaining + NEW.quantity,
            updated_at = now()
        WHERE id = NEW.batch_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update batch quantity on transaction
DROP TRIGGER IF EXISTS trigger_update_batch_quantity ON batch_stock_transactions;
CREATE TRIGGER trigger_update_batch_quantity
    AFTER INSERT ON batch_stock_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_batch_quantity();

-- Function: Check and mark expired batches
CREATE OR REPLACE FUNCTION check_expired_batches()
RETURNS void AS $$
BEGIN
    -- Mark batches as expired
    UPDATE medicine_batches
    SET is_expired = TRUE, is_active = FALSE, updated_at = now()
    WHERE expiry_date < CURRENT_DATE AND is_expired = FALSE;
    
    -- Log expired batches
    INSERT INTO expired_medicines (batch_id, product_id, batch_number, expiry_date, quantity, purchase_value)
    SELECT 
        mb.id,
        mb.product_id,
        mb.batch_number,
        mb.expiry_date,
        mb.quantity_remaining,
        mb.quantity_remaining * mb.purchase_price
    FROM medicine_batches mb
    WHERE mb.expiry_date < CURRENT_DATE 
        AND mb.is_expired = FALSE 
        AND mb.quantity_remaining > 0
        AND NOT EXISTS (
            SELECT 1 FROM expired_medicines em 
            WHERE em.batch_id = mb.id
        );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_generic_name ON products(generic_name);
CREATE INDEX IF NOT EXISTS idx_products_medicine_category ON products(medicine_category_id);
CREATE INDEX IF NOT EXISTS idx_products_medicine_type ON products(medicine_type_id);
CREATE INDEX IF NOT EXISTS idx_products_manufacturer ON products(manufacturer_id);
CREATE INDEX IF NOT EXISTS idx_manufacturers_name ON manufacturers(name);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(contact);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_code ON customers(customer_code);

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE medicine_categories IS 'Dosage forms like tablet, syrup, injection, etc.';
COMMENT ON TABLE unit_types IS 'Measurement units like mg, ml, piece, strip, etc.';
COMMENT ON TABLE medicine_types IS 'Therapeutic categories like painkiller, antibiotic, etc.';
COMMENT ON TABLE manufacturers IS 'Medicine manufacturers and suppliers';
COMMENT ON TABLE medicine_batches IS 'Individual batches of medicines with expiry tracking';
COMMENT ON TABLE batch_stock_transactions IS 'All stock movements at batch level';
COMMENT ON TABLE expired_medicines IS 'Log of expired medicines for disposal tracking';
COMMENT ON TABLE waste_products IS 'Log of damaged or wasted products';
COMMENT ON TABLE discount_configs IS 'Configurable discount rules';

-- ============================================
-- COMPLETION MESSAGE
-- ============================================
DO $$
BEGIN
    RAISE NOTICE 'Phase 1: Medicine Management System Migration Completed Successfully!';
    RAISE NOTICE 'Created Tables: medicine_categories, unit_types, medicine_types, manufacturers, medicine_batches';
    RAISE NOTICE 'Enhanced Tables: products, purchase_items, sales_items, customers';
    RAISE NOTICE 'Created Views: v_medicines_with_stock, v_expiring_medicines, v_low_stock_medicines';
    RAISE NOTICE 'Ready for Medicine Management Operations!';
END $$;

