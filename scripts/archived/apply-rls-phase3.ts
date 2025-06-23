#!/usr/bin/env ts-node
/**
 * Apply RLS Phase 3 - Critical Tables
 * HIGH RISK: Enables RLS on User, UserCredit, and PaymentLog tables
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import readline from 'readline';

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

async function preflightChecks() {
  console.log('🔍 Running preflight checks...\n');
  
  // Check if Phase 1 & 2 are applied
  const securitySchema = await prisma.$queryRaw<any[]>`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.schemata 
      WHERE schema_name = 'security'
    ) as exists;
  `;
  
  if (!securitySchema[0].exists) {
    throw new Error('Security schema missing! Apply Phase 1 first.');
  }
  
  // Check if low-risk tables have RLS
  const lowRiskStatus = await prisma.$queryRaw<any[]>`
    SELECT COUNT(*) as count
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename IN ('Feedback', 'Thread', 'Reply', 'GraphEdge')
      AND rowsecurity = true;
  `;
  
  if (lowRiskStatus[0].count < 4) {
    console.warn('⚠️  Warning: Not all low-risk tables have RLS enabled.');
    console.warn('   It\'s recommended to apply Phase 2 first.\n');
  }
  
  // Check current critical table status
  const criticalStatus = await prisma.$queryRaw<any[]>`
    SELECT 
      tablename,
      rowsecurity
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename IN ('User', 'UserCredit', 'PaymentLog')
    ORDER BY tablename;
  `;
  
  console.log('📊 Current critical table status:');
  criticalStatus.forEach((table: any) => {
    console.log(`   ${table.tablename}: ${table.rowsecurity ? '✅ RLS Enabled' : '❌ RLS Disabled'}`);
  });
  
  return criticalStatus.every((t: any) => !t.rowsecurity);
}

async function main() {
  console.log('🚨 RLS Phase 3: Critical Tables Migration');
  console.log('=========================================\n');
  console.log('⚠️  THIS IS A HIGH-RISK OPERATION!');
  console.log('   Enabling RLS on: User, UserCredit, PaymentLog\n');
  
  try {
    // Run preflight checks
    const canProceed = await preflightChecks();
    
    if (!canProceed) {
      console.log('\n✅ Critical tables already have RLS enabled!');
      rl.close();
      return;
    }
    
    // Confirmation prompts
    console.log('\n📋 Pre-deployment checklist:');
    const backup = await askQuestion('1. Have you created a full database backup? (yes/no): ');
    if (backup.toLowerCase() !== 'yes') {
      console.log('❌ Please create a backup first!');
      console.log('   Run: pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql');
      rl.close();
      return;
    }
    
    const tested = await askQuestion('2. Have you tested this in staging? (yes/no): ');
    if (tested.toLowerCase() !== 'yes') {
      console.log('⚠️  Warning: It\'s strongly recommended to test in staging first!');
    }
    
    const rollback = await askQuestion('3. Do you have the rollback script ready? (yes/no): ');
    if (rollback.toLowerCase() !== 'yes') {
      console.log('❌ Please prepare the rollback script first!');
      rl.close();
      return;
    }
    
    const confirm = await askQuestion('\n🔴 Final confirmation: Apply RLS to critical tables? (type "APPLY RLS" to confirm): ');
    if (confirm !== 'APPLY RLS') {
      console.log('❌ Migration cancelled.');
      rl.close();
      return;
    }
    
    // Apply the migration
    console.log('\n🚀 Applying Phase 3 migration...');
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20240103000001_rls_phase3_critical_tables.sql');
    const sql = await fs.readFile(migrationPath, 'utf-8');
    
    await prisma.$executeRawUnsafe(sql);
    
    console.log('✅ Phase 3 migration applied successfully!');
    
    // Verify the migration
    console.log('\n🔍 Verifying migration...');
    const verification = await prisma.$queryRaw<any[]>`
      SELECT * FROM security.monitor_critical_tables();
    `;
    
    console.log('\n📊 Critical table protection status:');
    verification.forEach((table: any) => {
      console.log(`   ${table.table_name}:`);
      console.log(`     - RLS Enabled: ${table.rls_enabled ? '✅' : '❌'}`);
      console.log(`     - Policies: ${table.policy_count}`);
      console.log(`     - Service Bypass: ${table.has_service_bypass ? '✅' : '❌'}`);
      if (table.table_name === 'User') {
        console.log(`     - Credit Protection: ${table.has_credit_protection ? '✅' : '❌'}`);
      }
    });
    
    // Test secure functions
    console.log('\n🧪 Testing secure credit functions...');
    try {
      // Test with a dummy user ID (this should fail if no user exists, but function should work)
      await prisma.$queryRaw`SELECT security.decrement_free_credits('00000000-0000-0000-0000-000000000000'::uuid, 0, 'test');`;
      console.log('   ✅ decrement_free_credits function accessible');
    } catch (error: any) {
      if (error.message.includes('User not found')) {
        console.log('   ✅ decrement_free_credits function working (user validation active)');
      } else {
        console.log('   ⚠️  decrement_free_credits function error:', error.message);
      }
    }
    
    console.log('\n✅ Phase 3 Migration Complete!');
    console.log('\n📋 Next steps:');
    console.log('1. Update API routes to use secure credit functions');
    console.log('2. Run the full RLS test suite: npm run rls:test');
    console.log('3. Monitor the RLS dashboard for any issues');
    console.log('4. Keep the rollback script handy for 24-48 hours');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.log('\n🔧 If you need to rollback, run:');
    console.log('   npx ts-node scripts/rollback-rls-phase3.ts');
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

main();
