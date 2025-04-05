import { NetworkState, VoteResult, Validator } from '@/lib/types';

// Mock validators
export const mockValidators: Validator[] = [
  {
    id: 'validator-1',
    publicKey: 'pubkey1',
    provider: 'OpenAI',
    profileName: 'GPT-4o Validator',
    isLeader: true,
    lastVote: true,
    lastResponse: 'Consensus reached',
    lastRationale: 'AI has the potential to solve many global challenges and improve human life in numerous ways.',
    modelName: 'GPT-4o',
    description: 'This validator uses OpenAI\'s GPT-4o model, which excels at balanced decision-making based on multiple perspectives and ethical considerations.',
    avatarUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/ChatGPT_logo.svg/512px-ChatGPT_logo.svg.png',
    reliability: 98,
    validatorType: 'Multimodal Reasoning Engine — OpenAI\'s flagship model known for balanced ethical assessments and nuanced decision-making capabilities.'
  },
  {
    id: 'validator-2',
    publicKey: 'pubkey2',
    provider: 'Anthropic',
    profileName: 'Claude 3 Opus',
    isLeader: false,
    lastVote: true,
    lastResponse: 'Consensus reached',
    lastRationale: 'With proper regulation and ethical guidelines, AI can benefit humanity significantly.',
    modelName: 'Claude 3 Opus',
    description: 'A highly sophisticated AI model from Anthropic that focuses on helpful, harmless, and honest responses with particular attention to nuanced ethical reasoning.',
    avatarUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Anthropic_logo.svg/1200px-Anthropic_logo.svg.png',
    reliability: 96,
    validatorType: 'Constitutional AI Reasoner — Anthropic\'s most capable model with exceptional ethical reasoning and nuanced perspectives on complex issues.'
  },
  {
    id: 'validator-3',
    publicKey: 'pubkey3',
    provider: 'Google',
    profileName: 'Gemini Ultra',
    isLeader: false,
    lastVote: true,
    lastResponse: 'Consensus reached',
    lastRationale: 'AI technologies are already helping in healthcare, education, and environmental protection.',
    modelName: 'Gemini Ultra',
    description: 'Google\'s most capable and largest model, built to be multimodal from the ground up. Specializes in complex reasoning, planning, and instruction following.',
    avatarUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Google_Gemini_Logo.png/800px-Google_Gemini_Logo.png',
    reliability: 95,
    validatorType: 'Multimodal Intelligence System — Google\'s advanced reasoning engine with specialized knowledge in scientific domains and contextual analysis.'
  },
  {
    id: 'validator-4',
    publicKey: 'pubkey4',
    provider: 'Eliza OS',
    profileName: 'Data Scientist Eliza',
    isLeader: false,
    lastVote: false,
    lastResponse: 'Consensus reached',
    lastRationale: 'The risks of job displacement and uncontrolled AI development outweigh the benefits.',
    modelName: 'OpenAI 4.5',
    description: 'An Eliza OS Agent with a Data Scientist character profile. Focuses on statistical analysis and data-driven decision making. Runs on OpenAI 4.5 architecture.',
    avatarUrl: '/images/eliza-profile.png',
    reliability: 93,
    validatorType: 'Specialized Agent — Eliza OS running on OpenAI 4.5 with Data Scientist character profile, optimized for statistical reasoning and critical analysis.'
  },
  {
    id: 'validator-5',
    publicKey: 'pubkey5',
    provider: 'Cohere',
    profileName: 'Validator 5',
    isLeader: false,
    lastVote: true,
    lastResponse: 'Consensus reached',
    lastRationale: 'When developed responsibly, AI can lead to tremendous scientific and social progress.',
    modelName: 'Cohere Model',
    description: 'A highly advanced language model developed by Cohere, focusing on generating human-like text based on the input it was given.',
    avatarUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Cohere_logo.svg/512px-Cohere_logo.svg.png',
    reliability: 94,
    validatorType: 'Command-R Language Expert — Cohere\'s enterprise-grade model designed for reliable reasoning and contextual understanding across diverse domains.'
  },
];

// Mock network state
export const mockNetworkState: NetworkState = {
  validators: mockValidators,
  currentLeaderIndex: 0,
  isVoting: false,
  lastQuery: 'Is artificial intelligence beneficial for society?',
  lastNetworkResponse: 'Consensus process completed',
  lastConsensusValue: true,
  lastConsensusThreshold: 0.5,
  lastConsensusAchieved: true,
  lastVoteTimestamp: new Date().toISOString(),
};

// Mock vote result
export const mockVoteResult: VoteResult = {
  id: 'mock-vote-session-1',
  isConsensusReached: true,
  consensusValue: true,
  queryText: 'Is artificial intelligence beneficial for society?',
  validatorResponses: [
    {
      id: 'validator-1',
      provider: 'OpenAI',
      profileName: 'GPT-4o Validator',
      vote: 'yes',
      rationale: 'AI has the potential to solve many global challenges and improve human life in numerous ways.',
    },
    {
      id: 'validator-2',
      provider: 'Anthropic',
      profileName: 'Claude 3 Opus',
      vote: 'yes',
      rationale: 'With proper regulation and ethical guidelines, AI can benefit humanity significantly.',
    },
    {
      id: 'validator-3',
      provider: 'Google',
      profileName: 'Gemini Ultra',
      vote: 'yes',
      rationale: 'AI technologies are already helping in healthcare, education, and environmental protection.',
    },
    {
      id: 'validator-4',
      provider: 'Eliza OS',
      profileName: 'Data Scientist Eliza',
      vote: 'no',
      rationale: 'The risks of job displacement and uncontrolled AI development outweigh the benefits.',
    },
    {
      id: 'validator-5',
      provider: 'Cohere',
      profileName: 'Validator 5',
      vote: 'yes',
      rationale: 'When developed responsibly, AI can lead to tremendous scientific and social progress.',
    },
  ],
  votingResult: {
    yes: 4,
    no: 1,
    notVoted: 0,
  },
};

// Function to generate a random vote result for testing
export function generateMockVoteResult(query: string): VoteResult {
  const yesVotes = Math.floor(Math.random() * 5) + 1; // 1-5 yes votes
  const noVotes = 5 - yesVotes;
  const isConsensus = yesVotes >= 3 || noVotes >= 3; // Consensus if 3+ votes on either side

  return {
    id: `mock-${Date.now()}`,
    isConsensusReached: isConsensus,
    consensusValue: yesVotes > noVotes,
    queryText: query,
    validatorResponses: mockValidators.map((validator, index) => {
      const vote = index < yesVotes ? 'YES' : 'NO';
      return {
        id: validator.id,
        provider: validator.provider,
        profileName: validator.profileName,
        vote,
        rationale: vote === 'YES'
          ? `As ${validator.provider}, I believe this statement is true based on available evidence.`
          : `As ${validator.provider}, I cannot confirm this statement based on available evidence.`,
      };
    }),
    votingResult: {
      yes: yesVotes,
      no: noVotes,
      notVoted: 0,
    },
  };
}
