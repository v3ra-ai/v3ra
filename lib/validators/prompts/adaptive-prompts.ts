import { QueryCategory, CategoryPromptConfig } from "@/lib/types/query-classifier";

export const CATEGORY_PROMPTS: Record<QueryCategory, CategoryPromptConfig> = {
  [QueryCategory.FACT_CHECK]: {
    systemMessage: `You are a professional fact-checker evaluating statements for factual accuracy.

CRITICAL INSTRUCTIONS:
1. Analyze the given statement objectively
2. Consider only verifiable facts, not opinions or predictions
3. Start your response with EXACTLY "YES", "NO", or "UNCERTAIN"
4. Follow immediately with your explanation
5. If uncertain, explain what additional context would be needed

Response format:
YES
[Explanation why the statement is factually accurate]

OR

NO
[Explanation why the statement contains inaccuracies]

OR

UNCERTAIN
[Explanation of why this cannot be definitively fact-checked and what information is missing]`,

    userMessageTemplate: (query: string, context?: string) => {
      let message = `Fact-check this statement:\n\n"${query}"`;
      if (context) {
        message += `\n\nAdditional context:\n${context}`;
      }
      return message;
    },

    responseParser: (response: string) => {
      const lines = response.trim().split('\n');
      const vote = lines[0]?.toUpperCase();
      const explanation = lines.slice(1).join('\n').trim();
      
      return {
        primary: vote,
        explanation,
        confidence: vote === 'UNCERTAIN' ? 0.3 : 0.8,
      };
    }
  },

  [QueryCategory.QUESTION_ANSWER]: {
    systemMessage: `You are a knowledgeable assistant providing clear, accurate answers to questions.

INSTRUCTIONS:
1. Provide a direct, concise answer first
2. Follow with supporting explanation if needed
3. Cite sources or reasoning when possible
4. Acknowledge uncertainty when present
5. For complex topics, break down the answer into clear points

Format your response as:
ANSWER: [Direct answer in 1-2 sentences]

EXPLANATION:
[Detailed explanation with supporting information]

KEY POINTS:
- [Important point 1]
- [Important point 2]
- [etc.]`,

    userMessageTemplate: (query: string) => `Please answer this question:\n\n${query}`,

    responseParser: (response: string) => {
      const answerMatch = response.match(/ANSWER:\s*(.+?)(?=\n\nEXPLANATION:|$)/s);
      const explanationMatch = response.match(/EXPLANATION:\s*(.+?)(?=\n\nKEY POINTS:|$)/s);
      const keyPointsMatch = response.match(/KEY POINTS:\s*(.+?)$/s);
      
      const keyPoints = keyPointsMatch ? 
        keyPointsMatch[1].split('\n')
          .filter(line => line.trim().startsWith('-'))
          .map(line => line.replace(/^-\s*/, '').trim()) : [];

      return {
        primary: answerMatch?.[1]?.trim() || response.trim(),
        explanation: explanationMatch?.[1]?.trim(),
        evidence: keyPoints,
        confidence: 0.85,
      };
    }
  },

  [QueryCategory.IDENTITY_PHILOSOPHY]: {
    systemMessage: `You are a thoughtful assistant exploring philosophical and existential questions.

INSTRUCTIONS:
1. Acknowledge the philosophical nature of the question
2. Present multiple perspectives when relevant
3. Avoid claiming absolute truth on subjective matters
4. Be respectful of different worldviews
5. Encourage reflection rather than prescribing answers

Format your response as:
NATURE: [Brief description of what kind of question this is]

PERSPECTIVES:
1. [Perspective name]: [Explanation]
2. [Perspective name]: [Explanation]
[etc.]

REFLECTION:
[Thought-provoking conclusion or questions for consideration]`,

    userMessageTemplate: (query: string) => `Explore this philosophical question:\n\n${query}`,

    responseParser: (response: string) => {
      const natureMatch = response.match(/NATURE:\s*(.+?)(?=\n\nPERSPECTIVES:|$)/s);
      const perspectivesMatch = response.match(/PERSPECTIVES:\s*(.+?)(?=\n\nREFLECTION:|$)/s);
      const reflectionMatch = response.match(/REFLECTION:\s*(.+?)$/s);

      const perspectives = perspectivesMatch ? 
        perspectivesMatch[1].split(/\d+\.\s+/).slice(1).map(p => {
          const [viewpoint, ...reasoning] = p.split(':');
          return {
            viewpoint: viewpoint.trim(),
            reasoning: reasoning.join(':').trim(),
            strength: 'moderate' as const
          };
        }) : [];

      return {
        primary: natureMatch?.[1]?.trim() || "Philosophical inquiry",
        explanation: reflectionMatch?.[1]?.trim(),
        perspectives,
        confidence: 0.7,
      };
    }
  },

  [QueryCategory.CURRENT_EVENTS]: {
    systemMessage: `You are a current events analyst providing accurate, up-to-date information.

INSTRUCTIONS:
1. Clearly state if information is within your knowledge cutoff
2. Provide the most recent information available to you
3. Distinguish between confirmed facts and developing situations
4. Include relevant dates and sources when possible
5. Acknowledge when information may be outdated

Format your response as:
STATUS: [Current/Historical/Beyond Knowledge Cutoff]
DATE CONTEXT: [Relevant dates or timeframe]

SUMMARY:
[Brief summary of the event or situation]

KEY FACTS:
- [Verified fact 1]
- [Verified fact 2]
[etc.]

CONTEXT:
[Additional background or related information]`,

    userMessageTemplate: (query: string) => `Provide information about:\n\n${query}`,

    responseParser: (response: string) => {
      const statusMatch = response.match(/STATUS:\s*(.+?)(?=\n)/);
      const summaryMatch = response.match(/SUMMARY:\s*(.+?)(?=\n\nKEY FACTS:|$)/s);
      const factsMatch = response.match(/KEY FACTS:\s*(.+?)(?=\n\nCONTEXT:|$)/s);
      
      const facts = factsMatch ? 
        factsMatch[1].split('\n')
          .filter(line => line.trim().startsWith('-'))
          .map(line => line.replace(/^-\s*/, '').trim()) : [];

      return {
        primary: summaryMatch?.[1]?.trim() || response.trim(),
        explanation: response,
        evidence: facts,
        confidence: statusMatch?.[1]?.includes('Beyond Knowledge') ? 0.3 : 0.8,
      };
    }
  },

  [QueryCategory.OPINION_DEBATE]: {
    systemMessage: `You are a balanced analyst presenting multiple viewpoints on debatable topics.

INSTRUCTIONS:
1. Present major perspectives fairly and objectively
2. Avoid taking a definitive stance on subjective matters
3. Include supporting arguments for each position
4. Acknowledge the complexity of the issue
5. Highlight areas of common ground when possible

Format your response as:
TOPIC ANALYSIS: [Brief neutral description of the debate]

MAIN POSITIONS:
Position A: [Name/Description]
- Arguments: [Supporting points]
- Considerations: [Relevant factors]

Position B: [Name/Description]
- Arguments: [Supporting points]
- Considerations: [Relevant factors]

COMMON GROUND:
[Areas where different positions might agree]

COMPLEXITY FACTORS:
[What makes this topic complex or nuanced]`,

    userMessageTemplate: (query: string) => `Analyze this topic from multiple perspectives:\n\n${query}`,

    responseParser: (response: string) => {
      const analysisMatch = response.match(/TOPIC ANALYSIS:\s*(.+?)(?=\n\nMAIN POSITIONS:|$)/s);
      const positionsSection = response.match(/MAIN POSITIONS:\s*(.+?)(?=\n\nCOMMON GROUND:|$)/s);
      
      const perspectives = [];
      if (positionsSection) {
        const positionMatches = positionsSection[1].matchAll(/Position\s+\w+:\s*(.+?)\n-\s*Arguments:\s*(.+?)(?=\n-\s*Considerations:|Position\s+\w+:|$)/gs);
        for (const match of positionMatches) {
          perspectives.push({
            viewpoint: match[1].trim(),
            reasoning: match[2].trim(),
            strength: 'moderate' as const
          });
        }
      }

      return {
        primary: analysisMatch?.[1]?.trim() || "Multiple perspectives exist",
        explanation: response,
        perspectives,
        confidence: 0.75,
      };
    }
  }
};

export function getPromptForCategory(category: QueryCategory): CategoryPromptConfig {
  return CATEGORY_PROMPTS[category] || CATEGORY_PROMPTS[QueryCategory.FACT_CHECK];
}