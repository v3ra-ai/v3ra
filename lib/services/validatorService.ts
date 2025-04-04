import { prisma } from '../db/client';
import { AIValidator } from '../validators/types';
import { keyService } from './keyService';
import { v4 as uuidv4 } from 'uuid';

/**
 * Service for managing validators in the database
 */
export class ValidatorService {
  /**
   * Add a new validator to the database
   */
  async addValidator(validator: AIValidator): Promise<AIValidator> {
    // Create the validator in the database
    const dbValidator = await prisma.validator.create({
      data: {
        id: validator.id || uuidv4(),
        profileName: validator.name,
        provider: validator.provider,
        modelName: validator.modelName,
        publicKey: validator.id,
        description: validator.description || undefined, // Convert null to undefined
        validatorType: validator.validatorType || undefined, // Convert null to undefined
        active: validator.active,
        // If a keyId is provided, create the relationship
        ...(validator.keyId && {
          apiKeys: {
            create: {
              apiKeyId: validator.keyId
            }
          }
        })
      },
      include: {
        apiKeys: true
      }
    });

    return {
      id: dbValidator.id,
      name: dbValidator.profileName,
      provider: dbValidator.provider,
      modelName: dbValidator.modelName,
      description: dbValidator.description || undefined,  // Convert null to undefined
      validatorType: dbValidator.validatorType || undefined,  // Convert null to undefined
      active: dbValidator.active,
      keyId: dbValidator.apiKeys[0]?.apiKeyId,
      // We don't implement validate here since that's model-specific
      validate: validator.validate
    };
  }

  /**
   * Update a validator's active status
   */
  async toggleValidator(id: string, active: boolean): Promise<boolean> {
    try {
      await prisma.validator.update({
        where: { id },
        data: { active }
      });
      return true;
    } catch (error) {
      console.error(`Error toggling validator ${id}:`, error);
      return false;
    }
  }

  /**
   * Remove a validator from the database
   */
  async removeValidator(id: string): Promise<boolean> {
    try {
      await prisma.validator.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      console.error(`Error removing validator ${id}:`, error);
      return false;
    }
  }

  /**
   * Get all validators from the database
   */
  async getAllValidators(): Promise<any[]> {
    return prisma.validator.findMany({
      include: {
        apiKeys: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  /**
   * Get active validators from the database
   */
  async getActiveValidators(): Promise<any[]> {
    return prisma.validator.findMany({
      where: {
        active: true
      },
      include: {
        apiKeys: true
      }
    });
  }

  /**
   * Associate an API key with a validator
   */
  async associateKeyWithValidator(validatorId: string, apiKeyId: string): Promise<boolean> {
    try {
      await prisma.validatorKey.create({
        data: {
          validatorId,
          apiKeyId
        }
      });
      return true;
    } catch (error) {
      console.error(`Error associating key with validator:`, error);
      return false;
    }
  }

  /**
   * Record a validator response to a query
   */
  async recordValidatorResponse({
    validatorId,
    voteSessionId,
    vote, 
    rationale,
    confidence,
    latency,
    error
  }: {
    validatorId: string;
    voteSessionId: string;
    vote: boolean;
    rationale: string;
    confidence: number;
    latency?: number;
    error?: string;
  }): Promise<void> {
    await prisma.validatorResponse.create({
      data: {
        validatorId,
        voteSessionId,
        vote: vote ? "YES" : "NO",
        rationale,
        confidence,
        latency,
        error
      }
    });

    // Update validator's vote statistics
    await prisma.validator.update({
      where: { id: validatorId },
      data: {
        totalVotes: {
          increment: 1
        }
      }
    });
  }
}

// Export singleton instance
export const validatorService = new ValidatorService();
