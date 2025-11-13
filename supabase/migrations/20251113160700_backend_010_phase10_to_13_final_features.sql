-- Phases 10-13: HRM, Advanced Features, UI/UX, CRM & Marketing (Combined)
-- Complete feature set for best pharmacy management system

-- ============================================
-- PHASE 10: HRM & EMPLOYEE MANAGEMENT
-- ============================================

-- Enhanced Profiles/Employees Table
ALTER TABLE IF EXISTS profiles
    ADD COLUMN IF NOT EXISTS employee_code TEXT UNIQUE,
    ADD COLUMN IF NOT EXISTS date_of_birth DATE,
    ADD COLUMN IF NOT EXISTS gender TEXT,
    ADD COLUMN IF NOT EXISTS blood_group TEXT,
    ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
    ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT,
    ADD COLUMN IF NOT EXISTS address_line1 TEXT,
    ADD COLUMN IF NOT EXISTS address_line2 TEXT,
    ADD COLUMN IF NOT EXISTS city TEXT,
    ADD COLUMN IF NOT EXISTS state TEXT,
    ADD COLUMN IF NOT EXISTS postal_code TEXT,
    ADD COLUMN IF NOT EXISTS joining_date DATE,
    ADD COLUMN IF NOT EXISTS confirmation_date DATE,
    ADD COLUMN IF NOT EXISTS resignation_date DATE,
    ADD COLUMN IF NOT EXISTS department TEXT,
    ADD COLUMN IF NOT EXISTS designation TEXT,
    ADD COLUMN IF NOT EXISTS employment_type TEXT, -- permanent, contract, part_time
    ADD COLUMN IF NOT EXISTS basic_salary NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS bank_account_number TEXT,
    ADD COLUMN IF NOT EXISTS bank_name TEXT,
    ADD COLUMN IF NOT EXISTS bank_ifsc TEXT,
    ADD COLUMN IF NOT EXISTS pan_number TEXT,
    ADD COLUMN IF NOT EXISTS aadhar_number TEXT,
    ADD COLUMN IF NOT EXISTS pf_number TEXT,
    ADD COLUMN IF NOT EXISTS esi_number TEXT,
    ADD COLUMN IF NOT EXISTS is_active_employee BOOLEAN DEFAULT TRUE;

-- Employee Documents
CREATE TABLE IF NOT EXISTS employee_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL, -- resume, id_proof, address_proof, education, experience, other
    document_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    uploaded_by TEXT,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Attendance
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    check_in_time TIME,
    check_out_time TIME,
    work_hours NUMERIC,
    status TEXT NOT NULL, -- present, absent, half_day, on_leave, holiday, week_off
    late_by_minutes INTEGER DEFAULT 0,
    early_leave_minutes INTEGER DEFAULT 0,
    overtime_minutes INTEGER DEFAULT 0,
    notes TEXT,
    marked_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(employee_id, attendance_date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_employee ON attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(attendance_date);

-- Leaves
CREATE TABLE IF NOT EXISTS leave_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    code TEXT UNIQUE NOT NULL,
    annual_quota INTEGER DEFAULT 0,
    is_paid BOOLEAN DEFAULT TRUE,
    is_carry_forward BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO leave_types (name, code, annual_quota, is_paid, is_carry_forward) VALUES
('Casual Leave', 'CL', 12, TRUE, FALSE),
('Sick Leave', 'SL', 12, TRUE, FALSE),
('Earned Leave', 'EL', 15, TRUE, TRUE),
('Maternity Leave', 'ML', 180, TRUE, FALSE),
('Paternity Leave', 'PL', 7, TRUE, FALSE),
('Loss of Pay', 'LOP', 0, FALSE, FALSE)
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS leave_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_number TEXT UNIQUE NOT NULL,
    employee_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    leave_type_id UUID REFERENCES leave_types(id),
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    total_days NUMERIC NOT NULL,
    reason TEXT NOT NULL,
    contact_during_leave TEXT,
    status TEXT DEFAULT 'pending', -- pending, approved, rejected, cancelled
    approved_by TEXT,
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leave_applications_employee ON leave_applications(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_applications_status ON leave_applications(status);

-- Payroll
CREATE TABLE IF NOT EXISTS salary_components (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    component_name TEXT NOT NULL UNIQUE,
    component_type TEXT NOT NULL, -- earning, deduction
    calculation_type TEXT DEFAULT 'fixed', -- fixed, percentage, formula
    default_amount NUMERIC DEFAULT 0,
    is_taxable BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO salary_components (component_name, component_type, calculation_type, is_taxable) VALUES
('Basic Salary', 'earning', 'fixed', TRUE),
('HRA', 'earning', 'percentage', TRUE),
('Conveyance Allowance', 'earning', 'fixed', TRUE),
('Medical Allowance', 'earning', 'fixed', TRUE),
('Special Allowance', 'earning', 'fixed', TRUE),
('Provident Fund', 'deduction', 'percentage', FALSE),
('Professional Tax', 'deduction', 'fixed', FALSE),
('TDS', 'deduction', 'percentage', FALSE),
('ESI', 'deduction', 'percentage', FALSE),
('Loan Deduction', 'deduction', 'fixed', FALSE)
ON CONFLICT (component_name) DO NOTHING;

CREATE TABLE IF NOT EXISTS payroll (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payroll_number TEXT UNIQUE NOT NULL,
    employee_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    days_worked NUMERIC DEFAULT 0,
    days_absent NUMERIC DEFAULT 0,
    gross_salary NUMERIC DEFAULT 0,
    total_deductions NUMERIC DEFAULT 0,
    net_salary NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'draft', -- draft, processed, paid
    payment_date DATE,
    payment_mode TEXT,
    payment_reference TEXT,
    processed_by TEXT,
    processed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(employee_id, month, year)
);

CREATE INDEX IF NOT EXISTS idx_payroll_employee ON payroll(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_period ON payroll(year, month);

CREATE TABLE IF NOT EXISTS payroll_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payroll_id UUID REFERENCES payroll(id) ON DELETE CASCADE,
    component_id UUID REFERENCES salary_components(id),
    component_name TEXT NOT NULL,
    component_type TEXT NOT NULL,
    amount NUMERIC NOT NULL
);

-- Employee Loans & Advances
CREATE TABLE IF NOT EXISTS employee_loans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loan_number TEXT UNIQUE NOT NULL,
    employee_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    loan_type TEXT NOT NULL, -- advance, loan
    loan_amount NUMERIC NOT NULL,
    interest_rate NUMERIC DEFAULT 0,
    emi_amount NUMERIC NOT NULL,
    total_installments INTEGER NOT NULL,
    paid_installments INTEGER DEFAULT 0,
    balance_amount NUMERIC NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    status TEXT DEFAULT 'active', -- active, completed, cancelled
    approved_by TEXT,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Internal Messages
CREATE TABLE IF NOT EXISTS internal_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID REFERENCES profiles(id),
    recipient_id UUID REFERENCES profiles(id),
    recipient_type TEXT DEFAULT 'individual', -- individual, department, all
    subject TEXT NOT NULL,
    message_body TEXT NOT NULL,
    priority TEXT DEFAULT 'normal', -- low, normal, high, urgent
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_recipient ON internal_messages(recipient_id, is_read);

-- ============================================
-- PHASE 11: ADVANCED FEATURES
-- ============================================

-- Database Backup Log
CREATE TABLE IF NOT EXISTS database_backups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    backup_name TEXT NOT NULL,
    backup_type TEXT NOT NULL, -- manual, automatic, scheduled
    backup_path TEXT NOT NULL,
    backup_size BIGINT,
    backup_duration_seconds INTEGER,
    status TEXT DEFAULT 'success', -- success, failed, in_progress
    error_message TEXT,
    created_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- System Configuration
CREATE TABLE IF NOT EXISTS system_configuration (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config_key TEXT UNIQUE NOT NULL,
    config_value TEXT,
    config_type TEXT DEFAULT 'string', -- string, number, boolean, json
    category TEXT NOT NULL, -- general, backup, printer, notification, security
    description TEXT,
    is_encrypted BOOLEAN DEFAULT FALSE,
    updated_by TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO system_configuration (config_key, config_value, config_type, category, description) VALUES
('auto_backup_enabled', 'true', 'boolean', 'backup', 'Enable automatic daily backups'),
('auto_backup_time', '02:00', 'string', 'backup', 'Time for automatic backup (24-hour format)'),
('backup_retention_days', '30', 'number', 'backup', 'Number of days to retain backups'),
('default_printer_name', '', 'string', 'printer', 'Default printer name'),
('default_paper_size', 'a4', 'string', 'printer', 'Default paper size for printing'),
('low_stock_alert_enabled', 'true', 'boolean', 'notification', 'Enable low stock alerts'),
('expiry_alert_days', '90', 'number', 'notification', 'Days before expiry to send alerts'),
('session_timeout_minutes', '60', 'number', 'security', 'Session timeout in minutes'),
('company_name', 'Sharkar Pharmacy', 'string', 'general', 'Company name'),
('company_address', '', 'string', 'general', 'Company address'),
('company_phone', '', 'string', 'general', 'Company phone number'),
('company_email', 'info@sharkarpharmacy.com', 'string', 'general', 'Company email'),
('tax_number', '', 'string', 'general', 'Company tax/GST number'),
('company_tagline', 'Best Pharmacy Management System', 'string', 'general', 'Company tagline')
ON CONFLICT (config_key) DO NOTHING;

-- Printer Configuration
CREATE TABLE IF NOT EXISTS printer_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    printer_name TEXT NOT NULL,
    printer_type TEXT NOT NULL, -- thermal, laser, inkjet
    paper_size TEXT NOT NULL, -- a4, a5, a6, pos_80mm, pos_58mm
    is_default BOOLEAN DEFAULT FALSE,
    computer_name TEXT,
    ip_address TEXT,
    port INTEGER,
    driver_name TEXT,
    settings JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Search History & Shortcuts
CREATE TABLE IF NOT EXISTS search_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id),
    search_type TEXT NOT NULL, -- product, customer, invoice, batch
    search_query TEXT NOT NULL,
    search_filters JSONB,
    result_count INTEGER,
    searched_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_search_history_user ON search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_type ON search_history(search_type);

-- Quick Access/Favorites
CREATE TABLE IF NOT EXISTS user_favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id),
    favorite_type TEXT NOT NULL, -- product, customer, report, page
    reference_id TEXT NOT NULL,
    reference_name TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, favorite_type, reference_id)
);

-- ============================================
-- PHASE 12: BRANDING & UI PREFERENCES
-- ============================================

-- Company Branding
CREATE TABLE IF NOT EXISTS company_branding (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    logo_url TEXT,
    logo_small_url TEXT,
    favicon_url TEXT,
    primary_color TEXT DEFAULT '#3b82f6',
    secondary_color TEXT DEFAULT '#10b981',
    accent_color TEXT DEFAULT '#f59e0b',
    theme_mode TEXT DEFAULT 'light', -- light, dark, auto
    font_family TEXT DEFAULT 'Inter',
    invoice_header_html TEXT,
    invoice_footer_html TEXT,
    receipt_header_html TEXT,
    receipt_footer_html TEXT,
    updated_by TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default branding
INSERT INTO company_branding (id) VALUES (uuid_generate_v4())
ON CONFLICT DO NOTHING;

-- User Preferences
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    theme TEXT DEFAULT 'light',
    language TEXT DEFAULT 'en',
    date_format TEXT DEFAULT 'DD/MM/YYYY',
    time_format TEXT DEFAULT '24h',
    currency_symbol TEXT DEFAULT '₹',
    number_format TEXT DEFAULT 'en-IN',
    default_page TEXT DEFAULT '/dashboard',
    sidebar_collapsed BOOLEAN DEFAULT FALSE,
    notification_sound BOOLEAN DEFAULT TRUE,
    email_notifications BOOLEAN DEFAULT TRUE,
    sms_notifications BOOLEAN DEFAULT FALSE,
    preferences JSONB,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id)
);

-- Dashboard Widgets
CREATE TABLE IF NOT EXISTS dashboard_widgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id),
    widget_type TEXT NOT NULL,
    widget_title TEXT,
    widget_size TEXT DEFAULT 'medium', -- small, medium, large
    position_x INTEGER,
    position_y INTEGER,
    is_visible BOOLEAN DEFAULT TRUE,
    config JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- PHASE 13: CRM & MARKETING
-- ============================================

-- Marketing Campaigns
CREATE TABLE IF NOT EXISTS marketing_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_name TEXT NOT NULL,
    campaign_type TEXT NOT NULL, -- email, sms, whatsapp, push
    target_audience TEXT NOT NULL, -- all_customers, loyal_customers, inactive, custom
    target_filter JSONB,
    message_template TEXT NOT NULL,
    schedule_type TEXT DEFAULT 'immediate', -- immediate, scheduled, recurring
    schedule_datetime TIMESTAMPTZ,
    recurrence_pattern TEXT,
    status TEXT DEFAULT 'draft', -- draft, scheduled, running, completed, cancelled
    total_recipients INTEGER DEFAULT 0,
    sent_count INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    opened_count INTEGER DEFAULT 0,
    clicked_count INTEGER DEFAULT 0,
    offer_code TEXT,
    offer_discount NUMERIC,
    valid_from DATE,
    valid_to DATE,
    created_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_campaigns_status ON marketing_campaigns(status);

-- Campaign Recipients
CREATE TABLE IF NOT EXISTS campaign_recipients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id),
    recipient_name TEXT,
    recipient_phone TEXT,
    recipient_email TEXT,
    status TEXT DEFAULT 'pending', -- pending, sent, delivered, failed, opened, clicked
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_campaign_recipients_campaign ON campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_customer ON campaign_recipients(customer_id);

-- Loyalty Program
CREATE TABLE IF NOT EXISTS loyalty_tiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tier_name TEXT NOT NULL UNIQUE,
    min_purchases NUMERIC DEFAULT 0,
    min_purchase_value NUMERIC DEFAULT 0,
    discount_percentage NUMERIC DEFAULT 0,
    points_multiplier NUMERIC DEFAULT 1.0,
    benefits TEXT,
    tier_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

INSERT INTO loyalty_tiers (tier_name, min_purchases, min_purchase_value, discount_percentage, points_multiplier, tier_order) VALUES
('Bronze', 0, 0, 2, 1.0, 1),
('Silver', 10, 5000, 5, 1.5, 2),
('Gold', 25, 15000, 8, 2.0, 3),
('Platinum', 50, 50000, 12, 3.0, 4)
ON CONFLICT (tier_name) DO NOTHING;

-- Loyalty Transactions
CREATE TABLE IF NOT EXISTS loyalty_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL, -- earn, redeem, expire, adjust
    points NUMERIC NOT NULL,
    balance_before NUMERIC NOT NULL,
    balance_after NUMERIC NOT NULL,
    reference_type TEXT, -- sale, return, bonus, expiry
    reference_id UUID,
    description TEXT,
    expiry_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_loyalty_trans_customer ON loyalty_transactions(customer_id);

-- Offers & Promotions
CREATE TABLE IF NOT EXISTS promotional_offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    offer_code TEXT UNIQUE NOT NULL,
    offer_name TEXT NOT NULL,
    offer_type TEXT NOT NULL, -- percentage_discount, flat_discount, buy_x_get_y, cashback
    description TEXT,
    discount_percentage NUMERIC,
    discount_amount NUMERIC,
    min_purchase_amount NUMERIC,
    max_discount NUMERIC,
    applicable_on TEXT DEFAULT 'all', -- all, category, product
    applicable_categories UUID[],
    applicable_products TEXT[],
    customer_types TEXT[],
    valid_from DATE NOT NULL,
    valid_to DATE NOT NULL,
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    per_customer_limit INTEGER DEFAULT 1,
    terms_conditions TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_offers_code ON promotional_offers(offer_code);
CREATE INDEX IF NOT EXISTS idx_offers_validity ON promotional_offers(valid_from, valid_to);

-- Customer Feedback
CREATE TABLE IF NOT EXISTS customer_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id),
    feedback_type TEXT NOT NULL, -- rating, complaint, suggestion, compliment
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    feedback_category TEXT, -- service, product, pricing, delivery, staff
    subject TEXT,
    feedback_text TEXT NOT NULL,
    response_text TEXT,
    responded_by TEXT,
    responded_at TIMESTAMPTZ,
    status TEXT DEFAULT 'pending', -- pending, acknowledged, resolved, closed
    priority TEXT DEFAULT 'normal',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feedback_customer ON customer_feedback(customer_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON customer_feedback(status);

-- Birthday & Anniversary Automation
CREATE TABLE IF NOT EXISTS celebration_automations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    automation_type TEXT NOT NULL, -- birthday, anniversary
    days_before INTEGER DEFAULT 0, -- Send greeting on the day
    greeting_message TEXT NOT NULL,
    discount_percentage NUMERIC DEFAULT 0,
    special_offer TEXT,
    send_email BOOLEAN DEFAULT TRUE,
    send_sms BOOLEAN DEFAULT TRUE,
    send_whatsapp BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO celebration_automations (automation_type, days_before, greeting_message, discount_percentage) VALUES
('birthday', 0, 'Happy Birthday! Enjoy a special discount on your special day!', 10),
('anniversary', 0, 'Happy Anniversary! Thank you for being with us!', 5)
ON CONFLICT DO NOTHING;

-- ============================================
-- COMPREHENSIVE VIEWS
-- ============================================

-- Employee Dashboard View
CREATE OR REPLACE VIEW v_employee_dashboard AS
SELECT 
    p.id,
    p.employee_code,
    p.full_name,
    p.email,
    p.phone,
    p.department,
    p.designation,
    p.joining_date,
    p.basic_salary,
    COALESCE(att.present_days, 0) as present_days_this_month,
    COALESCE(att.absent_days, 0) as absent_days_this_month,
    COALESCE(la.pending_leaves, 0) as pending_leave_requests,
    p.is_active_employee
FROM profiles p
LEFT JOIN (
    SELECT employee_id, 
           COUNT(*) FILTER (WHERE status = 'present') as present_days,
           COUNT(*) FILTER (WHERE status = 'absent') as absent_days
    FROM attendance
    WHERE EXTRACT(MONTH FROM attendance_date) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(YEAR FROM attendance_date) = EXTRACT(YEAR FROM CURRENT_DATE)
    GROUP BY employee_id
) att ON p.id = att.employee_id
LEFT JOIN (
    SELECT employee_id, COUNT(*) as pending_leaves
    FROM leave_applications
    WHERE status = 'pending'
    GROUP BY employee_id
) la ON p.id = la.employee_id
WHERE p.is_active_employee = TRUE;

-- Customer Loyalty Dashboard
CREATE OR REPLACE VIEW v_customer_loyalty_dashboard AS
SELECT 
    c.id,
    c.name,
    c.loyalty_tier,
    c.loyalty_points,
    c.total_purchases,
    c.purchase_count,
    c.last_purchase_date,
    lt.discount_percentage as tier_discount,
    lt.points_multiplier,
    CASE 
        WHEN c.last_purchase_date >= CURRENT_DATE - INTERVAL '30 days' THEN 'active'
        WHEN c.last_purchase_date >= CURRENT_DATE - INTERVAL '90 days' THEN 'at_risk'
        ELSE 'inactive'
    END as engagement_status
FROM customers c
LEFT JOIN loyalty_tiers lt ON c.loyalty_tier = lt.tier_name;

-- ============================================
-- AUTOMATED TASKS SCHEDULER
-- ============================================
CREATE TABLE IF NOT EXISTS scheduled_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_name TEXT NOT NULL,
    task_type TEXT NOT NULL, -- backup, report, alert, cleanup, birthday_greeting, expiry_check
    task_frequency TEXT NOT NULL, -- once, daily, weekly, monthly
    schedule_time TIME,
    schedule_day INTEGER, -- Day of week (1-7) or day of month (1-31)
    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ,
    status TEXT DEFAULT 'active',
    error_count INTEGER DEFAULT 0,
    last_error TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO scheduled_tasks (task_name, task_type, task_frequency, schedule_time) VALUES
('Daily Database Backup', 'backup', 'daily', '02:00:00'),
('Check Expiring Medicines', 'expiry_check', 'daily', '08:00:00'),
('Send Birthday Greetings', 'birthday_greeting', 'daily', '09:00:00'),
('Generate Daily Sales Report', 'report', 'daily', '23:30:00'),
('Low Stock Alert', 'alert', 'daily', '10:00:00')
ON CONFLICT DO NOTHING;

-- ============================================
-- COMPLETION MESSAGE
-- ============================================
DO $$
BEGIN
    RAISE NOTICE 'Phases 10-13: HRM, Advanced Features, UI/UX, CRM & Marketing - COMPLETE!';
    RAISE NOTICE 'Phase 10: Complete HRM with attendance, leaves, payroll, loans, messages';
    RAISE NOTICE 'Phase 11: Backup system, printer config, search history, favorites';
    RAISE NOTICE 'Phase 12: Company branding, user preferences, dashboard widgets';
    RAISE NOTICE 'Phase 13: Marketing campaigns, loyalty program, offers, feedback, birthday automation';
    RAISE NOTICE 'ALL MAJOR FEATURES IMPLEMENTED!';
END $$;

