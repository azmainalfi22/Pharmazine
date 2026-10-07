-- Columns the API's SQLAlchemy models select but the database never got.
-- Without them every query on these tables fails, e.g. GET /api/customers and
-- GET /api/dashboard/stats return 500 ("column customers.customer_group does
-- not exist"). Purely additive and idempotent.

ALTER TABLE public.customers
    ADD COLUMN IF NOT EXISTS customer_group        TEXT,
    ADD COLUMN IF NOT EXISTS birthday              DATE,
    ADD COLUMN IF NOT EXISTS anniversary           DATE,
    ADD COLUMN IF NOT EXISTS title                 TEXT,
    ADD COLUMN IF NOT EXISTS middle_name           TEXT,
    ADD COLUMN IF NOT EXISTS last_name             TEXT,
    ADD COLUMN IF NOT EXISTS anniversary_date      DATE,
    ADD COLUMN IF NOT EXISTS chronic_conditions    TEXT,
    ADD COLUMN IF NOT EXISTS email_verified        BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS phone_verified        BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS whatsapp_number       TEXT,
    ADD COLUMN IF NOT EXISTS alternate_phone       TEXT,
    ADD COLUMN IF NOT EXISTS email2                TEXT,
    ADD COLUMN IF NOT EXISTS address_line1         TEXT,
    ADD COLUMN IF NOT EXISTS address_line2         TEXT,
    ADD COLUMN IF NOT EXISTS city                  TEXT,
    ADD COLUMN IF NOT EXISTS state                 TEXT,
    ADD COLUMN IF NOT EXISTS country               TEXT,
    ADD COLUMN IF NOT EXISTS postal_code           TEXT,
    ADD COLUMN IF NOT EXISTS landmark              TEXT,
    ADD COLUMN IF NOT EXISTS payment_deadline_days INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_purchases       DOUBLE PRECISION DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_paid            DOUBLE PRECISION DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_purchase_date    DATE,
    ADD COLUMN IF NOT EXISTS loyalty_tier          TEXT;

ALTER TABLE public.purchase_items
    ADD COLUMN IF NOT EXISTS batch_no    TEXT,
    ADD COLUMN IF NOT EXISTS gst_percent DOUBLE PRECISION;

-- Nullable on purpose: existing writers insert payment_method, not method.
ALTER TABLE public.sale_payments
    ADD COLUMN IF NOT EXISTS method     TEXT,
    ADD COLUMN IF NOT EXISTS status     TEXT DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS created_by TEXT,
    ADD COLUMN IF NOT EXISTS cleared_at TIMESTAMPTZ;
