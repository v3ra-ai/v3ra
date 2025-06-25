#!/usr/bin/env node
import * as dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Load environment variables
dotenv.config();

// Initialize Prisma client
const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

async function checkDatabaseConnection() {
  console.log('\n=== Database Connection Check ===');
  try {
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Check if required environment variables are set
    const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL;
    console.log(`✅ Database URL configured: ${dbUrl ? 'Yes' : 'No'}`);
    
    if (dbUrl) {
      // Mask sensitive parts of the URL
      const urlParts = dbUrl.match(/^(postgres:\/\/[^:]+):[^@]+@(.+)$/);
      if (urlParts) {
        console.log(`   Connection string format: ${urlParts[1]}:****@${urlParts[2]}`);
      }
    }
    
    // Check table existence
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    ` as Array<{ table_name: string }>;
    
    console.log(`✅ Found ${tables.length} tables in database`);
    
    const requiredTables = ['Validator', 'VoteSession', 'ValidatorResponse', 'ApiKey', 'ValidatorKey'];
    for (const table of requiredTables) {
      const exists = tables.some(t => t.table_name === table);
      console.log(`   ${exists ? '✅' : '❌'} Table "${table}" exists`);
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
  return true;
}

async function checkValidators() {
  console.log('\n=== Validators Check ===');
  try {
    // Count validators
    const validatorCount = await prisma.validator.count();
    console.log(`✅ Total validators in database: ${validatorCount}`);
    
    // Count active validators
    const activeCount = await prisma.validator.count({ where: { active: true } });
    console.log(`✅ Active validators: ${activeCount}`);
    
    // Check validators with API keys
    const validatorsWithKeys = await prisma.validator.findMany({
      include: { apiKeys: true },
      take: 5
    });
    
    console.log(`✅ Sample validators with API keys:`);
    validatorsWithKeys.forEach(v => {
      console.log(`   - ${v.profileName} (${v.provider}): ${v.apiKeys.length} keys`);
    });
    
    // Check if there are any validators without required fields
    const invalidValidators = await prisma.validator.findMany({
      where: {
        OR: [
          { profileName: null },
          { provider: null },
          { publicKey: null }
        ]
      }
    });
    
    if (invalidValidators.length > 0) {
      console.log(`⚠️  Found ${invalidValidators.length} validators with missing required fields`);
    }
    
  } catch (error) {
    console.error('❌ Validators check failed:', error);
    return false;
  }
  return true;
}

async function checkVoteHistory() {
  console.log('\n=== Vote History Check ===');
  try {
    // Count vote sessions
    const voteSessionCount = await prisma.voteSession.count();
    console.log(`✅ Total vote sessions: ${voteSessionCount}`);
    
    // Get recent vote sessions
    const recentSessions = await prisma.voteSession.findMany({
      take: 5,
      orderBy: { timestamp: 'desc' },
      include: {
        validatorResponses: {
          include: {
            validator: true
          }
        }
      }
    });
    
    console.log(`✅ Recent vote sessions:`);
    recentSessions.forEach(session => {
      const yesVotes = session.validatorResponses.filter(r => r.vote === 'YES').length;
      const noVotes = session.validatorResponses.filter(r => r.vote === 'NO').length;
      console.log(`   - ${session.queryText.substring(0, 50)}...`);
      console.log(`     Consensus: ${session.isConsensusReached ? 'Yes' : 'No'} | Yes: ${yesVotes}, No: ${noVotes}`);
    });
    
    // Check for orphaned validator responses
    const orphanedResponses = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM "ValidatorResponse" vr
      LEFT JOIN "Validator" v ON vr."validatorId" = v.id
      WHERE v.id IS NULL;
    ` as Array<{ count: bigint }>;
    
    const orphanedCount = Number(orphanedResponses[0]?.count || 0);
    if (orphanedCount > 0) {
      console.log(`⚠️  Found ${orphanedCount} orphaned validator responses`);
    }
    
  } catch (error) {
    console.error('❌ Vote history check failed:', error);
    return false;
  }
  return true;
}

async function checkApiEndpoints() {
  console.log('\n=== API Endpoints Check (for local testing) ===');
  
  // Only test if running locally
  if (process.env.NODE_ENV === 'production') {
    console.log('⚠️  Skipping API endpoint tests in production environment');
    return true;
  }
  
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  
  try {
    // Test validators endpoint
    console.log(`Testing ${baseUrl}/api/validators`);
    const validatorsResponse = await fetch(`${baseUrl}/api/validators`);
    if (validatorsResponse.ok) {
      const validators = await validatorsResponse.json();
      console.log(`✅ /api/validators returned ${validators.length} validators`);
    } else {
      console.log(`❌ /api/validators returned status ${validatorsResponse.status}`);
    }
    
    // Test vote-history endpoint
    console.log(`Testing ${baseUrl}/api/vote-history?limit=5`);
    const voteHistoryResponse = await fetch(`${baseUrl}/api/vote-history?limit=5`);
    if (voteHistoryResponse.ok) {
      const history = await voteHistoryResponse.json();
      console.log(`✅ /api/vote-history returned ${history.length} sessions`);
    } else {
      console.log(`❌ /api/vote-history returned status ${voteHistoryResponse.status}`);
    }
    
  } catch (error) {
    console.error('❌ API endpoint test failed:', error);
    return false;
  }
  return true;
}

async function checkEnvironmentVariables() {
  console.log('\n=== Environment Variables Check ===');
  
  const requiredVars = [
    'DATABASE_URL',
    'POSTGRES_PRISMA_URL',
    'POSTGRES_URL_NON_POOLING',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
  ];
  
  const optionalVars = [
    'VERCEL_URL',
    'NEXT_PUBLIC_SITE_URL',
    'VALIDATOR_CACHE_TTL',
    'VALIDATOR_CACHE_ENABLED',
  ];
  
  console.log('Required variables:');
  for (const varName of requiredVars) {
    const isSet = !!process.env[varName];
    console.log(`  ${isSet ? '✅' : '❌'} ${varName}: ${isSet ? 'Set' : 'Not set'}`);
  }
  
  console.log('\nOptional variables:');
  for (const varName of optionalVars) {
    const value = process.env[varName];
    console.log(`  ${value ? '✅' : '⚠️ '} ${varName}: ${value || 'Not set'}`);
  }
  
  return true;
}

async function main() {
  console.log('🔍 Diagnosing Vercel API Issues');
  console.log('================================');
  
  try {
    await checkEnvironmentVariables();
    const dbOk = await checkDatabaseConnection();
    
    if (dbOk) {
      await checkValidators();
      await checkVoteHistory();
    }
    
    await checkApiEndpoints();
    
    console.log('\n✅ Diagnostics complete');
    
  } catch (error) {
    console.error('\n❌ Diagnostic failed with error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run diagnostics
main().catch(console.error);