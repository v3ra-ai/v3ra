-- =====================================================
-- PHASE 3: CRITICAL TABLES RLS IMPLEMENTATION
-- Tables: User, UserCredit, PaymentLog
-- 
-- CRITICAL: This migration protects financial data
-- Test thoroughly in staging before production
-- =====================================================

BEGIN;

-- Log the start of migration
INSERT INTO security.audit_log (table_name, operation, metadata)
VALUES ('migration', 'phase3_start', jsonb_build_object('timestamp', now()));

-- =====================================================
-- 1. ENABLE RLS ON CRITICAL TABLES
-- =====================================================
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserCredit" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PaymentLog" ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. USER TABLE POLICIES
-- =====================================================

-- Users can view their own data
CREATE POLICY "user_select_own" ON "User"
  FOR SELECT
  USING (auth.uid()::text = id::text);

-- Users can update their own data EXCEPT freeCredits
CREATE POLICY "user_update_non_credits" ON "User"
  FOR UPDATE
  USING (auth.uid()::text = id::text)
  WITH CHECK (
    auth.uid()::text = id::text AND
    -- CRITICAL: Prevent direct freeCredits updates
    (NEW.freeCredits = OLD.freeCredits OR NEW.freeCredits IS NULL)
  );

-- Users can insert their own record (for registration)
CREATE POLICY "user_insert_self" ON "User"
  FOR INSERT
  WITH CHECK (auth.uid()::text = id::text);

-- Service role bypass for all operations
CREATE POLICY "user_service_role" ON "User"
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- 3. USERCREDIT TABLE POLICIES
-- =====================================================

-- Users can view their own credit balance
CREATE POLICY "usercredit_select_own" ON "UserCredit"
  FOR SELECT
  USING (
    auth.uid()::text = userId::text OR
    auth.jwt()->>'role' = 'service_role'
  );

-- CRITICAL: Only service role can modify credits
CREATE POLICY "usercredit_service_role_only" ON "UserCredit"
  FOR INSERT
  USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "usercredit_update_service_role" ON "UserCredit"
  FOR UPDATE
  USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "usercredit_delete_service_role" ON "UserCredit"
  FOR DELETE
  USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- 4. PAYMENTLOG TABLE POLICIES
-- =====================================================

-- Users can view their own payment history
CREATE POLICY "paymentlog_select_own" ON "PaymentLog"
  FOR SELECT
  USING (
    walletPublicKey IN (
      SELECT walletPublicKey FROM "UserCredit" 
      WHERE userId::text = auth.uid()::text
    )
  );

-- Only service role can create payment logs
CREATE POLICY "paymentlog_insert_service_role" ON "PaymentLog"
  FOR INSERT
  USING (auth.jwt()->>'role' = 'service_role');

-- Service role can do everything
CREATE POLICY "paymentlog_service_role_all" ON "PaymentLog"
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- 5. PERFORMANCE INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_user_id ON "User"(id);
CREATE INDEX IF NOT EXISTS idx_user_freecredits ON "User"(freeCredits);
CREATE INDEX IF NOT EXISTS idx_usercredit_userid ON "UserCredit"(userId);
CREATE INDEX IF NOT EXISTS idx_usercredit_wallet ON "UserCredit"(walletPublicKey);
CREATE INDEX IF NOT EXISTS idx_paymentlog_wallet ON "PaymentLog"(walletPublicKey);
CREATE INDEX IF NOT EXISTS idx_paymentlog_created ON "PaymentLog"(createdAt);

-- =====================================================
-- 6. MONITORING FUNCTION FOR CRITICAL TABLES
-- =====================================================
CREATE OR REPLACE FUNCTION security.monitor_critical_tables()
RETURNS TABLE (
  table_name text,
  rls_enabled boolean,
  policy_count bigint,
  has_service_bypass boolean,
  has_credit_protection boolean
) AS $$
BEGIN
  RETURN QUERY
  WITH table_status AS (
    SELECT 
      t.tablename,
      t.rowsecurity,
      COUNT(p.policyname) as policies
    FROM pg_tables t
    LEFT JOIN pg_policies p ON t.tablename = p.tablename
    WHERE t.schemaname = 'public'
      AND t.tablename IN ('User', 'UserCredit', 'PaymentLog')
    GROUP BY t.tablename, t.rowsecurity
  ),
  service_check AS (
    SELECT 
      tablename,
      bool_or(qual LIKE '%service_role%') as has_service
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('User', 'UserCredit', 'PaymentLog')
    GROUP BY tablename
  ),
  credit_check AS (
    SELECT 
      bool_or(
        tablename = 'User' AND 
        with_check LIKE '%freeCredits%'
      ) as has_protection
    FROM pg_policies
    WHERE schemaname = 'public'
  )
  SELECT 
    ts.tablename::text,
    ts.rowsecurity,
    ts.policies,
    COALESCE(sc.has_service, false),
    COALESCE(cc.has_protection, false)
  FROM table_status ts
  LEFT JOIN service_check sc ON ts.tablename = sc.tablename
  CROSS JOIN credit_check cc;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. VALIDATION
-- =====================================================
DO $$
DECLARE
  v_table record;
  v_critical_tables text[] := ARRAY['User', 'UserCredit', 'PaymentLog'];
BEGIN
  -- Check each critical table
  FOR v_table IN 
    SELECT tablename, rowsecurity 
    FROM pg_tables 
    WHERE schemaname = 'public' 
      AND tablename = ANY(v_critical_tables)
  LOOP
    IF NOT v_table.rowsecurity THEN
      RAISE EXCEPTION 'RLS not enabled on critical table: %', v_table.tablename;
    END IF;
  END LOOP;
  
  -- Verify credit protection
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'User'
      AND with_check LIKE '%freeCredits%'
  ) THEN
    RAISE WARNING 'Credit protection policy might not be properly configured';
  END IF;
  
  -- Log success
  INSERT INTO security.audit_log (table_name, operation, metadata)
  VALUES ('migration', 'phase3_complete', jsonb_build_object(
    'tables_protected', v_critical_tables,
    'timestamp', now()
  ));
END $$;

COMMIT;

-- =====================================================
-- EMERGENCY ROLLBACK SCRIPT
-- Save this separately and test before deployment!
-- =====================================================
/*
BEGIN;

-- Disable RLS on critical tables
ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "UserCredit" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "PaymentLog" DISABLE ROW LEVEL SECURITY;

-- Drop all policies
DROP POLICY IF EXISTS "user_select_own" ON "User";
DROP POLICY IF EXISTS "user_update_non_credits" ON "User";
DROP POLICY IF EXISTS "user_insert_self" ON "User";
DROP POLICY IF EXISTS "user_service_role" ON "User";
DROP POLICY IF EXISTS "usercredit_select_own" ON "UserCredit";
DROP POLICY IF EXISTS "usercredit_service_role_only" ON "UserCredit";
DROP POLICY IF EXISTS "usercredit_update_service_role" ON "UserCredit";
DROP POLICY IF EXISTS "usercredit_delete_service_role" ON "UserCredit";
DROP POLICY IF EXISTS "paymentlog_select_own" ON "PaymentLog";
DROP POLICY IF EXISTS "paymentlog_insert_service_role" ON "PaymentLog";
DROP POLICY IF EXISTS "paymentlog_service_role_all" ON "PaymentLog";

-- Log rollback
INSERT INTO security.audit_log (table_name, operation, metadata)
VALUES ('migration', 'phase3_rollback', jsonb_build_object('timestamp', now()));

COMMIT;
*/
