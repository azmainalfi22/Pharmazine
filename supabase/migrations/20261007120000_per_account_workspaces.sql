-- ============================================================================
-- Per-account workspaces (multi-tenancy)
--
-- Every business table gets a tenant_id column. The API connects as
-- `postgres` (which bypasses RLS), so for each request it switches to the
-- `pharmazine_app` role and sets `app.tenant_id` for the transaction:
--
--     SET LOCAL ROLE pharmazine_app;
--     SELECT set_config('app.tenant_id', '<workspace uuid>', true);
--
-- Restrictive RLS policies on pharmazine_app then limit every read and write
-- to that workspace, including raw SQL and views.
--
-- Backwards compatible: connections that do not switch role (the previous
-- backend version, schedulers) keep working and write into the original
-- workspace, so this can be applied before or after deploying the backend.
--
-- Existing data and existing accounts -> "Original workspace".
-- New sign-ups -> their own empty workspace (created by the API on first
-- login/registration via pharmazine_create_workspace()).
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.tenants (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       TEXT NOT NULL,
    owner_id   UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.tenants (id, name)
VALUES ('00000000-0000-0000-0000-000000000001', 'Original workspace')
ON CONFLICT (id) DO NOTHING;

-- Workspace of the current transaction, or NULL when none is set.
CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
    SELECT nullif(current_setting('app.tenant_id', true), '')::uuid
$$;

-- ---------------------------------------------------------------------------
-- Application role (no BYPASSRLS); the connecting role may SET ROLE to it.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'pharmazine_app') THEN
        CREATE ROLE pharmazine_app NOLOGIN NOBYPASSRLS;
    END IF;
    EXECUTE format('GRANT pharmazine_app TO %I', current_user);
END
$$;

GRANT USAGE ON SCHEMA public TO pharmazine_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO pharmazine_app;
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO pharmazine_app;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO pharmazine_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO pharmazine_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO pharmazine_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO pharmazine_app;

-- A workspace can read only its own tenants row.
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS pharmazine_tenant_self ON public.tenants;
CREATE POLICY pharmazine_tenant_self ON public.tenants
    FOR SELECT TO pharmazine_app
    USING (id = public.current_tenant_id());

-- ---------------------------------------------------------------------------
-- Make one table workspace-scoped. Idempotent; the API also calls
-- pharmazine_tenantize_all(true) at startup so tables it creates at runtime
-- (e.g. vouchers) are covered too.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.pharmazine_tenantize(tbl regclass)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    tname text := (SELECT relname FROM pg_class WHERE oid = tbl);
    has_nulls boolean;
BEGIN
    IF tname = 'tenants' THEN
        RETURN;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_attribute
                   WHERE attrelid = tbl AND attname = 'tenant_id' AND NOT attisdropped) THEN
        -- A constant default fills existing rows without rewriting or updating
        -- them (Postgres 11+): existing data and accounts -> Original workspace.
        EXECUTE format('ALTER TABLE %s ADD COLUMN tenant_id UUID '
                       'DEFAULT ''00000000-0000-0000-0000-000000000001''', tbl);
    ELSIF tname <> 'profiles' THEN
        EXECUTE format('SELECT EXISTS (SELECT 1 FROM %s WHERE tenant_id IS NULL)', tbl) INTO has_nulls;
        IF has_nulls THEN
            EXECUTE format(
                'UPDATE %s SET tenant_id = ''00000000-0000-0000-0000-000000000001'' WHERE tenant_id IS NULL', tbl);
        END IF;
    END IF;

    IF tname = 'profiles' THEN
        -- NULL = account without a workspace yet (e.g. a profile created by the
        -- auth.users trigger at sign-up); the API assigns a new one.
        EXECUTE format('ALTER TABLE %s ALTER COLUMN tenant_id SET DEFAULT public.current_tenant_id()', tbl);
    ELSE
        EXECUTE format(
            'ALTER TABLE %s ALTER COLUMN tenant_id SET DEFAULT '
            'coalesce(public.current_tenant_id(), ''00000000-0000-0000-0000-000000000001''::uuid)', tbl);
    END IF;

    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %s (tenant_id)', 'ix_' || tname || '_tenant_id', tbl);
    EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON %s TO pharmazine_app', tbl);

    -- Existing policies include some granted TO public; the restrictive policy
    -- is ANDed with all of them, so pharmazine_app can never escape it.
    EXECUTE format('DROP POLICY IF EXISTS pharmazine_app_access ON %s', tbl);
    EXECUTE format('CREATE POLICY pharmazine_app_access ON %s AS PERMISSIVE FOR ALL TO pharmazine_app '
                   'USING (true) WITH CHECK (true)', tbl);
    EXECUTE format('DROP POLICY IF EXISTS pharmazine_tenant_isolation ON %s', tbl);
    EXECUTE format('CREATE POLICY pharmazine_tenant_isolation ON %s AS RESTRICTIVE FOR ALL TO pharmazine_app '
                   'USING (tenant_id = public.current_tenant_id()) '
                   'WITH CHECK (tenant_id = public.current_tenant_id())', tbl);
END
$$;

-- only_missing = true skips tables that already have tenant_id (cheap; used
-- by the API at startup).
CREATE OR REPLACE FUNCTION public.pharmazine_tenantize_all(only_missing boolean DEFAULT false)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    r record;
BEGIN
    FOR r IN
        SELECT c.oid::regclass AS tbl
        FROM pg_class c
        WHERE c.relnamespace = 'public'::regnamespace
          AND c.relkind IN ('r', 'p')
          AND c.relname <> 'tenants'
          AND NOT (only_missing AND EXISTS (
              SELECT 1 FROM pg_attribute a
              WHERE a.attrelid = c.oid AND a.attname = 'tenant_id' AND NOT a.attisdropped))
    LOOP
        PERFORM public.pharmazine_tenantize(r.tbl);
    END LOOP;

    -- Views must evaluate RLS as the querying role, not the view owner.
    FOR r IN
        SELECT c.oid::regclass AS v
        FROM pg_class c
        WHERE c.relnamespace = 'public'::regnamespace AND c.relkind = 'v'
    LOOP
        EXECUTE format('ALTER VIEW %s SET (security_invoker = true)', r.v);
        EXECUTE format('GRANT SELECT ON %s TO pharmazine_app', r.v);
    END LOOP;
END
$$;

SELECT public.pharmazine_tenantize_all();

-- Existing accounts keep access to the existing data.
UPDATE public.profiles
SET tenant_id = '00000000-0000-0000-0000-000000000001'
WHERE tenant_id IS NULL;

-- ---------------------------------------------------------------------------
-- Uniqueness is per workspace (two pharmacies may both have SKU "PARA-500").
-- ---------------------------------------------------------------------------
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
        EXECUTE format('CREATE UNIQUE INDEX IF NOT EXISTS %I ON public.%I (tenant_id, %s)',
                       'ux_' || spec.tbl || '_tenant_' || array_to_string(spec.cols, '_'),
                       spec.tbl,
                       (SELECT string_agg(quote_ident(x), ', ') FROM unnest(spec.cols) x));
    END LOOP;

    IF to_regclass('public.ix_branches_code') IS NOT NULL THEN
        DROP INDEX public.ix_branches_code;
    END IF;
    IF to_regclass('public.branches') IS NOT NULL THEN
        CREATE UNIQUE INDEX IF NOT EXISTS ux_branches_tenant_code ON public.branches (tenant_id, code);
    END IF;
END
$$;

-- ---------------------------------------------------------------------------
-- Create a fresh workspace for an account, seeded with the standard lookup
-- lists, and make the account its admin. Called by the API (as postgres).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.pharmazine_create_workspace(p_user_id UUID, p_name TEXT)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    t UUID;
BEGIN
    SELECT tenant_id INTO t FROM public.profiles WHERE id = p_user_id;
    IF t IS NOT NULL THEN
        RETURN t;
    END IF;

    INSERT INTO public.tenants (name, owner_id)
    VALUES (coalesce(nullif(p_name, ''), 'My pharmacy'), p_user_id)
    RETURNING id INTO t;

    UPDATE public.profiles SET tenant_id = t, role = 'admin' WHERE id = p_user_id;
    DELETE FROM public.user_roles WHERE user_id = p_user_id;
    INSERT INTO public.user_roles (user_id, role, tenant_id) VALUES (p_user_id, 'admin', t);

    INSERT INTO public.medicine_categories (name, description, display_order, tenant_id)
    SELECT v.*, t FROM (VALUES
        ('Tablet', 'Solid dosage form - Tablets', 1),
        ('Capsule', 'Capsule form medications', 2),
        ('Syrup', 'Liquid oral medications', 3),
        ('Injection', 'Injectable medications', 4),
        ('Suspension', 'Liquid suspension medications', 5),
        ('Ointment', 'Topical ointments and creams', 6),
        ('Drops', 'Eye/Ear/Nasal drops', 7),
        ('Powder', 'Powder form medications', 8),
        ('Inhaler', 'Inhalation medications', 9),
        ('Suppository', 'Rectal/Vaginal suppositories', 10),
        ('Gel', 'Topical gels', 11),
        ('Lotion', 'Topical lotions', 12),
        ('Spray', 'Spray medications', 13),
        ('Solution', 'Solution form', 14),
        ('Other', 'Other forms', 99)
    ) AS v(name, description, display_order);

    INSERT INTO public.unit_types (name, abbreviation, category, display_order, tenant_id)
    SELECT v.*, t FROM (VALUES
        ('Milligram', 'mg', 'weight', 1),
        ('Gram', 'g', 'weight', 2),
        ('Kilogram', 'kg', 'weight', 3),
        ('Milliliter', 'ml', 'volume', 4),
        ('Liter', 'l', 'volume', 5),
        ('Piece', 'pc', 'quantity', 6),
        ('Strip', 'strip', 'quantity', 7),
        ('Box', 'box', 'quantity', 8),
        ('Bottle', 'btl', 'quantity', 9),
        ('Tube', 'tube', 'quantity', 10),
        ('Vial', 'vial', 'quantity', 11),
        ('Ampoule', 'amp', 'quantity', 12),
        ('Sachet', 'sachet', 'quantity', 13),
        ('Packet', 'pkt', 'quantity', 14),
        ('Roll', 'roll', 'quantity', 15)
    ) AS v(name, abbreviation, category, display_order);

    INSERT INTO public.medicine_types (name, description, display_order, tenant_id)
    SELECT v.*, t FROM (VALUES
        ('Painkiller', 'Analgesics and pain relief', 1),
        ('Antibiotic', 'Antibacterial medications', 2),
        ('Antiviral', 'Antiviral medications', 3),
        ('Antifungal', 'Antifungal medications', 4),
        ('Heart Disease', 'Cardiovascular medications', 5),
        ('Diabetes', 'Antidiabetic medications', 6),
        ('Blood Pressure', 'Antihypertensive medications', 7),
        ('Fever & Cold', 'Antipyretic and cold medications', 8),
        ('Allergy', 'Antihistamine and antiallergic', 9),
        ('Vitamin & Supplement', 'Vitamins and nutritional supplements', 10),
        ('Antacid', 'Digestive and antacid medications', 11),
        ('Antiemetic', 'Anti-nausea medications', 12),
        ('Laxative', 'Laxatives and constipation relief', 13),
        ('Antidiarrheal', 'Diarrhea medications', 14),
        ('Cough & Asthma', 'Respiratory medications', 15),
        ('Skin Care', 'Dermatological medications', 16),
        ('Eye Care', 'Ophthalmic medications', 17),
        ('Contraceptive', 'Contraceptive medications', 18),
        ('Hormone', 'Hormone replacement therapy', 19),
        ('Mental Health', 'Psychiatric medications', 20),
        ('Anticoagulant', 'Blood thinning medications', 21),
        ('Anesthetic', 'Anesthetic medications', 22),
        ('Other', 'Other medications', 99)
    ) AS v(name, description, display_order);

    INSERT INTO public.expiry_alert_settings (alert_days_before, alert_level, notification_method, tenant_id)
    VALUES (90, 'info', ARRAY['system']::text[], t),
           (60, 'warning', ARRAY['system', 'email']::text[], t),
           (30, 'critical', ARRAY['system', 'email', 'sms']::text[], t);

    RETURN t;
END
$$;

-- Only the API's own connection role may create workspaces.
REVOKE EXECUTE ON FUNCTION public.pharmazine_create_workspace(UUID, TEXT) FROM PUBLIC, pharmazine_app;
REVOKE EXECUTE ON FUNCTION public.pharmazine_tenantize(regclass) FROM PUBLIC, pharmazine_app;
REVOKE EXECUTE ON FUNCTION public.pharmazine_tenantize_all(boolean) FROM PUBLIC, pharmazine_app;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        EXECUTE 'REVOKE EXECUTE ON FUNCTION public.pharmazine_create_workspace(UUID, TEXT) FROM anon, authenticated';
        EXECUTE 'REVOKE EXECUTE ON FUNCTION public.pharmazine_tenantize(regclass) FROM anon, authenticated';
        EXECUTE 'REVOKE EXECUTE ON FUNCTION public.pharmazine_tenantize_all(boolean) FROM anon, authenticated';
    END IF;
END
$$;
