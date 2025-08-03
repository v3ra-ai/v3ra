import { z } from 'zod';
import { createLogger } from '@/lib/logger';

const logger = createLogger('dynamic-model-validator');
import { prismaModelRegistry } from '@/lib/services/prisma-model-registry';
import { isValidUUID } from '@/utils/security-utils';

/**
 * Dynamic model validation that uses Supabase as the source of truth
 */

// Create a custom Zod refinement that checks against the database
export const dynamicModelValidator = z.string()
  .min(1, 'Model ID is required')
  .refine(async (modelId) => {
    // First check if it's a UUID (for backwards compatibility)
    if (isValidUUID(modelId)) {
      return true;
    }
    
    // Then check if it's a valid model path format
    if (!/^[a-zA-Z0-9-]+\/[a-zA-Z0-9.-]+$/.test(modelId)) {
      return false;
    }
    
    // Finally, check if the model exists in our database
    return await prismaModelRegistry.isValidModel(modelId);
  }, 'Invalid model ID - model not found in registry');

// Synchronous validator for initial format checking
export const modelFormatValidator = z.string()
  .min(1, 'Model ID is required')
  .refine((modelId) => {
    // Accept either UUID or model path format
    return isValidUUID(modelId) || /^[a-zA-Z0-9-]+\/[a-zA-Z0-9.-]+$/.test(modelId);
  }, 'Invalid model ID format');

// Voting context validator - more lenient for backwards compatibility
export const voteModelValidator = z.string()
  .min(1, 'Model ID is required')
  .refine((modelId) => {
    // For voting, we accept UUIDs or properly formatted model paths
    // We don't validate against the database here to avoid async in voting flow
    return isValidUUID(modelId) || /^[a-zA-Z0-9-]+\/[a-zA-Z0-9.-]+$/.test(modelId);
  }, 'Invalid model ID format');

// Helper function to validate a model exists in the registry
export async function validateModelExists(modelId: string): Promise<boolean> {
  try {
    return await prismaModelRegistry.isValidModel(modelId);
  } catch (error) {
    logger.error('Error validating model', error);
    return false;
  }
}

// Helper function to get all valid model IDs
export async function getValidModelIds(): Promise<string[]> {
  try {
    const models = await prismaModelRegistry.getActiveModels();
    return models.map(m => m.model_path);
  } catch (error) {
    logger.error('Error fetching valid model IDs:', error);
    return [];
  }
}

// Helper function to validate a pair of models for blind testing
export async function validateModelPair(modelId1: string, modelId2: string): Promise<boolean> {
  if (modelId1 === modelId2) {
    return false; // Can't compare the same model
  }
  
  const [valid1, valid2] = await Promise.all([
    validateModelExists(modelId1),
    validateModelExists(modelId2)
  ]);
  
  return valid1 && valid2;
}