-- Enhanced Customer Management Migration
-- Add additional fields to support full customer management features

-- Add new columns to customers table
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS company TEXT,
ADD COLUMN IF NOT EXISTS customer_group TEXT,
ADD COLUMN IF NOT EXISTS credit_limit NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS opening_balance NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_balance NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS birthday DATE,
ADD COLUMN IF NOT EXISTS anniversary DATE,
ADD COLUMN IF NOT EXISTS tax_number TEXT,
ADD COLUMN IF NOT EXISTS discount_percentage NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_terms TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create customer loyalty points table
CREATE TABLE IF NOT EXISTS customer_loyalty_points (
    id SERIAL PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    points INTEGER NOT NULL DEFAULT 0,
    transaction_type TEXT NOT NULL, -- earn, redeem, expire, adjust
    reference_type TEXT, -- purchase, campaign, manual
    reference_id TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by TEXT
);

-- Create loyalty rewards catalog
CREATE TABLE IF NOT EXISTS loyalty_rewards (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    points_required INTEGER NOT NULL,
    reward_type TEXT NOT NULL, -- discount, free_product, voucher, service
    reward_value NUMERIC NOT NULL,
    max_redemptions INTEGER,
    current_redemptions INTEGER DEFAULT 0,
    valid_from DATE NOT NULL,
    valid_until DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by TEXT
);

-- Create reward redemptions table
CREATE TABLE IF NOT EXISTS reward_redemptions (
    id SERIAL PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    reward_id INTEGER NOT NULL REFERENCES loyalty_rewards(id),
    points_used INTEGER NOT NULL,
    redemption_code TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, redeemed, expired, cancelled
    redeemed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by TEXT
);

-- Create marketing campaigns table
CREATE TABLE IF NOT EXISTS marketing_campaigns (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    campaign_type TEXT NOT NULL, -- email, sms, push
    subject TEXT,
    message TEXT NOT NULL,
    target_audience TEXT NOT NULL DEFAULT 'all', -- all, gold, silver, bronze
    status TEXT NOT NULL DEFAULT 'draft', -- draft, scheduled, sent, completed
    sent_count INTEGER DEFAULT 0,
    opened_count INTEGER DEFAULT 0,
    click_count INTEGER DEFAULT 0,
    scheduled_date TIMESTAMPTZ,
    sent_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by TEXT
);

-- Create campaign recipients table
CREATE TABLE IF NOT EXISTS campaign_recipients (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER NOT NULL REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    sent_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'pending' -- pending, sent, delivered, opened, clicked, failed
);

-- Create customer segments table
CREATE TABLE IF NOT EXISTS customer_segments (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    filter_criteria JSONB, -- Store segment filters as JSON
    customer_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_customer_group ON customers(customer_group);
CREATE INDEX IF NOT EXISTS idx_customers_is_active ON customers(is_active);

CREATE INDEX IF NOT EXISTS idx_loyalty_points_customer ON customer_loyalty_points(customer_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_points_type ON customer_loyalty_points(transaction_type);
CREATE INDEX IF NOT EXISTS idx_loyalty_points_created ON customer_loyalty_points(created_at);

CREATE INDEX IF NOT EXISTS idx_rewards_active ON loyalty_rewards(is_active);
CREATE INDEX IF NOT EXISTS idx_rewards_dates ON loyalty_rewards(valid_from, valid_until);

CREATE INDEX IF NOT EXISTS idx_redemptions_customer ON reward_redemptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_status ON reward_redemptions(status);
CREATE INDEX IF NOT EXISTS idx_redemptions_code ON reward_redemptions(redemption_code);

CREATE INDEX IF NOT EXISTS idx_campaigns_status ON marketing_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_dates ON marketing_campaigns(scheduled_date, sent_date);

CREATE INDEX IF NOT EXISTS idx_campaign_recipients_campaign ON campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_customer ON campaign_recipients(customer_id);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_status ON campaign_recipients(status);

-- Create view for customer loyalty statistics
CREATE OR REPLACE VIEW customer_loyalty_stats AS
SELECT 
    c.id as customer_id,
    c.name as customer_name,
    c.email,
    c.phone,
    COALESCE(SUM(CASE WHEN clp.points > 0 THEN clp.points ELSE 0 END), 0) as points_earned,
    COALESCE(SUM(CASE WHEN clp.points < 0 THEN ABS(clp.points) ELSE 0 END), 0) as points_redeemed,
    COALESCE(SUM(clp.points), 0) as total_points,
    CASE 
        WHEN COALESCE(SUM(clp.points), 0) >= 500 THEN 'Gold'
        WHEN COALESCE(SUM(clp.points), 0) >= 200 THEN 'Silver'
        ELSE 'Bronze'
    END as tier,
    COALESCE(c.current_balance, 0) as lifetime_value,
    (SELECT COUNT(*) FROM purchases WHERE supplier_id = c.id) as total_purchases,
    (SELECT MAX(created_at) FROM purchases WHERE supplier_id = c.id) as last_purchase_date
FROM customers c
LEFT JOIN customer_loyalty_points clp ON c.id = clp.customer_id
WHERE c.is_active = true
GROUP BY c.id, c.name, c.email, c.phone, c.current_balance;

-- Insert sample loyalty rewards
INSERT INTO loyalty_rewards (name, description, points_required, reward_type, reward_value, max_redemptions, valid_from, valid_until, is_active)
VALUES 
('10% Discount Voucher', 'Get 10% off on your next purchase', 100, 'discount', 10.00, 500, CURRENT_DATE, CURRENT_DATE + INTERVAL '90 days', true),
('Free Health Checkup', 'Complimentary health checkup service', 500, 'service', 200.00, 100, CURRENT_DATE, CURRENT_DATE + INTERVAL '180 days', true),
('Premium Medicine Bundle', 'Free premium medicine package worth 500 LE', 1000, 'free_product', 500.00, 50, CURRENT_DATE, CURRENT_DATE + INTERVAL '365 days', true),
('20% Seasonal Discount', 'Special seasonal discount on all medicines', 250, 'discount', 20.00, 200, CURRENT_DATE, CURRENT_DATE + INTERVAL '60 days', true),
('Free Blood Pressure Monitor', 'Complimentary BP monitoring device', 750, 'free_product', 350.00, 75, CURRENT_DATE, CURRENT_DATE + INTERVAL '120 days', true)
ON CONFLICT DO NOTHING;

-- Insert sample marketing campaigns
INSERT INTO marketing_campaigns (name, campaign_type, subject, message, target_audience, status, sent_count, opened_count, click_count, scheduled_date, sent_date)
VALUES 
('Summer Health Campaign', 'email', 'Stay Healthy This Summer!', 'Get 20% off on all vitamins and supplements this summer season.', 'all', 'completed', 250, 180, 95, CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP - INTERVAL '2 days'),
('New Medicine Launch', 'sms', NULL, 'New advanced pain relief medication now available at our pharmacy!', 'gold', 'completed', 120, 95, 48, CURRENT_TIMESTAMP - INTERVAL '10 days', CURRENT_TIMESTAMP - INTERVAL '7 days'),
('Prescription Reminder', 'push', NULL, 'Don''t forget to refill your prescriptions! Visit us today.', 'all', 'scheduled', 0, 0, 0, CURRENT_TIMESTAMP + INTERVAL '3 days', NULL),
('Flu Season Alert', 'email', 'Protect Yourself This Flu Season', 'Get your flu shots and stock up on essential medications.', 'all', 'active', 180, 120, 60, CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP - INTERVAL '1 day')
ON CONFLICT DO NOTHING;

COMMENT ON TABLE customers IS 'Enhanced customer management with loyalty program support';
COMMENT ON TABLE customer_loyalty_points IS 'Customer loyalty points transaction history';
COMMENT ON TABLE loyalty_rewards IS 'Catalog of available rewards for loyalty program';
COMMENT ON TABLE reward_redemptions IS 'History of customer reward redemptions';
COMMENT ON TABLE marketing_campaigns IS 'Marketing campaign management';
COMMENT ON TABLE campaign_recipients IS 'Campaign recipient tracking and analytics';
COMMENT ON TABLE customer_segments IS 'Customer segmentation for targeted marketing';

