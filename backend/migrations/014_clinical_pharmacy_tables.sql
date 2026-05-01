-- Phase 14: Clinical Pharmacy Tables
-- Creates tables for drug interactions, prescriptions, refill reminders,
-- insurance claims, and medicine allergies

-- Drug Interactions
CREATE TABLE IF NOT EXISTS drug_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    medicine_a_id UUID,
    medicine_b_id UUID,
    interaction_type TEXT NOT NULL,  -- major, moderate, minor
    description TEXT,
    severity_level INTEGER DEFAULT 1, -- 1=minor, 2=moderate, 3=major
    recommended_action TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_drug_interactions_pair
    ON drug_interactions(medicine_a_id, medicine_b_id);

-- Prescription Records
CREATE TABLE IF NOT EXISTS prescription_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prescription_number TEXT UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    doctor_name TEXT,
    doctor_license TEXT,
    diagnosis TEXT,
    prescription_date DATE NOT NULL,
    valid_until DATE,
    refills_allowed INTEGER DEFAULT 0,
    refills_used INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prescriptions_customer
    ON prescription_records(customer_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_date
    ON prescription_records(prescription_date);

-- Prescription Items
CREATE TABLE IF NOT EXISTS prescription_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prescription_id UUID REFERENCES prescription_records(id) ON DELETE CASCADE,
    product_id UUID,
    product_name TEXT NOT NULL,
    dosage TEXT,
    frequency TEXT,
    duration_days INTEGER,
    quantity_prescribed INTEGER NOT NULL,
    quantity_dispensed INTEGER DEFAULT 0,
    instructions TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prescription_items_rx
    ON prescription_items(prescription_id);

-- Refill Reminders
CREATE TABLE IF NOT EXISTS refill_reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    product_id UUID,
    product_name TEXT NOT NULL,
    last_purchase_date DATE NOT NULL,
    next_refill_date DATE NOT NULL,
    status TEXT DEFAULT 'pending',      -- pending, sent, completed, cancelled
    reminder_sent BOOLEAN DEFAULT FALSE,
    reminder_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_refill_reminders_customer
    ON refill_reminders(customer_id);
CREATE INDEX IF NOT EXISTS idx_refill_reminders_date
    ON refill_reminders(next_refill_date);

-- Insurance Claims
CREATE TABLE IF NOT EXISTS insurance_claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    claim_number TEXT UNIQUE NOT NULL,
    sale_id UUID,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    insurance_provider TEXT NOT NULL,
    policy_number TEXT NOT NULL,
    claim_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    approved_amount NUMERIC(12,2),
    claim_status TEXT DEFAULT 'pending',  -- pending, approved, rejected, paid
    submitted_date DATE NOT NULL,
    approval_date DATE,
    payment_date DATE,
    rejection_reason TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_insurance_claims_status
    ON insurance_claims(claim_status);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_customer
    ON insurance_claims(customer_id);

-- Medicine Allergies
CREATE TABLE IF NOT EXISTS medicine_allergies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    medicine_name TEXT NOT NULL,
    generic_name TEXT,
    allergy_type TEXT NOT NULL DEFAULT 'mild',  -- mild, moderate, severe, life-threatening
    symptoms TEXT NOT NULL,
    date_identified DATE,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_medicine_allergies_customer
    ON medicine_allergies(customer_id);
CREATE INDEX IF NOT EXISTS idx_medicine_allergies_type
    ON medicine_allergies(allergy_type);

DO $$
BEGIN
    RAISE NOTICE 'Phase 14: Clinical pharmacy tables created successfully';
END $$;
