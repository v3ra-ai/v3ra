import { NextResponse } from 'next/server';
import * as validators from '../../../../lib/db/validators';

// GET /api/validators/active - Get active validators
export async function GET() {
  try {
    const activeValidators = await validators.getActiveValidators();

    // Convert DB validators to JSON-friendly format
    const formattedValidators = activeValidators.map(validator => {
      // Use type assertion to handle Prisma's complex types
      const dbValidator = validator;

      return {
        id: dbValidator.id,
        name: dbValidator.profileName,
        provider: dbValidator.provider,
        modelName: dbValidator.modelName || 'unknown',
        description: dbValidator.description || undefined,
        validatorType: dbValidator.validatorType || undefined,
        active: dbValidator.active !== undefined ? dbValidator.active : true,
        keyId: dbValidator.apiKeys && dbValidator.apiKeys[0]?.apiKeyId,
        // Omit the validate function as it's added client-side
      };
    });

    return NextResponse.json(formattedValidators);
  } catch (error) {
    console.error('Error getting active validators:', error);
    return NextResponse.json(
      { error: 'Failed to fetch active validators' },
      { status: 500 }
    );
  }
}
