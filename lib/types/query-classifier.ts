export enum QueryCategory {
  FACT_CHECK = "fact_check",
  QUESTION_ANSWER = "question_answer", 
  IDENTITY_PHILOSOPHY = "identity_philosophy",
  CURRENT_EVENTS = "current_events",
  OPINION_DEBATE = "opinion_debate"
}

export interface QueryClassification {
  category: QueryCategory;
  confidence: number;
  reasoning?: string;
  suggestedRephrasing?: string;
  keywords?: string[];
}

export interface CategoryPromptConfig {
  systemMessage: string;
  userMessageTemplate: (query: string, context?: string) => string;
  responseParser: (response: string) => ParsedResponse;
}

export interface ParsedResponse {
  primary: string;
  explanation?: string;
  confidence?: number;
  evidence?: string[];
  perspectives?: Perspective[];
}

export interface Perspective {
  viewpoint: string;
  reasoning: string;
  strength: "strong" | "moderate" | "weak";
}

export interface ConsensusResult {
  category: QueryCategory;
  value?: boolean | null;  // For fact-check
  answer?: string;         // For Q&A
  perspectives?: Perspective[]; // For opinions
  confidence: number;
  summary: string;
  keyPoints: string[];
  modelAgreement: number;
}

export interface AdaptiveResponse {
  query: string;
  classification: QueryClassification;
  consensus: ConsensusResult;
  validatorResponses: any[]; // Will use existing VoteValidatorResponse type
  metadata: {
    processingTime: number;
    modelsQueried: number;
    timestamp: string;
  };
}