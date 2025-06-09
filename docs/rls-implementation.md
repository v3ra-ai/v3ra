# Row Level Security (RLS) Implementation Plan

## 🚨 CRITICAL: Security Implementation for Testnet-Demo

### Executive Summary

This document outlines the comprehensive plan for implementing Row Level Security (RLS) on the testnet-demo Supabase database. Currently, **NO RLS is enabled**, which represents a critical security vulnerability. This implementation will be done with **ZERO downtime** and **NO breaking changes**.

---

## 📊 Current State Analysis

### Database Access Pattern
- **Primary ORM**: Prisma (bypasses RLS by default)
- **Supabase Client**: Configured but minimal direct usage
- **Authentication**: Supabase Auth

### Critical Findings from Audit

1. **Total Database Operations**: 140 operations across 42 files
2. **Credit System Operations**: 
   - `freeCredits` field in User table
   - Direct mutations in `/app/api/credits/decrement/route.tsx`
   - Reset operations in `lib/db/user-credits.ts`
3. **High-Risk Tables**:
   - `User` (contains freeCredits)
   - `UserCredit` (financial data)
   - `PaymentLog` (31 operations)
   - `Validator` (28 operations, recently cached)

### ⚠️ Critical Security Gaps

1. **No RLS on any table** - All data accessible via anon key
2. **Direct freeCredits mutations** - Can be exploited
3. **No audit trail** for credit changes
4. **Prisma bypasses RLS** - Need hybrid approach

---

## 🎯 Implementation Strategy

### Phase 1: Pre-Implementation (Week 1)

#### 1.1 Infrastructure Setup
```sql
-- Create security schema for functions
CREATE SCHEMA IF NOT EXISTS security;

-- Create audit table
CREATE TABLE security.audit_log (
  id BIGSERIAL PRIMARY KEY,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  user_id UUID,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 1.2 Backup and Rollback Preparation
```bash
# Create full backup
pg_dump $DATABASE_URL > backup_before_rls_$(date +%Y%m%d_%H%M%S).sql

# Create rollback scripts for each table
```

#### 1.3 Performance Baseline
```sql
-- Capture current query performance
CREATE TABLE security.performance_baseline AS
SELECT 
  query,
  calls,
  mean_exec_time,
  stddev_exec_time,
  rows
FROM pg_stat_statements
WHERE query LIKE '%public.%';
```

### Phase 2: Security Functions (Week 1)

#### 2.1 Secure Credit Operations
```sql
-- CRITICAL: Security definer function for freeCredits
CREATE OR REPLACE FUNCTION security.decrement_free_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_reason TEXT DEFAULT NULL
) RETURNS INTEGER
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_current_credits INTEGER;
  v_new_credits INTEGER;
BEGIN
  -- Get current credits with row lock
  SELECT freeCredits INTO v_current_credits
  FROM "User"
  WHERE id = p_user_id
  FOR UPDATE;

  IF v_current_credits IS NULL THEN
    RAISE EXCEPTION 'User not found: %', p_user_id;
  END IF;

  IF v_current_credits < p_amount THEN
    RAISE EXCEPTION 'Insufficient credits. Current: %, Requested: %', 
      v_current_credits, p_amount;
  END IF;

  -- Update credits
  v_new_credits := v_current_credits - p_amount;
  
  UPDATE "User"
  SET freeCredits = v_new_credits
  WHERE id = p_user_id;

  -- Audit log
  INSERT INTO security.audit_log (
    table_name, operation, user_id, old_data, new_data
  ) VALUES (
    'User', 'decrement_credits', p_user_id,
    jsonb_build_object('freeCredits', v_current_credits),
    jsonb_build_object('freeCredits', v_new_credits, 'reason', p_reason)
  );

  RETURN v_new_credits;
END;
$$ LANGUAGE plpgsql;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION security.decrement_free_credits TO authenticated;
```

#### 2.2 Credit Reset Function
```sql
CREATE OR REPLACE FUNCTION security.reset_free_credits(
  p_user_id UUID
) RETURNS JSONB
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user RECORD;
  v_next_reset TIMESTAMPTZ;
BEGIN
  SELECT freeCredits, lastResetDate 
  INTO v_user
  FROM "User"
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', p_user_id;
  END IF;

  v_next_reset := v_user.lastResetDate + INTERVAL '1 day';

  IF NOW() > v_next_reset THEN
    UPDATE "User"
    SET freeCredits = 10,
        lastResetDate = NOW()
    WHERE id = p_user_id;

    -- Audit log
    INSERT INTO security.audit_log (
      table_name, operation, user_id, old_data, new_data
    ) VALUES (
      'User', 'reset_credits', p_user_id,
      jsonb_build_object('freeCredits', v_user.freeCredits),
      jsonb_build_object('freeCredits', 10, 'reset', true)
    );

    RETURN jsonb_build_object('freeCredits', 10, 'reset', true);
  END IF;

  RETURN jsonb_build_object('freeCredits', v_user.freeCredits, 'reset', false);
END;
$$ LANGUAGE plpgsql;
```

### Phase 3: RLS Policies - Low Risk Tables (Week 2)

#### 3.1 Reference Tables (Feedback, Thread, Reply)
```sql
-- Enable RLS on low-risk tables first
ALTER TABLE "Feedback" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Thread" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Reply" ENABLE ROW LEVEL SECURITY;

-- Feedback policies
CREATE POLICY "Users can view own feedback" ON "Feedback"
  FOR SELECT USING (auth.uid()::text = "userId");

CREATE POLICY "Users can create feedback" ON "Feedback"
  FOR INSERT WITH CHECK (auth.uid()::text = "userId");

-- Service role bypass
CREATE POLICY "Service role full access" ON "Feedback"
  USING (auth.jwt()->>'role' = 'service_role');
```

### Phase 4: RLS Policies - Critical Tables (Week 3)

#### 4.1 User Table Policies
```sql
-- CRITICAL: Block direct freeCredits updates
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

-- Users can view own profile
CREATE POLICY "Users view own profile" ON "User"
  FOR SELECT USING (
    auth.uid() = id OR
    auth.jwt()->>'role' = 'service_role'
  );

-- Users can update own profile EXCEPT freeCredits
CREATE POLICY "Users update own profile" ON "User"
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    -- CRITICAL: Prevent freeCredits modification
    (NEW.freeCredits IS NOT DISTINCT FROM OLD.freeCredits)
  );

-- Service role bypass for system operations
CREATE POLICY "Service role full access" ON "User"
  USING (auth.jwt()->>'role' = 'service_role');
```

#### 4.2 Financial Tables
```sql
-- UserCredit policies
ALTER TABLE "UserCredit" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own credits" ON "UserCredit"
  FOR SELECT USING (auth.uid()::text = "userId");

-- PaymentLog policies
ALTER TABLE "PaymentLog" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own payments" ON "PaymentLog"
  FOR SELECT USING (auth.uid()::text = "userId");
```

### Phase 5: Prisma Integration (Week 3)

Since Prisma bypasses RLS, we need a hybrid approach:

#### 5.1 Create RLS-Aware Prisma Client
```typescript
// lib/database-rls.ts
import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';

export class RLSPrismaClient extends PrismaClient {
  private supabase: any;
  
  constructor(options?: any) {
    super(options);
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! // For admin operations
    );
  }

  // Override credit operations to use secure functions
  async decrementCredits(userId: string, amount: number, reason?: string) {
    const { data, error } = await this.supabase.rpc(
      'decrement_free_credits',
      { p_user_id: userId, p_amount: amount, p_reason: reason }
    );
    
    if (error) throw error;
    return data;
  }
}
```

#### 5.2 Update API Routes
```typescript
// app/api/credits/decrement/route.tsx
import { RLSPrismaClient } from '@/lib/database-rls';

const prisma = new RLSPrismaClient();

// Replace direct update with secure function
const newCredits = await prisma.decrementCredits(
  userId,
  creditAmount,
  'API request'
);
```

### Phase 6: Monitoring & Validation (Week 4)

#### 6.1 RLS Status Dashboard
```sql
CREATE OR REPLACE VIEW security.rls_status AS
SELECT 
  schemaname,
  tablename,
  CASE 
    WHEN rowsecurity THEN '✅ ENABLED'
    ELSE '❌ DISABLED'
  END as rls_status,
  (SELECT COUNT(*) FROM pg_policies p 
   WHERE p.tablename = t.tablename) as policy_count
FROM pg_tables t
WHERE schemaname = 'public'
ORDER BY tablename;
```

#### 6.2 Access Monitoring
```sql
-- Monitor access denials
CREATE OR REPLACE FUNCTION security.log_rls_denial()
RETURNS event_trigger AS $$
BEGIN
  INSERT INTO security.audit_log (
    table_name, operation, user_id, new_data
  ) VALUES (
    TG_TABLE_NAME, 'access_denied', auth.uid(),
    jsonb_build_object('error', 'RLS policy violation')
  );
END;
$$ LANGUAGE plpgsql;
```

### Phase 7: Testing Framework

#### 7.1 RLS Test Suite
```typescript
// __tests__/rls-policies.test.ts
describe('RLS Policies', () => {
  test('Users cannot directly update freeCredits', async () => {
    const { error } = await supabase
      .from('User')
      .update({ freeCredits: 1000 })
      .eq('id', testUserId);
    
    expect(error).toBeTruthy();
    expect(error.message).toContain('policy');
  });

  test('Credit decrement function works', async () => {
    const { data, error } = await supabase.rpc(
      'decrement_free_credits',
      { p_user_id: testUserId, p_amount: 1 }
    );
    
    expect(error).toBeFalsy();
    expect(data).toBe(9); // 10 - 1
  });
});
```

### Phase 8: Rollback Procedures

#### 8.1 Emergency Disable Script
```sql
-- EMERGENCY: Disable all RLS
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables 
           WHERE schemaname = 'public' AND rowsecurity = true
  LOOP
    EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY', r.tablename);
  END LOOP;
END $$;
```

#### 8.2 Gradual Rollback
```sql
-- Disable RLS on specific table
ALTER TABLE "TableName" DISABLE ROW LEVEL SECURITY;

-- Remove all policies
DROP POLICY IF EXISTS "policy_name" ON "TableName";
```

---

## 📋 Implementation Checklist

### Week 1: Preparation
- [ ] Full database backup
- [ ] Create security schema
- [ ] Implement secure credit functions
- [ ] Set up audit logging
- [ ] Performance baseline capture
- [ ] Create rollback scripts

### Week 2: Low-Risk Tables
- [ ] Enable RLS on Feedback table
- [ ] Enable RLS on Thread table
- [ ] Enable RLS on Reply table
- [ ] Test service role access
- [ ] Monitor for access denials

### Week 3: Critical Tables
- [ ] Enable RLS on User table
- [ ] Block direct freeCredits updates
- [ ] Enable RLS on UserCredit table
- [ ] Enable RLS on PaymentLog table
- [ ] Update API routes to use secure functions
- [ ] Implement RLS-aware Prisma client

### Week 4: Complex Tables
- [ ] Enable RLS on Validator table
- [ ] Enable RLS on VoteSession table
- [ ] Enable RLS on ValidatorResponse table
- [ ] Complete testing suite
- [ ] Performance comparison
- [ ] Final validation

---

## 🚀 Success Criteria

1. **Zero Breaking Changes**: All existing functionality continues to work
2. **Performance**: <20% impact on query performance
3. **Security**: Complete user data isolation
4. **Credits**: freeCredits protected by security definer functions
5. **Audit**: Complete audit trail for all credit operations
6. **Monitoring**: Real-time RLS status dashboard
7. **Rollback**: Tested emergency procedures

---

## ⚠️ Critical Warnings

1. **NEVER enable RLS without policies** - This locks out ALL access
2. **Test each table individually** - No bulk changes
3. **Monitor access denials** - Set up alerts immediately
4. **Keep service role key secure** - Only for server-side operations
5. **Regular backups** - Before each phase

---

## 📞 Emergency Contacts

- Database Admin: [Contact Info]
- Security Team: [Contact Info]
- On-Call Engineer: [Contact Info]

---

Last Updated: [Current Date]
Implementation Status: **NOT STARTED - AWAITING APPROVAL**
