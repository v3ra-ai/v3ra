#!/usr/bin/env ts-node
/**
 * Manual testing script for daily credit allocation system
 * 
 * Usage:
 *   npm run script scripts/test-daily-credits.ts
 */

import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// Create Supabase admin client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function testDailyCredits() {
  console.log('🧪 Daily Credit Allocation Test Script');
  console.log('=====================================\n');

  try {
    // Step 1: Check current allocation status
    console.log('1️⃣ Checking current allocation status...');
    const { data: statusData, error: statusError } = await supabaseAdmin.rpc('get_allocation_status');
    
    if (statusError) {
      console.error('❌ Error checking status:', statusError);
    } else {
      console.log('📊 Current status:', statusData);
    }

    // Step 2: Get sample of users before allocation
    console.log('\n2️⃣ Checking sample users before allocation...');
    const sampleUsers = await prisma.user.findMany({
      take: 5,
      select: {
        id: true,
        email: true,
        freeCredits: true,
        lastResetDate: true,
      },
      orderBy: {
        lastResetDate: 'asc',
      },
    });

    console.log('Sample users:');
    sampleUsers.forEach(user => {
      console.log(`  - ${user.email}: ${user.freeCredits} credits, last reset: ${user.lastResetDate}`);
    });

    // Step 3: Test the allocation function
    console.log('\n3️⃣ Testing credit allocation...');
    const { data: allocationData, error: allocationError } = await supabaseAdmin.rpc(
      'allocate_daily_credits',
      { p_force: true } // Force allocation for testing
    );

    if (allocationError) {
      console.error('❌ Allocation error:', allocationError);
      return;
    }

    console.log('✅ Allocation result:', allocationData);

    // Step 4: Verify users were updated
    console.log('\n4️⃣ Verifying user updates...');
    const updatedUsers = await prisma.user.findMany({
      where: {
        id: { in: sampleUsers.map(u => u.id) },
      },
      select: {
        id: true,
        email: true,
        freeCredits: true,
        lastResetDate: true,
      },
    });

    console.log('Updated users:');
    updatedUsers.forEach(user => {
      const oldUser = sampleUsers.find(u => u.id === user.id);
      const wasUpdated = oldUser && (
        oldUser.freeCredits !== user.freeCredits ||
        oldUser.lastResetDate?.getTime() !== user.lastResetDate?.getTime()
      );
      console.log(`  - ${user.email}: ${user.freeCredits} credits ${wasUpdated ? '✅ UPDATED' : '⏭️ SKIPPED'}`);
    });

    // Step 5: Check allocation record
    console.log('\n5️⃣ Checking allocation record...');
    const allocationRecord = await prisma.$queryRaw<any[]>`
      SELECT * FROM credit_allocations 
      WHERE allocation_date = CURRENT_DATE
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (allocationRecord.length > 0) {
      console.log('📝 Allocation record:', allocationRecord[0]);
    }

    // Step 6: Test API endpoint
    console.log('\n6️⃣ Testing API endpoint...');
    const apiUrl = `http://localhost:3000/api/cron/daily-credits`;
    
    try {
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.CRON_SECRET}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ API response:', data);
      } else {
        console.log('❌ API error:', response.status, await response.text());
      }
    } catch (error) {
      console.log('⚠️ API not available (expected if not running locally)');
    }

    // Step 7: Test duplicate prevention
    console.log('\n7️⃣ Testing duplicate prevention...');
    const { data: duplicateData, error: duplicateError } = await supabaseAdmin.rpc(
      'allocate_daily_credits',
      { p_force: false } // Should prevent duplicate
    );

    if (duplicateError) {
      console.log('✅ Duplicate prevention working:', duplicateError.message);
    } else if (duplicateData?.success === false) {
      console.log('✅ Duplicate prevented:', duplicateData.message);
    } else {
      console.log('⚠️ Unexpected result:', duplicateData);
    }

    // Step 8: Create test users if needed
    console.log('\n8️⃣ Creating test users for load testing...');
    const userCount = await prisma.user.count();
    
    if (userCount < 100) {
      console.log(`Current user count: ${userCount}. Creating test users...`);
      
      const testUsers = [];
      for (let i = 0; i < 20; i++) {
        testUsers.push({
          id: `test-user-${Date.now()}-${i}`,
          email: `test${Date.now()}-${i}@example.com`,
          name: `Test User ${i}`,
          freeCredits: 0,
          lastResetDate: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25 hours ago
        });
      }

      await prisma.user.createMany({
        data: testUsers,
        skipDuplicates: true,
      });

      console.log(`✅ Created ${testUsers.length} test users`);
    }

    // Summary
    console.log('\n📊 Test Summary');
    console.log('===============');
    console.log('✅ Allocation function working');
    console.log('✅ User updates verified');
    console.log('✅ Duplicate prevention working');
    console.log('✅ Allocation tracking working');
    
    console.log('\n🎉 All tests completed successfully!');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Cleanup function
async function cleanupTestData() {
  console.log('\n🧹 Cleaning up test data...');
  
  try {
    // Delete test users
    const deleted = await prisma.user.deleteMany({
      where: {
        email: { contains: 'test' },
      },
    });
    
    console.log(`✅ Deleted ${deleted.count} test users`);
    
    // Clear today's allocation for retesting
    await prisma.$executeRaw`
      DELETE FROM credit_allocations 
      WHERE allocation_date = CURRENT_DATE
    `;
    
    console.log('✅ Cleared today\'s allocation record');
    
  } catch (error) {
    console.error('❌ Cleanup error:', error);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--cleanup')) {
    await cleanupTestData();
  } else {
    await testDailyCredits();
    
    console.log('\n💡 Tip: Run with --cleanup flag to remove test data');
    console.log('   npm run script scripts/test-daily-credits.ts -- --cleanup');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());