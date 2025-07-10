import { 
  MarketPosition, 
  MarketConsensus, 
  getConsensusStrength,
  positionToValue,
  TraderPerformance 
} from './core';

/**
 * ConsensusEngine calculates the market consensus from AI trader positions
 * 
 * Core algorithm:
 * 1. Weight each position by confidence
 * 2. Apply reputation weights (future enhancement)
 * 3. Calculate weighted average probability
 * 4. Determine consensus strength
 */
export class ConsensusEngine {
  /**
   * Calculate market consensus from positions
   */
  static calculate(
    positions: MarketPosition[],
    statementId: string,
    traderPerformance?: Map<string, TraderPerformance>
  ): MarketConsensus {
    if (positions.length === 0) {
      return this.createEmptyConsensus(statementId);
    }
    
    // Calculate weighted probability
    let weightedSum = 0;
    let totalWeight = 0;
    
    positions.forEach(position => {
      // Base weight is the confidence
      let weight = position.confidence;
      
      // Apply reputation weight if available (Phase 2 enhancement)
      if (traderPerformance?.has(position.validatorId)) {
        const performance = traderPerformance.get(position.validatorId)!;
        // Boost weight based on historical accuracy (0.5x to 1.5x multiplier)
        const reputationMultiplier = 0.5 + (performance.accuracy / 100);
        weight *= reputationMultiplier;
      }
      
      // Convert position to numerical value
      const value = positionToValue(position.position);
      
      weightedSum += value * weight;
      totalWeight += weight;
    });
    
    // Calculate probability
    const probability = totalWeight > 0 
      ? Math.round((weightedSum / totalWeight) * 100)
      : 50; // Default to 50% if no weight
    
    // Calculate average confidence
    const avgConfidence = Math.round(
      positions.reduce((sum, pos) => sum + pos.confidence, 0) / positions.length
    );
    
    // Calculate agreement rate
    const agreementRate = this.calculateAgreementRate(positions);
    
    // Determine consensus strength
    const consensusStrength = getConsensusStrength(positions);
    
    return {
      statementId,
      probability,
      confidence: avgConfidence,
      positions,
      totalValidators: positions.length,
      consensusStrength,
      agreementRate,
      lastUpdated: new Date()
    };
  }
  
  /**
   * Calculate how much validators agree with each other
   */
  private static calculateAgreementRate(positions: MarketPosition[]): number {
    if (positions.length <= 1) return 100;
    
    // Count positions
    const positionCounts = positions.reduce((acc, pos) => {
      acc[pos.position] = (acc[pos.position] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Find the most common position
    const maxCount = Math.max(...Object.values(positionCounts));
    
    // Agreement rate is percentage with most common position
    return Math.round((maxCount / positions.length) * 100);
  }
  
  /**
   * Create empty consensus for edge cases
   */
  private static createEmptyConsensus(statementId: string): MarketConsensus {
    return {
      statementId,
      probability: 50,
      confidence: 0,
      positions: [],
      totalValidators: 0,
      consensusStrength: 'WEAK',
      agreementRate: 0,
      lastUpdated: new Date()
    };
  }
  
  /**
   * Calculate confidence intervals for the consensus
   * This helps communicate uncertainty in the market
   */
  static calculateConfidenceInterval(consensus: MarketConsensus): {
    lower: number;
    upper: number;
  } {
    if (consensus.positions.length === 0) {
      return { lower: 0, upper: 100 };
    }
    
    // Simple confidence interval based on agreement and average confidence
    const spread = 100 - consensus.agreementRate; // Disagreement creates wider intervals
    const confidenceFactor = consensus.confidence / 100; // Higher confidence = tighter intervals
    
    const margin = (spread * (1 - confidenceFactor)) / 2;
    
    return {
      lower: Math.max(0, consensus.probability - margin),
      upper: Math.min(100, consensus.probability + margin)
    };
  }
  
  /**
   * Get a human-readable summary of the consensus
   */
  static getSummary(consensus: MarketConsensus): string {
    const { probability, consensusStrength, positions } = consensus;
    
    // Count positions by type
    const yesCount = positions.filter(p => p.position === 'YES').length;
    const noCount = positions.filter(p => p.position === 'NO').length;
    const uncertainCount = positions.filter(p => p.position === 'UNCERTAIN').length;
    
    let summary = `Market consensus: ${probability}% probability`;
    
    if (consensusStrength === 'STRONG') {
      summary += ' (high confidence)';
    } else if (consensusStrength === 'WEAK') {
      summary += ' (low confidence)';
    }
    
    summary += `\n${yesCount} YES, ${noCount} NO`;
    if (uncertainCount > 0) {
      summary += `, ${uncertainCount} UNCERTAIN`;
    }
    
    return summary;
  }
  
  /**
   * Determine if this consensus represents a clear verdict
   */
  static hasClearVerdict(consensus: MarketConsensus): boolean {
    return (
      consensus.consensusStrength === 'STRONG' &&
      (consensus.probability > 75 || consensus.probability < 25)
    );
  }
  
  /**
   * Get market sentiment (bullish/bearish/neutral)
   */
  static getMarketSentiment(consensus: MarketConsensus): 'BULLISH' | 'BEARISH' | 'NEUTRAL' {
    if (consensus.probability > 65) return 'BULLISH';
    if (consensus.probability < 35) return 'BEARISH';
    return 'NEUTRAL';
  }
}