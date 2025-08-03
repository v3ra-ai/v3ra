'use server';

import { v4 as uuidv4 } from 'uuid';
import { prismaModelRegistry } from '@/lib/services/prisma-model-registry';
import { modelManager } from '@/lib/services/model-manager';
import { createLogger } from '@/lib/logger';
import type { VoteResult } from '@/lib/types';

const logger = createLogger('blind-test');

export async function getBlindTestComparison(
  queryText: string,
  pairingStrategy: 'SMART' | 'UNDERDOG' | 'TITANS' | 'OPEN_SOURCE' = 'SMART'
): Promise<VoteResult | { error: string }> {
  try {
    // Get a pair of models based on the strategy
    let modelPair;
    try {
      modelPair = await prismaModelRegistry.getRandomPair(pairingStrategy);
    } catch (err) {
      logger.warn('Model registry unavailable, falling back to static models', { err });
    }

    if (!modelPair || modelPair.length < 2) {
      // Hard-coded fallback pair if DB or registry is unavailable
      modelPair = [
        { name: 'GPT-4o', provider: 'OpenAI', model_path: 'openai/gpt-4o' },
        { name: 'Claude 3 Sonnet', provider: 'Anthropic', model_path: 'anthropic/claude-3-sonnet' }
      ];
      logger.info('Using static fallback model pair for blind test');
    }

    const [model1, model2] = modelPair;
    
    // Get validators dynamically from model manager
    logger.info('Getting validators for models', { 
      model1: model1.model_path, 
      model2: model2.model_path 
    });
    
    const [validator1, validator2] = await modelManager.getValidators([
      model1.model_path,
      model2.model_path
    ]);
    
    if (!validator1 || !validator2) {
      logger.error('Failed to get validators', { 
        model1: model1.model_path, 
        model2: model2.model_path,
        validator1: !!validator1,
        validator2: !!validator2
      });
      return { error: 'Unable to initialize validators for selected models' };
    }

    // Generate session ID
    const sessionId = uuidv4();
    
    // For blind testing, we want the AI to respond to the query, not fact-check it
    // So we'll use the rationale as the main response
    const [response1, response2] = await Promise.all([
      validator1.validate({
        statement: queryText,
        context: '',
        queryMode: 'fact-check'
      }),
      validator2.validate({
        statement: queryText,
        context: '',
        queryMode: 'fact-check'
      })
    ]);

    // Construct the result
    const result: VoteResult = {
      id: sessionId,
      queryText,
      isConsensusReached: false,
      consensusValue: null,
      validatorResponses: [
        {
          id: model1.model_path || uuidv4(), // Use model_path as ID for blind testing
          profileName: model1.name,
          provider: model1.provider,
          vote: 'RESPONSE', // For blind testing, this isn't a YES/NO vote
          rationale: response1.rationale // This is the actual AI response
        },
        {
          id: model2.model_path || uuidv4(), // Use model_path as ID for blind testing
          profileName: model2.name,
          provider: model2.provider,
          vote: 'RESPONSE', // For blind testing, this isn't a YES/NO vote
          rationale: response2.rationale // This is the actual AI response
        }
      ],
      votingResult: {
        yes: 0,
        no: 0,
        notVoted: 0
      },
      timestamp: new Date().toISOString()
    };

    return result;
  } catch (error) {
    logger.error('Error in getBlindTestComparison', { error });
    return { error: error instanceof Error ? error.message : 'Failed to get AI responses' };
  }
}