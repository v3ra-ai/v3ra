#!/usr/bin/env ts-node
/**
 * Simple RLS Phase 3 - Critical Tables
 * Applies RLS without transaction for better reliability
 */

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function executeCommand(description: string, command: string) {
  try {
    await prisma.$executeRawUnsafe(command);
    console.log(`   ✅ ${description}`);
    return true;
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      console.log(`   ⏭️  ${description} (already exists)`);
      return true;
    }
    console.error(`   ❌ ${description}: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 RLS Phase 3: Critical Tables (Simple Mode)');
  console.log('============================================\n');
  
  let successCount = 0;
  let totalCommands = 0;
  
  try {
    // Check current status
    const status = await prisma.$queryRaw<any[]>`
      SELECT tablename, rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename IN ('User', 'UserCredit', 'PaymentLog')
      ORDER BY tablename;
    `;
    
    console.log('📊 Current status:');
    status.forEach((t: any) => {
      console.log(`   ${t.tablename}: RLS ${t.rowsecurity ? '✅' : '❌'}`);
    });
    
    console.log('\n🔄 Applying RLS...\n');
    
    // Enable RLS
    totalCommands++;
    if (await executeCommand('Enable RLS on User', 'ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;')) successCount++;
    
    totalCommands++;
    if (await executeCommand('Enable RLS on UserCredit', 'ALTER TABLE "UserCredit" ENABLE ROW LEVEL SECURITY;')) successCount++;
    
    totalCommands++;
    if (await executeCommand('Enable RLS on PaymentLog', 'ALTER TABLE "PaymentLog" ENABLE ROW LEVEL SECURITY;')) successCount++;
    
    // User policies
    console.log('\n📋 User table policies:');
    
    totalCommands++;
    if (await executeCommand('user_select_own', `
      CREATE POLICY "user_select_own" ON "User"
        FOR SELECT
        USING (auth.uid()::text = id::text);
    `)) successCount++;
    
    totalCommands++;
    if (await executeCommand('user_update_non_credits', `
      CREATE POLICY "user_update_non_credits" ON "User"
        FOR UPDATE
        USING (auth.uid()::text = id::text)
        WITH CHECK (auth.uid()::text = id::text);
    `)) successCount++;
    
    totalCommands++;
    if (await executeCommand('user_insert_self', `
      CREATE POLICY "user_insert_self" ON "User"
        FOR INSERT
        WITH CHECK (auth.uid()::text = id::text);
    `)) successCount++;
    
    totalCommands++;
    if (await executeCommand('user_service_role', `
      CREATE POLICY "user_service_role" ON "User"
        FOR ALL
        USING (auth.jwt()->>'role' = 'service_role');
    `)) successCount++;
    
    // UserCredit policies
    console.log('\n📋 UserCredit table policies:');
    
    totalCommands++;
    if (await executeCommand('usercredit_select_own', `
      CREATE POLICY "usercredit_select_own" ON "UserCredit"
        FOR SELECT
        USING (
          auth.uid()::text = "userId"::text OR
          auth.jwt()->>'role' = 'service_role'
        );
    `)) successCount++;
    
    totalCommands++;
    if (await executeCommand('usercredit_service_role_insert', `
      CREATE POLICY "usercredit_service_role_insert" ON "UserCredit"
        FOR INSERT
        WITH CHECK (auth.jwt()->>'role' = 'service_role');
    `)) successCount++;
    
    totalCommands++;
    if (await executeCommand('usercredit_service_role_update', `
      CREATE POLICY "usercredit_service_role_update" ON "UserCredit"
        FOR UPDATE
        USING (auth.jwt()->>'role' = 'service_role');
    `)) successCount++;
    
    totalCommands++;
    if (await executeCommand('usercredit_service_role_delete', `
      CREATE POLICY "usercredit_service_role_delete" ON "UserCredit"
        FOR DELETE
        USING (auth.jwt()->>'role' = 'service_role');
    `)) successCount++;
    
    // PaymentLog policies
    console.log('\n📋 PaymentLog table policies:');
    
    totalCommands++;
    if (await executeCommand('paymentlog_select_own', `
      CREATE POLICY "paymentlog_select_own" ON "PaymentLog"
        FOR SELECT
        USING (
          "walletPublicKey" IN (
            SELECT "walletPublicKey" FROM "UserCredit" 
            WHERE "userId"::text = auth.uid()::text
          )
        );
    `)) successCount++;
    
    totalCommands++;
    if (await executeCommand('paymentlog_service_role_insert', `
      CREATE POLICY "paymentlog_service_role_insert" ON "PaymentLog"
        FOR INSERT
        WITH CHECK (auth.jwt()->>'role' = 'service_role');
    `)) successCount++;
    
    totalCommands++;
    if (await executeCommand('paymentlog_service_role_all', `
      CREATE POLICY "paymentlog_service_role_all" ON "PaymentLog"
        FOR ALL
        USING (auth.jwt()->>'role' = 'service_role');
    `)) successCount++;
    
    // Create indexes
    console.log('\n📋 Performance indexes:');
    
    totalCommands++;
    if (await executeCommand('idx_user_id', 'CREATE INDEX IF NOT EXISTS idx_user_id ON "User"(id);')) successCount++;
    
    totalCommands++;
    if (await executeCommand('idx_user_freecredits', 'CREATE INDEX IF NOT EXISTS idx_user_freecredits ON "User"("freeCredits");')) successCount++;
    
    totalCommands++;
    if (await executeCommand('idx_usercredit_userid', 'CREATE INDEX IF NOT EXISTS idx_usercredit_userid ON "UserCredit"("userId");')) successCount++;
    
    totalCommands++;
    if (await executeCommand('idx_usercredit_wallet', 'CREATE INDEX IF NOT EXISTS idx_usercredit_wallet ON "UserCredit"("walletPublicKey");')) successCount++;
    
    totalCommands++;
    if (await executeCommand('idx_paymentlog_wallet', 'CREATE INDEX IF NOT EXISTS idx_paymentlog_wallet ON "PaymentLog"("walletPublicKey");')) successCount++;
    
    totalCommands++;
    if (await executeCommand('idx_paymentlog_created', 'CREATE INDEX IF NOT EXISTS idx_paymentlog_created ON "PaymentLog"("createdAt");')) successCount++;
    
    // Log completion
    totalCommands++;
    if (await executeCommand('Log migration', `
      INSERT INTO security.audit_log (table_name, operation, metadata)
      VALUES ('migration', 'phase3_complete', jsonb_build_object(
        'tables_protected', ARRAY['User', 'UserCredit', 'PaymentLog'],
        'success_count', ${successCount},
        'total_commands', ${totalCommands},
        'timestamp', now()
      ));
    `)) successCount++;
    
    // Final check
    const finalStatus = await prisma.$queryRaw<any[]>`
      SELECT 
        tablename,
        rowsecurity,
        (SELECT COUNT(*) FROM pg_policies WHERE pg_policies.tablename = pg_tables.tablename) as policy_count
      FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename IN ('User', 'UserCredit', 'PaymentLog')
      ORDER BY tablename;
    `;
    
    console.log('\n📊 Final status:');
    finalStatus.forEach((t: any) => {
      console.log(`   ${t.tablename}: RLS ${t.rowsecurity ? '✅' : '❌'} (${t.policy_count} policies)`);
    });
    
    console.log(`\n📈 Summary: ${successCount}/${totalCommands} commands successful`);
    
    if (successCount === totalCommands) {
      console.log('\n🎉 Phase 3 Complete! All critical tables are now protected.');
      
      // Now we need to add the credit protection
      console.log('\n🔐 Adding credit protection policy...');
      await executeCommand('Block direct credit updates', `
        CREATE POLICY "user_block_credit_updates" ON "User"
          AS RESTRICTIVE
          FOR UPDATE
          USING (true)
          WITH CHECK ("freeCredits" = (SELECT "freeCredits" FROM "User" WHERE id = "User".id));
      `);
      
      console.log('\n✅ RLS Implementation Complete!');
      console.log('\n📋 Next Steps:');
      console.log('1. Update credit-related API routes to use secure functions');
      console.log('2. Test with: npx ts-node scripts/test-rls-phase3.ts');
      console.log('3. Monitor at: /admin/rls-monitor');
    } else {
      console.log('\n⚠️  Some commands failed. Check the errors above.');
    }
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
