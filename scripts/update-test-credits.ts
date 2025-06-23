#!/usr/bin/env npx tsx

import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

config();

const prisma = new PrismaClient();

async function updateTestCredits() {
  console.log('💰 Updating Test Credits\n');
  console.log('='.repeat(80));

  const userEmail = 'jeremy@shoprefit.com'; // Your email from the logs
  const newCreditAmount = 1000;

  try {
    // First, check if user exists
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: { userCredit: true }
    });

    if (!user) {
      console.log('❌ User not found. Creating user...');
      
      // Create user if doesn't exist
      const newUser = await prisma.user.create({
        data: {
          email: userEmail,
          name: 'Test User',
          freeCredits: newCreditAmount,
        }
      });
      
      console.log(`✅ Created user with ${newCreditAmount} free credits`);
      console.log(`   Email: ${newUser.email}`);
      console.log(`   Free Credits: ${newUser.freeCredits}`);
    } else {
      console.log('✅ User found. Current balance:');
      console.log(`   Free Credits: ${user.freeCredits}`);
      
      // Check if user has UserCredit for purchased credits
      if (user.userCredit) {
        console.log(`   Purchased Credits (via wallet): ${user.userCredit.credits}`);
        console.log(`   Total: ${user.freeCredits + user.userCredit.credits}`);
      } else {
        console.log(`   Purchased Credits: 0 (no wallet linked)`);
        console.log(`   Total: ${user.freeCredits}`);
      }
      
      // Update free credits
      const updatedUser = await prisma.user.update({
        where: { email: userEmail },
        data: {
          freeCredits: newCreditAmount,
        }
      });
      
      console.log('\n💳 Updated balance:');
      console.log(`   Free Credits: ${updatedUser.freeCredits}`);
      if (user.userCredit) {
        console.log(`   Purchased Credits: ${user.userCredit.credits}`);
        console.log(`   Total: ${updatedUser.freeCredits + user.userCredit.credits}`);
      } else {
        console.log(`   Total: ${updatedUser.freeCredits}`);
      }
    }

    console.log('\n✨ Credits updated successfully!');
    console.log('   You now have 1000 free credits for testing.');

  } catch (error) {
    console.error('\n❌ Error updating credits:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateTestCredits();