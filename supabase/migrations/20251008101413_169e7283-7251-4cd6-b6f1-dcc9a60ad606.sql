-- Update transaction_type enum to include all stock movement types
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'sales_return';
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'transfer_in';
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'transfer_out';
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'stock_adjustment_in';
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'stock_adjustment_out';
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'misc_receive';
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'misc_issue';
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'supplier_return';
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'production_out';
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'purchase_return';

-- Add transfer-related columns to stock_transactions if needed
ALTER TABLE stock_transactions 
ADD COLUMN IF NOT EXISTS from_location text,
ADD COLUMN IF NOT EXISTS to_location text,
ADD COLUMN IF NOT EXISTS reason text;