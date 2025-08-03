'use server';

import { v4 as uuidv4 } from 'uuid';
import { validatorRegistry } from '@/lib/validators/registry';
import { prismaModelRegistry } from '@/lib/services/prisma-model-registry';
import type { VoteResult } from '@/lib/types';

export async function getBlindTestComparison(
  queryText: string,
  pairingStrategy: 'SMART' | 'UNDERDOG' | 'TITANS' | 'OPEN_SOURCE' = 'SMART'
): Promise<VoteResult | { error: string }> {
  try {
    // Get a pair of models based on the strategy
    const modelPair = await prismaModelRegistry.getRandomPair(pairingStrategy);
    
    if (!modelPair) {
      return { error: 'Unable to find suitable AI models for comparison' };
    }

    const [model1, model2] = modelPair;
    
    // Create validators for these models
    const validator1 = await validatorRegistry.getValidator(model1.model_path);
    const validator2 = await validatorRegistry.getValidator(model2.model_path);
    
    if (!validator1 || !validator2) {
      return { error: 'Unable to initialize validators for selected models' };
    }

    // Generate session ID
    const sessionId = uuidv4();
    
    // Get responses from both validators
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
          id: uuidv4(),
          profileName: model1.name,
          provider: model1.provider,
          modelName: model1.model_path,
          vote: response1.vote,
          rationale: response1.rationale,
          confidence: response1.confidence,
          latency: response1.latency,
          validatorId: model1.id,
          avatarUrl: model1.icon
        },
        {
          id: uuidv4(),
          profileName: model2.name,
          provider: model2.provider,
          modelName: model2.model_path,
          vote: response2.vote,
          rationale: response2.rationale,
          confidence: response2.confidence,
          latency: response2.latency,
          validatorId: model2.id,
          avatarUrl: model2.icon
        }
      ],
      timestamp: new Date(),
      votesYes: 0,
      votesNo: 0,
      notVoted: 0,
      mode: 'factCheck'
    };

    return result;
  } catch (error) {
    console.error('Error in getBlindTestComparison:', error);
    return { error: error instanceof Error ? error.message : 'Failed to get AI responses' };
  }
}