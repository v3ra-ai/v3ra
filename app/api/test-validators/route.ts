import { NextRequest, NextResponse } from 'next/server';
import { OpenAIValidator } from '../../../lib/validators/providers/openai';
import { AnthropicValidator } from '../../../lib/validators/providers/anthropic';

// Define the structure of the validation response (adjust based on actual validator output)
interface AIValidationResponse {
  vote: boolean;       // Changed to boolean to match validator output
  rationale: string;
  confidence: number;
  latency?: number;
  error?: string;
}

// Define the structure of a test result
interface TestResult {
  provider: string;
  model: string;
  result?: AIValidationResponse;  // Use the correct type
  error?: string;
}

// Define the expected constructor config for validators (adjust if different)
// interface ValidatorConfig {
//   name: string;
//   modelName: string;
//   keyId?: string;  // Optional, if used in your implementation
// }

/**
 * API route to test validators with real API integrations
 * POST /api/test-validators
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.statement) {
      return NextResponse.json(
        { error: 'Missing required field: statement' },
        { status: 400 }
      );
    }

    const statement: string = body.statement;
    const context: string = body.context || '';
    const results: TestResult[] = [];

    // Test OpenAI validator
    try {
      console.log('Testing OpenAI validator...');
      const openaiValidator = new OpenAIValidator({
        name: 'GPT-4o Test',
        modelName: 'gpt-4o'
        // Removed validatorType since it’s not in the constructor type
      });

      const openaiResult = await openaiValidator.validate({ statement, context });
      results.push({
        provider: 'OpenAI',
        model: 'gpt-4o',
        result: openaiResult
      });
    } catch (error) {
      console.error('Error testing OpenAI validator:', error);
      results.push({
        provider: 'OpenAI',
        model: 'gpt-4o',
        error: error instanceof Error ? error.message : String(error)
      });
    }

    // Test Anthropic validator
    try {
      console.log('Testing Anthropic validator...');
      const anthropicValidator = new AnthropicValidator({
        name: 'Claude Opus Test',
        modelName: 'claude-3-opus'
        // Removed validatorType since it’s not in the constructor type
      });

      const anthropicResult = await anthropicValidator.validate({ statement, context });
      results.push({
        provider: 'Anthropic',
        model: 'claude-3-opus',
        result: anthropicResult
      });
    } catch (error) {
      console.error('Error testing Anthropic validator:', error);
      results.push({
        provider: 'Anthropic',
        model: 'claude-3-opus',
        error: error instanceof Error ? error.message : String(error)
      });
    }

    // Return the results
    return NextResponse.json({
      statement,
      context,
      results
    });
  } catch (error) {
    console.error('Error in test validators route:', error);
    return NextResponse.json(
      { error: 'Server error testing validators' },
      { status: 500 }
    );
  }
}