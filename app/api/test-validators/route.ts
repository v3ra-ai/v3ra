import { NextRequest, NextResponse } from 'next/server';
import { OpenAIValidator } from '../../../lib/validators/providers/openai';
import { AnthropicValidator } from '../../../lib/validators/providers/anthropic';
import { validatorService } from '../../../lib/services/validatorService';
import { keyService } from '../../../lib/services/keyService';

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
    
    const statement = body.statement;
    const context = body.context || '';
    const results: any[] = [];
    
    // Test OpenAI validator
    try {
      console.log('Testing OpenAI validator...');
      const openaiValidator = new OpenAIValidator({
        name: 'GPT-4o Test',
        modelName: 'gpt-4o',
        validatorType: 'Multimodal Reasoning Engine'
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
        error: error instanceof Error ? error.message : String(error)
      });
    }
    
    // Test Anthropic validator
    try {
      console.log('Testing Anthropic validator...');
      const anthropicValidator = new AnthropicValidator({
        name: 'Claude Opus Test',
        modelName: 'claude-3-opus',
        validatorType: 'Constitutional AI Reasoner'
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
