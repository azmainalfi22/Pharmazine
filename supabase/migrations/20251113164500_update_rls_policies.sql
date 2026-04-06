-- Drop permissive allow_all_access policies added during initial RLS enablement
DO $$
DECLARE
  rec record;
BEGIN
  FOR rec IN
    SELECT schemaname, tablename
    FROM pg_policies
    WHERE policyname = 'allow_all_access' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY "allow_all_access" ON %I.%I;', rec.schemaname, rec.tablename);
  END LOOP;
END;
$$;

-- Profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'));

-- User roles
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles"
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'))
  WITH CHECK (public.has_role((SELECT auth.uid()), 'admin'));

-- Categories
DROP POLICY IF EXISTS "Authenticated users can view categories" ON public.categories;
DROP POLICY IF EXISTS "Admin and managers can manage categories" ON public.categories;

CREATE POLICY "Authenticated users can view categories"
  ON public.categories
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin and managers can insert categories"
  ON public.categories
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_or_manager((SELECT auth.uid())));

CREATE POLICY "Admin and managers can update categories"
  ON public.categories
  FOR UPDATE
  TO authenticated
  USING (public.is_admin_or_manager((SELECT auth.uid())))
  WITH CHECK (public.is_admin_or_manager((SELECT auth.uid())));

CREATE POLICY "Admin and managers can delete categories"
  ON public.categories
  FOR DELETE
  TO authenticated
  USING (public.is_admin_or_manager((SELECT auth.uid())));

-- Suppliers
DROP POLICY IF EXISTS "Authenticated users can view suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Admin and managers can manage suppliers" ON public.suppliers;

CREATE POLICY "Authenticated users can view suppliers"
  ON public.suppliers
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin and managers can insert suppliers"
  ON public.suppliers
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_or_manager((SELECT auth.uid())));

CREATE POLICY "Admin and managers can update suppliers"
  ON public.suppliers
  FOR UPDATE
  TO authenticated
  USING (public.is_admin_or_manager((SELECT auth.uid())))
  WITH CHECK (public.is_admin_or_manager((SELECT auth.uid())));

CREATE POLICY "Admin and managers can delete suppliers"
  ON public.suppliers
  FOR DELETE
  TO authenticated
  USING (public.is_admin_or_manager((SELECT auth.uid())));

-- Products
DROP POLICY IF EXISTS "Authenticated users can view products" ON public.products;
DROP POLICY IF EXISTS "Admin and managers can manage products" ON public.products;

CREATE POLICY "Authenticated users can view products"
  ON public.products
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin and managers can insert products"
  ON public.products
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_or_manager((SELECT auth.uid())));

CREATE POLICY "Admin and managers can update products"
  ON public.products
  FOR UPDATE
  TO authenticated
  USING (public.is_admin_or_manager((SELECT auth.uid())))
  WITH CHECK (public.is_admin_or_manager((SELECT auth.uid())));

CREATE POLICY "Admin and managers can delete products"
  ON public.products
  FOR DELETE
  TO authenticated
  USING (public.is_admin_or_manager((SELECT auth.uid())));

-- Stock transactions
DROP POLICY IF EXISTS "Authenticated users can view stock transactions" ON public.stock_transactions;
DROP POLICY IF EXISTS "Admin and managers can create stock transactions" ON public.stock_transactions;

CREATE POLICY "Authenticated users can view stock transactions"
  ON public.stock_transactions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin and managers can create stock transactions"
  ON public.stock_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_or_manager((SELECT auth.uid())));

-- Sales
DROP POLICY IF EXISTS "Authenticated users can view sales" ON public.sales;
DROP POLICY IF EXISTS "Authenticated users can create sales" ON public.sales;
DROP POLICY IF EXISTS "Admin and managers can update sales" ON public.sales;

CREATE POLICY "Authenticated users can view sales"
  ON public.sales
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create sales"
  ON public.sales
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Admin and managers can update sales"
  ON public.sales
  FOR UPDATE
  TO authenticated
  USING (public.is_admin_or_manager((SELECT auth.uid())))
  WITH CHECK (public.is_admin_or_manager((SELECT auth.uid())));

-- Sales items
DROP POLICY IF EXISTS "Authenticated users can view sales items" ON public.sales_items;
DROP POLICY IF EXISTS "Authenticated users can create sales items" ON public.sales_items;

CREATE POLICY "Authenticated users can view sales items"
  ON public.sales_items
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create sales items"
  ON public.sales_items
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

-- Subcategories
DROP POLICY IF EXISTS "Authenticated users can view subcategories" ON public.subcategories;
DROP POLICY IF EXISTS "Admin and managers can manage subcategories" ON public.subcategories;

CREATE POLICY "Authenticated users can view subcategories"
  ON public.subcategories
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin and managers can insert subcategories"
  ON public.subcategories
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_or_manager((SELECT auth.uid())));

CREATE POLICY "Admin and managers can update subcategories"
  ON public.subcategories
  FOR UPDATE
  TO authenticated
  USING (public.is_admin_or_manager((SELECT auth.uid())))
  WITH CHECK (public.is_admin_or_manager((SELECT auth.uid())));

CREATE POLICY "Admin and managers can delete subcategories"
  ON public.subcategories
  FOR DELETE
  TO authenticated
  USING (public.is_admin_or_manager((SELECT auth.uid())));

-- Countries
DROP POLICY IF EXISTS "Authenticated users can view countries" ON public.countries;
DROP POLICY IF EXISTS "Admin and managers can manage countries" ON public.countries;

CREATE POLICY "Authenticated users can view countries"
  ON public.countries
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin and managers can insert countries"
  ON public.countries
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_or_manager((SELECT auth.uid())));

CREATE POLICY "Admin and managers can update countries"
  ON public.countries
  FOR UPDATE
  TO authenticated
  USING (public.is_admin_or_manager((SELECT auth.uid())))
  WITH CHECK (public.is_admin_or_manager((SELECT auth.uid())));

CREATE POLICY "Admin and managers can delete countries"
  ON public.countries
  FOR DELETE
  TO authenticated
  USING (public.is_admin_or_manager((SELECT auth.uid())));

-- Customers
DROP POLICY IF EXISTS "Authenticated users can view customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can create customers" ON public.customers;
DROP POLICY IF EXISTS "Admin and managers can manage customers" ON public.customers;

CREATE POLICY "Authenticated users can view customers"
  ON public.customers
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create customers"
  ON public.customers
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Admin and managers can update customers"
  ON public.customers
  FOR UPDATE
  TO authenticated
  USING (public.is_admin_or_manager((SELECT auth.uid())))
  WITH CHECK (public.is_admin_or_manager((SELECT auth.uid())));

CREATE POLICY "Admin and managers can delete customers"
  ON public.customers
  FOR DELETE
  TO authenticated
  USING (public.is_admin_or_manager((SELECT auth.uid())));
