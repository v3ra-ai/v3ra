#!/usr/bin/env ts-node
/**
 * Apply RLS Migrations Script
 * Applies all three phases of RLS implementation
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function applyMigration(migrationPath: string, phaseName: string) {
  console.log(`\n📋 Applying ${phaseName}...`);
  
  try {
    const sql = await fs.readFile(migrationPath, 'utf-8');
    
    // Execute the migration
    await prisma.$executeRawUnsafe(sql);
    
    console.log(`✅ ${phaseName} applied successfully!`);
    return true;
  } catch (error: any) {
    console.error(`❌ Error applying ${phaseName}:`, error.message);
    
    // Check if it's because it's already applied
    if (error.message.includes('already exists')) {
      console.log(`ℹ️  ${phaseName} appears to be already applied (partial or full)`);
      return false;
    }
    throw error;
  }
}

async function checkRLSStatus() {
  const result = await prisma.$queryRaw<any[]>`
    SELECT 
      tablename,
      rowsecurity,
      (SELECT COUNT(*) FROM pg_policies WHERE pg_policies.tablename = pg_tables.tablename) as policy_count
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename IN ('User', 'UserCredit', 'PaymentLog', 'Feedback', 'Thread', 'Reply', 'GraphEdge')
    ORDER BY tablename;
  `;
  
  const enabledCount = result.filter((r: any) => r.rowsecurity).length;
  console.log(`\n📊 RLS Status: ${enabledCount}/${result.length} tables protected`);
  
  return result;
}

async function main() {
  console.log('🚀 Starting RLS Migration Process');
  console.log('==================================\n');
  
  try {
    // Check initial status
    console.log('📍 Initial RLS Status:');
    await checkRLSStatus();
    
    const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
    
    // Phase 1: Security Infrastructure
    const phase1Path = path.join(migrationsDir, '20240101000001_rls_phase1_security_infrastructure.sql');
    const phase1Applied = await applyMigration(phase1Path, 'Phase 1: Security Infrastructure');
    
    // Phase 2: Low-Risk Tables
    const phase2Path = path.join(migrationsDir, '20240102000001_rls_phase2_low_risk_tables.sql');
    const phase2Applied = await applyMigration(phase2Path, 'Phase 2: Low-Risk Tables');
    
    // Check status after Phase 2
    console.log('\n📍 Status after Phase 1 & 2:');
    await checkRLSStatus();
    
    // Ask for confirmation before Phase 3
    console.log('\n⚠️  Phase 3 will enable RLS on CRITICAL tables:');
    console.log('   - User (contains freeCredits)');
    console.log('   - UserCredit (financial data)');
    console.log('   - PaymentLog (transaction history)');
    console.log('\n🔴 This is a HIGH-RISK operation!');
    console.log('   Make sure you have:');
    console.log('   1. Created a full database backup');
    console.log('   2. Tested in staging environment');
    console.log('   3. Prepared rollback scripts');
    
    // For now, let's stop here and let the user manually apply Phase 3
    console.log('\n📋 To apply Phase 3, run:');
    console.log('   npx ts-node scripts/apply-rls-phase3.ts');
    
    // Final status check
    console.log('\n📍 Final RLS Status:');
    const finalStatus = await checkRLSStatus();
    
    // Check secure functions
    const functions = await prisma.$queryRaw<any[]>`
      SELECT routine_name
      FROM information_schema.routines
      WHERE routine_schema = 'security'
        AND routine_name IN ('decrement_free_credits', 'reset_free_credits', 'add_free_credits');
    `;
    
    console.log(`\n💳 Secure credit functions: ${functions.length}/3 installed`);
    functions.forEach((fn: any) => {
      console.log(`   ✅ ${fn.routine_name}`);
    });
    
    console.log('\n✅ Phase 1 & 2 Migration Complete!');
    console.log('   Next: Apply Phase 3 for critical tables');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check your DATABASE_URL is set correctly');
    console.log('2. Ensure you have proper permissions');
    console.log('3. Review the error message above');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
