/**
 * Truth Market Core Types and Interfaces
 * 
 * Every query becomes a probability assessment
 * Every AI becomes a trader in the market
 */

export interface TruthStatement {
  id: string;
  originalQuery: string;
  statement: string; // Normalized to verifiable claim
  context?: string;
  timeframe?: Date; // For predictions
  createdAt: Date;
}

export interface MarketPosition {
  validatorId: string;
  modelName: string;
  position: 'YES' | 'NO' | 'UNCERTAIN';
  confidence: number; // 0-100
  reasoning: string;
  responseTime: number;
}

export interface MarketConsensus {
  statementId: string;
  probability: number; // 0-100
  confidence: number; // Average confidence
  positions: MarketPosition[];
  totalValidators: number;
  consensusStrength: 'STRONG' | 'MODERATE' | 'WEAK';
  agreementRate: number; // Percentage of validators in agreement
  lastUpdated: Date;
}

export interface TraderPerformance {
  validatorId: string;
  accuracy: number; // Historical accuracy percentage
  calibrationScore: number; // How well confidence matches accuracy
  totalPredictions: number;
  specialties: Map<string, number>; // Topic -> accuracy
}

export type ConsensusStrength = 'STRONG' | 'MODERATE' | 'WEAK';

/**
 * Calculate consensus strength based on agreement and confidence
 */
export function getConsensusStrength(positions: MarketPosition[]): ConsensusStrength {
  if (positions.length === 0) return 'WEAK';
  
  // Calculate agreement rate
  const positionCounts = positions.reduce((acc, pos) => {
    acc[pos.position] = (acc[pos.position] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const maxAgreement = Math.max(...Object.values(positionCounts));
  const agreementRate = maxAgreement / positions.length;
  
  // Calculate average confidence
  const avgConfidence = positions.reduce((sum, pos) => sum + pos.confidence, 0) / positions.length;
  
  // Strong: High agreement (>80%) AND high confidence (>70%)
  if (agreementRate > 0.8 && avgConfidence > 70) return 'STRONG';
  
  // Moderate: Decent agreement (>60%) OR high confidence
  if (agreementRate > 0.6 || avgConfidence > 60) return 'MODERATE';
  
  // Weak: Low agreement or low confidence
  return 'WEAK';
}

/**
 * Convert a position to a numerical value for calculations
 */
export function positionToValue(position: 'YES' | 'NO' | 'UNCERTAIN'): number {
  switch (position) {
    case 'YES': return 1;
    case 'NO': return 0;
    case 'UNCERTAIN': return 0.5;
  }
}

/**
 * Format probability for display
 */
export function formatProbability(probability: number): string {
  return `${Math.round(probability)}%`;
}

/**
 * Determine if a consensus represents high certainty
 */
export function isHighCertainty(consensus: MarketConsensus): boolean {
  return consensus.probability > 80 || consensus.probability < 20;
}

/**
 * Check if this is a prediction (has future timeframe)
 */
export function isPrediction(statement: TruthStatement): boolean {
  return statement.timeframe !== undefined && statement.timeframe > new Date();
}