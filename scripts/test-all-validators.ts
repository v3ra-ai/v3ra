import { PrismaClient } from '@prisma/client';
import { OpenRouterValidator } from '../lib/validators/providers/openrouter';
import { OpenAIValidator } from '../lib/validators/providers/openai';
import { AnthropicValidator } from '../lib/validators/providers/anthropic';
import { GeminiValidator } from '../lib/validators/providers/gemini';
import { GrokValidator } from '../lib/validators/providers/grok';

const prisma = new PrismaClient();

interface TestResult {
  id: string;
  profileName: string;
  provider: string;
  modelName: string;
  status: 'success' | 'error';
  response?: any;
  error?: string;
  latency?: number;
}

async function testValidator(validator: any): Promise<TestResult> {
  const startTime = Date.now();
  const result: TestResult = {
    id: validator.id,
    profileName: validator.profileName,
    provider: validator.provider,
    modelName: validator.modelName,
    status: 'success'
  };

  try {
    let validatorInstance;
    
    switch (validator.provider) {
      case 'OpenRouter':
        validatorInstance = new OpenRouterValidator({
          name: validator.profileName,
          modelName: validator.modelName,
        });
        break;
      case 'OpenAI':
        validatorInstance = new OpenAIValidator({
          name: validator.profileName,
          modelName: validator.modelName,
        });
        break;
      case 'Anthropic':
        validatorInstance = new AnthropicValidator({
          name: validator.profileName,
          modelName: validator.modelName,
        });
        break;
      case 'Gemini':
        validatorInstance = new GeminiValidator({
          name: validator.profileName,
          modelName: validator.modelName,
        });
        break;
      case 'Grok':
        validatorInstance = new GrokValidator({
          name: validator.profileName,
          modelName: validator.modelName,
        });
        break;
      default:
        throw new Error(`Unknown provider: ${validator.provider}`);
    }

    const response = await validatorInstance.validate({
      statement: "Water boils at 100 degrees Celsius at sea level",
      context: "Testing validator functionality"
    });

    result.response = response;
    result.latency = Date.now() - startTime;
  } catch (error) {
    result.status = 'error';
    result.error = error instanceof Error ? error.message : String(error);
    result.latency = Date.now() - startTime;
  }

  return result;
}

async function main() {
  console.log('🔍 Testing all active validators...\n');

  try {
    // Get all active validators
    const validators = await prisma.validator.findMany({
      where: { active: true },
      orderBy: { profileName: 'asc' }
    });

    console.log(`Found ${validators.length} active validators\n`);

    // Test each validator
    const results: TestResult[] = [];
    
    for (const validator of validators) {
      console.log(`Testing ${validator.profileName}...`);
      const result = await testValidator(validator);
      results.push(result);
      
      if (result.status === 'success') {
        console.log(`✅ Success (${result.latency}ms)`);
      } else {
        console.log(`❌ Error: ${result.error}`);
      }
    }

    // Summary
    console.log('\n📊 Summary:');
    console.log(`Total validators: ${results.length}`);
    console.log(`Successful: ${results.filter(r => r.status === 'success').length}`);
    console.log(`Failed: ${results.filter(r => r.status === 'error').length}`);

    // List failed validators
    const failed = results.filter(r => r.status === 'error');
    if (failed.length > 0) {
      console.log('\n❌ Failed validators:');
      for (const result of failed) {
        console.log(`- ${result.profileName} (${result.provider}): ${result.error}`);
      }

      // Ask if we should deactivate failed validators
      console.log('\n💡 To deactivate failed validators, run:');
      console.log('npm run deactivate-failed-validators');
    }

    // Performance stats
    const successful = results.filter(r => r.status === 'success');
    if (successful.length > 0) {
      const avgLatency = successful.reduce((sum, r) => sum + (r.latency || 0), 0) / successful.length;
      console.log(`\n⚡ Average latency: ${Math.round(avgLatency)}ms`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);