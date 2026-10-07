-- ============================================================================
-- Tables for modules whose backend models exist but whose tables were never
-- created in the database: HRM, Services, CRM campaigns/loyalty, stock
-- receive/issue (elc_*), companies and vouchers. Their API endpoints
-- currently fail with "relation ... does not exist".
--
-- Generated from the SQLAlchemy models (backend/hrm_models.py,
-- service_models.py, crm_models.py, main.py). Foreign-key columns use the
-- type of the column they reference (uuid for employees/customers/profiles).
-- Purely additive and idempotent. Runs after the per-account workspaces
-- migration, so the new tables are workspace-scoped and their unique keys
-- are unique per workspace.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_code VARCHAR NOT NULL,
    full_name VARCHAR NOT NULL,
    email VARCHAR,
    phone VARCHAR NOT NULL,
    date_of_birth DATE,
    gender VARCHAR,
    address TEXT,
    city VARCHAR,
    state VARCHAR,
    postal_code VARCHAR,
    national_id VARCHAR,
    designation VARCHAR,
    department VARCHAR,
    employment_type VARCHAR,
    joining_date DATE NOT NULL,
    leaving_date DATE,
    basic_salary NUMERIC DEFAULT 0,
    allowances NUMERIC DEFAULT 0,
    bank_name VARCHAR,
    bank_account_number VARCHAR,
    emergency_contact_name VARCHAR,
    emergency_contact_phone VARCHAR,
    photo_url VARCHAR,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.leave_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL,
    code VARCHAR NOT NULL,
    annual_quota INTEGER DEFAULT 0,
    is_paid BOOLEAN DEFAULT TRUE,
    is_carry_forward BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL,
    attendance_date DATE NOT NULL,
    check_in_time TIMESTAMP WITHOUT TIME ZONE,
    check_out_time TIMESTAMP WITHOUT TIME ZONE,
    status VARCHAR DEFAULT 'present',
    working_hours FLOAT DEFAULT 0,
    overtime_hours FLOAT DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    FOREIGN KEY (employee_id) REFERENCES public.employees(id)
);

CREATE TABLE IF NOT EXISTS public.leave_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_number VARCHAR,
    employee_id UUID NOT NULL,
    leave_type_id UUID,
    leave_type VARCHAR,
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    total_days NUMERIC NOT NULL,
    reason TEXT NOT NULL,
    contact_during_leave TEXT,
    status VARCHAR DEFAULT 'pending',
    approved_by VARCHAR,
    approved_at TIMESTAMP WITHOUT TIME ZONE,
    rejection_reason TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    FOREIGN KEY (employee_id) REFERENCES public.employees(id),
    FOREIGN KEY (leave_type_id) REFERENCES public.leave_types(id)
);

CREATE TABLE IF NOT EXISTS public.employee_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL,
    document_type VARCHAR NOT NULL,
    document_name VARCHAR NOT NULL,
    file_path VARCHAR NOT NULL,
    file_size INTEGER,
    uploaded_by VARCHAR,
    uploaded_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    FOREIGN KEY (employee_id) REFERENCES public.employees(id)
);

CREATE TABLE IF NOT EXISTS public.employee_loans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loan_number VARCHAR NOT NULL,
    employee_id UUID NOT NULL,
    loan_type VARCHAR NOT NULL,
    loan_amount NUMERIC NOT NULL,
    interest_rate NUMERIC DEFAULT 0,
    emi_amount NUMERIC NOT NULL,
    total_installments INTEGER NOT NULL,
    paid_installments INTEGER DEFAULT 0,
    remaining_amount NUMERIC,
    status VARCHAR DEFAULT 'active',
    disbursement_date DATE,
    approved_by VARCHAR,
    notes TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    FOREIGN KEY (employee_id) REFERENCES public.employees(id)
);

CREATE TABLE IF NOT EXISTS public.salary_components (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    component_name VARCHAR NOT NULL,
    component_type VARCHAR NOT NULL,
    calculation_type VARCHAR DEFAULT 'fixed',
    default_amount NUMERIC DEFAULT 0,
    is_taxable BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payroll (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payroll_number VARCHAR,
    employee_id UUID NOT NULL,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    days_worked NUMERIC DEFAULT 0,
    days_absent NUMERIC DEFAULT 0,
    basic_salary NUMERIC NOT NULL,
    allowances NUMERIC DEFAULT 0,
    overtime_amount NUMERIC DEFAULT 0,
    bonuses NUMERIC DEFAULT 0,
    deductions NUMERIC DEFAULT 0,
    tax_deduction NUMERIC DEFAULT 0,
    gross_salary NUMERIC NOT NULL,
    total_deductions NUMERIC DEFAULT 0,
    net_salary NUMERIC NOT NULL,
    payment_date DATE,
    payment_method VARCHAR,
    payment_status VARCHAR DEFAULT 'pending',
    payment_reference VARCHAR,
    processed_by VARCHAR,
    processed_at TIMESTAMP WITHOUT TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    FOREIGN KEY (employee_id) REFERENCES public.employees(id)
);

CREATE TABLE IF NOT EXISTS public.payroll_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payroll_id UUID NOT NULL,
    component_id UUID,
    component_name VARCHAR NOT NULL,
    component_type VARCHAR NOT NULL,
    amount NUMERIC NOT NULL,
    FOREIGN KEY (payroll_id) REFERENCES public.payroll(id),
    FOREIGN KEY (component_id) REFERENCES public.salary_components(id)
);

CREATE TABLE IF NOT EXISTS public.service_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_code VARCHAR NOT NULL,
    category_id UUID,
    name VARCHAR NOT NULL,
    description TEXT,
    base_price NUMERIC NOT NULL,
    vat_percentage NUMERIC DEFAULT 0,
    cgst_percentage NUMERIC DEFAULT 0,
    sgst_percentage NUMERIC DEFAULT 0,
    igst_percentage NUMERIC DEFAULT 0,
    hsn_code VARCHAR,
    duration_minutes INTEGER,
    is_home_service BOOLEAN DEFAULT FALSE,
    travel_charges NUMERIC DEFAULT 0,
    min_advance_booking_hours INTEGER DEFAULT 0,
    max_bookings_per_day INTEGER,
    terms_and_conditions TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_by VARCHAR,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    FOREIGN KEY (category_id) REFERENCES public.service_categories(id)
);

CREATE TABLE IF NOT EXISTS public.service_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_number VARCHAR NOT NULL,
    customer_id UUID,
    customer_name VARCHAR NOT NULL,
    customer_phone VARCHAR NOT NULL,
    customer_address TEXT,
    service_id UUID,
    service_name VARCHAR NOT NULL,
    booking_date DATE NOT NULL,
    booking_time TIME WITHOUT TIME ZONE NOT NULL,
    duration_minutes INTEGER,
    status VARCHAR DEFAULT 'pending',
    service_invoice_id UUID,
    advance_paid NUMERIC DEFAULT 0,
    notes TEXT,
    special_instructions TEXT,
    assigned_to VARCHAR,
    confirmed_by VARCHAR,
    confirmed_at TIMESTAMP WITHOUT TIME ZONE,
    cancelled_by VARCHAR,
    cancelled_at TIMESTAMP WITHOUT TIME ZONE,
    cancellation_reason TEXT,
    created_by VARCHAR,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    FOREIGN KEY (service_id) REFERENCES public.services(id)
);

CREATE TABLE IF NOT EXISTS public.service_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR NOT NULL,
    customer_id UUID,
    customer_name VARCHAR NOT NULL,
    customer_phone VARCHAR,
    customer_email VARCHAR,
    customer_address TEXT,
    invoice_date DATE NOT NULL,
    service_date DATE,
    service_time TIME WITHOUT TIME ZONE,
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
    payment_method VARCHAR,
    payment_status VARCHAR DEFAULT 'pending',
    paid_amount NUMERIC DEFAULT 0,
    balance_amount NUMERIC DEFAULT 0,
    notes TEXT,
    terms_conditions TEXT,
    created_by VARCHAR,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.service_invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL,
    service_id UUID,
    service_code VARCHAR,
    service_name VARCHAR NOT NULL,
    description TEXT,
    quantity NUMERIC DEFAULT 1,
    unit_price NUMERIC NOT NULL,
    subtotal NUMERIC NOT NULL,
    discount_percentage NUMERIC DEFAULT 0,
    discount_amount NUMERIC DEFAULT 0,
    vat_amount NUMERIC DEFAULT 0,
    cgst_amount NUMERIC DEFAULT 0,
    sgst_amount NUMERIC DEFAULT 0,
    igst_amount NUMERIC DEFAULT 0,
    total NUMERIC NOT NULL,
    FOREIGN KEY (invoice_id) REFERENCES public.service_invoices(id),
    FOREIGN KEY (service_id) REFERENCES public.services(id)
);

CREATE TABLE IF NOT EXISTS public.service_packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    package_code VARCHAR NOT NULL,
    name VARCHAR NOT NULL,
    description TEXT,
    total_services INTEGER DEFAULT 0,
    package_price NUMERIC NOT NULL,
    discount_percentage NUMERIC DEFAULT 0,
    validity_days INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.service_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID,
    booking_id UUID,
    customer_id UUID,
    customer_name VARCHAR,
    rating INTEGER NOT NULL,
    review_text TEXT,
    service_quality INTEGER,
    staff_behavior INTEGER,
    value_for_money INTEGER,
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    FOREIGN KEY (service_id) REFERENCES public.services(id),
    FOREIGN KEY (booking_id) REFERENCES public.service_bookings(id)
);

CREATE TABLE IF NOT EXISTS public.marketing_campaigns (
    id INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    name VARCHAR NOT NULL,
    campaign_type VARCHAR NOT NULL,
    subject VARCHAR,
    message TEXT NOT NULL,
    target_audience VARCHAR NOT NULL DEFAULT 'all',
    status VARCHAR NOT NULL DEFAULT 'draft',
    sent_count INTEGER DEFAULT 0,
    opened_count INTEGER DEFAULT 0,
    click_count INTEGER DEFAULT 0,
    scheduled_date TIMESTAMP WITHOUT TIME ZONE,
    sent_date TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    created_by VARCHAR
);

CREATE TABLE IF NOT EXISTS public.customer_loyalty_points (
    id INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    customer_id UUID NOT NULL,
    points INTEGER NOT NULL DEFAULT 0,
    transaction_type VARCHAR NOT NULL,
    reference_type VARCHAR,
    reference_id VARCHAR,
    notes TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    created_by VARCHAR,
    FOREIGN KEY (customer_id) REFERENCES public.customers(id)
);

CREATE TABLE IF NOT EXISTS public.loyalty_rewards (
    id INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    name VARCHAR NOT NULL,
    description TEXT,
    points_required INTEGER NOT NULL,
    reward_type VARCHAR NOT NULL,
    reward_value NUMERIC NOT NULL,
    max_redemptions INTEGER,
    current_redemptions INTEGER DEFAULT 0,
    valid_from DATE NOT NULL,
    valid_until DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    created_by VARCHAR
);

CREATE TABLE IF NOT EXISTS public.reward_redemptions (
    id INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    customer_id UUID NOT NULL,
    reward_id INTEGER NOT NULL,
    points_used INTEGER NOT NULL,
    redemption_code VARCHAR,
    status VARCHAR DEFAULT 'pending',
    redeemed_at TIMESTAMP WITHOUT TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    FOREIGN KEY (customer_id) REFERENCES public.customers(id),
    FOREIGN KEY (reward_id) REFERENCES public.loyalty_rewards(id)
);

CREATE TABLE IF NOT EXISTS public.companies (
    id VARCHAR PRIMARY KEY,
    name VARCHAR NOT NULL,
    email VARCHAR,
    phone VARCHAR,
    address TEXT,
    website VARCHAR,
    tax_id VARCHAR,
    registration_number VARCHAR,
    business_type VARCHAR,
    established_date VARCHAR,
    description TEXT,
    logo_url VARCHAR,
    created_at TIMESTAMP WITHOUT TIME ZONE,
    updated_at TIMESTAMP WITHOUT TIME ZONE
);

CREATE TABLE IF NOT EXISTS public.elc_receive_master (
    receive_pk_no INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    chalan_date TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    chalan_no VARCHAR(100),
    category VARCHAR,
    supplier_name VARCHAR,
    product_model_number VARCHAR,
    receive_type VARCHAR(50),
    status INTEGER DEFAULT 1,
    au_entry_by INTEGER NOT NULL,
    au_entry_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    au_update_by INTEGER,
    au_update_at TIMESTAMP WITHOUT TIME ZONE
);

CREATE TABLE IF NOT EXISTS public.elc_receive_details (
    receivedtl_pk_no INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    receive_pk_no INTEGER,
    chalan_no VARCHAR(100),
    item_barcode VARCHAR(200),
    item_pk_no INTEGER NOT NULL,
    item_name VARCHAR(200),
    receive_quantity FLOAT NOT NULL DEFAULT 0,
    unit_price FLOAT,
    status INTEGER DEFAULT 0,
    au_entry_by INTEGER NOT NULL,
    au_entry_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    au_update_by INTEGER,
    au_update_at TIMESTAMP WITHOUT TIME ZONE,
    adj_reason VARCHAR(1000),
    adj_type VARCHAR(100),
    remarks VARCHAR(200),
    FOREIGN KEY (receive_pk_no) REFERENCES public.elc_receive_master(receive_pk_no)
);

CREATE TABLE IF NOT EXISTS public.elc_issue_master (
    issue_pk_no INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    chalan_date TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    chalan_no VARCHAR(100),
    category VARCHAR,
    supplier_name VARCHAR,
    product_model_number VARCHAR,
    issue_type VARCHAR(50),
    status INTEGER DEFAULT 1,
    au_entry_by INTEGER NOT NULL,
    au_entry_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    au_update_by INTEGER,
    au_update_at TIMESTAMP WITHOUT TIME ZONE
);

CREATE TABLE IF NOT EXISTS public.elc_issue_details (
    issuedtl_pk_no INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    issue_pk_no INTEGER,
    chalan_no VARCHAR(100),
    item_barcode VARCHAR(200),
    item_pk_no INTEGER NOT NULL,
    item_name VARCHAR(200),
    issue_quantity FLOAT NOT NULL DEFAULT 0,
    unit_price FLOAT,
    status INTEGER DEFAULT 0,
    au_entry_by INTEGER NOT NULL,
    au_entry_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    au_update_by INTEGER,
    au_update_at TIMESTAMP WITHOUT TIME ZONE,
    adj_reason VARCHAR(1000),
    adj_type VARCHAR(100),
    remarks VARCHAR(200),
    FOREIGN KEY (issue_pk_no) REFERENCES public.elc_issue_master(issue_pk_no)
);

CREATE TABLE IF NOT EXISTS public.vouchers (
    id VARCHAR PRIMARY KEY,
    voucher_no VARCHAR NOT NULL,
    voucher_type VARCHAR NOT NULL,
    date TIMESTAMP DEFAULT now(),
    amount DOUBLE PRECISION NOT NULL,
    description TEXT,
    status VARCHAR DEFAULT 'pending',
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP DEFAULT now()
);

-- Foreign-key lookups
CREATE INDEX IF NOT EXISTS ix_attendance_employee_id ON public.attendance (employee_id);
CREATE INDEX IF NOT EXISTS ix_leave_applications_employee_id ON public.leave_applications (employee_id);
CREATE INDEX IF NOT EXISTS ix_payroll_employee_id ON public.payroll (employee_id);
CREATE INDEX IF NOT EXISTS ix_service_bookings_service_id ON public.service_bookings (service_id);
CREATE INDEX IF NOT EXISTS ix_customer_loyalty_points_customer_id ON public.customer_loyalty_points (customer_id);

DO $$
BEGIN
    IF to_regprocedure('public.pharmazine_tenantize_all(boolean)') IS NOT NULL THEN
        -- tenant_id + row-level security for the new tables
        PERFORM public.pharmazine_tenantize_all(true);
        EXECUTE 'DROP INDEX IF EXISTS public.ux_employees_employee_code';
        EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS ux_employees_tenant_employee_code ON public.employees (tenant_id, employee_code)';
        EXECUTE 'DROP INDEX IF EXISTS public.ux_employees_email';
        EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS ux_employees_tenant_email ON public.employees (tenant_id, email)';
        EXECUTE 'DROP INDEX IF EXISTS public.ux_leave_types_name';
        EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS ux_leave_types_tenant_name ON public.leave_types (tenant_id, name)';
        EXECUTE 'DROP INDEX IF EXISTS public.ux_leave_types_code';
        EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS ux_leave_types_tenant_code ON public.leave_types (tenant_id, code)';
        EXECUTE 'DROP INDEX IF EXISTS public.ux_leave_applications_application_number';
        EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS ux_leave_applications_tenant_application_number ON public.leave_applications (tenant_id, application_number)';
        EXECUTE 'DROP INDEX IF EXISTS public.ux_employee_loans_loan_number';
        EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS ux_employee_loans_tenant_loan_number ON public.employee_loans (tenant_id, loan_number)';
        EXECUTE 'DROP INDEX IF EXISTS public.ux_salary_components_component_name';
        EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS ux_salary_components_tenant_component_name ON public.salary_components (tenant_id, component_name)';
        EXECUTE 'DROP INDEX IF EXISTS public.ux_payroll_payroll_number';
        EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS ux_payroll_tenant_payroll_number ON public.payroll (tenant_id, payroll_number)';
        EXECUTE 'DROP INDEX IF EXISTS public.ux_service_categories_name';
        EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS ux_service_categories_tenant_name ON public.service_categories (tenant_id, name)';
        EXECUTE 'DROP INDEX IF EXISTS public.ux_services_service_code';
        EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS ux_services_tenant_service_code ON public.services (tenant_id, service_code)';
        EXECUTE 'DROP INDEX IF EXISTS public.ux_service_bookings_booking_number';
        EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS ux_service_bookings_tenant_booking_number ON public.service_bookings (tenant_id, booking_number)';
        EXECUTE 'DROP INDEX IF EXISTS public.ux_service_invoices_invoice_number';
        EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS ux_service_invoices_tenant_invoice_number ON public.service_invoices (tenant_id, invoice_number)';
        EXECUTE 'DROP INDEX IF EXISTS public.ux_service_packages_package_code';
        EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS ux_service_packages_tenant_package_code ON public.service_packages (tenant_id, package_code)';
        EXECUTE 'DROP INDEX IF EXISTS public.ux_reward_redemptions_redemption_code';
        EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS ux_reward_redemptions_tenant_redemption_code ON public.reward_redemptions (tenant_id, redemption_code)';
        EXECUTE 'DROP INDEX IF EXISTS public.ux_vouchers_voucher_no';
        EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS ux_vouchers_tenant_voucher_no ON public.vouchers (tenant_id, voucher_no)';
    ELSE
        -- Per-account workspaces not installed: plain unique keys.
        EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS ux_employees_employee_code ON public.employees (employee_code)';
        EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS ux_employees_email ON public.employees (email)';
        EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS ux_leave_types_name ON public.leave_types (name)';
        EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS ux_leave_types_code ON public.leave_types (code)';
        EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS ux_leave_applications_application_number ON public.leave_applications (application_number)';
        EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS ux_employee_loans_loan_number ON public.employee_loans (loan_number)';
        EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS ux_salary_components_component_name ON public.salary_components (component_name)';
        EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS ux_payroll_payroll_number ON public.payroll (payroll_number)';
        EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS ux_service_categories_name ON public.service_categories (name)';
        EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS ux_services_service_code ON public.services (service_code)';
        EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS ux_service_bookings_booking_number ON public.service_bookings (booking_number)';
        EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS ux_service_invoices_invoice_number ON public.service_invoices (invoice_number)';
        EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS ux_service_packages_package_code ON public.service_packages (package_code)';
        EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS ux_reward_redemptions_redemption_code ON public.reward_redemptions (redemption_code)';
        EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS ux_vouchers_voucher_no ON public.vouchers (voucher_no)';
    END IF;
END
$$;
