import { PrismaClient } from '@prisma/client';
import LLMHealthService from '../lib/services/llm-health-service';

const prisma = new PrismaClient();

async function testOpenRouterHealthCheck() {
  console.log('🧪 Testing OpenRouter Health Checks\n');

  try {
    const healthService = LLMHealthService.getInstance();
    
    // Get one active OpenRouter validator for testing
    const testValidator = await prisma.validator.findFirst({
      where: {
        provider: 'OpenRouter',
        active: true
      },
      include: {
        apiKeys: {
          include: {
            apiKey: true
          }
        }
      }
    });

    if (!testValidator) {
      console.log('❌ No active OpenRouter validators found');
      return;
    }

    console.log(`Testing validator: ${testValidator.profileName}`);
    console.log(`Model: ${testValidator.modelName}`);
    console.log(`Has API keys: ${testValidator.apiKeys.length > 0 ? '✅' : '❌'}\n`);

    // Test the specific model using the private method (we'll need to make it public temporarily)
    console.log('Running health check...');
    
    // Since testModel is private, let's run a full health check but filter for OpenRouter
    const results = await healthService.runHealthChecks();
    
    // Filter for OpenRouter results
    const openRouterResults = results.filter(r => r.provider === 'OpenRouter');
    
    console.log(`\n📊 OpenRouter Health Check Results:`);
    console.log(`Total OpenRouter models tested: ${openRouterResults.length}\n`);
    
    // Group by status
    const statusGroups = openRouterResults.reduce((acc, result) => {
      if (!acc[result.status]) acc[result.status] = [];
      acc[result.status].push(result);
      return acc;
    }, {} as Record<string, typeof openRouterResults>);
    
    // Display results by status
    for (const [status, models] of Object.entries(statusGroups)) {
      console.log(`\n${status.toUpperCase()} (${models.length}):`);
      for (const model of models) {
        console.log(`  - ${model.model}`);
        if (model.latency) {
          console.log(`    Latency: ${model.latency}ms`);
        }
        if (model.error) {
          console.log(`    Error: ${model.error}`);
        }
      }
    }
    
    // Summary
    const healthy = statusGroups['healthy']?.length || 0;
    const total = openRouterResults.length;
    const healthPercentage = total > 0 ? Math.round((healthy / total) * 100) : 0;
    
    console.log(`\n📈 Summary:`);
    console.log(`  Health Score: ${healthPercentage}% (${healthy}/${total} models healthy)`);
    
    if (healthy === 0 && total > 0) {
      console.log('\n⚠️  All OpenRouter models are unhealthy. Possible causes:');
      console.log('  1. OPENROUTER_API_KEY environment variable is invalid');
      console.log('  2. OpenRouter service is down');
      console.log('  3. Models are deprecated or unavailable');
      console.log('  4. Rate limiting or quota issues');
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testOpenRouterHealthCheck();