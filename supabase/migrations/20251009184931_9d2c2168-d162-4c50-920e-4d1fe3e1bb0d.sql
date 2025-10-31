-- Add EMI management fields to sales table
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS emi_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS emi_months integer,
ADD COLUMN IF NOT EXISTS emi_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS emi_interest_rate numeric DEFAULT 0;

-- Add comment for clarity
COMMENT ON COLUMN public.sales.emi_enabled IS 'Whether EMI payment is enabled for this sale';
COMMENT ON COLUMN public.sales.emi_months IS 'Number of months for EMI payment (3, 6, 12, 24, etc.)';
COMMENT ON COLUMN public.sales.emi_amount IS 'Monthly EMI amount';
COMMENT ON COLUMN public.sales.emi_interest_rate IS 'Interest rate percentage for EMI';