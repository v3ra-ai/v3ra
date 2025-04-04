import { NextRequest, NextResponse } from 'next/server';
import { validatorRegistry } from '../../../lib/validators/registry';
import { ValidationRequest } from '../../../lib/validators/types';

// POST /api/validate - Process validation request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    if (!body.validatorId || !body.statement) {
      return NextResponse.json(
        { error: 'Missing required fields: validatorId, statement' },
        { status: 400 }
      );
    }
    
    // Prepare validation request
    const validationRequest: ValidationRequest = {
      statement: body.statement,
      context: body.context || ''
    };
    
    // Get validator
    const validator = await validatorRegistry.getValidator(body.validatorId);
    if (!validator) {
      return NextResponse.json(
        { error: 'Validator not found' },
        { status: 404 }
      );
    }
    
    // Run validation
    try {
      const result = await validator.validate(validationRequest);
      return NextResponse.json(result);
    } catch (validationError) {
      console.error('Error during validation:', validationError);
      return NextResponse.json(
        { 
          vote: false, 
          confidence: 0.5, 
          rationale: `Error during validation: ${validationError instanceof Error ? validationError.message : 'Unknown error'}`
        }
      );
    }
  } catch (error) {
    console.error('Error processing validation request:', error);
    return NextResponse.json(
      { error: 'Failed to process validation request' },
      { status: 500 }
    );
  }
}
