#!/usr/bin/env ts-node
/**
 * RLS Phase 3 Testing Script
 * Tests critical table RLS policies for User, UserCredit, and PaymentLog
 */

import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize clients
const prisma = new PrismaClient();
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Check required env vars
if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

// Create Supabase clients
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

interface TestResult {
  test: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

async function runTest(testName: string, testFn: () => Promise<boolean>): Promise<void> {
  try {
    const passed = await testFn();
    results.push({ test: testName, passed });
    console.log(`${passed ? '✅' : '❌'} ${testName}`);
  } catch (error) {
    results.push({ test: testName, passed: false, error: String(error) });
    console.log(`❌ ${testName}: ${error}`);
  }
}

async function testPhase3RLS() {
  console.log('🔍 Testing RLS Phase 3: Critical Tables\n');

  // Create test users
  const testUser1 = {
    id: 'test-user-1',
    email: 'test1@example.com',
    name: 'Test User 1',
    freeCredits: 100
  };

  const testUser2 = {
    id: 'test-user-2',
    email: 'test2@example.com', 
    name: 'Test User 2',
    freeCredits: 50
  };

  try {
    // Setup: Create test users using service role
    console.log('📝 Setting up test users...');
    await prisma.user.createMany({
      data: [testUser1, testUser2],
      skipDuplicates: true
    });

    // Create user credits
    await prisma.userCredit.create({
      data: {
        id: 'credit1',
        walletPublicKey: 'wallet1',
        credits: 100,
        userId: testUser1.id
      }
    });
      
    await prisma.userCredit.create({
      data: {
        id: 'credit2',
        walletPublicKey: 'wallet2',
        credits: 50,
        userId: testUser2.id
      }
    });

    // ==========================================
    // USER TABLE TESTS
    // ==========================================
    console.log('\n📋 Testing User table policies...\n');

    // Test 1: User can view own data
    await runTest('User can view own data', async () => {
      const { data, error } = await supabaseAnon
        .from('User')
        .select('*')
        .eq('id', testUser1.id)
        .single();
      return !error && data?.id === testUser1.id;
    });

    // Test 2: User cannot view other user's data
    await runTest('User cannot view other user data', async () => {
      const { data, error } = await supabaseAnon
        .from('User')
        .select('*')
        .eq('id', testUser2.id)
        .single();
      return error?.code === 'PGRST116' || !data; // No rows returned
    });

    // Test 3: User cannot update freeCredits directly
    await runTest('User cannot update freeCredits directly', async () => {
      const { error } = await supabaseAnon
        .from('User')
        .update({ freeCredits: 999 })
        .eq('id', testUser1.id);
      return error !== null;
    });

    // Test 4: User can update other fields
    await runTest('User can update non-credit fields', async () => {
      const { error } = await supabaseAnon
        .from('User')
        .update({ name: 'Updated Name' })
        .eq('id', testUser1.id);
      return error === null;
    });

    // Test 5: Service role can update freeCredits
    await runTest('Service role can update freeCredits', async () => {
      const { error } = await supabaseService
        .from('User')
        .update({ freeCredits: 150 })
        .eq('id', testUser1.id);
      return error === null;
    });

    // ==========================================
    // USERCREDIT TABLE TESTS
    // ==========================================
    console.log('\n💳 Testing UserCredit table policies...\n');

    // Test 6: User can view own credits
    await runTest('User can view own credit balance', async () => {
      const { data, error } = await supabaseAnon
        .from('UserCredit')
        .select('*')
        .eq('userId', testUser1.id)
        .single();
      return !error && data?.userId === testUser1.id;
    });

    // Test 7: User cannot view other's credits
    await runTest('User cannot view other user credits', async () => {
      const { data, error } = await supabaseAnon
        .from('UserCredit')
        .select('*')
        .eq('userId', testUser2.id);
      return error?.code === 'PGRST116' || data?.length === 0;
    });

    // Test 8: User cannot update credits directly
    await runTest('User cannot update credits directly', async () => {
      const { error } = await supabaseAnon
        .from('UserCredit')
        .update({ credits: 9999 })
        .eq('userId', testUser1.id);
      return error !== null;
    });

    // Test 9: Service role can update credits
    await runTest('Service role can update credits', async () => {
      const { error } = await supabaseService
        .from('UserCredit')
        .update({ credits: 10 })
        .eq('userId', testUser1.id);
      return error === null;
    });

    // ==========================================
    // PAYMENTLOG TABLE TESTS
    // ==========================================
    console.log('\n📊 Testing PaymentLog table policies...\n');

    // Create test payment log
    await prisma.paymentLog.create({
      data: {
        id: 'payment1',
        walletPublicKey: 'wallet1',
        credits: 100,
        solAmount: 0.1,
        status: 'completed'
      }
    });

    // Test 10: User can view own payment logs
    await runTest('User can view own payment logs', async () => {
      const { data, error } = await supabaseAnon
        .from('PaymentLog')
        .select('*')
        .eq('walletPublicKey', 'wallet1');
      return !error && data && data.length > 0;
    });

    // Test 11: User cannot view other's payment logs
    await runTest('User cannot view other payment logs', async () => {
      const { data, error } = await supabaseAnon
        .from('PaymentLog')
        .select('*')
        .eq('walletPublicKey', 'wallet2');
      return error?.code === 'PGRST116' || data?.length === 0;
    });

    // Test 12: User cannot create payment logs
    await runTest('User cannot create payment logs', async () => {
      const { error } = await supabaseAnon
        .from('PaymentLog')
        .insert({
          id: 'payment-test-hack',
          walletPublicKey: 'wallet1',
          credits: 999,
          solAmount: 0.1,
          status: 'hacked'
        });
      return error !== null;
    });

    // ==========================================
    // SECURE FUNCTIONS TESTS
    // ==========================================
    console.log('\n🔐 Testing secure credit functions...\n');

    // Test 13: Decrement credits via secure function
    await runTest('Secure decrement_free_credits function works', async () => {
      const { data, error } = await supabaseService.rpc('decrement_free_credits', {
        p_user_id: testUser1.id,
        p_amount: 10,
        p_reason: 'Test usage'
      });
      return !error && typeof data === 'number';
    });

    // Test 14: Reset credits via secure function
    await runTest('Secure reset_free_credits function works', async () => {
      const { data, error } = await supabaseService.rpc('reset_free_credits', {
        p_user_id: testUser1.id,
        p_new_amount: 100,
        p_reason: 'Test reset'
      });
      return !error && data === true;
    });

    // ==========================================
    // MONITORING FUNCTION TEST
    // ==========================================
    console.log('\n📊 Testing monitoring function...\n');

    // Test 15: Monitor critical tables function
    await runTest('Monitor critical tables function works', async () => {
      const { data, error } = await supabaseService.rpc('monitor_critical_tables');
      return !error && data && data.length === 3;
    });

  } catch (error) {
    console.error('Test setup failed:', error);
  } finally {
    // Cleanup test data
    console.log('\n🧹 Cleaning up test data...');
    await prisma.paymentLog.deleteMany({
      where: { id: { startsWith: 'payment' } }
    });
    await prisma.userCredit.deleteMany({
      where: { userId: { in: [testUser1.id, testUser2.id] } }
    });
    await prisma.user.deleteMany({
      where: { id: { in: [testUser1.id, testUser2.id] } }
    });
  }

  // Summary
  console.log('\n📊 Test Summary:');
  console.log('================');
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  console.log(`Total: ${results.length}`);
  console.log(`Passed: ${passed} ✅`);
  console.log(`Failed: ${failed} ❌`);
  
  if (failed > 0) {
    console.log('\nFailed tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`- ${r.test}: ${r.error || 'Failed'}`);
    });
  }

  return failed === 0;
}

// Run tests
testPhase3RLS()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
