#!/usr/bin/env node
import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

// Load environment variables
config();

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testProductionSetup() {
  console.log('🔍 Testing Production Setup...\n');

  // Test 1: Environment Variables
  console.log('1️⃣ Checking Environment Variables:');
  const requiredEnvVars = [
    'DATABASE_URL',
    'POSTGRES_URL_NON_POOLING',
    'OPENROUTER_API_KEY',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ];

  let envVarsOk = true;
  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      console.log(`✅ ${envVar} is set`);
    } else {
      console.log(`❌ ${envVar} is MISSING`);
      envVarsOk = false;
    }
  }

  if (!envVarsOk) {
    console.log('\n⚠️  Some environment variables are missing!');
    console.log('Please check VERCEL_ENV_SETUP.md for the complete list.\n');
  }

  // Test 2: Database Connection
  console.log('\n2️⃣ Testing Database Connection:');
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Test 3: Check ai_models table
    console.log('\n3️⃣ Checking ai_models table:');
    const modelCount = await prisma.ai_models.count();
    console.log(`✅ Found ${modelCount} AI models in database`);

    if (modelCount > 0) {
      const sampleModels = await prisma.ai_models.findMany({ take: 3 });
      console.log('\nSample models:');
      sampleModels.forEach(model => {
        console.log(`  - ${model.name} (${model.provider})`);
      });
    }

    // Test 4: Check get_blind_test_pair function
    console.log('\n4️⃣ Testing get_blind_test_pair function:');
    try {
      const result = await prisma.$queryRaw`SELECT * FROM get_blind_test_pair()`;
      console.log('✅ get_blind_test_pair function works');
      console.log('Sample pair:', result);
    } catch (error) {
      console.log('❌ get_blind_test_pair function failed:', error);
    }

    // Test 5: Database URL format
    console.log('\n5️⃣ Checking Database URL format:');
    const dbUrl = process.env.DATABASE_URL || '';
    if (dbUrl.includes('pooler.supabase.com:6543')) {
      console.log('✅ DATABASE_URL uses correct pooler port (6543)');
    } else if (dbUrl.includes('pooler.supabase.com:5432')) {
      console.log('⚠️  DATABASE_URL uses wrong port (5432) - should be 6543 for pooler');
    }

    const directUrl = process.env.POSTGRES_URL_NON_POOLING || '';
    if (directUrl.includes('db.') && directUrl.includes(':5432')) {
      console.log('✅ POSTGRES_URL_NON_POOLING uses correct direct port (5432)');
    }

  } catch (error) {
    console.log('❌ Database connection failed:', error);
    console.log('\nMake sure your DATABASE_URL is correctly set in environment variables.');
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n✨ Production setup test complete!');
}

// Run the test
testProductionSetup().catch(console.error);