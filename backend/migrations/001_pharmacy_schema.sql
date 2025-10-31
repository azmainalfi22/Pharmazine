-- Pharmacy & Animal Feed schema (PostgreSQL)
-- Safe to run multiple times (IF NOT EXISTS guards)

-- Roles already exist as user_roles(role text). Ensure allowed values documented: admin, salesman

-- Stores
CREATE TABLE IF NOT EXISTS stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    address TEXT,
    contact TEXT,
    timezone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Extend products
ALTER TABLE IF EXISTS products
    ADD COLUMN IF NOT EXISTS unit_type TEXT,
    ADD COLUMN IF NOT EXISTS unit_size TEXT,
    ADD COLUMN IF NOT EXISTS unit_multiplier NUMERIC,
    ADD COLUMN IF NOT EXISTS purchase_price NUMERIC,
    ADD COLUMN IF NOT EXISTS selling_price NUMERIC,
    ADD COLUMN IF NOT EXISTS min_stock_threshold INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Product stock per store
CREATE TABLE IF NOT EXISTS product_stock (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id TEXT NOT NULL,
    store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
    opening_qty NUMERIC DEFAULT 0,
    current_qty NUMERIC DEFAULT 0,
    reserved_qty NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(product_id, store_id)
);

-- Customers
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    contact TEXT,
    address TEXT,
    ledger_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Purchases
CREATE TABLE IF NOT EXISTS purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id TEXT,
    invoice_no TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_amount NUMERIC NOT NULL DEFAULT 0,
    payment_status TEXT DEFAULT 'pending',
    created_by TEXT,
    store_id UUID REFERENCES stores(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS purchase_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL,
    qty NUMERIC NOT NULL,
    unit TEXT,
    unit_price NUMERIC NOT NULL,
    total_price NUMERIC NOT NULL
);

-- Goods Receipt Note (GRN)
CREATE TABLE IF NOT EXISTS grns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_by TEXT
);

-- Sales extension minimal alignment
ALTER TABLE IF EXISTS sales
    ADD COLUMN IF NOT EXISTS payment_type TEXT,
    ADD COLUMN IF NOT EXISTS customer_id TEXT;

ALTER TABLE IF EXISTS sales_items
    ADD COLUMN IF NOT EXISTS discount NUMERIC DEFAULT 0;

-- Requisitions
CREATE TABLE IF NOT EXISTS requisitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id),
    requested_by TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    approved_by TEXT,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS requisition_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requisition_id UUID NOT NULL REFERENCES requisitions(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL,
    qty NUMERIC NOT NULL,
    unit TEXT
);

-- Transactions / Ledger
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date TIMESTAMPTZ NOT NULL DEFAULT now(),
    type TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    reference_id TEXT,
    description TEXT,
    created_by TEXT
);

-- Expenses
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    category TEXT,
    amount NUMERIC NOT NULL,
    description TEXT,
    receipt_url TEXT
);

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT,
    action TEXT,
    table_name TEXT,
    record_id TEXT,
    old_value JSONB,
    new_value JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


