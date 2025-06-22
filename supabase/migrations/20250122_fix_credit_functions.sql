-- Fix credit functions to work with TEXT user IDs instead of UUID

-- Drop existing functions
DROP FUNCTION IF EXISTS decrement_free_credits(UUID, INTEGER, TEXT, JSONB);
DROP FUNCTION IF EXISTS reset_free_credits(UUID, INTEGER, TEXT);
DROP FUNCTION IF EXISTS get_credit_balance(UUID);

-- Recreate decrement_free_credits with TEXT user_id
CREATE OR REPLACE FUNCTION decrement_free_credits(
  p_user_id TEXT,
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

  -- Create audit log entry (user_id is UUID in audit log)
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
    p_user_id::UUID,
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
    p_user_id::UUID
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
      p_user_id::UUID,
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
      p_user_id::UUID
    );
    
    -- Re-raise the exception
    RAISE;
END;
$$;

-- Recreate reset_free_credits with TEXT user_id
CREATE OR REPLACE FUNCTION reset_free_credits(
  p_user_id TEXT,
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
    p_user_id::UUID,
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
    p_user_id::UUID
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

-- Recreate get_credit_balance with TEXT user_id
CREATE OR REPLACE FUNCTION get_credit_balance(p_user_id TEXT)
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

-- Re-grant permissions
GRANT EXECUTE ON FUNCTION decrement_free_credits TO authenticated;
GRANT EXECUTE ON FUNCTION reset_free_credits TO authenticated;
GRANT EXECUTE ON FUNCTION get_credit_balance TO authenticated;