// V3RA Arena Types

export interface Question {
  id: string;
  question: string;
  answers: Answer[];
}

export interface Answer {
  id: string;
  text: string;
  modelId: string;
}

export interface Vote {
  questionId: string;
  answerId: string;
  userId?: string;
}

export interface Validator {
  id: string;
  name: string;
  profileName: string;
  provider: string;
  modelName: string;
  description?: string;
  active: boolean;
}