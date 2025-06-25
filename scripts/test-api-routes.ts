#!/usr/bin/env node
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface TestResult {
  endpoint: string;
  success: boolean;
  status?: number;
  data?: any;
  error?: string;
  duration?: number;
}

async function testEndpoint(url: string, options?: RequestInit): Promise<TestResult> {
  const startTime = Date.now();
  const result: TestResult = { endpoint: url, success: false };
  
  try {
    console.log(`\n🔍 Testing: ${url}`);
    const response = await fetch(url, options);
    const duration = Date.now() - startTime;
    
    result.status = response.status;
    result.duration = duration;
    
    if (response.ok) {
      result.success = true;
      result.data = await response.json();
      console.log(`✅ Success (${response.status}) - ${duration}ms`);
    } else {
      result.success = false;
      const errorText = await response.text();
      result.error = errorText;
      console.log(`❌ Failed (${response.status}) - ${duration}ms`);
      console.log(`   Error: ${errorText.substring(0, 200)}...`);
    }
  } catch (error) {
    result.error = error instanceof Error ? error.message : String(error);
    console.log(`❌ Request failed: ${result.error}`);
  }
  
  return result;
}

async function runTests(baseUrl: string) {
  console.log(`\n🚀 Testing API endpoints at: ${baseUrl}`);
  console.log('=====================================');
  
  const results: TestResult[] = [];
  
  // Test 1: Validators endpoint
  results.push(await testEndpoint(`${baseUrl}/api/validators`));
  
  // Test 2: Active validators endpoint
  results.push(await testEndpoint(`${baseUrl}/api/validators/active`));
  
  // Test 3: Vote history with different parameters
  results.push(await testEndpoint(`${baseUrl}/api/vote-history?limit=5`));
  results.push(await testEndpoint(`${baseUrl}/api/vote-history?countOnly=true`));
  results.push(await testEndpoint(`${baseUrl}/api/vote-history?limit=10&offset=0`));
  
  // Test 4: Check if database is accessible through debug endpoint
  results.push(await testEndpoint(`${baseUrl}/api/debug-validators`));
  
  // Summary
  console.log('\n📊 Test Summary');
  console.log('===============');
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  
  // Detailed analysis for failed tests
  if (failed > 0) {
    console.log('\n❌ Failed Endpoints:');
    results.filter(r => !r.success).forEach(result => {
      console.log(`\n  ${result.endpoint}`);
      console.log(`  Status: ${result.status || 'N/A'}`);
      console.log(`  Error: ${result.error || 'Unknown'}`);
    });
  }
  
  // Performance analysis
  console.log('\n⏱️  Performance:');
  results.filter(r => r.duration).forEach(result => {
    const emoji = result.duration! < 1000 ? '🟢' : result.duration! < 3000 ? '🟡' : '🔴';
    console.log(`  ${emoji} ${result.endpoint}: ${result.duration}ms`);
  });
  
  // Data validation for successful endpoints
  console.log('\n📋 Data Validation:');
  
  const validatorsResult = results.find(r => r.endpoint.includes('/api/validators') && !r.endpoint.includes('active'));
  if (validatorsResult?.success && validatorsResult.data) {
    const validators = validatorsResult.data;
    console.log(`  - Validators count: ${validators.length}`);
    if (validators.length > 0) {
      console.log(`  - First validator: ${validators[0].name || validators[0].profileName} (${validators[0].provider})`);
      console.log(`  - Has required fields: ${validators[0].id ? '✅' : '❌'} id, ${validators[0].provider ? '✅' : '❌'} provider`);
    }
  }
  
  const voteHistoryResult = results.find(r => r.endpoint.includes('vote-history') && r.endpoint.includes('limit=5'));
  if (voteHistoryResult?.success && voteHistoryResult.data) {
    const history = voteHistoryResult.data;
    console.log(`  - Vote history count: ${history.length}`);
    if (history.length > 0) {
      console.log(`  - First session consensus: ${history[0].isConsensusReached ? 'Yes' : 'No'}`);
      console.log(`  - Has validator responses: ${history[0].validatorResponses?.length || 0}`);
    }
  }
}

async function main() {
  // Check if we have a URL argument
  const args = process.argv.slice(2);
  let baseUrl = args[0];
  
  if (!baseUrl) {
    // Try to determine URL from environment
    if (process.env.VERCEL_URL) {
      baseUrl = `https://${process.env.VERCEL_URL}`;
      console.log(`Using VERCEL_URL: ${baseUrl}`);
    } else if (process.env.NEXT_PUBLIC_SITE_URL) {
      baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
      console.log(`Using NEXT_PUBLIC_SITE_URL: ${baseUrl}`);
    } else {
      baseUrl = 'http://localhost:3000';
      console.log(`Using default localhost URL: ${baseUrl}`);
    }
  }
  
  // Remove trailing slash
  baseUrl = baseUrl.replace(/\/$/, '');
  
  try {
    await runTests(baseUrl);
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  }
}

// Usage instructions
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Usage: npm run test-api [URL]

Examples:
  npm run test-api                                    # Test localhost
  npm run test-api https://my-app.vercel.app         # Test production
  npm run test-api https://my-app-preview.vercel.app # Test preview
`);
  process.exit(0);
}

main().catch(console.error);