#!/usr/bin/env npx tsx

import { broadcastCustomQuery } from '../app/actions';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testValidatorQuery() {
  console.log('🧪 Testing Validator Query System\n');
  console.log('='.repeat(80));

  try {
    // Get some active validators with API keys
    const activeValidators = await prisma.validator.findMany({
      where: { 
        active: true,
        apiKeys: { some: {} }
      },
      include: { apiKeys: true },
      take: 5
    });

    console.log(`Found ${activeValidators.length} active validators with API keys\n`);

    // Test with a simple fact-check query
    const testQuery = "The Earth is round";
    const selectedIds = activeValidators.map(v => v.id);

    console.log('📤 Sending test query:', testQuery);
    console.log('Selected validators:', activeValidators.map(v => `${v.profileName} (${v.provider})`).join(', '));
    console.log('\n' + '-'.repeat(60) + '\n');

    const result = await broadcastCustomQuery(
      testQuery,
      'fact-check',
      selectedIds.length,
      selectedIds
    );

    if ('error' in result) {
      console.error('❌ Query failed:', result.error);
    } else {
      console.log('✅ Query successful!\n');
      console.log(`Session ID: ${result.id}`);
      console.log(`Consensus reached: ${result.isConsensusReached}`);
      console.log(`Consensus value: ${result.consensusValue}`);
      console.log(`\nVoting results:`);
      console.log(`  YES: ${result.votingResult.yes}`);
      console.log(`  NO: ${result.votingResult.no}`);
      console.log(`  ERROR: ${result.votingResult.notVoted}`);
      
      console.log('\nValidator responses:');
      result.validatorResponses.forEach((response, i) => {
        console.log(`\n${i + 1}. ${response.profileName} (${response.provider})`);
        console.log(`   Vote: ${response.vote}`);
        console.log(`   Rationale: ${response.rationale.substring(0, 100)}...`);
      });
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testValidatorQuery();