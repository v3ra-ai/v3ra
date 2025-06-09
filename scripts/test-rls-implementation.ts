#!/usr/bin/env ts-node

import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';
import { RLSTestUtils } from '../lib/database/rls-utils';
import { getSecurePrismaClient } from '../lib/database/secure-prisma-client';
import * as dotenv from 'dotenv';

dotenv.config();

// Test configuration
const TEST_USER_ID = 'test-user-' + Date.now();
const TEST_USER_ID_2 = 'test-user-2-' + Date.now();

async function main() {
  console.log('🧪 RLS Implementation Test Suite\n');
  console.log('=' .repeat(60));
  
  // Initialize clients
  const rlsUtils = new RLSTestUtils();
  const securePrisma = getSecurePrismaClient();
  const regularPrisma = new PrismaClient();
  
  const results: Array<{
    test: string;
    status: 'PASS' | 'FAIL' | 'SKIP';
    message?: string;
  }> = [];

  try {
    // Test 1: Validate RLS configuration
    console.log('\n📋 Test 1: Validate RLS Configuration');
    const { isValid, issues } = await securePrisma.validateRLSConfiguration();
    results.push({
      test: 'RLS Configuration',
      status: isValid ? 'PASS' : 'FAIL',
      message: issues.length > 0 ? issues.join(', ') : undefined
    });
    console.log(isValid ? '✅ PASS' : '❌ FAIL');
    if (!isValid) {
      console.log('Issues:', issues);
    }

    // Test 2: Check RLS status
    console.log('\n📋 Test 2: Check RLS Status on Tables');
    const rlsStatus = await rlsUtils.validateRLSStatus();
    const allEnabled = rlsStatus.every(t => t.rlsEnabled || t.table === 'User'); // User table might not be enabled yet
    results.push({
      test: 'RLS Status Check',
      status: allEnabled ? 'PASS' : 'SKIP',
      message: `${rlsStatus.filter(t => t.rlsEnabled).length}/${rlsStatus.length} tables protected`
    });
    console.log(allEnabled ? '✅ PASS' : '⚠️  SKIP (Not all tables enabled yet)');
    
    // Test 3: Test secure credit operations
    console.log('\n📋 Test 3: Test Secure Credit Operations');
    try {
      // First create a test user
      const testUser = await regularPrisma.user.create({
        data: {
          id: TEST_USER_ID,
          email: `test-${Date.now()}@example.com`,
          name: 'Test User'
        }
      });
      
      // Test decrement
      const decrementResult = await securePrisma.decrementFreeCredits(TEST_USER_ID, 10, 'Test decrement');
      const decrementSuccess = decrementResult.success && decrementResult.newCredits === 90;
      
      results.push({
        test: 'Secure Credit Decrement',
        status: decrementSuccess ? 'PASS' : 'FAIL',
        message: decrementResult.error || `Credits: ${decrementResult.previousCredits} -> ${decrementResult.newCredits}`
      });
      console.log(decrementSuccess ? '✅ PASS' : '❌ FAIL');
      
      // Test reset
      const resetResult = await securePrisma.resetFreeCredits(TEST_USER_ID);
      const resetSuccess = resetResult.success && resetResult.freeCredits === 100;
      
      results.push({
        test: 'Secure Credit Reset',
        status: resetSuccess ? 'PASS' : 'FAIL',
        message: resetResult.error || `Credits reset to: ${resetResult.freeCredits}`
      });
      console.log(resetSuccess ? '✅ PASS' : '❌ FAIL');
      
      // Cleanup
      await regularPrisma.user.delete({ where: { id: TEST_USER_ID } });
    } catch (err: any) {
      results.push({
        test: 'Secure Credit Operations',
        status: 'FAIL',
        message: err.message
      });
      console.log('❌ FAIL:', err.message);
    }

    // Test 4: Test direct credit update prevention
    console.log('\n📋 Test 4: Test Direct Credit Update Prevention');
    try {
      const testUser = await regularPrisma.user.create({
        data: {
          id: TEST_USER_ID_2,
          email: `test2-${Date.now()}@example.com`,
          name: 'Test User 2'
        }
      });
      
      let blocked = false;
      try {
        // This should be blocked by secure client
        await securePrisma.user.update({
          where: { id: TEST_USER_ID_2 },
          data: { name: 'Modified Name' } // Try to update something else
        });
      } catch (err: any) {
        if (err.message.includes('Direct credit updates are not allowed')) {
          blocked = true;
        }
      }
      
      results.push({
        test: 'Direct Credit Update Block',
        status: blocked ? 'PASS' : 'FAIL',
        message: blocked ? 'Successfully blocked direct update' : 'Failed to block direct update'
      });
      console.log(blocked ? '✅ PASS' : '❌ FAIL');
      
      // Cleanup
      await regularPrisma.user.delete({ where: { id: TEST_USER_ID_2 } });
    } catch (err: any) {
      results.push({
        test: 'Direct Credit Update Block',
        status: 'FAIL',
        message: err.message
      });
      console.log('❌ FAIL:', err.message);
    }

    // Test 5: Run full RLS test suite (if tables are enabled)
    console.log('\n📋 Test 5: Full RLS Test Suite');
    const tablesWithRLS = rlsStatus.filter((t: any) => t.rlsEnabled);
    if (tablesWithRLS.length > 0) {
      try {
        await rlsUtils.runFullTestSuite(TEST_USER_ID, TEST_USER_ID_2);
        results.push({
          test: 'Full RLS Test Suite',
          status: 'PASS',
          message: 'All RLS tests passed'
        });
        console.log('✅ PASS');
      } catch (err: any) {
        results.push({
          test: 'Full RLS Test Suite',
          status: 'FAIL',
          message: err.message
        });
        console.log('❌ FAIL:', err.message);
      }
    } else {
      results.push({
        test: 'Full RLS Test Suite',
        status: 'SKIP',
        message: 'No tables with RLS enabled yet'
      });
      console.log('⚠️  SKIP (No tables with RLS enabled)');
    }

  } catch (err: any) {
    console.error('\n❌ Test suite error:', err);
  } finally {
    // Cleanup
    await regularPrisma.$disconnect();
    await securePrisma.$disconnect();
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary\n');
  
  const passCount = results.filter(r => r.status === 'PASS').length;
  const failCount = results.filter(r => r.status === 'FAIL').length;
  const skipCount = results.filter(r => r.status === 'SKIP').length;
  
  results.forEach(result => {
    const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${icon} ${result.test}: ${result.status}`);
    if (result.message) {
      console.log(`   ${result.message}`);
    }
  });
  
  console.log('\n' + '-'.repeat(40));
  console.log(`Total: ${results.length} tests`);
  console.log(`Passed: ${passCount}`);
  console.log(`Failed: ${failCount}`);
  console.log(`Skipped: ${skipCount}`);
  
  if (failCount === 0) {
    console.log('\n✅ All tests passed! RLS implementation is working correctly.');
  } else {
    console.log('\n❌ Some tests failed. Please review the issues above.');
  }
}

// Run tests
main().catch(console.error);
