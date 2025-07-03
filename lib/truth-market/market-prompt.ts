import { TruthStatement } from './core';

/**
 * Unified prompt system for the Truth Market
 * Every AI acts as a trader assessing probability of truth
 */

export const MARKET_SYSTEM_PROMPT = `You are an AI trader in a prediction market for truth. Your role is to assess the probability that a given statement is or will be true.

Guidelines:
- Provide a clear YES/NO/UNCERTAIN position
- Give confidence 0-100 (0=completely unsure, 100=absolutely certain)
- Higher confidence means your vote has more weight in the market
- Consider current evidence and future likelihood
- Be well-calibrated: if you say 80% confidence, you should be right 80% of the time
- UNCERTAIN is for cases where evidence is truly insufficient or the statement is malformed

Your response will be combined with other AI traders to create a market consensus.`;

/**
 * Create a user prompt for a specific truth statement
 */
export function createMarketPrompt(statement: TruthStatement): string {
  let prompt = `Assess this statement: "${statement.statement}"`;
  
  if (statement.context) {
    prompt += `\n\nAdditional context: ${statement.context}`;
  }
  
  if (statement.timeframe) {
    const timeframeStr = statement.timeframe.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    prompt += `\n\nTimeframe for evaluation: By ${timeframeStr}`;
  }
  
  prompt += `\n\nProvide your assessment in the following JSON format:
{
  "position": "YES" | "NO" | "UNCERTAIN",
  "confidence": <0-100>,
  "reasoning": "<brief explanation of your assessment>"
}

Remember:
- YES means you believe the statement is/will be true
- NO means you believe the statement is/will be false  
- UNCERTAIN means you cannot make a determination
- Confidence reflects how sure you are (0=no confidence, 100=absolute certainty)`;
  
  return prompt;
}

/**
 * Parse the AI response into a structured format
 */
export interface ParsedMarketResponse {
  position: 'YES' | 'NO' | 'UNCERTAIN';
  confidence: number;
  reasoning: string;
}

export function parseMarketResponse(response: string): ParsedMarketResponse | null {
  try {
    // First try to extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return fallbackParse(response);
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    // Validate the response
    if (!parsed.position || !['YES', 'NO', 'UNCERTAIN'].includes(parsed.position)) {
      return fallbackParse(response);
    }
    
    const confidence = typeof parsed.confidence === 'number' 
      ? Math.max(0, Math.min(100, parsed.confidence))
      : 50; // Default to 50 if not provided
    
    return {
      position: parsed.position as 'YES' | 'NO' | 'UNCERTAIN',
      confidence: confidence,
      reasoning: parsed.reasoning || 'No reasoning provided'
    };
  } catch (error) {
    // If JSON parsing fails, try to extract information from text
    return fallbackParse(response);
  }
}

/**
 * Fallback parser for non-JSON responses
 */
function fallbackParse(response: string): ParsedMarketResponse | null {
  const upperResponse = response.toUpperCase();
  
  // Look for position
  let position: 'YES' | 'NO' | 'UNCERTAIN' = 'UNCERTAIN';
  if (upperResponse.includes('YES') && !upperResponse.includes('NO')) {
    position = 'YES';
  } else if (upperResponse.includes('NO') && !upperResponse.includes('YES')) {
    position = 'NO';
  } else if (upperResponse.includes('UNCERTAIN') || upperResponse.includes('UNCLEAR')) {
    position = 'UNCERTAIN';
  }
  
  // Look for confidence
  const confidenceMatch = response.match(/(\d+)%|\b(\d+)\s*(?:confidence|confident|certainty)/i);
  const confidence = confidenceMatch 
    ? parseInt(confidenceMatch[1] || confidenceMatch[2])
    : position === 'UNCERTAIN' ? 0 : 50;
  
  return {
    position,
    confidence: Math.max(0, Math.min(100, confidence)),
    reasoning: response.substring(0, 500) // Use first 500 chars as reasoning
  };
}

/**
 * Create a prompt for human traders in Truth Arena
 */
export function createHumanPrompt(statement: TruthStatement, aiConsensus: number): string {
  return `The AI market consensus is ${aiConsensus}% that this statement is true:

"${statement.statement}"

${statement.context ? `Context: ${statement.context}\n` : ''}
${statement.timeframe ? `Timeframe: By ${statement.timeframe.toLocaleDateString()}\n` : ''}

What's your assessment? (0-100%)
Remember: 0% means definitely false, 100% means definitely true, 50% means equal chance.`;
}