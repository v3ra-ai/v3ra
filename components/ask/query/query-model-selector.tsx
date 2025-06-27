"use client";

import { useLLMStore } from "@/store/llm-store";
import { useQueryStore } from "@/store/query-store";
import { BookOpen, Brain, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Model selection based on category - max 5 diverse models
const KNOWLEDGE_MODEL_PRIORITY = [
  "GPT-4 Validator",
  "Gemini Pro Validator", 
  "Mistral Large Validator",
  "GPT-3.5-turbo Validator",
  "Llama 3 8B Validator"
];

const REASONING_MODEL_PRIORITY = [
  "Claude 3 Opus Validator",
  "GPT-4o Validator",
  "Claude 3 Sonnet Validator",
  "Llama 3 70B Validator",
  "Gemini 1.5 Pro Validator"
];

interface QueryModelSelectorProps {
  onDropdownChange?: (open: boolean) => void;
}

export function QueryModelSelector({}: QueryModelSelectorProps = {}) {
  const router = useRouter();
  const llms = useLLMStore((s) => s.llms);
  const setEnabledLLMs = useLLMStore((s) => s.setEnabledLLMs);
  const setSelectedLLMIds = useQueryStore((s) => s.setSelectedLLMIds);
  const loadCustomSelection = useLLMStore((s) => s.loadCustomSelection);
  const customSelection = useLLMStore((s) => s.customSelection);
  const [activeMode, setActiveMode] = useState<'fast' | 'balanced' | 'custom' | null>(null);

  // Determine active mode based on selected LLMs
  useEffect(() => {
    const enabledCount = llms.filter(llm => llm.enabled).length;
    const enabledNames = llms.filter(llm => llm.enabled).map(llm => llm.name);
    
    // Check if current selection matches knowledge models
    const isKnowledge = enabledCount === 5 && 
      KNOWLEDGE_MODEL_PRIORITY.some(name => enabledNames.includes(name));
    
    // Check if current selection matches reasoning models  
    const isReasoning = enabledCount === 5 &&
      REASONING_MODEL_PRIORITY.some(name => enabledNames.includes(name));
    
    if (isKnowledge) {
      setActiveMode('fast'); // Using 'fast' for knowledge
    } else if (isReasoning) {
      setActiveMode('balanced'); // Using 'balanced' for reasoning
    } else if (enabledCount > 0 && enabledCount <= 5) {
      setActiveMode('custom');
    } else {
      setActiveMode(null);
    }
  }, [llms]);

  // Load custom selection only on mount
  useEffect(() => {
    if (customSelection.length > 0) {
      loadCustomSelection();
      setSelectedLLMIds(customSelection);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps to run only on mount

  const selectKnowledgeModels = () => {
    setActiveMode('fast'); // Set active mode immediately
    
    // Select top 5 knowledge models with diverse providers
    const selectedModels: { id: string; provider?: string; name?: string }[] = [];
    const providers = new Set<string>();
    
    // First pass: get priority models
    for (const modelName of KNOWLEDGE_MODEL_PRIORITY) {
      const model = llms.find(llm => llm.name === modelName);
      if (model && selectedModels.length < 5) {
        selectedModels.push(model);
        providers.add(model.provider || '');
      }
    }
    
    // Fill remaining slots with diverse providers
    if (selectedModels.length < 5) {
      const remaining = llms
        .filter(llm => 
          !selectedModels.includes(llm) && 
          !providers.has(llm.provider) &&
          !llm.name?.includes('opus') && 
          !llm.name?.includes('sonnet')
        )
        .slice(0, 5 - selectedModels.length);
      selectedModels.push(...remaining);
    }
    
    const modelIds = selectedModels.slice(0, 5).map(llm => llm.id);
    setEnabledLLMs(modelIds);
    setSelectedLLMIds(modelIds);
  };

  const selectReasoningModels = () => {
    setActiveMode('balanced'); // Set active mode immediately
    
    // Select top 5 reasoning models with diverse providers
    const selectedModels: { id: string; provider?: string; name?: string }[] = [];
    const providers = new Set<string>();
    
    // First pass: get priority models
    for (const modelName of REASONING_MODEL_PRIORITY) {
      const model = llms.find(llm => llm.name === modelName);
      if (model && selectedModels.length < 5) {
        selectedModels.push(model);
        providers.add(model.provider || '');
      }
    }
    
    // Fill remaining slots with high-capability models
    if (selectedModels.length < 5) {
      const remaining = llms
        .filter(llm => 
          !selectedModels.includes(llm) && 
          (llm.name?.includes('gpt-4') || 
           llm.name?.includes('claude') || 
           llm.name?.includes('opus') ||
           llm.name?.includes('70b'))
        )
        .slice(0, 5 - selectedModels.length);
      selectedModels.push(...remaining);
    }
    
    const modelIds = selectedModels.slice(0, 5).map(llm => llm.id);
    setEnabledLLMs(modelIds);
    setSelectedLLMIds(modelIds);
  };

  const _selectAllModels = () => {
    const allModelIds = llms.map((llm) => llm.id);
    setEnabledLLMs(allModelIds);
    setSelectedLLMIds(allModelIds);
  };

  const handleCustomClick = () => {
    // Navigate to AI Hub page
    router.push('/ai-hub');
  };


  const enabledCount = llms.filter(llm => llm.enabled).length;

  return (
    <div className="relative">
      <div className="flex justify-center items-center gap-1 text-sm">
        <button
          onClick={selectKnowledgeModels}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-200 ${
            activeMode === 'fast'
              ? 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/30'
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-950/50 hover:border-cyan-500/20 border border-transparent'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          Knowledge (5)
        </button>
        <span className="text-zinc-700 px-2">•</span>
        <button
          onClick={selectReasoningModels}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-200 ${
            activeMode === 'balanced'
              ? 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/30'
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-950/50 hover:border-cyan-500/20 border border-transparent'
          }`}
        >
          <Brain className="w-3.5 h-3.5" />
          Reasoning (5)
        </button>
        <span className="text-zinc-700 px-2">•</span>
        <button
          onClick={handleCustomClick}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-200 ${
            activeMode === 'custom'
              ? 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/30'
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-950/50 hover:border-cyan-500/20 border border-transparent'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          Custom ({enabledCount})
        </button>
      </div>
    </div>
  );
}