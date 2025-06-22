export interface AIModelSpecialization {
  category: string;
  description: string;
  strengths: string[];
  useCases: string[];
}

export interface VoteStatistics {
  totalVotes: number;
  yesVotes: number;
  noVotes: number;
  reliability: number;
  consensus: number;
  nonConsensus: number;
}

export interface VoteHistory {
  queryText: string;
  vote: 'YES' | 'NO';
  rationale: string;
  timestamp: string;
}

export interface AIModelProfile {
  id: string;
  name: string;
  provider: string;
  model: string;
  description: string;
  specialization: AIModelSpecialization;
  isActive: boolean;
  isLeader: boolean;
  publicKey?: string;
  validatorType?: string;
  createdAt: string;
  updatedAt: string;
  voteStatistics: VoteStatistics;
  voteHistory: VoteHistory[];
}

// Predefined specializations for common models
export const MODEL_SPECIALIZATIONS: Record<string, AIModelSpecialization> = {
  // OpenAI Models
  'gpt-4o': {
    category: 'Multimodal Excellence',
    description: 'OpenAI\'s most advanced model with vision, voice, and text capabilities for complex real-world tasks',
    strengths: ['Vision understanding', 'Voice synthesis', 'Complex reasoning', 'Real-time processing'],
    useCases: ['Visual analysis', 'Voice assistants', 'Complex research', 'Creative projects']
  },
  'gpt-4-turbo': {
    category: 'Advanced Intelligence',
    description: 'Optimized GPT-4 with 128K context, enhanced speed, and improved instruction following',
    strengths: ['Long context', 'JSON mode', 'Function calling', 'Enhanced reasoning'],
    useCases: ['API development', 'Document analysis', 'Complex coding', 'Technical writing']
  },
  'gpt-4': {
    category: 'General Intelligence',
    description: 'Advanced reasoning, complex problem-solving, and comprehensive understanding across diverse domains',
    strengths: ['Complex reasoning', 'Code generation', 'Creative writing', 'Analysis'],
    useCases: ['Research', 'Software development', 'Content creation', 'Problem solving']
  },
  'gpt-3.5-turbo': {
    category: 'Conversational AI',
    description: 'Fast, efficient conversational AI for general-purpose tasks and dialogue',
    strengths: ['Quick responses', 'General knowledge', 'Conversation', 'Cost-effective'],
    useCases: ['Chatbots', 'Customer service', 'Quick queries', 'Brainstorming']
  },
  
  // Anthropic Models
  'claude-3-opus': {
    category: 'Advanced Analysis',
    description: 'Superior at complex analysis, long-form content, and nuanced understanding with 200K context',
    strengths: ['Deep analysis', 'Long context', 'Academic writing', 'Ethical reasoning'],
    useCases: ['Research papers', 'Legal analysis', 'Technical documentation', 'Ethics review']
  },
  'claude-3.5-sonnet': {
    category: 'Speed & Intelligence',
    description: 'Fastest Claude model with graduate-level reasoning, superior coding, and visual understanding',
    strengths: ['Code generation', 'Visual processing', 'Fast responses', 'Instruction following'],
    useCases: ['Software engineering', 'Data analysis', 'Content creation', 'Customer support']
  },
  'claude-3-sonnet': {
    category: 'Balanced Performance',
    description: 'Well-balanced model excelling at both analytical and creative tasks',
    strengths: ['Balanced capabilities', 'Code review', 'Writing', 'Summarization'],
    useCases: ['Content editing', 'Code assistance', 'Report writing', 'Data analysis']
  },
  'claude-3-haiku': {
    category: 'Lightning Fast',
    description: 'Fastest Claude model for instant responses while maintaining quality',
    strengths: ['Ultra-fast', 'Cost-effective', 'Basic reasoning', 'High throughput'],
    useCases: ['Real-time chat', 'Content moderation', 'Quick lookups', 'High-volume processing']
  },
  
  // Meta Llama Models
  'llama-3.1-405b': {
    category: 'Open Source Frontier',
    description: 'Meta\'s flagship 405B parameter model rivaling GPT-4 with 128K context window',
    strengths: ['Massive scale', 'Open source', 'Multilingual', 'Tool use'],
    useCases: ['Research', 'Enterprise deployment', 'Complex reasoning', 'Synthetic data']
  },
  'llama-3-70b': {
    category: 'Open Source Powerhouse',
    description: 'High-performance open-source model with strong multilingual capabilities',
    strengths: ['Open source', 'Multilingual', 'Customizable', 'Privacy-focused'],
    useCases: ['On-premise deployment', 'Custom applications', 'Multilingual tasks', 'Research']
  },
  'llama-3-8b': {
    category: 'Efficient Open Model',
    description: 'Compact yet powerful model ideal for edge deployment and resource-constrained environments',
    strengths: ['Lightweight', 'Fast inference', 'Mobile-ready', 'Energy efficient'],
    useCases: ['Edge computing', 'Mobile apps', 'IoT devices', 'Personal assistants']
  },
  
  // Google Models
  'gemini-2.0-flash': {
    category: 'Multimodal Speed',
    description: 'Google\'s fastest multimodal model with native image, video, and audio understanding',
    strengths: ['Multimodal native', 'Real-time processing', 'Tool use', 'Long context'],
    useCases: ['Live translation', 'Video analysis', 'Interactive tutoring', 'Multimodal search']
  },
  'gemini-pro': {
    category: 'Multimodal Intelligence',
    description: 'Google\'s advanced model with multimodal capabilities and broad knowledge',
    strengths: ['Multimodal', 'Reasoning', 'Math', 'Science'],
    useCases: ['Educational content', 'Scientific research', 'Visual analysis', 'Problem solving']
  },
  'gemini-pro-vision': {
    category: 'Visual Understanding',
    description: 'Specialized for image and video understanding with advanced visual reasoning',
    strengths: ['Image analysis', 'OCR', 'Visual QA', 'Diagram understanding'],
    useCases: ['Document processing', 'Medical imaging', 'Quality control', 'Visual search']
  },
  
  // Mistral Models
  'mixtral-8x22b': {
    category: 'Expert Architecture',
    description: 'Large mixture of experts model with 8x22B parameters for superior performance',
    strengths: ['Massive capacity', 'Expert routing', 'Multilingual', 'Code mastery'],
    useCases: ['Enterprise AI', 'Complex coding', 'Translation', 'Technical analysis']
  },
  'mixtral-8x7b': {
    category: 'Efficient Expert',
    description: 'Mixture of experts architecture providing efficient, specialized responses',
    strengths: ['Efficiency', 'Technical tasks', 'Reasoning', 'Speed'],
    useCases: ['Technical support', 'Code generation', 'API services', 'Real-time applications']
  },
  'mistral-7b': {
    category: 'Compact Excellence',
    description: 'Highly efficient 7B model outperforming larger models in many benchmarks',
    strengths: ['Size efficiency', 'Fast inference', 'Strong performance', 'Low resource'],
    useCases: ['Chatbots', 'Code completion', 'Text generation', 'Edge deployment']
  },
  
  // DeepSeek Models
  'deepseek-chat': {
    category: 'Chinese AI Leader',
    description: 'Advanced Chinese model with strong reasoning and bilingual capabilities',
    strengths: ['Chinese fluency', 'Reasoning', 'Math', 'Code'],
    useCases: ['Chinese content', 'Technical support', 'Education', 'Research']
  },
  'deepseek-coder': {
    category: 'Code Specialist',
    description: 'Specialized for programming with support for 80+ languages and advanced debugging',
    strengths: ['Code generation', 'Bug fixing', 'Code review', 'Multi-language'],
    useCases: ['Software development', 'Code review', 'Debugging', 'Documentation']
  },
  
  // Qwen Models
  'qwen-2.5-72b': {
    category: 'Multilingual Master',
    description: 'Alibaba\'s flagship model excelling in 29+ languages with strong reasoning',
    strengths: ['Multilingual', 'Long context', 'Instruction following', 'Math & coding'],
    useCases: ['Global applications', 'Translation', 'Technical writing', 'Education']
  },
  'qwen-2.5-coder': {
    category: 'Code Expert',
    description: 'Specialized coding model supporting 92 languages with advanced debugging capabilities',
    strengths: ['92 languages', 'Code generation', 'Debugging', 'Refactoring'],
    useCases: ['Full-stack development', 'Code migration', 'Technical documentation', 'DevOps']
  },
  
  // Specialized Models
  'phi-3': {
    category: 'Small Language Model',
    description: 'Microsoft\'s efficient SLM with surprising capabilities for its size',
    strengths: ['Tiny size', 'Mobile-ready', 'Fast inference', 'Low power'],
    useCases: ['Mobile apps', 'Edge AI', 'Embedded systems', 'Real-time processing']
  },
  'yi-34b': {
    category: 'Bilingual Excellence',
    description: 'Strong bilingual model excelling in English and Chinese with balanced capabilities',
    strengths: ['Bilingual', 'Long context', 'Reasoning', 'Creative writing'],
    useCases: ['Cross-cultural content', 'Translation', 'International business', 'Education']
  },
  'grok': {
    category: 'Real-time Knowledge',
    description: 'xAI\'s model with real-time information access and witty personality',
    strengths: ['Real-time data', 'Humor', 'Current events', 'Direct answers'],
    useCases: ['News analysis', 'Social media', 'Current events', 'Entertainment']
  },
  'perplexity': {
    category: 'Search Intelligence',
    description: 'Optimized for web search with citations and real-time information retrieval',
    strengths: ['Web search', 'Citations', 'Fact-checking', 'Current data'],
    useCases: ['Research', 'Fact verification', 'Academic work', 'Information gathering']
  },
  'wizardlm': {
    category: 'Instruction Master',
    description: 'Fine-tuned for exceptional instruction following and complex task completion',
    strengths: ['Instruction following', 'Complex tasks', 'Step-by-step', 'Teaching'],
    useCases: ['Tutoring', 'Task automation', 'Workflow assistance', 'Training']
  },
  'zephyr': {
    category: 'Aligned Assistant',
    description: 'Highly aligned model optimized for helpful, harmless, and honest responses',
    strengths: ['Alignment', 'Safety', 'Helpfulness', 'Consistency'],
    useCases: ['Customer service', 'Educational content', 'Family-friendly apps', 'Professional communication']
  },
  'nous-hermes': {
    category: 'Uncensored Intelligence',
    description: 'Less restricted model for research and creative applications requiring flexibility',
    strengths: ['Flexibility', 'Creative freedom', 'Research focus', 'Diverse responses'],
    useCases: ['Creative writing', 'Research', 'Artistic projects', 'Exploration']
  },
  'default': {
    category: 'General Purpose',
    description: 'A versatile AI model suitable for a wide range of tasks',
    strengths: ['Versatility', 'Reliability', 'General knowledge'],
    useCases: ['General queries', 'Content generation', 'Task assistance']
  }
};

export function getModelSpecialization(modelName: string): AIModelSpecialization {
  const lowerName = modelName.toLowerCase();
  
  // Check for specific model matches
  if (lowerName.includes('gpt-4o') || lowerName.includes('gpt-40')) {
    return MODEL_SPECIALIZATIONS['gpt-4o'];
  }
  if (lowerName.includes('gpt-4-turbo') || lowerName.includes('gpt-4-1106')) {
    return MODEL_SPECIALIZATIONS['gpt-4-turbo'];
  }
  if (lowerName.includes('claude-3-opus')) {
    return MODEL_SPECIALIZATIONS['claude-3-opus'];
  }
  if (lowerName.includes('claude-3.5-sonnet') || lowerName.includes('claude-3-5-sonnet')) {
    return MODEL_SPECIALIZATIONS['claude-3.5-sonnet'];
  }
  if (lowerName.includes('claude-3-haiku')) {
    return MODEL_SPECIALIZATIONS['claude-3-haiku'];
  }
  if (lowerName.includes('llama-3.1-405b') || lowerName.includes('llama-3-1-405b')) {
    return MODEL_SPECIALIZATIONS['llama-3.1-405b'];
  }
  if (lowerName.includes('llama-3-8b') || lowerName.includes('llama-3.1-8b')) {
    return MODEL_SPECIALIZATIONS['llama-3-8b'];
  }
  if (lowerName.includes('gemini-2.0-flash') || lowerName.includes('gemini-2-0-flash')) {
    return MODEL_SPECIALIZATIONS['gemini-2.0-flash'];
  }
  if (lowerName.includes('gemini-pro-vision')) {
    return MODEL_SPECIALIZATIONS['gemini-pro-vision'];
  }
  if (lowerName.includes('mixtral-8x22b')) {
    return MODEL_SPECIALIZATIONS['mixtral-8x22b'];
  }
  if (lowerName.includes('mistral-7b') && !lowerName.includes('mixtral')) {
    return MODEL_SPECIALIZATIONS['mistral-7b'];
  }
  if (lowerName.includes('deepseek-coder')) {
    return MODEL_SPECIALIZATIONS['deepseek-coder'];
  }
  if (lowerName.includes('deepseek-chat') || lowerName.includes('deepseek') && lowerName.includes('chat')) {
    return MODEL_SPECIALIZATIONS['deepseek-chat'];
  }
  if (lowerName.includes('qwen') && lowerName.includes('coder')) {
    return MODEL_SPECIALIZATIONS['qwen-2.5-coder'];
  }
  if (lowerName.includes('qwen-2.5') || lowerName.includes('qwen') && lowerName.includes('72b')) {
    return MODEL_SPECIALIZATIONS['qwen-2.5-72b'];
  }
  if (lowerName.includes('phi-3') || lowerName.includes('phi3')) {
    return MODEL_SPECIALIZATIONS['phi-3'];
  }
  if (lowerName.includes('yi') && (lowerName.includes('34b') || lowerName.includes('chat'))) {
    return MODEL_SPECIALIZATIONS['yi-34b'];
  }
  if (lowerName.includes('grok')) {
    return MODEL_SPECIALIZATIONS['grok'];
  }
  if (lowerName.includes('perplexity') || lowerName.includes('pplx')) {
    return MODEL_SPECIALIZATIONS['perplexity'];
  }
  if (lowerName.includes('wizard')) {
    return MODEL_SPECIALIZATIONS['wizardlm'];
  }
  if (lowerName.includes('zephyr')) {
    return MODEL_SPECIALIZATIONS['zephyr'];
  }
  if (lowerName.includes('nous') || lowerName.includes('hermes')) {
    return MODEL_SPECIALIZATIONS['nous-hermes'];
  }
  
  // Check for broader category matches
  if (lowerName.includes('gpt-4')) {
    return MODEL_SPECIALIZATIONS['gpt-4'];
  }
  if (lowerName.includes('gpt-3.5') || lowerName.includes('gpt')) {
    return MODEL_SPECIALIZATIONS['gpt-3.5-turbo'];
  }
  if (lowerName.includes('claude')) {
    return MODEL_SPECIALIZATIONS['claude-3-sonnet'];
  }
  if (lowerName.includes('llama')) {
    return MODEL_SPECIALIZATIONS['llama-3-70b'];
  }
  if (lowerName.includes('mixtral') || lowerName.includes('mistral')) {
    return MODEL_SPECIALIZATIONS['mixtral-8x7b'];
  }
  if (lowerName.includes('gemini')) {
    return MODEL_SPECIALIZATIONS['gemini-pro'];
  }
  if (lowerName.includes('deepseek')) {
    return MODEL_SPECIALIZATIONS['deepseek-chat'];
  }
  if (lowerName.includes('qwen')) {
    return MODEL_SPECIALIZATIONS['qwen-2.5-72b'];
  }
  
  return MODEL_SPECIALIZATIONS['default'];
}
