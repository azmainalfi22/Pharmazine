-- ============================================================================
-- Per-account workspaces, part 2: remove the old database-wide unique rules.
--
-- 20261007120000_per_account_workspaces.sql added per-workspace unique indexes
-- (tenant_id, sku) etc. The original constraints below are database-wide, so
-- while they exist two pharmacies cannot share a SKU, category name or code,
-- and a new workspace cannot get the standard medicine categories / unit
-- types (they would clash with the Original workspace's rows).
--
-- Kept separate because it removes constraints; idempotent.
-- ============================================================================
DO $$
DECLARE
    spec record;
    con record;
BEGIN
    FOR spec IN
        SELECT * FROM (VALUES
            ('categories',           ARRAY['name']),
            ('products',             ARRAY['sku']),
            ('products',             ARRAY['barcode']),
            ('countries',            ARRAY['code']),
            ('medicine_categories',  ARRAY['name']),
            ('unit_types',           ARRAY['name']),
            ('medicine_types',       ARRAY['name']),
            ('manufacturers',        ARRAY['code']),
            ('customers',            ARRAY['customer_code']),
            ('prescription_records', ARRAY['prescription_number']),
            ('insurance_claims',     ARRAY['claim_number']),
            ('vouchers',             ARRAY['voucher_no'])
        ) AS s(tbl, cols)
    LOOP
        IF to_regclass('public.' || spec.tbl) IS NULL THEN
            CONTINUE;
        END IF;
        FOR con IN
            SELECT k.conname
            FROM pg_constraint k
            WHERE k.conrelid = ('public.' || spec.tbl)::regclass
              AND k.contype = 'u'
              AND (SELECT array_agg(a.attname::text ORDER BY a.attname)
                   FROM pg_attribute a
                   WHERE a.attrelid = k.conrelid AND a.attnum = ANY (k.conkey))
                  = (SELECT array_agg(x ORDER BY x) FROM unnest(spec.cols) x)
        LOOP
            EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT %I', spec.tbl, con.conname);
        END LOOP;
    END LOOP;
END
$$;

DROP INDEX IF EXISTS public.ix_branches_code;

-- Only present if 20261007130000_create_missing_module_tables.sql ran before
-- the workspaces migration (it then creates database-wide unique indexes).
DROP INDEX IF EXISTS public.ux_employees_employee_code;
DROP INDEX IF EXISTS public.ux_employees_email;
DROP INDEX IF EXISTS public.ux_leave_types_name;
DROP INDEX IF EXISTS public.ux_leave_types_code;
DROP INDEX IF EXISTS public.ux_leave_applications_application_number;
DROP INDEX IF EXISTS public.ux_employee_loans_loan_number;
DROP INDEX IF EXISTS public.ux_salary_components_component_name;
DROP INDEX IF EXISTS public.ux_payroll_payroll_number;
DROP INDEX IF EXISTS public.ux_service_categories_name;
DROP INDEX IF EXISTS public.ux_services_service_code;
DROP INDEX IF EXISTS public.ux_service_bookings_booking_number;
DROP INDEX IF EXISTS public.ux_service_invoices_invoice_number;
DROP INDEX IF EXISTS public.ux_service_packages_package_code;
DROP INDEX IF EXISTS public.ux_reward_redemptions_redemption_code;
DROP INDEX IF EXISTS public.ux_vouchers_voucher_no;
