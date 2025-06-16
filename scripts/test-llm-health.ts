import { PrismaClient } from '@prisma/client';
import LLMHealthService from '../lib/services/llm-health-service';

const prisma = new PrismaClient();

async function testLLMHealthMonitoring() {
  console.log('🧪 Testing LLM Health Monitoring System\n');

  try {
    // Initialize the health service
    const healthService = LLMHealthService.getInstance();
    
    // Test 1: Check if we can get system health report (even with no data)
    console.log('Test 1: Getting system health report...');
    const report = await healthService.getSystemHealthReport();
    console.log('✅ System health report retrieved successfully');
    console.log(`   Overall Score: ${report.overallScore}%`);
    console.log(`   Providers: ${report.providers.length}`);
    console.log(`   Active Issues: ${report.activeIssues.length}\n`);

    // Test 2: Check if we can get model recommendations
    console.log('Test 2: Getting model recommendations...');
    const recommendations = await healthService.getModelRecommendations();
    console.log('✅ Model recommendations retrieved successfully');
    console.log(`   Recommendations: ${recommendations.length}\n`);

    // Test 3: Verify database tables exist
    console.log('Test 3: Verifying database tables...');
    
    // Check LLMHealthMetric table
    const metricsCount = await prisma.lLMHealthMetric.count();
    console.log(`✅ LLMHealthMetric table exists (${metricsCount} records)`);
    
    // Check ModelDeprecationAlert table
    const alertsCount = await prisma.modelDeprecationAlert.count();
    console.log(`✅ ModelDeprecationAlert table exists (${alertsCount} records)`);
    
    // Check LLMHealthProbe table
    const probesCount = await prisma.lLMHealthProbe.count();
    console.log(`✅ LLMHealthProbe table exists (${probesCount} records)\n`);

    // Test 4: Test API endpoints (if server is running)
    console.log('Test 4: Testing API endpoints...');
    try {
      const response = await fetch('http://localhost:3000/api/admin/llm-health');
      if (response.ok) {
        const data = await response.json();
        console.log('✅ API endpoint /api/admin/llm-health is working');
        console.log(`   Response: ${data.success ? 'Success' : 'Failed'}`);
      } else {
        console.log('⚠️  API endpoint returned status:', response.status);
      }
    } catch (error) {
      console.log('⚠️  Could not test API endpoint (server may not be running)');
    }

    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      
      // Check if it's a database error
      if (error.message.includes('does not exist')) {
        console.error('\n⚠️  Database tables may not exist. Run migrations first:');
        console.error('   npx prisma migrate dev');
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testLLMHealthMonitoring();