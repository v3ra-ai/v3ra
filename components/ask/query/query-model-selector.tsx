"use client";

import { memo, useEffect, useState } from "react";
import { useLLMStore } from "@/store/llm-store";
import { useQueryStore } from "@/store/query-store";
import { BookOpen, Brain, Settings, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { KNOWLEDGE_MODEL_PRIORITY, REASONING_MODEL_PRIORITY } from "@/lib/model-presets";
import { logger } from "@/lib/utils/client-logger";

interface QueryModelSelectorProps {
  onDropdownChange?: (open: boolean) => void;
  onPhilosophyModeChange?: (enabled: boolean) => void;
  showPhilosophy?: boolean;
}

export const QueryModelSelector = memo(function QueryModelSelector({ onPhilosophyModeChange, showPhilosophy = false }: QueryModelSelectorProps = {}) {
  const router = useRouter();
  const llms = useLLMStore((s) => s.llms);
  const setEnabledLLMs = useLLMStore((s) => s.setEnabledLLMs);
  const setSelectedLLMIds = useQueryStore((s) => s.setSelectedLLMIds);
  const loadCustomSelection = useLLMStore((s) => s.loadCustomSelection);
  const customSelection = useLLMStore((s) => s.customSelection);
  const [activeMode, setActiveMode] = useState<'fast' | 'balanced' | 'custom' | null>(null);
  const [justClicked, setJustClicked] = useState(false);
  const [philosophyMode, setPhilosophyMode] = useState(false);

  // Determine active mode based on selected LLMs
  useEffect(() => {
    // Don't run if a button was just clicked
    if (justClicked) {
      setJustClicked(false);
      return;
    }
    const enabledIds = llms.filter(llm => llm.enabled).map(llm => llm.id);
    if (enabledIds.length !== 5) {
      setActiveMode(null);
      return;
    }
    
    // Get the models that were selected by Knowledge preset
    const knowledgeModels: string[] = [];
    for (const modelName of KNOWLEDGE_MODEL_PRIORITY) {
      const model = llms.find(llm => 
        llm.name === modelName || 
        llm.name === `${modelName} Validator` ||
        llm.name?.replace(' Validator', '') === modelName
      );
      if (model) knowledgeModels.push(model.id);
    }
    
    // Get the models that were selected by Reasoning preset
    const reasoningModels: string[] = [];
    for (const modelName of REASONING_MODEL_PRIORITY) {
      const model = llms.find(llm => 
        llm.name === modelName || 
        llm.name === `${modelName} Validator` ||
        llm.name?.replace(' Validator', '') === modelName
      );
      if (model) reasoningModels.push(model.id);
    }
    
    // Check if current selection matches Knowledge preset (at least 3 matches)
    const knowledgeMatches = enabledIds.filter(id => knowledgeModels.includes(id)).length;
    if (knowledgeMatches >= 3) {
      setActiveMode('fast');
      return;
    }
    
    // Check if current selection matches Reasoning preset (at least 3 matches)
    const reasoningMatches = enabledIds.filter(id => reasoningModels.includes(id)).length;
    if (reasoningMatches >= 3) {
      setActiveMode('balanced');
      logger.debug('Reasoning mode activated', { reasoningMatches, enabledIds, reasoningModels });
      return;
    }
    
    // If there are enabled models but they don't match presets, it's custom mode
    if (enabledIds.length > 0) {
      setActiveMode('custom');
      return;
    }
    
    // Otherwise no preset is active
    setActiveMode(null);
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
    // Select top 5 knowledge models with diverse providers
    const selectedModels: { id: string; provider?: string; name?: string }[] = [];
    const providers = new Set<string>();
    
    // First pass: get priority models
    for (const modelName of KNOWLEDGE_MODEL_PRIORITY) {
      const model = llms.find(llm => 
        llm.name === modelName || 
        llm.name === `${modelName} Validator` ||
        llm.name?.replace(' Validator', '') === modelName
      );
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
    // Force activeMode update immediately
    setActiveMode('fast');
    setJustClicked(true);
  };

  const selectReasoningModels = () => {
    // Select top 5 reasoning models with diverse providers
    const selectedModels: { id: string; provider?: string; name?: string }[] = [];
    const providers = new Set<string>();
    
    // First pass: get priority models
    for (const modelName of REASONING_MODEL_PRIORITY) {
      const model = llms.find(llm => 
        llm.name === modelName || 
        llm.name === `${modelName} Validator` ||
        llm.name?.replace(' Validator', '') === modelName
      );
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
    logger.debug('Selecting reasoning models', { modelIds, selectedModels: selectedModels.map(m => m.name) });
    setEnabledLLMs(modelIds);
    setSelectedLLMIds(modelIds);
    // Force activeMode update immediately
    setActiveMode('balanced');
    setJustClicked(true);
  };


  const handleCustomClick = () => {
    // Set custom mode before navigating
    setActiveMode('custom');
    setJustClicked(true);
    // Navigate to AI Hub page
    router.push('/ai-hub');
  };

  const handlePhilosophyToggle = () => {
    const newValue = !philosophyMode;
    setPhilosophyMode(newValue);
    onPhilosophyModeChange?.(newValue);
  };


  return (
    <div className="relative w-full">
      <div className="flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-1 text-sm">
        {/* Philosophy Mode Button - Smaller and to the left */}
        {showPhilosophy && (
          <>
            <button
              onClick={handlePhilosophyToggle}
              className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg transition-all duration-200 text-xs ${
                philosophyMode
                  ? 'text-white dark:text-purple-400 bg-purple-600 dark:bg-purple-500/20 border-2 border-purple-600 dark:border-purple-500/50 shadow-lg shadow-purple-500/20'
                  : 'text-zinc-700 dark:text-zinc-400 bg-white dark:bg-zinc-900/50 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-purple-500/30 dark:hover:border-purple-500/30 border-2 border-zinc-300 dark:border-zinc-700'
              }`}
              title="Toggle philosophical exploration mode"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="font-medium">Philosophy</span>
            </button>
            <span className="hidden sm:inline text-zinc-400 dark:text-zinc-600 px-1">|</span>
          </>
        )}
        <button
          onClick={selectKnowledgeModels}
          className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 w-full sm:w-auto sm:min-w-0 ${
            activeMode === 'fast'
              ? 'text-white dark:text-cyan-400 bg-cyan-600 dark:bg-cyan-500/20 border-2 border-cyan-600 dark:border-cyan-500/50 shadow-lg shadow-cyan-500/20'
              : 'text-zinc-700 dark:text-zinc-400 bg-white dark:bg-zinc-900/50 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-cyan-500/30 dark:hover:border-cyan-500/30 border-2 border-zinc-300 dark:border-zinc-700'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span className="font-medium">Knowledge</span>
          <span className="text-xs opacity-70">(5)</span>
        </button>
        <span className="hidden sm:inline text-zinc-400 dark:text-zinc-600 px-1">•</span>
        <button
          onClick={selectReasoningModels}
          className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 w-full sm:w-auto sm:min-w-0 ${
            activeMode === 'balanced'
              ? 'text-white dark:text-cyan-400 bg-cyan-600 dark:bg-cyan-500/20 border-2 border-cyan-600 dark:border-cyan-500/50 shadow-lg shadow-cyan-500/20'
              : 'text-zinc-700 dark:text-zinc-400 bg-white dark:bg-zinc-900/50 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-cyan-500/30 dark:hover:border-cyan-500/30 border-2 border-zinc-300 dark:border-zinc-700'
          }`}
        >
          <Brain className="w-4 h-4" />
          <span className="font-medium">Reasoning</span>
          <span className="text-xs opacity-70">(5)</span>
        </button>
        <span className="hidden sm:inline text-zinc-400 dark:text-zinc-600 px-1">•</span>
        <button
          onClick={handleCustomClick}
          className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 w-full sm:w-auto sm:min-w-0 ${
            activeMode === 'custom'
              ? 'text-white dark:text-cyan-400 bg-cyan-600 dark:bg-cyan-500/20 border-2 border-cyan-600 dark:border-cyan-500/50 shadow-lg shadow-cyan-500/20'
              : 'text-zinc-700 dark:text-zinc-400 bg-white dark:bg-zinc-900/50 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-cyan-500/30 dark:hover:border-cyan-500/30 border-2 border-zinc-300 dark:border-zinc-700'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span className="font-medium">Custom</span>
        </button>
      </div>
    </div>
  );
});