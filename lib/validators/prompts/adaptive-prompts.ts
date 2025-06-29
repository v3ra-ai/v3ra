import { QueryCategory, CategoryPromptConfig } from "@/lib/types/query-classifier";

export const CATEGORY_PROMPTS: Record<QueryCategory, CategoryPromptConfig> = {
  [QueryCategory.FACT_CHECK]: {
    systemMessage: `You are a fact-checker. Respond with YES, NO, or UNCERTAIN followed by a brief explanation.`,
    
    userMessageTemplate: (query: string) => `Fact-check: "${query}"`,
    
    responseParser: (response: string) => {
      const lines = response.trim().split('\n');
      const vote = lines[0]?.toUpperCase();
      return {
        primary: vote,
        explanation: lines.slice(1).join('\n').trim(),
        confidence: vote === 'UNCERTAIN' ? 0.3 : 0.8,
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
  }
};

export function getPromptForCategory(category: QueryCategory): CategoryPromptConfig {
  return CATEGORY_PROMPTS[category];
}