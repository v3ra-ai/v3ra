-- ============================================================================
-- DAILY CREDIT ALLOCATION SYSTEM
-- ============================================================================
-- This migration adds infrastructure for automated daily credit allocation
-- tracking and batch processing of user credit resets.
-- ============================================================================

-- Create tracking table for daily allocations
CREATE TABLE IF NOT EXISTS credit_allocations (
  id SERIAL PRIMARY KEY,
  allocation_date DATE UNIQUE NOT NULL,
  users_updated INTEGER NOT NULL DEFAULT 0,
  users_failed INTEGER NOT NULL DEFAULT 0,
  users_skipped INTEGER NOT NULL DEFAULT 0,
  total_credits_allocated INTEGER NOT NULL DEFAULT 0,
  execution_time_ms INTEGER,
  error_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on tracking table
ALTER TABLE credit_allocations ENABLE ROW LEVEL SECURITY;

-- Only service role can manage allocations
CREATE POLICY "Service role full access" ON credit_allocations
  FOR ALL USING (auth.role() = 'service_role');

-- Create index for date lookups
CREATE INDEX idx_credit_allocations_date ON credit_allocations(allocation_date);

-- ============================================================================
-- BATCH ALLOCATION FUNCTION
-- ============================================================================
-- This function processes all users and allocates daily credits efficiently
CREATE OR REPLACE FUNCTION security.allocate_daily_credits(
  p_force BOOLEAN DEFAULT FALSE
) 
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_allocation_date DATE := CURRENT_DATE;
  v_users_updated INTEGER := 0;
  v_users_failed INTEGER := 0;
  v_users_skipped INTEGER := 0;
  v_total_credits INTEGER := 0;
  v_start_time TIMESTAMP := clock_timestamp();
  v_execution_time_ms INTEGER;
  v_user RECORD;
  v_error_details JSONB := '[]'::jsonb;
  v_batch_size INTEGER := 100;
  v_offset INTEGER := 0;
  v_total_users INTEGER;
BEGIN
  -- Check if already allocated today (unless forced)
  IF NOT p_force AND EXISTS (
    SELECT 1 FROM credit_allocations 
    WHERE allocation_date = v_allocation_date
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Credits already allocated today',
      'allocation_date', v_allocation_date,
      'existing_allocation', (
        SELECT row_to_json(ca.*) 
        FROM credit_allocations ca 
        WHERE allocation_date = v_allocation_date
      )
    );
  END IF;

  -- Get total user count
  SELECT COUNT(*) INTO v_total_users FROM "User";

  -- Process users in batches
  LOOP
    -- Process batch of users
    FOR v_user IN 
      SELECT id, "freeCredits", "lastResetDate"
      FROM "User"
      ORDER BY id
      LIMIT v_batch_size
      OFFSET v_offset
    LOOP
      BEGIN
        -- Check if user needs reset (24 hours since last reset)
        IF v_user."lastResetDate" IS NULL OR 
           v_user."lastResetDate" < NOW() - INTERVAL '24 hours' THEN
          
          -- Update user credits
          UPDATE "User"
          SET 
            "freeCredits" = 10,
            "lastResetDate" = NOW()
          WHERE id = v_user.id
          AND ("lastResetDate" IS NULL OR "lastResetDate" < NOW() - INTERVAL '24 hours');
          
          -- Check if update happened
          IF FOUND THEN
            v_users_updated := v_users_updated + 1;
            v_total_credits := v_total_credits + 10;
            
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
              'daily_credit_allocation', 
              v_user.id::uuid,
              jsonb_build_object(
                'freeCredits', v_user."freeCredits",
                'lastResetDate', v_user."lastResetDate"
              ),
              jsonb_build_object(
                'freeCredits', 10,
                'lastResetDate', NOW()
              ),
              jsonb_build_object(
                'allocation_date', v_allocation_date,
                'batch_job', true
              )
            );
          ELSE
            v_users_skipped := v_users_skipped + 1;
          END IF;
        ELSE
          v_users_skipped := v_users_skipped + 1;
        END IF;
        
      EXCEPTION WHEN OTHERS THEN
        v_users_failed := v_users_failed + 1;
        v_error_details := v_error_details || jsonb_build_object(
          'user_id', v_user.id,
          'error', SQLERRM,
          'error_detail', SQLSTATE,
          'timestamp', NOW()
        );
      END;
    END LOOP;

    -- Update offset
    v_offset := v_offset + v_batch_size;
    
    -- Exit if we've processed all users
    EXIT WHEN v_offset >= v_total_users;
    
    -- Optional: Add small delay between batches to reduce load
    PERFORM pg_sleep(0.01); -- 10ms delay
  END LOOP;

  -- Calculate execution time
  v_execution_time_ms := EXTRACT(MILLISECONDS FROM (clock_timestamp() - v_start_time));

  -- Record allocation results
  INSERT INTO credit_allocations (
    allocation_date,
    users_updated,
    users_failed,
    users_skipped,
    total_credits_allocated,
    execution_time_ms,
    error_details
  ) VALUES (
    v_allocation_date,
    v_users_updated,
    v_users_failed,
    v_users_skipped,
    v_total_credits,
    v_execution_time_ms,
    CASE WHEN v_error_details = '[]'::jsonb THEN NULL ELSE v_error_details END
  );

  -- Return comprehensive result
  RETURN jsonb_build_object(
    'success', true,
    'allocation_date', v_allocation_date,
    'users_updated', v_users_updated,
    'users_failed', v_users_failed,
    'users_skipped', v_users_skipped,
    'total_credits_allocated', v_total_credits,
    'total_users', v_total_users,
    'execution_time_ms', v_execution_time_ms,
    'errors', CASE WHEN v_error_details = '[]'::jsonb THEN NULL ELSE v_error_details END
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Log critical error
    INSERT INTO security.audit_log (
      table_name, 
      operation, 
      user_id, 
      metadata
    ) VALUES (
      'credit_allocations', 
      'batch_allocation_error', 
      NULL,
      jsonb_build_object(
        'error', SQLERRM,
        'error_detail', SQLSTATE,
        'allocation_date', v_allocation_date,
        'partial_results', jsonb_build_object(
          'users_updated', v_users_updated,
          'users_failed', v_users_failed,
          'users_skipped', v_users_skipped
        )
      )
    );
    
    -- Re-raise the error
    RAISE;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION security.allocate_daily_credits TO postgres;
GRANT EXECUTE ON FUNCTION security.allocate_daily_credits TO service_role;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get allocation status for today
CREATE OR REPLACE FUNCTION security.get_allocation_status(
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_result RECORD;
BEGIN
  SELECT * INTO v_result
  FROM credit_allocations
  WHERE allocation_date = p_date;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'allocated', false,
      'date', p_date,
      'message', 'No allocation found for this date'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'allocated', true,
    'date', p_date,
    'users_updated', v_result.users_updated,
    'users_failed', v_result.users_failed,
    'users_skipped', v_result.users_skipped,
    'total_credits_allocated', v_result.total_credits_allocated,
    'execution_time_ms', v_result.execution_time_ms,
    'created_at', v_result.created_at
  );
END;
$$ LANGUAGE plpgsql;

-- Grant execute to service role
GRANT EXECUTE ON FUNCTION security.get_allocation_status TO service_role;

-- ============================================================================
-- VALIDATION AND ROLLBACK COMMANDS
-- ============================================================================

-- Verify setup
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p 
    JOIN pg_namespace n ON p.pronamespace = n.oid 
    WHERE n.nspname = 'security' AND p.proname = 'allocate_daily_credits'
  ) THEN
    RAISE EXCEPTION 'Function security.allocate_daily_credits not created';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'credit_allocations'
  ) THEN
    RAISE EXCEPTION 'Table credit_allocations not created';
  END IF;
END $$;

-- Add comment with rollback instructions
COMMENT ON TABLE credit_allocations IS 'Daily credit allocation tracking. 
ROLLBACK: 
  DROP TABLE IF EXISTS credit_allocations CASCADE;
  DROP FUNCTION IF EXISTS security.allocate_daily_credits CASCADE;
  DROP FUNCTION IF EXISTS security.get_allocation_status CASCADE;
';