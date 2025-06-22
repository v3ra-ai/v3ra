-- ============================================================================
-- SECURE CREDIT MANAGEMENT SYSTEM
-- ============================================================================
-- This migration creates a production-ready credit management system with:
-- 1. Audit logging for all credit operations
-- 2. Row-level locking to prevent race conditions
-- 3. Atomic operations with proper error handling
-- 4. Security best practices
-- ============================================================================

-- Create audit log table for tracking all credit operations
CREATE TABLE IF NOT EXISTS credit_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  operation TEXT NOT NULL,
  credit_type TEXT NOT NULL CHECK (credit_type IN ('free', 'paid')),
  amount INTEGER NOT NULL,
  balance_before INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  ip_address INET,
  user_agent TEXT
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_credit_audit_user_id ON credit_audit_log (user_id);
CREATE INDEX IF NOT EXISTS idx_credit_audit_created_at ON credit_audit_log (created_at);
CREATE INDEX IF NOT EXISTS idx_credit_audit_operation ON credit_audit_log (operation);

-- Enable RLS on audit log
ALTER TABLE credit_audit_log ENABLE ROW LEVEL SECURITY;

-- Only allow inserts, no updates or deletes (immutable audit log)
CREATE POLICY "Audit logs are insert-only" ON credit_audit_log
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to read their own audit logs
CREATE POLICY "Users can read own audit logs" ON credit_audit_log
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- SECURE CREDIT FUNCTIONS
-- ============================================================================

-- Function to safely decrement free credits with row-level locking
CREATE OR REPLACE FUNCTION decrement_free_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_reason TEXT DEFAULT 'Query execution',
  p_metadata JSONB DEFAULT '{}'
) 
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_credits INTEGER;
  v_new_credits INTEGER;
  v_user_record RECORD;
BEGIN
  -- Validate inputs
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive: %', p_amount;
  END IF;

  IF p_amount > 100 THEN
    RAISE EXCEPTION 'Amount exceeds maximum allowed: %', p_amount;
  END IF;

  -- Get user with row-level lock to prevent race conditions
  SELECT id, "freeCredits"
  INTO v_user_record
  FROM "User"
  WHERE id = p_user_id
  FOR UPDATE;

  -- Check if user exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', p_user_id;
  END IF;

  v_current_credits := v_user_record."freeCredits";

  -- Check sufficient credits
  IF v_current_credits < p_amount THEN
    RAISE EXCEPTION 'Insufficient free credits. Have: %, Need: %', 
      v_current_credits, p_amount
      USING HINT = 'Purchase more credits or wait for daily reset';
  END IF;

  -- Calculate new balance
  v_new_credits := v_current_credits - p_amount;
  
  -- Update credits
  UPDATE "User"
  SET "freeCredits" = v_new_credits
  WHERE id = p_user_id;

  -- Create audit log entry
  INSERT INTO credit_audit_log (
    user_id,
    operation,
    credit_type,
    amount,
    balance_before,
    balance_after,
    reason,
    metadata,
    created_by
  ) VALUES (
    p_user_id,
    'decrement',
    'free',
    p_amount,
    v_current_credits,
    v_new_credits,
    p_reason,
    p_metadata || jsonb_build_object(
      'function', 'decrement_free_credits',
      'timestamp', NOW()
    ),
    p_user_id
  );

  -- Return result
  RETURN jsonb_build_object(
    'success', true,
    'previous_balance', v_current_credits,
    'new_balance', v_new_credits,
    'amount_deducted', p_amount
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Log error to audit log
    INSERT INTO credit_audit_log (
      user_id,
      operation,
      credit_type,
      amount,
      balance_before,
      balance_after,
      reason,
      metadata,
      created_by
    ) VALUES (
      p_user_id,
      'decrement_error',
      'free',
      p_amount,
      COALESCE(v_current_credits, 0),
      COALESCE(v_current_credits, 0),
      p_reason,
      jsonb_build_object(
        'error', SQLERRM,
        'error_detail', SQLSTATE,
        'function', 'decrement_free_credits'
      ),
      p_user_id
    );
    
    -- Re-raise the exception
    RAISE;
END;
$$;

-- Function to safely decrement paid credits
CREATE OR REPLACE FUNCTION decrement_paid_credits(
  p_wallet_public_key TEXT,
  p_amount INTEGER,
  p_reason TEXT DEFAULT 'Query execution',
  p_metadata JSONB DEFAULT '{}'
) 
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_credits INTEGER;
  v_new_credits INTEGER;
  v_credit_record RECORD;
  v_user_id UUID;
BEGIN
  -- Validate inputs
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive: %', p_amount;
  END IF;

  IF p_amount > 100 THEN
    RAISE EXCEPTION 'Amount exceeds maximum allowed: %', p_amount;
  END IF;

  -- Get user credit with row-level lock
  SELECT uc.*, u.id as user_id
  INTO v_credit_record
  FROM "UserCredit" uc
  LEFT JOIN "User" u ON u."userCreditId" = uc.id
  WHERE uc."walletPublicKey" = p_wallet_public_key
  FOR UPDATE;

  -- Check if wallet exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet not found: %', p_wallet_public_key;
  END IF;

  v_current_credits := v_credit_record.credits;
  v_user_id := v_credit_record.user_id;

  -- Check sufficient credits
  IF v_current_credits < p_amount THEN
    RAISE EXCEPTION 'Insufficient paid credits. Have: %, Need: %', 
      v_current_credits, p_amount
      USING HINT = 'Purchase more credits to continue';
  END IF;

  -- Calculate new balance
  v_new_credits := v_current_credits - p_amount;
  
  -- Update credits
  UPDATE "UserCredit"
  SET credits = v_new_credits,
      "updatedAt" = NOW()
  WHERE "walletPublicKey" = p_wallet_public_key;

  -- Create audit log entry
  INSERT INTO credit_audit_log (
    user_id,
    operation,
    credit_type,
    amount,
    balance_before,
    balance_after,
    reason,
    metadata,
    created_by
  ) VALUES (
    COALESCE(v_user_id, '00000000-0000-0000-0000-000000000000'::UUID),
    'decrement',
    'paid',
    p_amount,
    v_current_credits,
    v_new_credits,
    p_reason,
    p_metadata || jsonb_build_object(
      'function', 'decrement_paid_credits',
      'wallet_public_key', p_wallet_public_key,
      'timestamp', NOW()
    ),
    v_user_id
  );

  -- Return result
  RETURN jsonb_build_object(
    'success', true,
    'previous_balance', v_current_credits,
    'new_balance', v_new_credits,
    'amount_deducted', p_amount
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Log error to audit log
    INSERT INTO credit_audit_log (
      user_id,
      operation,
      credit_type,
      amount,
      balance_before,
      balance_after,
      reason,
      metadata,
      created_by
    ) VALUES (
      COALESCE(v_user_id, '00000000-0000-0000-0000-000000000000'::UUID),
      'decrement_error',
      'paid',
      p_amount,
      COALESCE(v_current_credits, 0),
      COALESCE(v_current_credits, 0),
      p_reason,
      jsonb_build_object(
        'error', SQLERRM,
        'error_detail', SQLSTATE,
        'wallet_public_key', p_wallet_public_key,
        'function', 'decrement_paid_credits'
      ),
      v_user_id
    );
    
    -- Re-raise the exception
    RAISE;
END;
$$;

-- Function to reset free credits (called by daily cron or manual reset)
CREATE OR REPLACE FUNCTION reset_free_credits(
  p_user_id UUID,
  p_new_amount INTEGER DEFAULT 10,
  p_reason TEXT DEFAULT 'Daily reset'
) 
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_credits INTEGER;
  v_last_reset TIMESTAMPTZ;
  v_user_record RECORD;
BEGIN
  -- Get user with row-level lock
  SELECT id, "freeCredits", "lastResetDate"
  INTO v_user_record
  FROM "User"
  WHERE id = p_user_id
  FOR UPDATE;

  -- Check if user exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', p_user_id;
  END IF;

  v_current_credits := v_user_record."freeCredits";
  v_last_reset := v_user_record."lastResetDate";

  -- Check if reset is due (at least 24 hours since last reset)
  IF v_last_reset > NOW() - INTERVAL '24 hours' THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Reset not due yet',
      'next_reset', v_last_reset + INTERVAL '24 hours',
      'current_balance', v_current_credits
    );
  END IF;

  -- Update credits and reset time
  UPDATE "User"
  SET "freeCredits" = p_new_amount,
      "lastResetDate" = NOW()
  WHERE id = p_user_id;

  -- Create audit log entry
  INSERT INTO credit_audit_log (
    user_id,
    operation,
    credit_type,
    amount,
    balance_before,
    balance_after,
    reason,
    metadata,
    created_by
  ) VALUES (
    p_user_id,
    'reset',
    'free',
    p_new_amount - v_current_credits,
    v_current_credits,
    p_new_amount,
    p_reason,
    jsonb_build_object(
      'function', 'reset_free_credits',
      'last_reset', v_last_reset,
      'timestamp', NOW()
    ),
    p_user_id
  );

  -- Return result
  RETURN jsonb_build_object(
    'success', true,
    'previous_balance', v_current_credits,
    'new_balance', p_new_amount,
    'last_reset', v_last_reset,
    'next_reset', NOW() + INTERVAL '24 hours'
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION decrement_free_credits TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_paid_credits TO authenticated;
GRANT EXECUTE ON FUNCTION reset_free_credits TO authenticated;

-- Create helper function to get credit balance
CREATE OR REPLACE FUNCTION get_credit_balance(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_record RECORD;
  v_paid_credits INTEGER DEFAULT 0;
BEGIN
  -- Get user and credit info
  SELECT 
    u.id,
    u."freeCredits",
    u."lastResetDate",
    uc.credits as paid_credits,
    uc."walletPublicKey"
  INTO v_user_record
  FROM "User" u
  LEFT JOIN "UserCredit" uc ON u."userCreditId" = uc.id
  WHERE u.id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', p_user_id;
  END IF;

  RETURN jsonb_build_object(
    'free_credits', v_user_record."freeCredits",
    'paid_credits', COALESCE(v_user_record.paid_credits, 0),
    'total_credits', v_user_record."freeCredits" + COALESCE(v_user_record.paid_credits, 0),
    'last_reset', v_user_record."lastResetDate",
    'next_reset', v_user_record."lastResetDate" + INTERVAL '24 hours',
    'wallet_connected', v_user_record."walletPublicKey" IS NOT NULL
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_credit_balance TO authenticated;

-- Add comment explaining the system
COMMENT ON TABLE credit_audit_log IS 'Immutable audit log for all credit operations. Critical for debugging and compliance.';
COMMENT ON FUNCTION decrement_free_credits IS 'Production-ready function to safely decrement free credits with row-level locking and audit logging.';
COMMENT ON FUNCTION decrement_paid_credits IS 'Production-ready function to safely decrement paid credits with row-level locking and audit logging.';
COMMENT ON FUNCTION reset_free_credits IS 'Resets user free credits with 24-hour cooldown enforcement and audit logging.';