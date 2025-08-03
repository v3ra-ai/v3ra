// Stub types for query classification
export interface QueryClassification {
  type: "factual" | "opinion" | "creative" | "unknown";
  confidence: number;
  reasoning?: string;
}

export interface ConsensusResult {
  reached: boolean;
  value: boolean | null;
  confidence: number;
  agreement_ratio: number;
}

export enum QueryCategory {
  FACT_CHECK = "fact-check",
  QUESTION_ANSWER = "question-answer",
  OPINION = "opinion",
  CREATIVE = "creative",
  IDENTITY_PHILOSOPHY = "identity-philosophy",
  CURRENT_EVENTS = "current-events",
  OPINION_DEBATE = "opinion-debate",
  PREDICTION = "prediction",
  UNKNOWN = "unknown"
}

export interface CategoryPromptConfig {
  systemMessage: string;
  userMessageTemplate: (query: string) => string;
  responseParser: (response: string) => {
    primary: string;
    explanation: string;
    confidence: number;
  };
}