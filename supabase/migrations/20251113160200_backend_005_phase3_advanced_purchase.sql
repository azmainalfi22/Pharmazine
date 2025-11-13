-- Phase 3: Advanced Purchase Management
-- Enhanced batch tracking, hold/recall bills, multiple print formats

-- ============================================
-- ENHANCED PURCHASES TABLE
-- ============================================
ALTER TABLE IF EXISTS purchases
    ADD COLUMN IF NOT EXISTS purchase_order_number TEXT UNIQUE,
    ADD COLUMN IF NOT EXISTS purchase_type TEXT DEFAULT 'standard', -- standard, return, replacement, consignment
    ADD COLUMN IF NOT EXISTS bill_number TEXT,
    ADD COLUMN IF NOT EXISTS bill_date DATE,
    ADD COLUMN IF NOT EXISTS delivery_date DATE,
    ADD COLUMN IF NOT EXISTS expected_delivery_date DATE,
    ADD COLUMN IF NOT EXISTS transport_mode TEXT,
    ADD COLUMN IF NOT EXISTS transport_company TEXT,
    ADD COLUMN IF NOT EXISTS transport_lr_number TEXT,
    ADD COLUMN IF NOT EXISTS transport_cost NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS discount_percentage NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS subtotal NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS vat_amount NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS cgst_amount NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS sgst_amount NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS igst_amount NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS other_charges NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS round_off NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS grand_total NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS paid_amount NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS balance_amount NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS payment_due_date DATE,
    ADD COLUMN IF NOT EXISTS notes TEXT,
    ADD COLUMN IF NOT EXISTS internal_notes TEXT,
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft', -- draft, confirmed, received, partially_received, completed, cancelled
    ADD COLUMN IF NOT EXISTS is_hold BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS hold_reason TEXT,
    ADD COLUMN IF NOT EXISTS hold_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS hold_by TEXT,
    ADD COLUMN IF NOT EXISTS approved_by TEXT,
    ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS print_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_print_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS print_size TEXT DEFAULT 'a4'; -- a4, a5, a6, pos

CREATE INDEX IF NOT EXISTS idx_purchases_po_number ON purchases(purchase_order_number);
CREATE INDEX IF NOT EXISTS idx_purchases_bill_number ON purchases(bill_number);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(status);
CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(date);
CREATE INDEX IF NOT EXISTS idx_purchases_supplier ON purchases(supplier_id);

-- ============================================
-- ENHANCED PURCHASE ITEMS
-- ============================================
ALTER TABLE IF EXISTS purchase_items
    ADD COLUMN IF NOT EXISTS item_number INTEGER,
    ADD COLUMN IF NOT EXISTS product_name TEXT,
    ADD COLUMN IF NOT EXISTS product_code TEXT,
    ADD COLUMN IF NOT EXISTS hsn_code TEXT,
    ADD COLUMN IF NOT EXISTS manufacture_date DATE,
    ADD COLUMN IF NOT EXISTS shelf_life_days INTEGER,
    ADD COLUMN IF NOT EXISTS box_qty NUMERIC,
    ADD COLUMN IF NOT EXISTS strip_qty NUMERIC,
    ADD COLUMN IF NOT EXISTS unit_per_strip INTEGER,
    ADD COLUMN IF NOT EXISTS unit_per_box INTEGER,
    ADD COLUMN IF NOT EXISTS free_qty NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS scheme TEXT,
    ADD COLUMN IF NOT EXISTS margin_percentage NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS bonus_qty NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS received_qty NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS pending_qty NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS damaged_qty NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS rack_location TEXT,
    ADD COLUMN IF NOT EXISTS shelf_location TEXT,
    ADD COLUMN IF NOT EXISTS item_notes TEXT;

-- ============================================
-- HELD PURCHASES (for recall functionality)
-- ============================================
CREATE TABLE IF NOT EXISTS held_purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_id UUID REFERENCES purchases(id) ON DELETE CASCADE,
    hold_number TEXT UNIQUE NOT NULL,
    supplier_id UUID REFERENCES suppliers(id),
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

CREATE INDEX IF NOT EXISTS idx_held_purchases_number ON held_purchases(hold_number);
CREATE INDEX IF NOT EXISTS idx_held_purchases_held_at ON held_purchases(held_at);
CREATE INDEX IF NOT EXISTS idx_held_purchases_active ON held_purchases(is_active);

-- ============================================
-- PURCHASE RETURNS
-- ============================================
CREATE TABLE IF NOT EXISTS purchase_returns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    return_number TEXT UNIQUE NOT NULL,
    original_purchase_id UUID REFERENCES purchases(id),
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    return_date DATE NOT NULL DEFAULT CURRENT_DATE,
    return_type TEXT NOT NULL, -- 'quality_issue', 'wrong_item', 'damaged', 'expired', 'excess', 'other'
    subtotal NUMERIC DEFAULT 0,
    vat_amount NUMERIC DEFAULT 0,
    cgst_amount NUMERIC DEFAULT 0,
    sgst_amount NUMERIC DEFAULT 0,
    igst_amount NUMERIC DEFAULT 0,
    total_amount NUMERIC NOT NULL,
    refund_method TEXT, -- 'cash', 'bank', 'credit_note', 'adjustment'
    refund_amount NUMERIC DEFAULT 0,
    credit_note_number TEXT,
    status TEXT DEFAULT 'pending', -- pending, approved, refunded, rejected
    reason TEXT,
    notes TEXT,
    created_by TEXT,
    approved_by TEXT,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_purchase_returns_number ON purchase_returns(return_number);
CREATE INDEX IF NOT EXISTS idx_purchase_returns_supplier ON purchase_returns(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_returns_date ON purchase_returns(return_date);
CREATE INDEX IF NOT EXISTS idx_purchase_returns_status ON purchase_returns(status);

-- ============================================
-- PURCHASE RETURN ITEMS
-- ============================================
CREATE TABLE IF NOT EXISTS purchase_return_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    return_id UUID REFERENCES purchase_returns(id) ON DELETE CASCADE,
    purchase_item_id UUID REFERENCES purchase_items(id),
    batch_id UUID REFERENCES medicine_batches(id),
    product_id UUID NOT NULL REFERENCES products(id),
    batch_number TEXT,
    qty NUMERIC NOT NULL,
    unit TEXT,
    unit_price NUMERIC NOT NULL,
    total_price NUMERIC NOT NULL,
    return_reason TEXT,
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_purchase_return_items_return ON purchase_return_items(return_id);
CREATE INDEX IF NOT EXISTS idx_purchase_return_items_product ON purchase_return_items(product_id);

-- ============================================
-- PURCHASE PAYMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS purchase_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_number TEXT UNIQUE NOT NULL,
    purchase_id UUID REFERENCES purchases(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount NUMERIC NOT NULL,
    payment_method TEXT NOT NULL, -- cash, cheque, bank_transfer, upi, card, neft, rtgs
    payment_reference TEXT,
    cheque_number TEXT,
    cheque_date DATE,
    bank_name TEXT,
    transaction_id TEXT,
    notes TEXT,
    created_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_purchase_payments_number ON purchase_payments(payment_number);
CREATE INDEX IF NOT EXISTS idx_purchase_payments_purchase ON purchase_payments(purchase_id);
CREATE INDEX IF NOT EXISTS idx_purchase_payments_supplier ON purchase_payments(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_payments_date ON purchase_payments(payment_date);

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'held_purchases' AND column_name = 'supplier_id' AND udt_name <> 'uuid'
    ) THEN
        EXECUTE 'ALTER TABLE held_purchases ALTER COLUMN supplier_id TYPE UUID USING supplier_id::uuid';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'purchase_returns' AND column_name = 'supplier_id' AND udt_name <> 'uuid'
    ) THEN
        EXECUTE 'ALTER TABLE purchase_returns ALTER COLUMN supplier_id TYPE UUID USING supplier_id::uuid';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'purchase_return_items' AND column_name = 'product_id' AND udt_name <> 'uuid'
    ) THEN
        EXECUTE 'ALTER TABLE purchase_return_items ALTER COLUMN product_id TYPE UUID USING product_id::uuid';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'purchase_payments' AND column_name = 'supplier_id' AND udt_name <> 'uuid'
    ) THEN
        EXECUTE 'ALTER TABLE purchase_payments ALTER COLUMN supplier_id TYPE UUID USING supplier_id::uuid';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'purchase_order_templates' AND column_name = 'supplier_id' AND udt_name <> 'uuid'
    ) THEN
        EXECUTE 'ALTER TABLE purchase_order_templates ALTER COLUMN supplier_id TYPE UUID USING supplier_id::uuid';
    END IF;
END;
$$;
-- ============================================
-- PURCHASE ORDER TEMPLATES
-- ============================================
CREATE TABLE IF NOT EXISTS purchase_order_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_name TEXT NOT NULL,
    supplier_id UUID REFERENCES suppliers(id),
    items JSONB NOT NULL,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_frequency TEXT, -- daily, weekly, monthly
    recurrence_day INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- PRINT TEMPLATES
-- ============================================
CREATE TABLE IF NOT EXISTS print_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_name TEXT NOT NULL UNIQUE,
    template_type TEXT NOT NULL, -- purchase_order, purchase_bill, invoice, receipt, label
    paper_size TEXT NOT NULL, -- a4, a5, a6, pos, label
    orientation TEXT DEFAULT 'portrait', -- portrait, landscape
    header_html TEXT,
    body_html TEXT,
    footer_html TEXT,
    css_styles TEXT,
    show_logo BOOLEAN DEFAULT TRUE,
    show_company_details BOOLEAN DEFAULT TRUE,
    show_terms BOOLEAN DEFAULT TRUE,
    custom_fields JSONB,
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_print_templates_type ON print_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_print_templates_size ON print_templates(paper_size);

-- ============================================
-- PRINT HISTORY
-- ============================================
CREATE TABLE IF NOT EXISTS print_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_type TEXT NOT NULL,
    document_id UUID NOT NULL,
    document_number TEXT,
    template_id UUID REFERENCES print_templates(id),
    paper_size TEXT NOT NULL,
    printer_name TEXT,
    print_count INTEGER DEFAULT 1,
    printed_by TEXT,
    printed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_print_history_document ON print_history(document_type, document_id);
CREATE INDEX IF NOT EXISTS idx_print_history_date ON print_history(printed_at);

-- ============================================
-- VIEWS
-- ============================================

-- Purchase Summary View
CREATE OR REPLACE VIEW v_purchase_summary AS
SELECT 
    p.id,
    p.purchase_order_number,
    p.bill_number,
    p.date,
    p.supplier_id,
    s.name as supplier_name,
    s.phone as supplier_phone,
    p.subtotal,
    p.discount_amount,
    p.vat_amount + p.cgst_amount + p.sgst_amount + p.igst_amount as total_tax,
    p.grand_total,
    p.paid_amount,
    p.balance_amount,
    p.payment_status,
    p.status,
    p.is_hold,
    p.delivery_date,
    p.payment_due_date,
    COUNT(DISTINCT pi.id) as item_count,
    SUM(pi.qty) as total_quantity,
    p.created_at
FROM purchases p
LEFT JOIN suppliers s ON p.supplier_id = s.id
LEFT JOIN purchase_items pi ON p.id = pi.purchase_id
GROUP BY p.id, s.name, s.phone;

-- Pending Purchase Payments View
CREATE OR REPLACE VIEW v_pending_purchase_payments AS
SELECT 
    p.id as purchase_id,
    p.purchase_order_number,
    p.bill_number,
    p.date as purchase_date,
    p.supplier_id,
    s.name as supplier_name,
    s.phone as supplier_phone,
    s.email as supplier_email,
    p.grand_total,
    p.paid_amount,
    p.balance_amount,
    p.payment_due_date,
    CASE
        WHEN p.payment_due_date < CURRENT_DATE THEN (CURRENT_DATE - p.payment_due_date)::INTEGER
        ELSE 0
    END as days_overdue,
    CASE
        WHEN p.payment_due_date < CURRENT_DATE THEN 'overdue'
        WHEN p.payment_due_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'due_soon'
        ELSE 'pending'
    END as payment_urgency
FROM purchases p
JOIN suppliers s ON p.supplier_id = s.id
WHERE p.balance_amount > 0
    AND p.status NOT IN ('draft', 'cancelled')
ORDER BY p.payment_due_date ASC;

-- Purchase Return Summary View
CREATE OR REPLACE VIEW v_purchase_return_summary AS
SELECT 
    pr.id,
    pr.return_number,
    pr.return_date,
    pr.supplier_id,
    s.name as supplier_name,
    pr.return_type,
    pr.total_amount,
    pr.refund_amount,
    pr.status,
    COUNT(pri.id) as item_count,
    SUM(pri.qty) as total_quantity,
    pr.created_at
FROM purchase_returns pr
LEFT JOIN suppliers s ON pr.supplier_id = s.id
LEFT JOIN purchase_return_items pri ON pr.id = pri.return_id
GROUP BY pr.id, s.name;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function: Generate Purchase Order Number
CREATE OR REPLACE FUNCTION generate_purchase_order_number()
RETURNS TEXT AS $$
DECLARE
    v_year TEXT;
    v_month TEXT;
    v_sequence INTEGER;
    v_po_number TEXT;
BEGIN
    v_year := TO_CHAR(CURRENT_DATE, 'YY');
    v_month := TO_CHAR(CURRENT_DATE, 'MM');
    
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(purchase_order_number FROM 'PO' || v_year || v_month || '(\d+)') AS INTEGER)
    ), 0) + 1 INTO v_sequence
    FROM purchases
    WHERE purchase_order_number LIKE 'PO' || v_year || v_month || '%';
    
    v_po_number := 'PO' || v_year || v_month || LPAD(v_sequence::TEXT, 4, '0');
    
    RETURN v_po_number;
END;
$$ LANGUAGE plpgsql;

-- Function: Hold Purchase
CREATE OR REPLACE FUNCTION hold_purchase(
    p_purchase_id UUID,
    p_hold_reason TEXT,
    p_held_by TEXT
)
RETURNS TEXT AS $$
DECLARE
    v_hold_number TEXT;
    v_items_data JSONB;
BEGIN
    -- Generate hold number
    v_hold_number := 'HOLD' || TO_CHAR(CURRENT_TIMESTAMP, 'YYYYMMDDHH24MISS');
    
    -- Get purchase items as JSON
    SELECT json_agg(pi.*)::JSONB INTO v_items_data
    FROM purchase_items pi
    WHERE pi.purchase_id = p_purchase_id;
    
    -- Insert into held_purchases
    INSERT INTO held_purchases (
        purchase_id, hold_number, items_data, hold_reason, held_by, expires_at
    )
    SELECT 
        p.id,
        v_hold_number,
        v_items_data,
        p_hold_reason,
        p_held_by,
        CURRENT_TIMESTAMP + INTERVAL '7 days'
    FROM purchases p
    WHERE p.id = p_purchase_id;
    
    -- Update purchase status
    UPDATE purchases
    SET is_hold = TRUE,
        hold_reason = p_hold_reason,
        hold_at = CURRENT_TIMESTAMP,
        hold_by = p_held_by
    WHERE id = p_purchase_id;
    
    RETURN v_hold_number;
END;
$$ LANGUAGE plpgsql;

-- Function: Recall Purchase
CREATE OR REPLACE FUNCTION recall_purchase(
    p_hold_number TEXT,
    p_recalled_by TEXT
)
RETURNS UUID AS $$
DECLARE
    v_purchase_id UUID;
BEGIN
    -- Get purchase ID
    SELECT purchase_id INTO v_purchase_id
    FROM held_purchases
    WHERE hold_number = p_hold_number
        AND is_active = TRUE;
    
    IF v_purchase_id IS NULL THEN
        RAISE EXCEPTION 'Hold number % not found or expired', p_hold_number;
    END IF;
    
    -- Update held purchase
    UPDATE held_purchases
    SET recalled_at = CURRENT_TIMESTAMP,
        recalled_by = p_recalled_by,
        is_active = FALSE
    WHERE hold_number = p_hold_number;
    
    -- Update purchase
    UPDATE purchases
    SET is_hold = FALSE,
        hold_reason = NULL
    WHERE id = v_purchase_id;
    
    RETURN v_purchase_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Calculate Purchase Totals
CREATE OR REPLACE FUNCTION calculate_purchase_totals()
RETURNS TRIGGER AS $$
DECLARE
    v_subtotal NUMERIC;
    v_discount NUMERIC;
    v_vat NUMERIC;
    v_cgst NUMERIC;
    v_sgst NUMERIC;
    v_igst NUMERIC;
BEGIN
    -- Calculate subtotal from items
    SELECT 
        COALESCE(SUM(total_price), 0),
        COALESCE(SUM(total_price * COALESCE(discount_percentage, 0) / 100), 0),
        COALESCE(SUM(total_price * COALESCE(vat_percentage, 0) / 100), 0),
        COALESCE(SUM(total_price * COALESCE(cgst_percentage, 0) / 100), 0),
        COALESCE(SUM(total_price * COALESCE(sgst_percentage, 0) / 100), 0),
        COALESCE(SUM(total_price * COALESCE(igst_percentage, 0) / 100), 0)
    INTO v_subtotal, v_discount, v_vat, v_cgst, v_sgst, v_igst
    FROM purchase_items
    WHERE purchase_id = NEW.purchase_id;
    
    -- Update purchase totals
    UPDATE purchases
    SET subtotal = v_subtotal,
        discount_amount = v_discount,
        vat_amount = v_vat,
        cgst_amount = v_cgst,
        sgst_amount = v_sgst,
        igst_amount = v_igst,
        grand_total = v_subtotal - v_discount + v_vat + v_cgst + v_sgst + v_igst,
        balance_amount = v_subtotal - v_discount + v_vat + v_cgst + v_sgst + v_igst - COALESCE(paid_amount, 0)
    WHERE id = NEW.purchase_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-calculate purchase totals
DROP TRIGGER IF EXISTS trigger_calculate_purchase_totals ON purchase_items;
CREATE TRIGGER trigger_calculate_purchase_totals
    AFTER INSERT OR UPDATE ON purchase_items
    FOR EACH ROW
    EXECUTE FUNCTION calculate_purchase_totals();

-- ============================================
-- DEFAULT PRINT TEMPLATES
-- ============================================

-- A4 Purchase Order Template
INSERT INTO print_templates (template_name, template_type, paper_size, orientation, is_default) VALUES
('Default Purchase Order - A4', 'purchase_order', 'a4', 'portrait', TRUE),
('Default Purchase Order - A5', 'purchase_order', 'a5', 'portrait', FALSE),
('Thermal Purchase Order - POS', 'purchase_order', 'pos', 'portrait', FALSE)
ON CONFLICT (template_name) DO NOTHING;

-- ============================================
-- COMPLETION MESSAGE
-- ============================================
DO $$
BEGIN
    RAISE NOTICE 'Phase 3: Advanced Purchase Management - COMPLETE!';
    RAISE NOTICE 'Enhanced: purchases, purchase_items tables';
    RAISE NOTICE 'Created: held_purchases, purchase_returns, purchase_payments, print_templates';
    RAISE NOTICE 'Created Views: v_purchase_summary, v_pending_purchase_payments';
    RAISE NOTICE 'Created Functions: hold_purchase(), recall_purchase(), calculate_purchase_totals()';
END $$;

