-- Ensure all public views run as security invoker
CREATE OR REPLACE FUNCTION public.__set_view_security_invoker()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  rec record;
BEGIN
  FOR rec IN
    SELECT schemaname, viewname
    FROM pg_catalog.pg_views
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER VIEW %I.%I SET (security_invoker = true);', rec.schemaname, rec.viewname);
  END LOOP;
END;
$$;

SELECT public.__set_view_security_invoker();
DROP FUNCTION public.__set_view_security_invoker();

-- Enable RLS on public tables and add a permissive default policy if none exist
CREATE OR REPLACE FUNCTION public.__enable_rls_on_public_tables()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  rec record;
BEGIN
  FOR rec IN
    SELECT n.nspname AS schemaname, c.relname AS tablename
    FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'r' AND n.nspname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY;', rec.schemaname, rec.tablename);

    IF NOT EXISTS (
      SELECT 1
      FROM pg_policies
      WHERE schemaname = rec.schemaname
        AND tablename = rec.tablename
    ) THEN
      EXECUTE format(
        'CREATE POLICY "allow_all_access" ON %I.%I FOR ALL TO public USING (true) WITH CHECK (true);',
        rec.schemaname,
        rec.tablename
      );
    END IF;
  END LOOP;
END;
$$;

SELECT public.__enable_rls_on_public_tables();
DROP FUNCTION public.__enable_rls_on_public_tables();
