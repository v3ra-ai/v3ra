-- ============================================================================
-- RLS PHASE 1: SECURITY INFRASTRUCTURE SETUP
-- ============================================================================
-- WARNING: This migration sets up the security foundation for RLS
-- It does NOT enable RLS on any tables yet
-- ============================================================================

-- Create security schema for functions and utilities
CREATE SCHEMA IF NOT EXISTS security;

-- Grant usage on security schema to authenticated users
GRANT USAGE ON SCHEMA security TO authenticated;

-- ============================================================================
-- AUDIT LOG TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS security.audit_log (
  id BIGSERIAL PRIMARY KEY,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  user_id UUID,
  old_data JSONB,
  new_data JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for efficient queries
CREATE INDEX idx_audit_log_user_id ON security.audit_log(user_id);
CREATE INDEX idx_audit_log_table_name ON security.audit_log(table_name);
CREATE INDEX idx_audit_log_created_at ON security.audit_log(created_at DESC);

-- Grant insert only to authenticated users (they can add logs but not modify)
GRANT INSERT ON security.audit_log TO authenticated;

-- ============================================================================
-- PERFORMANCE BASELINE TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS security.performance_baseline (
  id SERIAL PRIMARY KEY,
  query_pattern TEXT,
  table_name TEXT,
  avg_execution_ms NUMERIC,
  p95_execution_ms NUMERIC,
  p99_execution_ms NUMERIC,
  sample_count INTEGER,
  captured_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- RLS STATUS MONITORING FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION security.get_rls_status()
RETURNS TABLE (
  schema_name TEXT,
  table_name TEXT,
  rls_enabled BOOLEAN,
  policy_count INTEGER,
  has_service_role_policy BOOLEAN
) 
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.schemaname::TEXT as schema_name,
    t.tablename::TEXT as table_name,
    t.rowsecurity as rls_enabled,
    COALESCE((
      SELECT COUNT(*)::INTEGER 
      FROM pg_policies p 
      WHERE p.schemaname = t.schemaname 
        AND p.tablename = t.tablename
    ), 0) as policy_count,
    EXISTS (
      SELECT 1 
      FROM pg_policies p 
      WHERE p.schemaname = t.schemaname 
        AND p.tablename = t.tablename
        AND p.qual LIKE '%service_role%'
    ) as has_service_role_policy
  FROM pg_tables t
  WHERE t.schemaname = 'public'
  ORDER BY 
    CASE 
      WHEN t.tablename IN ('User', 'UserCredit', 'PaymentLog') THEN 1
      WHEN t.tablename IN ('Validator', 'ValidatorKey', 'VoteSession') THEN 2
      ELSE 3
    END,
    t.tablename;
END;
$$ LANGUAGE plpgsql;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION security.get_rls_status() TO authenticated;

-- ============================================================================
-- SECURE CREDIT OPERATIONS FUNCTIONS
-- ============================================================================

-- Function to safely decrement free credits
CREATE OR REPLACE FUNCTION security.decrement_free_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_reason TEXT DEFAULT NULL
) 
RETURNS JSONB
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_current_credits INTEGER;
  v_new_credits INTEGER;
  v_user_exists BOOLEAN;
BEGIN
  -- Validate inputs
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;

  -- Get current credits with row lock
  SELECT 
    EXISTS(SELECT 1 FROM "User" WHERE id = p_user_id),
    COALESCE(
      (SELECT "freeCredits" FROM "User" WHERE id = p_user_id FOR UPDATE),
      NULL
    )
  INTO v_user_exists, v_current_credits;

  -- Check if user exists
  IF NOT v_user_exists THEN
    RAISE EXCEPTION 'User not found: %', p_user_id;
  END IF;

  -- Check sufficient credits
  IF v_current_credits < p_amount THEN
    RAISE EXCEPTION 'Insufficient credits. Current: %, Requested: %', 
      v_current_credits, p_amount;
  END IF;

  -- Calculate new credits
  v_new_credits := v_current_credits - p_amount;
  
  -- Update credits
  UPDATE "User"
  SET "freeCredits" = v_new_credits
  WHERE id = p_user_id;

  -- Audit log
  INSERT INTO security.audit_log (
    table_name, 
    operation, 
    user_id, 
    old_data, 
    new_data,
    metadata
  ) VALUES (
    'User', 
    'decrement_credits', 
    p_user_id,
    jsonb_build_object('freeCredits', v_current_credits),
    jsonb_build_object('freeCredits', v_new_credits),
    jsonb_build_object(
      'amount', p_amount,
      'reason', p_reason,
      'function', 'security.decrement_free_credits'
    )
  );

  -- Return result
  RETURN jsonb_build_object(
    'success', true,
    'previous_credits', v_current_credits,
    'new_credits', v_new_credits,
    'amount_deducted', p_amount
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Log error
    INSERT INTO security.audit_log (
      table_name, 
      operation, 
      user_id, 
      metadata
    ) VALUES (
      'User', 
      'decrement_credits_error', 
      p_user_id,
      jsonb_build_object(
        'error', SQLERRM,
        'error_detail', SQLSTATE,
        'amount', p_amount,
        'reason', p_reason
      )
    );
    RAISE;
END;
$$ LANGUAGE plpgsql;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION security.decrement_free_credits TO authenticated;

-- Function to reset free credits
CREATE OR REPLACE FUNCTION security.reset_free_credits(
  p_user_id UUID
) 
RETURNS JSONB
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user RECORD;
  v_next_reset TIMESTAMPTZ;
  v_reset_performed BOOLEAN := false;
  v_new_credits INTEGER := 10; -- Default free credits amount
BEGIN
  -- Get user data with lock
  SELECT 
    "freeCredits", 
    "lastResetDate",
    id
  INTO v_user
  FROM "User"
  WHERE id = p_user_id
  FOR UPDATE;

  -- Check if user exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', p_user_id;
  END IF;

  -- Calculate next reset time (24 hours after last reset)
  v_next_reset := v_user."lastResetDate" + INTERVAL '1 day';

  -- Check if reset is due
  IF NOW() >= v_next_reset THEN
    -- Perform reset
    UPDATE "User"
    SET 
      "freeCredits" = v_new_credits,
      "lastResetDate" = NOW()
    WHERE id = p_user_id;

    v_reset_performed := true;

    -- Audit log
    INSERT INTO security.audit_log (
      table_name, 
      operation, 
      user_id, 
      old_data, 
      new_data,
      metadata
    ) VALUES (
      'User', 
      'reset_credits', 
      p_user_id,
      jsonb_build_object(
        'freeCredits', v_user."freeCredits",
        'lastResetDate', v_user."lastResetDate"
      ),
      jsonb_build_object(
        'freeCredits', v_new_credits,
        'lastResetDate', NOW()
      ),
      jsonb_build_object(
        'next_reset_was', v_next_reset,
        'function', 'security.reset_free_credits'
      )
    );
  END IF;

  -- Return result
  RETURN jsonb_build_object(
    'success', true,
    'freeCredits', CASE WHEN v_reset_performed THEN v_new_credits ELSE v_user."freeCredits" END,
    'reset', v_reset_performed,
    'lastResetDate', CASE WHEN v_reset_performed THEN NOW() ELSE v_user."lastResetDate" END,
    'nextResetDate', CASE WHEN v_reset_performed THEN NOW() + INTERVAL '1 day' ELSE v_next_reset END
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Log error
    INSERT INTO security.audit_log (
      table_name, 
      operation, 
      user_id, 
      metadata
    ) VALUES (
      'User', 
      'reset_credits_error', 
      p_user_id,
      jsonb_build_object(
        'error', SQLERRM,
        'error_detail', SQLSTATE
      )
    );
    RAISE;
END;
$$ LANGUAGE plpgsql;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION security.reset_free_credits TO authenticated;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to check if current user has a specific role
CREATE OR REPLACE FUNCTION security.has_role(role_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (auth.jwt()->>'role' = role_name);
END;
$$;

-- Function to get current user ID safely
CREATE OR REPLACE FUNCTION security.current_user_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN auth.uid();
END;
$$;

-- ============================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Ensure indexes exist on user-related columns before RLS is enabled
DO $$
BEGIN
  -- User table indexes
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'User' AND indexname = 'idx_user_id') THEN
    CREATE INDEX idx_user_id ON "User"(id);
  END IF;

  -- UserCredit indexes
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'UserCredit' AND indexname = 'idx_usercredit_userid') THEN
    CREATE INDEX idx_usercredit_userid ON "UserCredit"("userId");
  END IF;

  -- PaymentLog indexes
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'PaymentLog' AND indexname = 'idx_paymentlog_userid') THEN
    CREATE INDEX idx_paymentlog_userid ON "PaymentLog"("userId");
  END IF;

  -- VoteSession indexes
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'VoteSession' AND indexname = 'idx_votesession_userid') THEN
    CREATE INDEX idx_votesession_userid ON "VoteSession"("userId");
  END IF;
END $$;

-- ============================================================================
-- VALIDATION QUERIES (Run these to verify setup)
-- ============================================================================

-- Verify security schema exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'security') THEN
    RAISE EXCEPTION 'Security schema not created properly';
  END IF;
END $$;

-- Verify critical functions exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p 
    JOIN pg_namespace n ON p.pronamespace = n.oid 
    WHERE n.nspname = 'security' AND p.proname = 'decrement_free_credits'
  ) THEN
    RAISE EXCEPTION 'Critical function security.decrement_free_credits not created';
  END IF;
END $$;

-- ============================================================================
-- ROLLBACK COMMANDS (Save these for emergency use)
-- ============================================================================
COMMENT ON SCHEMA security IS 'RLS Phase 1: Security Infrastructure. 
ROLLBACK: 
  DROP SCHEMA security CASCADE;
  DROP INDEX IF EXISTS idx_user_id;
  DROP INDEX IF EXISTS idx_usercredit_userid;
  DROP INDEX IF EXISTS idx_paymentlog_userid;
  DROP INDEX IF EXISTS idx_votesession_userid;
';
