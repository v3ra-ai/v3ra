import { QueryCategory, CategoryPromptConfig } from "@/lib/types/query-classifier";

export const CATEGORY_PROMPTS: Record<QueryCategory, CategoryPromptConfig> = {
  [QueryCategory.FACT_CHECK]: {
    systemMessage: `You are a fact-checker. Respond with YES, NO, or UNKNOWN followed by a brief explanation. Use UNKNOWN for unverifiable claims, matters of belief, or topics lacking scientific consensus.`,
    
    userMessageTemplate: (query: string) => `Fact-check: "${query}"`,
    
    responseParser: (response: string) => {
      const lines = response.trim().split('\n');
      const vote = lines[0]?.toUpperCase();
      return {
        primary: vote,
        explanation: lines.slice(1).join('\n').trim(),
        confidence: vote === 'UNKNOWN' ? 0.5 : 0.85,
      };
    }
  },

  [QueryCategory.QUESTION_ANSWER]: {
    systemMessage: `Provide clear, direct answers. Start with a 1-2 sentence answer, then explain if needed.`,
    
    userMessageTemplate: (query: string) => query,
    
    responseParser: (response: string) => {
      const firstParagraph = response.split('\n\n')[0];
      return {
        primary: firstParagraph,
        explanation: response,
        confidence: 0.85,
      };
    }
  },

  [QueryCategory.IDENTITY_PHILOSOPHY]: {
    systemMessage: `Explore philosophical questions thoughtfully. Present multiple perspectives when relevant.`,
    
    userMessageTemplate: (query: string) => query,
    
    responseParser: (response: string) => {
      return {
        primary: "This is a philosophical question with multiple perspectives",
        explanation: response,
        confidence: 0.7,
      };
    }
  },

  [QueryCategory.CURRENT_EVENTS]: {
    systemMessage: `Provide current information. Note if something is beyond your knowledge cutoff.`,
    
    userMessageTemplate: (query: string) => query,
    
    responseParser: (response: string) => {
      const beyondCutoff = response.toLowerCase().includes("knowledge cutoff");
      return {
        primary: response.split('\n')[0],
        explanation: response,
        confidence: beyondCutoff ? 0.3 : 0.8,
      };
    }
  },

  [QueryCategory.OPINION_DEBATE]: {
    systemMessage: `Present balanced perspectives on debatable topics. Avoid taking sides.`,
    
    userMessageTemplate: (query: string) => query,
    
    responseParser: (response: string) => {
      return {
        primary: "Multiple viewpoints exist on this topic",
        explanation: response,
        confidence: 0.75,
      };
    }
  },

  [QueryCategory.PREDICTION]: {
    systemMessage: `You are an expert prediction analyst. When asked about future events, provide probability estimates in a structured format.

CRITICAL INSTRUCTIONS:
1. Start with "PREDICTION:" followed by your primary prediction and probability
2. List other possible outcomes with their probabilities (must sum to 100%)
3. For sports: Use ONLY official team names (e.g., "Los Angeles Dodgers", NOT "Dodgers win")
4. Group all unlikely teams as "Other teams" with combined probability
5. Provide reasoning based on current data and trends
6. Specify confidence level (LOW/MEDIUM/HIGH)
7. Estimate when this prediction can be verified

Format:
PREDICTION: [Most likely outcome] - [X]%
Other outcomes:
- [Outcome 2] - [Y]%
- [Outcome 3] - [Z]%

IMPORTANT: All probabilities MUST sum to exactly 100%!

Reasoning: [Why you predict this based on current evidence]
Confidence: [LOW/MEDIUM/HIGH]
Resolution date: [When this can be verified]`,
    
    userMessageTemplate: (query: string) => query,
    
    responseParser: (response: string) => {
      const lines = response.split('\n');
      const predictionLine = lines.find(l => l.startsWith('PREDICTION:'));
      const primaryMatch = predictionLine?.match(/PREDICTION:\s*(.+?)\s*-\s*(\d+)%/);
      
      const predictions = [];
      let inOtherOutcomes = false;
      let reasoning = '';
      let confidence = 0.5;
      let resolutionDate = '';
      
      for (const line of lines) {
        if (line.includes('Other outcomes:')) {
          inOtherOutcomes = true;
          continue;
        }
        
        if (inOtherOutcomes && line.trim().startsWith('-')) {
          const match = line.match(/-\s*(.+?)\s*-\s*(\d+)%/);
          if (match) {
            predictions.push({
              outcome: match[1].trim(),
              probability: parseInt(match[2]) / 100
            });
          }
        }
        
        if (line.startsWith('Reasoning:')) {
          reasoning = line.substring('Reasoning:'.length).trim();
          inOtherOutcomes = false;
        }
        
        if (line.startsWith('Confidence:')) {
          const conf = line.substring('Confidence:'.length).trim().toUpperCase();
          confidence = conf === 'HIGH' ? 0.8 : conf === 'MEDIUM' ? 0.6 : 0.4;
        }
        
        if (line.startsWith('Resolution date:')) {
          resolutionDate = line.substring('Resolution date:'.length).trim();
        }
      }
      
      // Add primary prediction
      if (primaryMatch) {
        predictions.unshift({
          outcome: primaryMatch[1].trim(),
          probability: parseInt(primaryMatch[2]) / 100,
          reasoning
        });
      }
      
      return {
        primary: primaryMatch ? `${primaryMatch[1]} (${primaryMatch[2]}%)` : 'No clear prediction',
        explanation: response,
        confidence,
        predictions,
        resolutionDate
      };
    }
  }
};

export function getPromptForCategory(category: QueryCategory): CategoryPromptConfig {
  return CATEGORY_PROMPTS[category];
}