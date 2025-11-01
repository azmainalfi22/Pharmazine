-- Clean up electronics-specific fields from products table
-- Make this a pure pharmacy system

-- ============================================
-- REMOVE ELECTRONICS-SPECIFIC FIELDS
-- ============================================

-- Drop electronics/appliance specific columns from products table
ALTER TABLE IF EXISTS products
    DROP COLUMN IF EXISTS warranty_period,
    DROP COLUMN IF EXISTS power_consumption,
    DROP COLUMN IF EXISTS voltage_rating,
    DROP COLUMN IF EXISTS connectivity,
    DROP COLUMN IF EXISTS compatibility,
    DROP COLUMN IF EXISTS assemble_country,
    DROP COLUMN IF EXISTS serial_number,
    DROP COLUMN IF EXISTS emi_management;

-- Keep useful fields that can apply to pharmacy:
-- - model: Can be used for medical equipment model numbers
-- - weight: Can be used for medicine weight
-- - dimensions: Can be used for packaging dimensions
-- - color: Can be used for medicine color/identification
-- - specifications: Can be used for medicine specifications
-- - features: Can be used for medicine features/benefits
-- - package_contents: Useful for medicine packaging info

-- ============================================
-- ENSURE PHARMACY FIELDS EXIST
-- ============================================

-- Make sure all pharmacy fields from Phase 1 are present
ALTER TABLE IF EXISTS products
    ADD COLUMN IF NOT EXISTS generic_name TEXT,
    ADD COLUMN IF NOT EXISTS brand_name TEXT,
    ADD COLUMN IF NOT EXISTS medicine_category_id UUID,
    ADD COLUMN IF NOT EXISTS medicine_type_id UUID,
    ADD COLUMN IF NOT EXISTS manufacturer_id UUID,
    ADD COLUMN IF NOT EXISTS strength TEXT,
    ADD COLUMN IF NOT EXISTS composition TEXT,
    ADD COLUMN IF NOT EXISTS barcode TEXT,
    ADD COLUMN IF NOT EXISTS qr_code TEXT,
    ADD COLUMN IF NOT EXISTS unit_type_id UUID,
    ADD COLUMN IF NOT EXISTS shelf_life_days INTEGER,
    ADD COLUMN IF NOT EXISTS storage_condition TEXT,
    ADD COLUMN IF NOT EXISTS is_prescription_required BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS is_schedule_drug BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS schedule_category TEXT,
    ADD COLUMN IF NOT EXISTS side_effects TEXT,
    ADD COLUMN IF NOT EXISTS dosage_info TEXT,
    ADD COLUMN IF NOT EXISTS pack_size INTEGER DEFAULT 1,
    ADD COLUMN IF NOT EXISTS strip_size INTEGER DEFAULT 1,
    ADD COLUMN IF NOT EXISTS box_size INTEGER DEFAULT 1,
    ADD COLUMN IF NOT EXISTS vat_percentage NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS cgst_percentage NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS sgst_percentage NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS igst_percentage NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS hsn_code TEXT,
    ADD COLUMN IF NOT EXISTS max_discount_percentage NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS is_narcotic BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS rack_number TEXT,
    ADD COLUMN IF NOT EXISTS shelf_number TEXT;

-- ============================================
-- UPDATE COMMENTS
-- ============================================

COMMENT ON TABLE products IS 'Pharmacy products including medicines, supplements, equipment';
COMMENT ON COLUMN products.model IS 'Model number for medical equipment';
COMMENT ON COLUMN products.weight IS 'Product weight (medicines, equipment)';
COMMENT ON COLUMN products.dimensions IS 'Package dimensions for storage planning';
COMMENT ON COLUMN products.color IS 'Medicine color for identification';
COMMENT ON COLUMN products.specifications IS 'Product specifications and details';
COMMENT ON COLUMN products.features IS 'Product features and benefits';
COMMENT ON COLUMN products.package_contents IS 'Package contents description';

-- ============================================
-- COMPLETION MESSAGE
-- ============================================
DO $$
BEGIN
    RAISE NOTICE 'Electronics cleanup completed!';
    RAISE NOTICE 'Removed: warranty_period, power_consumption, voltage_rating, connectivity, compatibility';
    RAISE NOTICE 'System is now 100%% pharmacy-focused!';
END $$;

