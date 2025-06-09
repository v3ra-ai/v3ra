#!/usr/bin/env ts-node
/**
 * Automated RLS Phase 3 - Critical Tables
 * For urgent deployment with safety checks
 */

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function applyPhase3() {
  console.log('🚀 Applying RLS Phase 3: Critical Tables');
  console.log('========================================\n');
  
  try {
    // Pre-flight check
    const criticalStatus = await prisma.$queryRaw<any[]>`
      SELECT tablename, rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename IN ('User', 'UserCredit', 'PaymentLog')
      ORDER BY tablename;
    `;
    
    console.log('📊 Current critical table status:');
    criticalStatus.forEach((table: any) => {
      console.log(`   ${table.tablename}: ${table.rowsecurity ? '✅ RLS Enabled' : '❌ RLS Disabled'}`);
    });
    
    if (criticalStatus.every((t: any) => t.rowsecurity)) {
      console.log('\n✅ All critical tables already have RLS enabled!');
      return;
    }
    
    console.log('\n🔄 Applying Phase 3 migration...');
    
    // Start transaction
    await prisma.$transaction(async (tx) => {
      // 1. Enable RLS on critical tables
      console.log('   📋 Enabling RLS...');
      await tx.$executeRaw`ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;`;
      await tx.$executeRaw`ALTER TABLE "UserCredit" ENABLE ROW LEVEL SECURITY;`;
      await tx.$executeRaw`ALTER TABLE "PaymentLog" ENABLE ROW LEVEL SECURITY;`;
      
      // 2. User table policies
      console.log('   📋 Creating User table policies...');
      
      await tx.$executeRaw`
        CREATE POLICY "user_select_own" ON "User"
          FOR SELECT
          USING (auth.uid()::text = id::text);
      `;
      
      await tx.$executeRaw`
        CREATE POLICY "user_update_non_credits" ON "User"
          FOR UPDATE
          USING (auth.uid()::text = id::text)
          WITH CHECK (
            auth.uid()::text = id::text AND
            "freeCredits" = (SELECT "freeCredits" FROM "User" WHERE id = "User".id)
          );
      `;
      
      await tx.$executeRaw`
        CREATE POLICY "user_insert_self" ON "User"
          FOR INSERT
          WITH CHECK (auth.uid()::text = id::text);
      `;
      
      await tx.$executeRaw`
        CREATE POLICY "user_service_role" ON "User"
          FOR ALL
          USING (auth.jwt()->>'role' = 'service_role');
      `;
      
      // 3. UserCredit policies
      console.log('   📋 Creating UserCredit table policies...');
      
      await tx.$executeRaw`
        CREATE POLICY "usercredit_select_own" ON "UserCredit"
          FOR SELECT
          USING (
            auth.uid()::text = "userId"::text OR
            auth.jwt()->>'role' = 'service_role'
          );
      `;
      
      await tx.$executeRaw`
        CREATE POLICY "usercredit_service_role_only" ON "UserCredit"
          FOR INSERT
          WITH CHECK (auth.jwt()->>'role' = 'service_role');
      `;
      
      await tx.$executeRaw`
        CREATE POLICY "usercredit_update_service_role" ON "UserCredit"
          FOR UPDATE
          USING (auth.jwt()->>'role' = 'service_role');
      `;
      
      await tx.$executeRaw`
        CREATE POLICY "usercredit_delete_service_role" ON "UserCredit"
          FOR DELETE
          USING (auth.jwt()->>'role' = 'service_role');
      `;
      
      // 4. PaymentLog policies
      console.log('   📋 Creating PaymentLog table policies...');
      
      await tx.$executeRaw`
        CREATE POLICY "paymentlog_select_own" ON "PaymentLog"
          FOR SELECT
          USING (
            "walletPublicKey" IN (
              SELECT "walletPublicKey" FROM "UserCredit" 
              WHERE "userId"::text = auth.uid()::text
            )
          );
      `;
      
      await tx.$executeRaw`
        CREATE POLICY "paymentlog_insert_service_role" ON "PaymentLog"
          FOR INSERT
          WITH CHECK (auth.jwt()->>'role' = 'service_role');
      `;
      
      await tx.$executeRaw`
        CREATE POLICY "paymentlog_service_role_all" ON "PaymentLog"
          FOR ALL
          USING (auth.jwt()->>'role' = 'service_role');
      `;
      
      // 5. Create indexes for performance
      console.log('   📋 Creating performance indexes...');
      await tx.$executeRaw`CREATE INDEX IF NOT EXISTS idx_user_id ON "User"(id);`;
      await tx.$executeRaw`CREATE INDEX IF NOT EXISTS idx_user_freecredits ON "User"("freeCredits");`;
      await tx.$executeRaw`CREATE INDEX IF NOT EXISTS idx_usercredit_userid ON "UserCredit"("userId");`;
      await tx.$executeRaw`CREATE INDEX IF NOT EXISTS idx_usercredit_wallet ON "UserCredit"("walletPublicKey");`;
      await tx.$executeRaw`CREATE INDEX IF NOT EXISTS idx_paymentlog_wallet ON "PaymentLog"("walletPublicKey");`;
      await tx.$executeRaw`CREATE INDEX IF NOT EXISTS idx_paymentlog_created ON "PaymentLog"("createdAt");`;
      
      // 6. Log successful migration
      await tx.$executeRaw`
        INSERT INTO security.audit_log (table_name, operation, metadata)
        VALUES ('migration', 'phase3_complete', jsonb_build_object(
          'tables_protected', ARRAY['User', 'UserCredit', 'PaymentLog'],
          'timestamp', now()
        ));
      `;
    });
    
    console.log('\n✅ Phase 3 migration completed successfully!');
    
    // Verify the migration
    const verification = await prisma.$queryRaw<any[]>`
      SELECT 
        tablename,
        rowsecurity,
        (SELECT COUNT(*) FROM pg_policies WHERE pg_policies.tablename = pg_tables.tablename) as policy_count
      FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename IN ('User', 'UserCredit', 'PaymentLog')
      ORDER BY tablename;
    `;
    
    console.log('\n📊 Final critical table status:');
    verification.forEach((table: any) => {
      console.log(`   ${table.tablename}: RLS ${table.rowsecurity ? '✅' : '❌'} (${table.policy_count} policies)`);
    });
    
    console.log('\n🎉 RLS Implementation Complete!');
    console.log('\n📋 Next Steps:');
    console.log('1. Update API routes to use secure credit functions');
    console.log('2. Run full test suite: npm run rls:test');
    console.log('3. Monitor RLS dashboard at /admin/rls-monitor');
    console.log('4. Keep rollback script ready: scripts/rollback-rls-phase3.ts');
    
  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    
    if (error.message.includes('already exists')) {
      console.log('\n⚠️  Some policies may already exist. Check current status.');
    } else {
      console.log('\n🔧 To rollback if needed:');
      console.log('   npx ts-node scripts/rollback-rls-phase3.ts');
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyPhase3();
