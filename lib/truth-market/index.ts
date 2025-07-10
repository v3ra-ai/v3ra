/**
 * Truth Market - Main entry point
 * 
 * Exports all the core functionality for the Truth Market system
 */

export * from './core';
export * from './statement-normalizer';
export * from './market-prompt';
export * from './consensus-engine';

import { TruthStatement, MarketPosition, MarketConsensus } from './core';
import { StatementNormalizer } from './statement-normalizer';
import { createMarketPrompt, parseMarketResponse, MARKET_SYSTEM_PROMPT } from './market-prompt';
import { ConsensusEngine } from './consensus-engine';
import { AIValidator } from '../validators/types';

/**
 * Main Truth Market service
 */
export class TruthMarket {
  /**
   * Process a query through the Truth Market system
   */
  static async processQuery(
    query: string,
    validators: AIValidator[]
  ): Promise<{
    statement: TruthStatement;
    consensus: MarketConsensus;
    positions: MarketPosition[];
  }> {
    // 1. Normalize the query into a truth statement
    const statement = StatementNormalizer.normalize(query);
    
    // 2. Query all validators in parallel
    const positionPromises = validators.map(validator => 
      this.queryValidator(validator, statement)
    );
    
    const positions = await Promise.all(positionPromises);
    
    // 3. Filter out failed responses
    const validPositions = positions.filter(p => p !== null) as MarketPosition[];
    
    // 4. Calculate consensus
    const consensus = ConsensusEngine.calculate(validPositions, statement.id);
    
    return {
      statement,
      consensus,
      positions: validPositions
    };
  }
  
  /**
   * Query a single validator for their market position
   */
  private static async queryValidator(
    validator: AIValidator,
    statement: TruthStatement
  ): Promise<MarketPosition | null> {
    try {
      const startTime = Date.now();
      
      // Create the market prompt
      const userPrompt = createMarketPrompt(statement);
      
      // Call the validator with adaptive validation request
      const response = await validator.validate({
        statement: statement.statement,
        context: statement.context,
        systemMessage: MARKET_SYSTEM_PROMPT,
        userMessage: userPrompt
      } as any); // TODO: Update validator types to support Truth Market
      
      // Parse the response
      const parsed = parseMarketResponse(response.rationale || '');
      if (!parsed) {
        console.error(`Failed to parse response from ${validator.name}`);
        return null;
      }
      
      const responseTime = Date.now() - startTime;
      
      return {
        validatorId: validator.id || '',
        modelName: validator.name,
        position: parsed.position,
        confidence: parsed.confidence,
        reasoning: parsed.reasoning,
        responseTime
      };
    } catch (error) {
      console.error(`Error querying validator ${validator.name}:`, error);
      return null;
    }
  }
  
  /**
   * Convert legacy vote format to market position
   */
  static convertLegacyVote(
    vote: boolean | 'UNKNOWN',
    _confidence: number = 50,
    _rationale: string = ''
  ): MarketPosition['position'] {
    if (vote === true) return 'YES';
    if (vote === false) return 'NO';
    return 'UNCERTAIN';
  }
}