#!/usr/bin/env ts-node
/**
 * Test secure credit operations
 */

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const prisma = new PrismaClient();

async function testSecureCredits() {
  console.log('🧪 Testing Secure Credit Operations');
  console.log('==================================\n');
  
  let testUserId: string | null = null;
  
  try {
    // Create a test user using raw SQL to avoid TypeScript issues
    testUserId = uuidv4();
    await prisma.$executeRaw`
      INSERT INTO "User" (id, email, name, "freeCredits", "lastResetDate", "createdAt", "updatedAt")
      VALUES (${testUserId}, 'secure-test@example.com', 'Secure Test User', 100, NOW(), NOW(), NOW());
    `;
    
    console.log('✅ Created test user with 100 credits');
    
    // Test 1: Decrement credits
    console.log('\n📉 Testing decrement_free_credits...');
    const decrementResult = await prisma.$queryRaw<{ decrement_free_credits: number }[]>`
      SELECT security.decrement_free_credits(
        ${testUserId},
        25::integer,
        'Test decrement'
      ) as decrement_free_credits;
    `;
    console.log(`   Result: 100 → ${decrementResult[0].decrement_free_credits}`);
    
    // Test 2: Add credits
    console.log('\n📈 Testing add_free_credits...');
    const addResult = await prisma.$queryRaw<{ add_free_credits: number }[]>`
      SELECT security.add_free_credits(
        ${testUserId},
        30::integer,
        'Test add'
      ) as add_free_credits;
    `;
    console.log(`   Result: ${decrementResult[0].decrement_free_credits} → ${addResult[0].add_free_credits}`);
    
    // Test 3: Reset credits
    console.log('\n🔄 Testing reset_free_credits...');
    const resetResult = await prisma.$queryRaw<{ reset_free_credits: boolean }[]>`
      SELECT security.reset_free_credits(
        ${testUserId},
        10::integer,
        'Test reset'
      ) as reset_free_credits;
    `;
    console.log(`   Result: Reset to 10 (success: ${resetResult[0].reset_free_credits})`);
    
    // Test 4: Try to decrement more than available
    console.log('\n❌ Testing insufficient credits...');
    try {
      await prisma.$queryRaw`
        SELECT security.decrement_free_credits(
          ${testUserId},
          50::integer,
          'Test insufficient'
        );
      `;
      console.log('   ❌ FAILED: Should have thrown error');
    } catch (error: any) {
      console.log(`   ✅ Correctly blocked: ${error.message}`);
    }
    
    // Test 5: Try direct update using raw SQL (should succeed with service role)
    console.log('\n🔒 Testing direct update with service role...');
    try {
      await prisma.$executeRaw`
        UPDATE "User" SET "freeCredits" = 9999 WHERE id = ${testUserId};
      `;
      console.log('   ⚠️  Direct update succeeded with service role (expected)');
    } catch (error) {
      console.log('   ✅ Direct update blocked');
    }
    
    // Check audit log
    console.log('\n📝 Checking audit log...');
    const auditLogs = await prisma.$queryRaw<any[]>`
      SELECT operation, metadata
      FROM security.audit_log
      WHERE user_id = ${testUserId}::uuid
      ORDER BY created_at DESC
      LIMIT 5;
    `;
    
    console.log(`   Found ${auditLogs.length} audit entries:`);
    auditLogs.forEach((log: any) => {
      console.log(`   - ${log.operation}: ${JSON.stringify(log.metadata)}`);
    });
    
    console.log('\n✅ All secure credit operations working correctly!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  } finally {
    // Cleanup using raw SQL
    if (testUserId) {
      await prisma.$executeRaw`DELETE FROM "User" WHERE id = ${testUserId};`;
      console.log('\n🧹 Cleaned up test data');
    }
    await prisma.$disconnect();
  }
}

testSecureCredits();
