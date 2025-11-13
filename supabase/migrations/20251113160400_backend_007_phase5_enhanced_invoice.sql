-- Phase 5: Enhanced Invoice System
-- GUI sale interface, barcode/QR integration, batch-wise tracking, professional templates

-- ============================================
-- ENHANCED SALES TABLE
-- ============================================
ALTER TABLE IF EXISTS sales
    ADD COLUMN IF NOT EXISTS invoice_number TEXT UNIQUE,
    ADD COLUMN IF NOT EXISTS invoice_type TEXT DEFAULT 'retail', -- retail, wholesale, hospital, return
    ADD COLUMN IF NOT EXISTS barcode_scanned BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS qr_scanned BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS scan_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS subtotal NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS discount_type TEXT, -- percentage, amount, coupon
    ADD COLUMN IF NOT EXISTS discount_code TEXT,
    ADD COLUMN IF NOT EXISTS vat_amount NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS cgst_amount NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS sgst_amount NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS igst_amount NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS round_off NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS grand_total NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS tender_amount NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS change_amount NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id),
    ADD COLUMN IF NOT EXISTS billing_address TEXT,
    ADD COLUMN IF NOT EXISTS shipping_address TEXT,
    ADD COLUMN IF NOT EXISTS doctor_name TEXT,
    ADD COLUMN IF NOT EXISTS prescription_number TEXT,
    ADD COLUMN IF NOT EXISTS prescription_date DATE,
    ADD COLUMN IF NOT EXISTS notes TEXT,
    ADD COLUMN IF NOT EXISTS internal_notes TEXT,
    ADD COLUMN IF NOT EXISTS invoice_template_id UUID,
    ADD COLUMN IF NOT EXISTS print_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_print_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS print_size TEXT DEFAULT 'a4',
    ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS sms_sent BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS sms_sent_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS whatsapp_sent BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS whatsapp_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_sales_invoice_number ON sales(invoice_number);
CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_prescription ON sales(prescription_number);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);

-- ============================================
-- SALES ITEMS ENHANCEMENTS
-- ============================================
ALTER TABLE IF EXISTS sales_items
    ADD COLUMN IF NOT EXISTS item_number INTEGER,
    ADD COLUMN IF NOT EXISTS product_name TEXT,
    ADD COLUMN IF NOT EXISTS product_code TEXT,
    ADD COLUMN IF NOT EXISTS generic_name TEXT,
    ADD COLUMN IF NOT EXISTS hsn_code TEXT,
    ADD COLUMN IF NOT EXISTS manufacture_date DATE,
    ADD COLUMN IF NOT EXISTS strip_qty NUMERIC,
    ADD COLUMN IF NOT EXISTS unit_per_strip INTEGER,
    ADD COLUMN IF NOT EXISTS free_qty NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS margin_percentage NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS tax_type TEXT, -- vat, gst
    ADD COLUMN IF NOT EXISTS item_notes TEXT;

-- ============================================
-- INVOICE TEMPLATES (Enhanced)
-- ============================================
INSERT INTO print_templates (template_name, template_type, paper_size, orientation, is_default, is_active) VALUES
-- A4 Templates
('Professional Invoice - A4', 'invoice', 'a4', 'portrait', TRUE, TRUE),
('Minimalist Invoice - A4', 'invoice', 'a4', 'portrait', FALSE, TRUE),
('Detailed Invoice with Logo - A4', 'invoice', 'a4', 'portrait', FALSE, TRUE),

-- A5 Templates  
('Compact Invoice - A5', 'invoice', 'a5', 'portrait', FALSE, TRUE),
('Quick Invoice - A5', 'invoice', 'a5', 'landscape', FALSE, TRUE),

-- A6 Templates
('Small Invoice - A6', 'invoice', 'a6', 'portrait', FALSE, TRUE),

-- POS/Thermal Templates
('Thermal Receipt - 80mm', 'invoice', 'pos', 'portrait', FALSE, TRUE),
('Thermal Receipt - 58mm', 'invoice', 'pos', 'portrait', FALSE, TRUE),

-- Receipt Templates
('Simple Receipt - A4', 'receipt', 'a4', 'portrait', FALSE, TRUE),
('Thermal Receipt', 'receipt', 'pos', 'portrait', FALSE, TRUE)
ON CONFLICT (template_name) DO NOTHING;

-- ============================================
-- BARCODE SCAN LOG
-- ============================================
CREATE TABLE IF NOT EXISTS barcode_scan_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id TEXT,
    barcode_data TEXT NOT NULL,
    product_id UUID REFERENCES products(id),
    batch_id UUID REFERENCES medicine_batches(id),
    scan_type TEXT, -- 'sale', 'purchase', 'stock_check', 'return'
    scanned_by TEXT,
    scanned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    result_status TEXT, -- 'found', 'not_found', 'expired', 'out_of_stock'
    sale_id UUID REFERENCES sales(id),
    purchase_id UUID REFERENCES purchases(id)
);

CREATE INDEX IF NOT EXISTS idx_barcode_scan_barcode ON barcode_scan_log(barcode_data);
CREATE INDEX IF NOT EXISTS idx_barcode_scan_product ON barcode_scan_log(product_id);
CREATE INDEX IF NOT EXISTS idx_barcode_scan_date ON barcode_scan_log(scanned_at);

-- ============================================
-- SALES RETURNS (Customer Returns)
-- ============================================
CREATE TABLE IF NOT EXISTS sales_returns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    return_number TEXT UNIQUE NOT NULL,
    original_sale_id UUID REFERENCES sales(id),
    original_invoice_number TEXT,
    customer_id UUID REFERENCES customers(id),
    customer_name TEXT,
    customer_phone TEXT,
    return_date DATE NOT NULL DEFAULT CURRENT_DATE,
    return_type TEXT NOT NULL, -- 'defective', 'wrong_item', 'expired', 'customer_request', 'doctor_change', 'other'
    subtotal NUMERIC DEFAULT 0,
    discount_amount NUMERIC DEFAULT 0,
    vat_amount NUMERIC DEFAULT 0,
    cgst_amount NUMERIC DEFAULT 0,
    sgst_amount NUMERIC DEFAULT 0,
    igst_amount NUMERIC DEFAULT 0,
    total_amount NUMERIC NOT NULL,
    refund_method TEXT, -- 'cash', 'card', 'upi', 'credit_note', 'exchange'
    refund_amount NUMERIC DEFAULT 0,
    exchange_amount NUMERIC DEFAULT 0,
    credit_note_number TEXT,
    status TEXT DEFAULT 'pending', -- pending, approved, refunded, rejected, exchanged
    reason TEXT,
    notes TEXT,
    approved_by TEXT,
    approved_at TIMESTAMPTZ,
    refunded_by TEXT,
    refunded_at TIMESTAMPTZ,
    created_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sales_returns_number ON sales_returns(return_number);
CREATE INDEX IF NOT EXISTS idx_sales_returns_customer ON sales_returns(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_returns_original ON sales_returns(original_sale_id);
CREATE INDEX IF NOT EXISTS idx_sales_returns_date ON sales_returns(return_date);

-- ============================================
-- SALES RETURN ITEMS
-- ============================================
CREATE TABLE IF NOT EXISTS sales_return_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    return_id UUID REFERENCES sales_returns(id) ON DELETE CASCADE,
    original_sale_item_id UUID REFERENCES sales_items(id),
    product_id UUID NOT NULL REFERENCES products(id),
    batch_id UUID REFERENCES medicine_batches(id),
    batch_number TEXT,
    quantity NUMERIC NOT NULL,
    unit_price NUMERIC NOT NULL,
    discount NUMERIC DEFAULT 0,
    vat_percentage NUMERIC DEFAULT 0,
    vat_amount NUMERIC DEFAULT 0,
    cgst_percentage NUMERIC DEFAULT 0,
    cgst_amount NUMERIC DEFAULT 0,
    sgst_percentage NUMERIC DEFAULT 0,
    sgst_amount NUMERIC DEFAULT 0,
    total_price NUMERIC NOT NULL,
    return_reason TEXT,
    condition TEXT, -- 'unopened', 'opened', 'damaged', 'expired'
    restockable BOOLEAN DEFAULT TRUE,
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_sales_return_items_return ON sales_return_items(return_id);
CREATE INDEX IF NOT EXISTS idx_sales_return_items_product ON sales_return_items(product_id);

-- ============================================
-- HELD SALES (for recall functionality)
-- ============================================
CREATE TABLE IF NOT EXISTS held_sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hold_number TEXT UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id),
    customer_name TEXT,
    customer_phone TEXT,
    items_data JSONB NOT NULL,
    subtotal NUMERIC DEFAULT 0,
    discount_amount NUMERIC DEFAULT 0,
    tax_amount NUMERIC DEFAULT 0,
    grand_total NUMERIC DEFAULT 0,
    hold_reason TEXT,
    notes TEXT,
    held_by TEXT,
    held_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    recalled_at TIMESTAMPTZ,
    recalled_by TEXT,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_held_sales_number ON held_sales(hold_number);
CREATE INDEX IF NOT EXISTS idx_held_sales_customer ON held_sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_held_sales_active ON held_sales(is_active);

-- ============================================
-- QUICK SALE TEMPLATES
-- ============================================
CREATE TABLE IF NOT EXISTS quick_sale_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_name TEXT NOT NULL,
    category TEXT, -- 'common_prescriptions', 'seasonal', 'chronic_care', 'custom'
    items JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    usage_count INTEGER DEFAULT 0,
    created_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quick_sale_templates_category ON quick_sale_templates(category);

-- ============================================
-- COUPON CODES
-- ============================================
CREATE TABLE IF NOT EXISTS coupon_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    discount_type TEXT NOT NULL, -- 'percentage', 'fixed_amount', 'free_item'
    discount_value NUMERIC NOT NULL,
    min_purchase_amount NUMERIC DEFAULT 0,
    max_discount_amount NUMERIC,
    valid_from DATE NOT NULL,
    valid_to DATE NOT NULL,
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    per_customer_limit INTEGER DEFAULT 1,
    applicable_products TEXT[], -- Array of product IDs
    applicable_categories UUID[], -- Array of category IDs
    customer_types TEXT[], -- retail, wholesale, hospital
    is_active BOOLEAN DEFAULT TRUE,
    created_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coupon_codes_code ON coupon_codes(code);
CREATE INDEX IF NOT EXISTS idx_coupon_codes_valid ON coupon_codes(valid_from, valid_to);

-- ============================================
-- COUPON USAGE LOG
-- ============================================
CREATE TABLE IF NOT EXISTS coupon_usage_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    coupon_id UUID REFERENCES coupon_codes(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    customer_id UUID REFERENCES customers(id),
    sale_id UUID REFERENCES sales(id),
    discount_applied NUMERIC NOT NULL,
    used_by TEXT,
    used_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon ON coupon_usage_log(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_customer ON coupon_usage_log(customer_id);

-- ============================================
-- INVOICE DELIVERY LOG
-- ============================================
CREATE TABLE IF NOT EXISTS invoice_delivery_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
    invoice_number TEXT,
    delivery_method TEXT NOT NULL, -- 'email', 'sms', 'whatsapp', 'print'
    recipient TEXT, -- email address or phone number
    delivery_status TEXT DEFAULT 'pending', -- pending, sent, delivered, failed
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    error_message TEXT,
    attempt_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoice_delivery_sale ON invoice_delivery_log(sale_id);
CREATE INDEX IF NOT EXISTS idx_invoice_delivery_status ON invoice_delivery_log(delivery_status);

-- ============================================
-- VIEWS
-- ============================================

-- Sales Invoice View (Complete Details)
CREATE OR REPLACE VIEW v_sales_invoice_details AS
SELECT 
    s.id,
    s.invoice_number,
    s.invoice_type,
    s.created_at::DATE as invoice_date,
    s.customer_id,
    c.name as customer_name,
    c.phone as customer_phone,
    c.email as customer_email,
    c.address as customer_address,
    c.tax_number as customer_tax_id,
    s.total_amount,
    s.discount,
    s.tax,
    s.net_amount,
    s.payment_method,
    s.payment_status,
    s.notes,
    u.full_name as salesperson,
    ARRAY_AGG(
        jsonb_build_object(
            'item_id', si.id,
            'product_id', si.product_id,
            'product_name', si.product_name,
            'batch_number', si.batch_number,
            'expiry_date', si.expiry_date,
            'quantity', si.quantity,
            'unit_price', si.unit_price,
            'discount_percentage', si.discount_percentage,
            'discount_amount', si.discount_amount,
            'tax_type', si.tax_type,
            'total_price', si.total_price
        )
    ) FILTER (WHERE si.id IS NOT NULL) as items
FROM sales s
LEFT JOIN customers c ON s.customer_id = c.id
LEFT JOIN profiles u ON s.created_by = u.id
LEFT JOIN sales_items si ON s.id = si.sale_id
GROUP BY s.id, c.name, c.phone, c.email, c.address, c.tax_number, u.full_name;

-- Today's Sales Summary
CREATE OR REPLACE VIEW v_today_sales_summary AS
SELECT 
    COUNT(DISTINCT id) as transaction_count,
    SUM(subtotal) as subtotal,
    SUM(discount) as total_discount,
    SUM(vat_amount + cgst_amount + sgst_amount + igst_amount) as total_tax,
    SUM(grand_total) as grand_total,
    SUM(CASE WHEN payment_method = 'cash' THEN grand_total ELSE 0 END) as cash_sales,
    SUM(CASE WHEN payment_method IN ('visa', 'bank_transfer') THEN grand_total ELSE 0 END) as card_sales,
    SUM(CASE WHEN payment_method IN ('bkash', 'upay') THEN grand_total ELSE 0 END) as mobile_sales
FROM sales
WHERE created_at::DATE = CURRENT_DATE;

-- Hourly Sales Trend (Today)
CREATE OR REPLACE VIEW v_hourly_sales_trend AS
SELECT 
    EXTRACT(HOUR FROM created_at) as hour_of_day,
    COUNT(id) as transaction_count,
    SUM(grand_total) as total_sales,
    AVG(grand_total) as average_sale
FROM sales
WHERE created_at::DATE = CURRENT_DATE
GROUP BY EXTRACT(HOUR FROM created_at)
ORDER BY hour_of_day;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function: Generate Invoice Number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
    v_year TEXT;
    v_month TEXT;
    v_sequence INTEGER;
    v_invoice_number TEXT;
BEGIN
    v_year := TO_CHAR(CURRENT_DATE, 'YY');
    v_month := TO_CHAR(CURRENT_DATE, 'MM');
    
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(invoice_number FROM 'INV' || v_year || v_month || '(\d+)') AS INTEGER)
    ), 0) + 1 INTO v_sequence
    FROM sales
    WHERE invoice_number LIKE 'INV' || v_year || v_month || '%';
    
    v_invoice_number := 'INV' || v_year || v_month || LPAD(v_sequence::TEXT, 5, '0');
    
    RETURN v_invoice_number;
END;
$$ LANGUAGE plpgsql;

-- Function: Hold Sale
CREATE OR REPLACE FUNCTION hold_sale(
    p_customer_data JSONB,
    p_items_data JSONB,
    p_totals JSONB,
    p_hold_reason TEXT,
    p_held_by TEXT
)
RETURNS TEXT AS $$
DECLARE
    v_hold_number TEXT;
BEGIN
    v_hold_number := 'HOLD' || TO_CHAR(CURRENT_TIMESTAMP, 'YYYYMMDDHH24MISS');
    
    INSERT INTO held_sales (
        hold_number,
        customer_id,
        customer_name,
        customer_phone,
        items_data,
        subtotal,
        discount_amount,
        tax_amount,
        grand_total,
        hold_reason,
        held_by,
        expires_at
    ) VALUES (
        v_hold_number,
        (p_customer_data->>'id')::UUID,
        p_customer_data->>'name',
        p_customer_data->>'phone',
        p_items_data,
        (p_totals->>'subtotal')::NUMERIC,
        (p_totals->>'discount')::NUMERIC,
        (p_totals->>'tax')::NUMERIC,
        (p_totals->>'grand_total')::NUMERIC,
        p_hold_reason,
        p_held_by,
        CURRENT_TIMESTAMP + INTERVAL '24 hours'
    );
    
    RETURN v_hold_number;
END;
$$ LANGUAGE plpgsql;

-- Function: Recall Sale
CREATE OR REPLACE FUNCTION recall_sale(p_hold_number TEXT)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'customer_id', customer_id,
        'customer_name', customer_name,
        'customer_phone', customer_phone,
        'items', items_data,
        'totals', jsonb_build_object(
            'subtotal', subtotal,
            'discount', discount_amount,
            'tax', tax_amount,
            'grand_total', grand_total
        )
    ) INTO v_result
    FROM held_sales
    WHERE hold_number = p_hold_number AND is_active = TRUE;
    
    IF v_result IS NULL THEN
        RAISE EXCEPTION 'Hold number % not found or expired', p_hold_number;
    END IF;
    
    UPDATE held_sales
    SET recalled_at = CURRENT_TIMESTAMP,
        is_active = FALSE
    WHERE hold_number = p_hold_number;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Function: Apply Coupon Code
CREATE OR REPLACE FUNCTION apply_coupon_code(
    p_code TEXT,
    p_customer_id UUID,
    p_purchase_amount NUMERIC
)
RETURNS JSONB AS $$
DECLARE
    v_coupon RECORD;
    v_discount NUMERIC;
    v_usage_count INTEGER;
    v_result JSONB;
BEGIN
    -- Get coupon details
    SELECT * INTO v_coupon
    FROM coupon_codes
    WHERE code = p_code
        AND is_active = TRUE
        AND CURRENT_DATE BETWEEN valid_from AND valid_to;
    
    IF v_coupon IS NULL THEN
        RETURN jsonb_build_object('valid', FALSE, 'message', 'Invalid or expired coupon code');
    END IF;
    
    -- Check usage limit
    IF v_coupon.usage_limit IS NOT NULL AND v_coupon.usage_count >= v_coupon.usage_limit THEN
        RETURN jsonb_build_object('valid', FALSE, 'message', 'Coupon usage limit exceeded');
    END IF;
    
    -- Check per customer limit
    SELECT COUNT(*) INTO v_usage_count
    FROM coupon_usage_log
    WHERE coupon_id = v_coupon.id AND customer_id = p_customer_id;
    
    IF v_usage_count >= v_coupon.per_customer_limit THEN
        RETURN jsonb_build_object('valid', FALSE, 'message', 'You have already used this coupon');
    END IF;
    
    -- Check minimum purchase
    IF p_purchase_amount < v_coupon.min_purchase_amount THEN
        RETURN jsonb_build_object(
            'valid', FALSE, 
            'message', 'Minimum purchase amount not met. Required: ' || v_coupon.min_purchase_amount
        );
    END IF;
    
    -- Calculate discount
    IF v_coupon.discount_type = 'percentage' THEN
        v_discount := p_purchase_amount * v_coupon.discount_value / 100;
        IF v_coupon.max_discount_amount IS NOT NULL THEN
            v_discount := LEAST(v_discount, v_coupon.max_discount_amount);
        END IF;
    ELSIF v_coupon.discount_type = 'fixed_amount' THEN
        v_discount := v_coupon.discount_value;
    END IF;
    
    v_result := jsonb_build_object(
        'valid', TRUE,
        'coupon_id', v_coupon.id,
        'discount_amount', v_discount,
        'discount_type', v_coupon.discount_type,
        'message', v_coupon.description
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Function: Calculate Sale Totals with Batch Tracking
CREATE OR REPLACE FUNCTION calculate_sale_totals()
RETURNS TRIGGER AS $$
DECLARE
    v_subtotal NUMERIC;
    v_vat NUMERIC;
    v_cgst NUMERIC;
    v_sgst NUMERIC;
    v_igst NUMERIC;
BEGIN
    SELECT 
        COALESCE(SUM(quantity * unit_price), 0),
        COALESCE(SUM(vat_amount), 0),
        COALESCE(SUM(cgst_amount), 0),
        COALESCE(SUM(sgst_amount), 0),
        COALESCE(SUM(igst_amount), 0)
    INTO v_subtotal, v_vat, v_cgst, v_sgst, v_igst
    FROM sales_items
    WHERE sale_id = NEW.sale_id;
    
    UPDATE sales
    SET subtotal = v_subtotal,
        vat_amount = v_vat,
        cgst_amount = v_cgst,
        sgst_amount = v_sgst,
        igst_amount = v_igst,
        tax = v_vat + v_cgst + v_sgst + v_igst,
        grand_total = v_subtotal - COALESCE(discount, 0) + v_vat + v_cgst + v_sgst + v_igst + COALESCE(round_off, 0),
        net_amount = v_subtotal - COALESCE(discount, 0) + v_vat + v_cgst + v_sgst + v_igst + COALESCE(round_off, 0)
    WHERE id = NEW.sale_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-calculate sale totals
DROP TRIGGER IF EXISTS trigger_calculate_sale_totals ON sales_items;
CREATE TRIGGER trigger_calculate_sale_totals
    AFTER INSERT OR UPDATE ON sales_items
    FOR EACH ROW
    EXECUTE FUNCTION calculate_sale_totals();

-- ============================================
-- COMPLETION MESSAGE
-- ============================================
DO $$
BEGIN
    RAISE NOTICE 'Phase 5: Enhanced Invoice System - COMPLETE!';
    RAISE NOTICE 'Enhanced: sales, sales_items tables with batch tracking';
    RAISE NOTICE 'Created: sales_returns, held_sales, barcode_scan_log, coupon_codes';
    RAISE NOTICE 'Created Views: v_sales_invoice_details, v_today_sales_summary';
    RAISE NOTICE 'Created Functions: generate_invoice_number(), hold_sale(), recall_sale(), apply_coupon_code()';
END $$;

