# RLS Deployment Guide - Next Steps

## Current Status Summary

### ✅ Completed
1. **Phase 1: Security Infrastructure** 
   - Security schema created
   - Audit logging table created
   - Secure credit functions implemented
   - Helper functions for RLS management

2. **Phase 2: Low-Risk Tables**
   - RLS enabled on: Feedback, Thread, Reply, GraphEdge
   - Basic policies implemented
   - Service role bypass configured
   - Monitoring functions created

3. **Implementation Tools**
   - RLS audit script (`npm run rls:audit`)
   - RLS test suite (`npm run rls:test`)
   - RLS monitor UI component
   - Secure Prisma client wrapper

### 🚧 In Progress
- Phase 3: Critical Tables (User, UserCredit, PaymentLog)

## Immediate Next Steps

### Step 1: Verify Environment Setup
```bash
# Check environment variables are set
echo $NEXT_PUBLIC_SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY
echo $DATABASE_URL

# If missing, copy from .env file or set them
export NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

### Step 2: Run RLS Audit
```bash
# Run comprehensive audit
npm run rls:audit

# Review the generated rls-audit-report.json
cat rls-audit-report.json | jq .
```

### Step 3: Apply Phase 1 & 2 Migrations (if not already applied)
```bash
# Connect to your Supabase database
psql $DATABASE_URL

# Check if migrations have been applied
SELECT * FROM security.audit_log LIMIT 1;
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

# If not applied, run the migrations:
# Phase 1: Security Infrastructure
\i supabase/migrations/20240101000001_rls_phase1_security_infrastructure.sql

# Phase 2: Low-Risk Tables
\i supabase/migrations/20240102000001_rls_phase2_low_risk_tables.sql
```

### Step 4: Run RLS Tests
```bash
# Test current RLS implementation
npm run rls:test

# Expected output:
# - Phase 1 & 2 tables should show RLS enabled
# - Secure credit operations should pass
# - Direct credit updates should be blocked
```

### Step 5: Monitor RLS Status
1. Start the dev server: `npm run dev`
2. Navigate to: http://localhost:3002/admin/rls-monitor
3. Verify:
   - Progress shows correct number of protected tables
   - Low-risk tables show as "Protected"
   - No errors in audit logs

## Phase 3: Critical Tables Implementation

### Pre-requisites Checklist
- [ ] Full database backup created
- [ ] All team members notified
- [ ] Monitoring alerts configured
- [ ] Rollback scripts tested

### Phase 3 Migration Script
Create `/supabase/migrations/20240103000001_rls_phase3_critical_tables.sql`:

```sql
-- =====================================================
-- PHASE 3: CRITICAL TABLES RLS IMPLEMENTATION
-- Tables: User, UserCredit, PaymentLog
-- =====================================================

BEGIN;

-- 1. Enable RLS on critical tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserCredit" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PaymentLog" ENABLE ROW LEVEL SECURITY;

-- 2. User table policies
-- CRITICAL: Block direct freeCredits updates
CREATE POLICY "user_select_own" ON "User"
  FOR SELECT
  USING (auth.uid()::text = id::text);

CREATE POLICY "user_update_non_credits" ON "User"
  FOR UPDATE
  USING (auth.uid()::text = id::text)
  WITH CHECK (
    auth.uid()::text = id::text AND
    (NEW.freeCredits = OLD.freeCredits OR NEW.freeCredits IS NULL)
  );

CREATE POLICY "user_service_role" ON "User"
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- 3. UserCredit policies
CREATE POLICY "usercredit_select_own" ON "UserCredit"
  FOR SELECT
  USING (
    auth.uid()::text = userId::text OR
    auth.jwt()->>'role' = 'service_role'
  );

-- Block all direct updates except service role
CREATE POLICY "usercredit_service_role_only" ON "UserCredit"
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- 4. PaymentLog policies (read-only for users)
CREATE POLICY "paymentlog_select_own" ON "PaymentLog"
  FOR SELECT
  USING (
    walletPublicKey IN (
      SELECT walletPublicKey FROM "UserCredit" 
      WHERE userId::text = auth.uid()::text
    )
  );

CREATE POLICY "paymentlog_service_role" ON "PaymentLog"
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- 5. Update secure credit functions to use service role
-- Already created in Phase 1, ensure they're working

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_id ON "User"(id);
CREATE INDEX IF NOT EXISTS idx_usercredit_userid ON "UserCredit"(userId);
CREATE INDEX IF NOT EXISTS idx_paymentlog_wallet ON "PaymentLog"(walletPublicKey);

-- 7. Verify and test
DO $$
BEGIN
  -- Verify RLS is enabled
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename IN ('User', 'UserCredit', 'PaymentLog')
    AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS not properly enabled on critical tables';
  END IF;
END $$;

COMMIT;

-- Emergency rollback script (save separately)
-- BEGIN;
-- ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE "UserCredit" DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE "PaymentLog" DISABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "user_select_own" ON "User";
-- DROP POLICY IF EXISTS "user_update_non_credits" ON "User";
-- DROP POLICY IF EXISTS "user_service_role" ON "User";
-- DROP POLICY IF EXISTS "usercredit_select_own" ON "UserCredit";
-- DROP POLICY IF EXISTS "usercredit_service_role_only" ON "UserCredit";
-- DROP POLICY IF EXISTS "paymentlog_select_own" ON "PaymentLog";
-- DROP POLICY IF EXISTS "paymentlog_service_role" ON "PaymentLog";
-- COMMIT;
```

### Deployment Steps for Phase 3

1. **Create Backup**
   ```bash
   pg_dump $DATABASE_URL > backup_phase3_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Test in Staging First**
   - Apply migration to staging database
   - Run full test suite
   - Monitor for 24 hours

3. **Production Deployment**
   ```bash
   # Apply migration
   psql $DATABASE_URL < supabase/migrations/20240103000001_rls_phase3_critical_tables.sql
   
   # Immediately test
   npm run rls:test
   
   # Check monitoring dashboard
   ```

4. **Post-Deployment Verification**
   - [ ] All API endpoints functioning
   - [ ] Credit operations working via secure functions
   - [ ] No unauthorized data access
   - [ ] Performance within acceptable limits

### Monitoring & Alerts

Set up the following monitors:
1. **RLS Denial Alerts**: Monitor for "permission denied" errors
2. **Performance Metrics**: Track query execution times
3. **Audit Log Review**: Check security.audit_log for anomalies
4. **Credit Balance Integrity**: Verify no unauthorized credit changes

### API Route Updates Required

After Phase 3, update these routes to use secure functions:
1. `/app/api/credits/decrement/route.tsx` - Use `security.decrement_free_credits()`
2. `/lib/db/user-credits.ts` - Use `security.reset_free_credits()`

Example update:
```typescript
// Instead of direct Prisma update
// await prisma.user.update({ 
//   where: { id }, 
//   data: { freeCredits: newValue } 
// });

// Use secure function via Supabase
const { data, error } = await supabase.rpc('decrement_free_credits', {
  p_user_id: userId,
  p_amount: amount,
  p_reason: 'API usage'
});
```

## Success Criteria

- [ ] All tables have RLS enabled
- [ ] Zero production incidents
- [ ] Query performance degradation < 20%
- [ ] All credit operations use secure functions
- [ ] Comprehensive audit trail established
- [ ] Emergency rollback tested and documented

## Support & Troubleshooting

### Common Issues
1. **"permission denied" errors**: Check auth.uid() is properly set
2. **Performance degradation**: Review indexes, consider caching
3. **Service role access issues**: Verify SUPABASE_SERVICE_ROLE_KEY

### Emergency Contacts
- Database Admin: [contact]
- Security Team: [contact]
- On-call Engineer: [contact]

---

Remember: **NEVER enable RLS without policies**. Always test in staging first!
