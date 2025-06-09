-- ============================================================================
-- RLS PHASE 2: LOW RISK TABLES
-- ============================================================================
-- This migration enables RLS on low-risk tables first to test the implementation
-- Tables: Feedback, Thread, Reply, GraphEdge
-- ============================================================================

-- ============================================================================
-- STEP 1: PRE-CHECKS
-- ============================================================================

-- Verify Phase 1 is complete
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'security') THEN
    RAISE EXCEPTION 'Phase 1 not complete: security schema missing. Run Phase 1 migration first.';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p 
    JOIN pg_namespace n ON p.pronamespace = n.oid 
    WHERE n.nspname = 'security' AND p.proname = 'decrement_free_credits'
  ) THEN
    RAISE EXCEPTION 'Phase 1 not complete: security functions missing. Run Phase 1 migration first.';
  END IF;
END $$;

-- ============================================================================
-- STEP 2: CREATE HELPER FUNCTION FOR CURRENT USER CHECK
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_owner(user_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid()::TEXT = user_id;
$$;

-- ============================================================================
-- STEP 3: ENABLE RLS ON FEEDBACK TABLE
-- ============================================================================

-- Enable RLS
ALTER TABLE "Feedback" ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own feedback
CREATE POLICY "Users can view own feedback" 
ON "Feedback" 
FOR SELECT 
USING (public.is_owner("userId"));

-- Policy: Users can create feedback
CREATE POLICY "Users can create feedback" 
ON "Feedback" 
FOR INSERT 
WITH CHECK (public.is_owner("userId"));

-- Policy: Users can update their own feedback
CREATE POLICY "Users can update own feedback" 
ON "Feedback" 
FOR UPDATE 
USING (public.is_owner("userId"))
WITH CHECK (public.is_owner("userId"));

-- Policy: Service role bypass
CREATE POLICY "Service role has full access to feedback" 
ON "Feedback" 
USING (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- STEP 4: ENABLE RLS ON THREAD TABLE
-- ============================================================================

-- Enable RLS
ALTER TABLE "Thread" ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own threads
CREATE POLICY "Users can view own threads" 
ON "Thread" 
FOR SELECT 
USING (public.is_owner("userId"));

-- Policy: Users can create threads
CREATE POLICY "Users can create threads" 
ON "Thread" 
FOR INSERT 
WITH CHECK (public.is_owner("userId"));

-- Policy: Users can update their own threads
CREATE POLICY "Users can update own threads" 
ON "Thread" 
FOR UPDATE 
USING (public.is_owner("userId"))
WITH CHECK (public.is_owner("userId"));

-- Policy: Users can delete their own threads
CREATE POLICY "Users can delete own threads" 
ON "Thread" 
FOR DELETE 
USING (public.is_owner("userId"));

-- Policy: Service role bypass
CREATE POLICY "Service role has full access to threads" 
ON "Thread" 
USING (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- STEP 5: ENABLE RLS ON REPLY TABLE
-- ============================================================================

-- Enable RLS
ALTER TABLE "Reply" ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view replies in their threads
CREATE POLICY "Users can view replies in own threads" 
ON "Reply" 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM "Thread" 
    WHERE "Thread".id = "Reply"."threadId" 
    AND public.is_owner("Thread"."userId")
  )
);

-- Policy: Users can create replies
CREATE POLICY "Users can create replies" 
ON "Reply" 
FOR INSERT 
WITH CHECK (public.is_owner("userId"));

-- Policy: Users can update their own replies
CREATE POLICY "Users can update own replies" 
ON "Reply" 
FOR UPDATE 
USING (public.is_owner("userId"))
WITH CHECK (public.is_owner("userId"));

-- Policy: Users can delete their own replies
CREATE POLICY "Users can delete own replies" 
ON "Reply" 
FOR DELETE 
USING (public.is_owner("userId"));

-- Policy: Service role bypass
CREATE POLICY "Service role has full access to replies" 
ON "Reply" 
USING (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- STEP 6: ENABLE RLS ON GRAPHEDGE TABLE
-- ============================================================================

-- Enable RLS
ALTER TABLE "GraphEdge" ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can read graph edges (public data)
CREATE POLICY "Authenticated users can view graph edges" 
ON "GraphEdge" 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Policy: Only service role can modify graph edges
CREATE POLICY "Service role can manage graph edges" 
ON "GraphEdge" 
USING (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- STEP 7: CREATE MONITORING FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION security.check_phase2_rls_status()
RETURNS TABLE (
  table_name TEXT,
  rls_enabled BOOLEAN,
  policy_count INTEGER,
  test_status TEXT
)
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  RETURN QUERY
  WITH rls_check AS (
    SELECT 
      t.tablename::TEXT,
      t.rowsecurity,
      (SELECT COUNT(*)::INTEGER FROM pg_policies p WHERE p.tablename = t.tablename) as policies
    FROM pg_tables t
    WHERE t.schemaname = 'public'
      AND t.tablename IN ('Feedback', 'Thread', 'Reply', 'GraphEdge')
  )
  SELECT 
    rc.tablename,
    rc.rowsecurity,
    rc.policies,
    CASE 
      WHEN NOT rc.rowsecurity THEN '❌ RLS NOT ENABLED'
      WHEN rc.policies = 0 THEN '⚠️ RLS ENABLED BUT NO POLICIES'
      WHEN rc.policies < 2 THEN '⚠️ MISSING POLICIES'
      ELSE '✅ OK'
    END as test_status
  FROM rls_check rc
  ORDER BY rc.tablename;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 8: LOG PHASE 2 COMPLETION
-- ============================================================================

INSERT INTO security.audit_log (
  table_name, 
  operation, 
  metadata
) VALUES (
  'MIGRATION', 
  'phase2_complete', 
  jsonb_build_object(
    'phase', 'Phase 2 - Low Risk Tables',
    'tables_enabled', ARRAY['Feedback', 'Thread', 'Reply', 'GraphEdge'],
    'timestamp', NOW(),
    'migration_file', '20240102000001_rls_phase2_low_risk_tables.sql'
  )
);

-- ============================================================================
-- STEP 9: VALIDATION
-- ============================================================================

DO $$
DECLARE
  v_result RECORD;
  v_failed BOOLEAN := false;
BEGIN
  -- Check each table
  FOR v_result IN SELECT * FROM security.check_phase2_rls_status() LOOP
    IF v_result.test_status != '✅ OK' THEN
      RAISE WARNING 'Table % status: %', v_result.table_name, v_result.test_status;
      v_failed := true;
    END IF;
  END LOOP;
  
  IF v_failed THEN
    RAISE EXCEPTION 'Phase 2 validation failed. Check warnings above.';
  END IF;
  
  RAISE NOTICE 'Phase 2 validation passed ✅';
END $$;

-- ============================================================================
-- ROLLBACK SCRIPT (Save this separately)
-- ============================================================================
COMMENT ON FUNCTION security.check_phase2_rls_status() IS '
ROLLBACK Phase 2:
  -- Disable RLS on all Phase 2 tables
  ALTER TABLE "Feedback" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "Thread" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "Reply" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "GraphEdge" DISABLE ROW LEVEL SECURITY;
  
  -- Drop all policies
  DROP POLICY IF EXISTS "Users can view own feedback" ON "Feedback";
  DROP POLICY IF EXISTS "Users can create feedback" ON "Feedback";
  DROP POLICY IF EXISTS "Users can update own feedback" ON "Feedback";
  DROP POLICY IF EXISTS "Service role has full access to feedback" ON "Feedback";
  
  DROP POLICY IF EXISTS "Users can view own threads" ON "Thread";
  DROP POLICY IF EXISTS "Users can create threads" ON "Thread";
  DROP POLICY IF EXISTS "Users can update own threads" ON "Thread";
  DROP POLICY IF EXISTS "Users can delete own threads" ON "Thread";
  DROP POLICY IF EXISTS "Service role has full access to threads" ON "Thread";
  
  DROP POLICY IF EXISTS "Users can view replies in own threads" ON "Reply";
  DROP POLICY IF EXISTS "Users can create replies" ON "Reply";
  DROP POLICY IF EXISTS "Users can update own replies" ON "Reply";
  DROP POLICY IF EXISTS "Users can delete own replies" ON "Reply";
  DROP POLICY IF EXISTS "Service role has full access to replies" ON "Reply";
  
  DROP POLICY IF EXISTS "Authenticated users can view graph edges" ON "GraphEdge";
  DROP POLICY IF EXISTS "Service role can manage graph edges" ON "GraphEdge";
  
  -- Drop helper function
  DROP FUNCTION IF EXISTS public.is_owner(TEXT);
  DROP FUNCTION IF EXISTS security.check_phase2_rls_status();
';
