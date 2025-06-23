#!/usr/bin/env ts-node
/**
 * Emergency Rollback Script for RLS Phase 3
 * Disables RLS on critical tables
 */

import { PrismaClient } from '@prisma/client';
import readline from 'readline';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function main() {
  console.log('🚨 EMERGENCY RLS ROLLBACK - Phase 3');
  console.log('===================================\n');
  console.log('⚠️  This will DISABLE RLS on critical tables!');
  console.log('   Tables affected: User, UserCredit, PaymentLog\n');
  
  try {
    const confirm = await askQuestion('Are you sure you want to rollback? (type "ROLLBACK" to confirm): ');
    if (confirm !== 'ROLLBACK') {
      console.log('❌ Rollback cancelled.');
      rl.close();
      return;
    }
    
    console.log('\n🔄 Starting rollback...');
    
    await prisma.$transaction(async (tx) => {
      // Disable RLS on critical tables
      await tx.$executeRaw`ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;`;
      await tx.$executeRaw`ALTER TABLE "UserCredit" DISABLE ROW LEVEL SECURITY;`;
      await tx.$executeRaw`ALTER TABLE "PaymentLog" DISABLE ROW LEVEL SECURITY;`;
      
      // Drop all policies
      await tx.$executeRaw`DROP POLICY IF EXISTS "user_select_own" ON "User";`;
      await tx.$executeRaw`DROP POLICY IF EXISTS "user_update_non_credits" ON "User";`;
      await tx.$executeRaw`DROP POLICY IF EXISTS "user_insert_self" ON "User";`;
      await tx.$executeRaw`DROP POLICY IF EXISTS "user_service_role" ON "User";`;
      
      await tx.$executeRaw`DROP POLICY IF EXISTS "usercredit_select_own" ON "UserCredit";`;
      await tx.$executeRaw`DROP POLICY IF EXISTS "usercredit_service_role_only" ON "UserCredit";`;
      await tx.$executeRaw`DROP POLICY IF EXISTS "usercredit_update_service_role" ON "UserCredit";`;
      await tx.$executeRaw`DROP POLICY IF EXISTS "usercredit_delete_service_role" ON "UserCredit";`;
      
      await tx.$executeRaw`DROP POLICY IF EXISTS "paymentlog_select_own" ON "PaymentLog";`;
      await tx.$executeRaw`DROP POLICY IF EXISTS "paymentlog_insert_service_role" ON "PaymentLog";`;
      await tx.$executeRaw`DROP POLICY IF EXISTS "paymentlog_service_role_all" ON "PaymentLog";`;
      
      // Log the rollback
      await tx.$executeRaw`
        INSERT INTO security.audit_log (table_name, operation, metadata)
        VALUES ('migration', 'phase3_rollback', jsonb_build_object('timestamp', now()));
      `;
    });
    
    console.log('✅ Rollback completed successfully!');
    
    // Verify rollback
    const status = await prisma.$queryRaw<any[]>`
      SELECT tablename, rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename IN ('User', 'UserCredit', 'PaymentLog');
    `;
    
    console.log('\n📊 Current status:');
    status.forEach((table: any) => {
      console.log(`   ${table.tablename}: RLS ${table.rowsecurity ? 'STILL ENABLED ⚠️' : 'Disabled ✅'}`);
    });
    
  } catch (error) {
    console.error('\n❌ Rollback failed:', error);
    console.log('\n⚠️  Manual intervention may be required!');
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

main();
