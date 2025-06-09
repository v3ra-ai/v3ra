#!/usr/bin/env ts-node
/**
 * Verify RLS is properly configured and secure functions work
 */

import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 RLS Verification Report');
  console.log('=========================\n');
  
  try {
    // 1. Check RLS status on all tables
    const rlsStatus = await prisma.$queryRaw<any[]>`
      SELECT 
        tablename,
        rowsecurity,
        (SELECT COUNT(*) FROM pg_policies WHERE pg_policies.tablename = pg_tables.tablename) as policy_count
      FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename IN ('User', 'UserCredit', 'PaymentLog', 'Feedback', 'Thread', 'Reply', 'GraphEdge')
      ORDER BY 
        CASE 
          WHEN tablename IN ('User', 'UserCredit', 'PaymentLog') THEN 0
          ELSE 1
        END,
        tablename;
    `;
    
    console.log('📊 RLS Status:');
    console.log('-------------');
    let criticalProtected = 0;
    let totalProtected = 0;
    
    rlsStatus.forEach((table: any) => {
      const status = table.rowsecurity ? '✅' : '❌';
      console.log(`${status} ${table.tablename}: RLS ${table.rowsecurity ? 'ENABLED' : 'DISABLED'} (${table.policy_count} policies)`);
      
      if (table.rowsecurity) {
        totalProtected++;
        if (['User', 'UserCredit', 'PaymentLog'].includes(table.tablename)) {
          criticalProtected++;
        }
      }
    });
    
    console.log(`\n📈 Summary: ${totalProtected}/${rlsStatus.length} tables protected`);
    console.log(`🔐 Critical tables: ${criticalProtected}/3 protected`);
    
    // 2. Check secure functions
    const functions = await prisma.$queryRaw<any[]>`
      SELECT 
        routine_name,
        security_type
      FROM information_schema.routines
      WHERE routine_schema = 'security'
        AND routine_name IN ('decrement_free_credits', 'reset_free_credits', 'add_free_credits')
      ORDER BY routine_name;
    `;
    
    console.log('\n💳 Secure Credit Functions:');
    console.log('-------------------------');
    functions.forEach((fn: any) => {
      console.log(`✅ ${fn.routine_name} (${fn.security_type})`);
    });
    
    // 3. Check audit log
    const auditLogs = await prisma.$queryRaw<any[]>`
      SELECT COUNT(*) as count FROM security.audit_log;
    `;
    
    console.log(`\n📝 Audit Log: ${auditLogs[0].count} entries`);
    
    // 4. Check specific policies
    const policies = await prisma.$queryRaw<any[]>`
      SELECT 
        tablename,
        policyname,
        permissive,
        cmd
      FROM pg_policies
      WHERE tablename IN ('User', 'UserCredit', 'PaymentLog')
      ORDER BY tablename, policyname;
    `;
    
    console.log('\n🛡️ Policy Details:');
    console.log('-----------------');
    let currentTable = '';
    policies.forEach((policy: any) => {
      if (policy.tablename !== currentTable) {
        currentTable = policy.tablename;
        console.log(`\n${currentTable}:`);
      }
      const type = policy.permissive === 'PERMISSIVE' ? '✅' : '🔒';
      console.log(`  ${type} ${policy.policyname} (${policy.cmd})`);
    });
    
    // 5. Test secure function (without auth)
    console.log('\n🧪 Testing Secure Functions:');
    console.log('---------------------------');
    
    try {
      // Create a test user
      const testUser = await prisma.user.create({
        data: {
          id: 'rls-test-user',
          email: 'rls-test@example.com',
          name: 'RLS Test User',
          freeCredits: 100
        }
      });
      
      // Test decrement function
      const result = await prisma.$queryRaw<any[]>`
        SELECT security.decrement_free_credits(${testUser.id}::uuid, 10, 'test decrement');
      `;
      console.log(`✅ decrement_free_credits: 100 → ${result[0].decrement_free_credits}`);
      
      // Test add function
      const addResult = await prisma.$queryRaw<any[]>`
        SELECT security.add_free_credits(${testUser.id}::uuid, 20, 'test add');
      `;
      console.log(`✅ add_free_credits: ${result[0].decrement_free_credits} → ${addResult[0].add_free_credits}`);
      
      // Test reset function
      const resetResult = await prisma.$queryRaw<any[]>`
        SELECT security.reset_free_credits(${testUser.id}::uuid, 50, 'test reset');
      `;
      console.log(`✅ reset_free_credits: → 50 (success: ${resetResult[0].reset_free_credits})`);
      
      // Cleanup
      await prisma.user.delete({ where: { id: testUser.id } });
      
    } catch (error: any) {
      console.error(`❌ Function test failed: ${error.message}`);
    }
    
    // 6. Check for direct credit update block
    const restrictivePolicies = await prisma.$queryRaw<any[]>`
      SELECT COUNT(*) as count
      FROM pg_policies
      WHERE tablename = 'User'
        AND policyname = 'user_block_credit_updates'
        AND permissive = 'RESTRICTIVE';
    `;
    
    console.log(`\n🔒 Credit Protection: ${restrictivePolicies[0].count > 0 ? '✅ ACTIVE' : '❌ NOT ACTIVE'}`);
    
    // Final verdict
    const allCriticalProtected = criticalProtected === 3;
    const hasFunctions = functions.length === 3;
    const hasCreditProtection = restrictivePolicies[0].count > 0;
    
    console.log('\n🎯 FINAL VERDICT:');
    console.log('================');
    if (allCriticalProtected && hasFunctions && hasCreditProtection) {
      console.log('✅ RLS IMPLEMENTATION COMPLETE AND SECURE!');
      console.log('\n📋 Next Steps:');
      console.log('1. Update API routes to use secure credit functions');
      console.log('2. Deploy RLS monitoring dashboard');
      console.log('3. Set up alerts for policy violations');
      console.log('4. Document emergency procedures');
    } else {
      console.log('⚠️  RLS IMPLEMENTATION INCOMPLETE:');
      if (!allCriticalProtected) console.log('  - Some critical tables not protected');
      if (!hasFunctions) console.log('  - Secure credit functions missing');
      if (!hasCreditProtection) console.log('  - Direct credit updates not blocked');
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
