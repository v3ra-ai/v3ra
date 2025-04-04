import { NextResponse } from 'next/server';
import * as validators from '../../../lib/db/validators';
import type { Validator as PrismaValidator } from '@prisma/client';

// GET /api/validators - Get all validators
export async function GET() {
  try {
    const allValidators = await validators.getAllValidators();
    
    if (!allValidators) {
      console.error('No validators found');
      return NextResponse.json([], { status: 200 }); // Return empty array instead of error
    }
    
    // Convert DB validators to JSON-friendly format with proper type checking
    const formattedValidators = allValidators.map((validator) => {
      const dbValidator = validator as PrismaValidator & {
        apiKeys?: Array<{ apiKeyId: string }>;
      };
      
      return {
        id: dbValidator.id,
        name: dbValidator.profileName,
        provider: dbValidator.provider,
        modelName: dbValidator.modelName || 'unknown',
        description: dbValidator.description || undefined,
        validatorType: dbValidator.validatorType || undefined,
        active: dbValidator.active !== undefined ? dbValidator.active : true,
        keyId: dbValidator.apiKeys && dbValidator.apiKeys[0]?.apiKeyId,
      };
    });
    
    return NextResponse.json(formattedValidators);
  } catch (error) {
    console.error('Error getting all validators:', error);
    // Return a more specific error message
    return NextResponse.json(
      { error: 'Database error: Failed to fetch validators' },
      { status: 500 }
    );
  }
}
