import { PrismaClient } from '@prisma/client';
import { V3RAPointsService } from '../lib/services/v3ra-points';
import 'dotenv/config';

const prisma = new PrismaClient();

async function testPointsSystem() {
  console.log('🔍 Testing V3RA Points System\n');

  // Test user ID (you can change this to your actual user ID)
  const testUserId = process.argv[2];
  
  if (!testUserId) {
    console.log('Usage: npx tsx scripts/test-points-system.ts <user-id>');
    console.log('\nFinding existing users with points...');
    
    const users = await prisma.userPoints.findMany({
      take: 5,
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        }
      },
      orderBy: {
        balance: 'desc'
      }
    });
    
    if (users.length > 0) {
      console.log('\nUsers with points:');
      users.forEach(up => {
        console.log(`- ${up.user.email} (${up.userId}): ${up.balance} points`);
      });
    }
    
    await prisma.$disconnect();
    return;
  }

  try {
    // Test 1: Get user points
    console.log('1️⃣ Getting user points:');
    const points = await V3RAPointsService.getUserPoints(testUserId);
    console.log(`   Balance: ${points.balance}`);
    console.log(`   Total Earned: ${points.totalEarned}`);
    console.log(`   Total Spent: ${points.totalSpent}`);
    console.log(`   Level: ${points.level}`);
    console.log(`   Streak: ${points.streak}`);

    // Test 2: Check if daily bonus is available
    console.log('\n2️⃣ Checking daily bonus:');
    const canClaim = await V3RAPointsService.canClaimDailyBonus(testUserId);
    console.log(`   Can claim: ${canClaim ? '✅ Yes' : '❌ No'}`);

    if (canClaim) {
      console.log('   Claiming daily bonus...');
      const result = await V3RAPointsService.claimDailyBonus(testUserId);
      console.log(`   ✅ Claimed ${result.bonusAmount} points!`);
      console.log(`   New balance: ${result.newBalance}`);
      console.log(`   Streak: ${result.streak}`);
    }

    // Test 3: Recent transactions
    console.log('\n3️⃣ Recent transactions:');
    const transactions = await prisma.pointsTransaction.findMany({
      where: { userId: testUserId },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    if (transactions.length > 0) {
      transactions.forEach(tx => {
        console.log(`   ${tx.type}: ${tx.amount > 0 ? '+' : ''}${tx.amount} points`);
        console.log(`     ${tx.description || 'No description'}`);
        console.log(`     ${tx.createdAt.toISOString()}`);
      });
    } else {
      console.log('   No transactions found');
    }

    // Test 4: Check vote submission function
    console.log('\n4️⃣ Testing vote submission function:');
    const functionExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT 1 
        FROM pg_proc 
        WHERE proname = 'submit_vote_with_reward'
      ) as exists;
    `;
    console.log(`   submit_vote_with_reward function: ${functionExists[0].exists ? '✅ Exists' : '❌ Missing'}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPointsSystem().catch(console.error);