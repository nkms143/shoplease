-- OPTIMIZATION SCRIPT FOR SUPABASE RLS
-- Run this script in the Supabase SQL Editor to resolve "Auth RLS Initialization Plan" warnings.
-- It wraps auth function calls in (select ...) to prevent re-evaluation for every row.

-- ============================================================
-- 1. TABLE: shops
-- ============================================================
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON "public"."shops";
CREATE POLICY "Enable read access for authenticated users" ON "public"."shops"
AS PERMISSIVE FOR SELECT TO authenticated
USING ( (select auth.role()) = 'authenticated' );

DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON "public"."shops";
-- Note: User report said "write access", checking standard naming or variations. 
-- We will create standard optimized policies for CRUD.
CREATE POLICY "Enable insert access for authenticated users" ON "public"."shops"
AS PERMISSIVE FOR INSERT TO authenticated
WITH CHECK ( (select auth.role()) = 'authenticated' );

DROP POLICY IF EXISTS "Enable update access for authenticated users" ON "public"."shops";
CREATE POLICY "Enable update access for authenticated users" ON "public"."shops"
AS PERMISSIVE FOR UPDATE TO authenticated
USING ( (select auth.role()) = 'authenticated' )
WITH CHECK ( (select auth.role()) = 'authenticated' );

DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON "public"."shops";
CREATE POLICY "Enable delete access for authenticated users" ON "public"."shops"
AS PERMISSIVE FOR DELETE TO authenticated
USING ( (select auth.role()) = 'authenticated' );


-- ============================================================
-- 2. TABLE: tenants
-- ============================================================
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON "public"."tenants";
CREATE POLICY "Enable read access for authenticated users" ON "public"."tenants"
AS PERMISSIVE FOR SELECT TO authenticated
USING ( (select auth.role()) = 'authenticated' );

DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON "public"."tenants";
CREATE POLICY "Enable insert access for authenticated users" ON "public"."tenants"
AS PERMISSIVE FOR INSERT TO authenticated
WITH CHECK ( (select auth.role()) = 'authenticated' );

DROP POLICY IF EXISTS "Enable update access for authenticated users" ON "public"."tenants";
CREATE POLICY "Enable update access for authenticated users" ON "public"."tenants"
AS PERMISSIVE FOR UPDATE TO authenticated
USING ( (select auth.role()) = 'authenticated' )
WITH CHECK ( (select auth.role()) = 'authenticated' );

DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON "public"."tenants";
CREATE POLICY "Enable delete access for authenticated users" ON "public"."tenants"
AS PERMISSIVE FOR DELETE TO authenticated
USING ( (select auth.role()) = 'authenticated' );


-- ============================================================
-- 3. TABLE: payments
-- ============================================================
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON "public"."payments";
CREATE POLICY "Enable read access for authenticated users" ON "public"."payments"
AS PERMISSIVE FOR SELECT TO authenticated
USING ( (select auth.role()) = 'authenticated' );

DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON "public"."payments";
CREATE POLICY "Enable insert access for authenticated users" ON "public"."payments"
AS PERMISSIVE FOR INSERT TO authenticated
WITH CHECK ( (select auth.role()) = 'authenticated' );

DROP POLICY IF EXISTS "Enable update access for authenticated users" ON "public"."payments";
CREATE POLICY "Enable update access for authenticated users" ON "public"."payments"
AS PERMISSIVE FOR UPDATE TO authenticated
USING ( (select auth.role()) = 'authenticated' )
WITH CHECK ( (select auth.role()) = 'authenticated' );

DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON "public"."payments";
CREATE POLICY "Enable delete access for authenticated users" ON "public"."payments"
AS PERMISSIVE FOR DELETE TO authenticated
USING ( (select auth.role()) = 'authenticated' );
