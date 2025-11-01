-- Phase 2: Enhanced Customer & Manufacturer Management
-- Customer detailed info, credit limits, birthdays, statements, profit/loss reports

-- ============================================
-- ENHANCED CUSTOMERS TABLE
-- ============================================
ALTER TABLE IF EXISTS customers
    ADD COLUMN IF NOT EXISTS title TEXT, -- Mr, Mrs, Dr, etc.
    ADD COLUMN IF NOT EXISTS middle_name TEXT,
    ADD COLUMN IF NOT EXISTS last_name TEXT,
    ADD COLUMN IF NOT EXISTS date_of_birth DATE,
    ADD COLUMN IF NOT EXISTS anniversary_date DATE,
    ADD COLUMN IF NOT EXISTS gender TEXT,
    ADD COLUMN IF NOT EXISTS blood_group TEXT,
    ADD COLUMN IF NOT EXISTS allergies TEXT,
    ADD COLUMN IF NOT EXISTS chronic_conditions TEXT,
    ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS whatsapp_number TEXT,
    ADD COLUMN IF NOT EXISTS alternate_phone TEXT,
    ADD COLUMN IF NOT EXISTS email2 TEXT,
    ADD COLUMN IF NOT EXISTS address_line1 TEXT,
    ADD COLUMN IF NOT EXISTS address_line2 TEXT,
    ADD COLUMN IF NOT EXISTS city TEXT,
    ADD COLUMN IF NOT EXISTS state TEXT,
    ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'India',
    ADD COLUMN IF NOT EXISTS postal_code TEXT,
    ADD COLUMN IF NOT EXISTS landmark TEXT,
    ADD COLUMN IF NOT EXISTS customer_type TEXT DEFAULT 'retail', -- retail, wholesale, hospital, clinic, doctor
    ADD COLUMN IF NOT EXISTS credit_limit NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS payment_terms TEXT, -- cash, 7days, 15days, 30days, 60days
    ADD COLUMN IF NOT EXISTS payment_deadline_days INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS opening_balance NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS current_balance NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_purchases NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_paid NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_purchase_date DATE,
    ADD COLUMN IF NOT EXISTS first_purchase_date DATE,
    ADD COLUMN IF NOT EXISTS purchase_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS tax_number TEXT, -- PAN, GST, etc.
    ADD COLUMN IF NOT EXISTS tax_type TEXT, -- PAN, GST, VAT
    ADD COLUMN IF NOT EXISTS discount_percentage NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS loyalty_points INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS loyalty_tier TEXT, -- bronze, silver, gold, platinum
    ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
    ADD COLUMN IF NOT EXISTS referred_by TEXT,
    ADD COLUMN IF NOT EXISTS preferred_payment_method TEXT,
    ADD COLUMN IF NOT EXISTS preferred_contact_method TEXT, -- phone, email, whatsapp, sms
    ADD COLUMN IF NOT EXISTS notes TEXT,
    ADD COLUMN IF NOT EXISTS internal_notes TEXT, -- Private notes for staff only
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS blocked_reason TEXT,
    ADD COLUMN IF NOT EXISTS blocked_date DATE,
    ADD COLUMN IF NOT EXISTS created_by TEXT,
    ADD COLUMN IF NOT EXISTS updated_by TEXT;

-- Create indexes for customers
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(contact);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_dob ON customers(date_of_birth);
CREATE INDEX IF NOT EXISTS idx_customers_anniversary ON customers(anniversary_date);
CREATE INDEX IF NOT EXISTS idx_customers_type ON customers(customer_type);
CREATE INDEX IF NOT EXISTS idx_customers_loyalty_tier ON customers(loyalty_tier);
CREATE INDEX IF NOT EXISTS idx_customers_referral ON customers(referral_code);

-- ============================================
-- CUSTOMER CREDIT TRANSACTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS customer_credit_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL, -- 'sale', 'payment', 'credit_note', 'debit_note', 'adjustment', 'opening_balance'
    amount NUMERIC NOT NULL,
    balance_before NUMERIC NOT NULL,
    balance_after NUMERIC NOT NULL,
    reference_id UUID,
    reference_type TEXT,
    payment_method TEXT,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    notes TEXT,
    created_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customer_credit_customer ON customer_credit_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_credit_date ON customer_credit_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_customer_credit_type ON customer_credit_transactions(transaction_type);

-- ============================================
-- CUSTOMER STATEMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS customer_statements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    statement_date DATE NOT NULL,
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    opening_balance NUMERIC NOT NULL,
    total_sales NUMERIC DEFAULT 0,
    total_payments NUMERIC DEFAULT 0,
    total_credits NUMERIC DEFAULT 0,
    total_debits NUMERIC DEFAULT 0,
    closing_balance NUMERIC NOT NULL,
    generated_by TEXT,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    sent_via TEXT, -- email, whatsapp, sms, print
    sent_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_customer_statements_customer ON customer_statements(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_statements_date ON customer_statements(statement_date);

-- ============================================
-- MANUFACTURER FINANCIAL TRACKING
-- ============================================
ALTER TABLE IF EXISTS manufacturers
    ADD COLUMN IF NOT EXISTS total_purchases NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_paid NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_outstanding NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_purchase_date DATE,
    ADD COLUMN IF NOT EXISTS first_purchase_date DATE,
    ADD COLUMN IF NOT EXISTS purchase_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_payment_date DATE,
    ADD COLUMN IF NOT EXISTS payment_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS average_payment_days INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS gstin TEXT,
    ADD COLUMN IF NOT EXISTS pan TEXT,
    ADD COLUMN IF NOT EXISTS bank_name TEXT,
    ADD COLUMN IF NOT EXISTS bank_account_number TEXT,
    ADD COLUMN IF NOT EXISTS bank_ifsc TEXT,
    ADD COLUMN IF NOT EXISTS bank_branch TEXT,
    ADD COLUMN IF NOT EXISTS contact_person_2 TEXT,
    ADD COLUMN IF NOT EXISTS contact_phone_2 TEXT,
    ADD COLUMN IF NOT EXISTS contact_email_2 TEXT,
    ADD COLUMN IF NOT EXISTS emergency_contact TEXT,
    ADD COLUMN IF NOT EXISTS emergency_phone TEXT,
    ADD COLUMN IF NOT EXISTS rating INTEGER DEFAULT 0, -- 1-5 star rating
    ADD COLUMN IF NOT EXISTS quality_rating INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS delivery_rating INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS price_rating INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS service_rating INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS created_by TEXT,
    ADD COLUMN IF NOT EXISTS updated_by TEXT;

-- ============================================
-- MANUFACTURER TRANSACTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS manufacturer_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    manufacturer_id UUID REFERENCES manufacturers(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL, -- 'purchase', 'payment', 'debit_note', 'credit_note', 'adjustment', 'opening_balance'
    amount NUMERIC NOT NULL,
    balance_before NUMERIC NOT NULL,
    balance_after NUMERIC NOT NULL,
    reference_id UUID,
    reference_type TEXT,
    payment_method TEXT,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    notes TEXT,
    created_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_manufacturer_trans_mfr ON manufacturer_transactions(manufacturer_id);
CREATE INDEX IF NOT EXISTS idx_manufacturer_trans_date ON manufacturer_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_manufacturer_trans_type ON manufacturer_transactions(transaction_type);

-- ============================================
-- MANUFACTURER STATEMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS manufacturer_statements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    manufacturer_id UUID REFERENCES manufacturers(id) ON DELETE CASCADE,
    statement_date DATE NOT NULL,
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    opening_balance NUMERIC NOT NULL,
    total_purchases NUMERIC DEFAULT 0,
    total_payments NUMERIC DEFAULT 0,
    total_credits NUMERIC DEFAULT 0,
    total_debits NUMERIC DEFAULT 0,
    closing_balance NUMERIC NOT NULL,
    generated_by TEXT,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    sent_via TEXT,
    sent_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_manufacturer_statements_mfr ON manufacturer_statements(manufacturer_id);
CREATE INDEX IF NOT EXISTS idx_manufacturer_statements_date ON manufacturer_statements(statement_date);

-- ============================================
-- MANUFACTURER PROFIT/LOSS TRACKING
-- ============================================
CREATE TABLE IF NOT EXISTS manufacturer_profit_loss (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    manufacturer_id UUID REFERENCES manufacturers(id) ON DELETE CASCADE,
    period_type TEXT NOT NULL, -- 'daily', 'weekly', 'monthly', 'quarterly', 'yearly'
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_purchases NUMERIC DEFAULT 0,
    total_purchase_value NUMERIC DEFAULT 0,
    total_sales NUMERIC DEFAULT 0,
    total_sales_value NUMERIC DEFAULT 0,
    cost_of_goods_sold NUMERIC DEFAULT 0,
    gross_profit NUMERIC DEFAULT 0,
    gross_profit_percentage NUMERIC DEFAULT 0,
    returns_to_supplier NUMERIC DEFAULT 0,
    returns_from_customer NUMERIC DEFAULT 0,
    damaged_goods NUMERIC DEFAULT 0,
    expired_goods NUMERIC DEFAULT 0,
    net_profit NUMERIC DEFAULT 0,
    net_profit_percentage NUMERIC DEFAULT 0,
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mfr_pl_manufacturer ON manufacturer_profit_loss(manufacturer_id);
CREATE INDEX IF NOT EXISTS idx_mfr_pl_period ON manufacturer_profit_loss(period_start, period_end);

-- ============================================
-- SPECIAL OCCASIONS & REMINDERS
-- ============================================
CREATE TABLE IF NOT EXISTS special_occasions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    occasion_type TEXT NOT NULL, -- 'birthday', 'anniversary', 'festival', 'custom'
    occasion_name TEXT,
    occasion_date DATE NOT NULL,
    recurring BOOLEAN DEFAULT TRUE,
    reminder_days_before INTEGER DEFAULT 7,
    send_notification BOOLEAN DEFAULT TRUE,
    notification_methods TEXT[], -- ['email', 'sms', 'whatsapp']
    discount_offer NUMERIC DEFAULT 0,
    offer_message TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_occasions_customer ON special_occasions(customer_id);
CREATE INDEX IF NOT EXISTS idx_occasions_date ON special_occasions(occasion_date);
CREATE INDEX IF NOT EXISTS idx_occasions_type ON special_occasions(occasion_type);

-- ============================================
-- PAYMENT REMINDERS
-- ============================================
CREATE TABLE IF NOT EXISTS payment_reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    outstanding_amount NUMERIC NOT NULL,
    due_date DATE,
    days_overdue INTEGER DEFAULT 0,
    reminder_type TEXT NOT NULL, -- 'due_soon', 'overdue', 'final_notice'
    reminder_method TEXT, -- 'email', 'sms', 'whatsapp', 'phone'
    sent_at TIMESTAMPTZ,
    acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_reminders_customer ON payment_reminders(customer_id);
CREATE INDEX IF NOT EXISTS idx_payment_reminders_due ON payment_reminders(due_date);

-- ============================================
-- CUSTOMER PREFERENCES
-- ============================================
CREATE TABLE IF NOT EXISTS customer_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    preference_type TEXT NOT NULL, -- 'communication', 'product', 'service', 'notification'
    preference_key TEXT NOT NULL,
    preference_value TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(customer_id, preference_type, preference_key)
);

CREATE INDEX IF NOT EXISTS idx_customer_prefs_customer ON customer_preferences(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_prefs_type ON customer_preferences(preference_type);

-- ============================================
-- VIEWS
-- ============================================

-- Customer Account Summary View
CREATE OR REPLACE VIEW v_customer_accounts AS
SELECT 
    c.id,
    c.name,
    c.contact as phone,
    c.email,
    c.customer_type,
    c.credit_limit,
    c.current_balance,
    c.total_purchases,
    c.total_paid,
    c.purchase_count,
    c.last_purchase_date,
    c.loyalty_points,
    c.loyalty_tier,
    CASE 
        WHEN c.current_balance > c.credit_limit THEN 'exceeded'
        WHEN c.current_balance > (c.credit_limit * 0.8) THEN 'warning'
        ELSE 'good'
    END as credit_status,
    CASE
        WHEN c.current_balance > 0 THEN c.current_balance
        ELSE 0
    END as outstanding_amount,
    c.is_active
FROM customers c
WHERE c.is_active = TRUE;

-- Upcoming Birthdays View
CREATE OR REPLACE VIEW v_upcoming_birthdays AS
SELECT 
    c.id,
    c.name,
    c.contact as phone,
    c.email,
    c.whatsapp_number,
    c.date_of_birth,
    EXTRACT(MONTH FROM c.date_of_birth) as birth_month,
    EXTRACT(DAY FROM c.date_of_birth) as birth_day,
    CASE
        WHEN EXTRACT(MONTH FROM CURRENT_DATE) = EXTRACT(MONTH FROM c.date_of_birth)
         AND EXTRACT(DAY FROM CURRENT_DATE) = EXTRACT(DAY FROM c.date_of_birth)
        THEN 0
        ELSE (DATE_TRUNC('year', CURRENT_DATE) + 
              (EXTRACT(MONTH FROM c.date_of_birth) || ' months')::INTERVAL +
              (EXTRACT(DAY FROM c.date_of_birth) - 1 || ' days')::INTERVAL -
              CURRENT_DATE)::INTEGER
    END as days_until_birthday,
    c.discount_percentage as default_discount,
    c.loyalty_tier
FROM customers c
WHERE c.date_of_birth IS NOT NULL
    AND c.is_active = TRUE
    AND (
        EXTRACT(MONTH FROM c.date_of_birth) = EXTRACT(MONTH FROM CURRENT_DATE)
        OR (
            EXTRACT(MONTH FROM c.date_of_birth) = EXTRACT(MONTH FROM CURRENT_DATE + INTERVAL '1 month')
            AND EXTRACT(DAY FROM c.date_of_birth) <= 7
        )
    )
ORDER BY days_until_birthday;

-- Manufacturer Performance View
CREATE OR REPLACE VIEW v_manufacturer_performance AS
SELECT 
    m.id,
    m.name,
    m.code,
    m.phone,
    m.email,
    m.city,
    m.total_purchases,
    m.total_paid,
    m.current_balance as outstanding,
    m.purchase_count,
    m.payment_count,
    m.average_payment_days,
    m.rating as overall_rating,
    m.quality_rating,
    m.delivery_rating,
    m.price_rating,
    m.service_rating,
    m.last_purchase_date,
    m.is_active,
    CASE 
        WHEN m.current_balance > m.credit_limit THEN 'exceeded'
        WHEN m.current_balance > (m.credit_limit * 0.8) THEN 'warning'
        ELSE 'good'
    END as payment_status
FROM manufacturers m
ORDER BY m.total_purchases DESC;

-- Overdue Customers View
CREATE OR REPLACE VIEW v_overdue_customers AS
SELECT 
    c.id,
    c.name,
    c.contact as phone,
    c.email,
    c.current_balance as outstanding_amount,
    c.payment_terms,
    c.payment_deadline_days,
    c.last_purchase_date,
    CURRENT_DATE - c.last_purchase_date as days_since_purchase,
    CASE
        WHEN c.payment_deadline_days > 0 THEN
            (CURRENT_DATE - (c.last_purchase_date + (c.payment_deadline_days || ' days')::INTERVAL))::INTEGER
        ELSE 0
    END as days_overdue,
    c.credit_limit,
    CASE 
        WHEN c.current_balance > c.credit_limit THEN 'blocked'
        WHEN (CURRENT_DATE - c.last_purchase_date) > 90 THEN 'critical'
        WHEN (CURRENT_DATE - c.last_purchase_date) > 60 THEN 'warning'
        ELSE 'alert'
    END as urgency_level
FROM customers c
WHERE c.current_balance > 0
    AND c.is_active = TRUE
    AND c.payment_deadline_days > 0
    AND c.last_purchase_date IS NOT NULL
    AND (CURRENT_DATE - c.last_purchase_date) > c.payment_deadline_days
ORDER BY days_overdue DESC;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function: Update customer balance
CREATE OR REPLACE FUNCTION update_customer_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- Update customer balance based on transaction type
    IF NEW.transaction_type IN ('sale', 'debit_note') THEN
        UPDATE customers 
        SET current_balance = current_balance + NEW.amount,
            total_purchases = total_purchases + NEW.amount,
            purchase_count = purchase_count + 1,
            last_purchase_date = NEW.transaction_date,
            first_purchase_date = COALESCE(first_purchase_date, NEW.transaction_date),
            updated_at = now()
        WHERE id = NEW.customer_id;
    ELSIF NEW.transaction_type IN ('payment', 'credit_note') THEN
        UPDATE customers 
        SET current_balance = current_balance - NEW.amount,
            total_paid = total_paid + NEW.amount,
            updated_at = now()
        WHERE id = NEW.customer_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update customer balance
DROP TRIGGER IF EXISTS trigger_update_customer_balance ON customer_credit_transactions;
CREATE TRIGGER trigger_update_customer_balance
    AFTER INSERT ON customer_credit_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_customer_balance();

-- Function: Update manufacturer balance
CREATE OR REPLACE FUNCTION update_manufacturer_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.transaction_type IN ('purchase', 'debit_note') THEN
        UPDATE manufacturers 
        SET current_balance = current_balance + NEW.amount,
            total_purchases = total_purchases + NEW.amount,
            purchase_count = purchase_count + 1,
            last_purchase_date = NEW.transaction_date,
            first_purchase_date = COALESCE(first_purchase_date, NEW.transaction_date),
            updated_at = now()
        WHERE id = NEW.manufacturer_id;
    ELSIF NEW.transaction_type IN ('payment', 'credit_note') THEN
        UPDATE manufacturers 
        SET current_balance = current_balance - NEW.amount,
            total_paid = total_paid + NEW.amount,
            payment_count = payment_count + 1,
            last_payment_date = NEW.transaction_date,
            updated_at = now()
        WHERE id = NEW.manufacturer_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update manufacturer balance
DROP TRIGGER IF EXISTS trigger_update_manufacturer_balance ON manufacturer_transactions;
CREATE TRIGGER trigger_update_manufacturer_balance
    AFTER INSERT ON manufacturer_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_manufacturer_balance();

-- Function: Generate customer statement
CREATE OR REPLACE FUNCTION generate_customer_statement(
    p_customer_id UUID,
    p_from_date DATE,
    p_to_date DATE
)
RETURNS UUID AS $$
DECLARE
    v_statement_id UUID;
    v_opening_balance NUMERIC;
    v_total_sales NUMERIC;
    v_total_payments NUMERIC;
    v_total_credits NUMERIC;
    v_total_debits NUMERIC;
    v_closing_balance NUMERIC;
BEGIN
    -- Calculate opening balance
    SELECT COALESCE(SUM(
        CASE 
            WHEN transaction_type IN ('sale', 'debit_note') THEN amount
            WHEN transaction_type IN ('payment', 'credit_note') THEN -amount
            ELSE 0
        END
    ), 0) INTO v_opening_balance
    FROM customer_credit_transactions
    WHERE customer_id = p_customer_id
        AND transaction_date < p_from_date;
    
    -- Calculate totals for period
    SELECT 
        COALESCE(SUM(CASE WHEN transaction_type = 'sale' THEN amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN transaction_type = 'payment' THEN amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN transaction_type = 'credit_note' THEN amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN transaction_type = 'debit_note' THEN amount ELSE 0 END), 0)
    INTO v_total_sales, v_total_payments, v_total_credits, v_total_debits
    FROM customer_credit_transactions
    WHERE customer_id = p_customer_id
        AND transaction_date BETWEEN p_from_date AND p_to_date;
    
    v_closing_balance := v_opening_balance + v_total_sales + v_total_debits - v_total_payments - v_total_credits;
    
    -- Insert statement record
    INSERT INTO customer_statements (
        customer_id, statement_date, from_date, to_date,
        opening_balance, total_sales, total_payments, total_credits, total_debits,
        closing_balance
    ) VALUES (
        p_customer_id, CURRENT_DATE, p_from_date, p_to_date,
        v_opening_balance, v_total_sales, v_total_payments, v_total_credits, v_total_debits,
        v_closing_balance
    ) RETURNING id INTO v_statement_id;
    
    RETURN v_statement_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Calculate manufacturer profit/loss
CREATE OR REPLACE FUNCTION calculate_manufacturer_profit_loss(
    p_manufacturer_id UUID,
    p_from_date DATE,
    p_to_date DATE
)
RETURNS UUID AS $$
DECLARE
    v_pl_id UUID;
    v_total_purchase_value NUMERIC;
    v_total_sales_value NUMERIC;
    v_cogs NUMERIC;
    v_gross_profit NUMERIC;
BEGIN
    -- This is a simplified calculation
    -- In real implementation, you'd join with purchases, sales, and batches
    
    INSERT INTO manufacturer_profit_loss (
        manufacturer_id, period_type, period_start, period_end,
        total_purchases, total_purchase_value
    ) VALUES (
        p_manufacturer_id, 'custom', p_from_date, p_to_date,
        0, 0
    ) RETURNING id INTO v_pl_id;
    
    RETURN v_pl_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMPLETION MESSAGE
-- ============================================
DO $$
BEGIN
    RAISE NOTICE 'Phase 2: Enhanced Customer & Manufacturer Management - COMPLETE!';
    RAISE NOTICE 'Enhanced: customers, manufacturers tables';
    RAISE NOTICE 'Created: customer_credit_transactions, manufacturer_transactions, special_occasions';
    RAISE NOTICE 'Created Views: v_customer_accounts, v_upcoming_birthdays, v_overdue_customers';
END $$;

