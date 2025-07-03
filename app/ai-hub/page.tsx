"use client";

import { useState, useEffect, Suspense } from "react";
import { useLLMStore } from "@/store/llm-store";
import { useQueryStore } from "@/store/query-store";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/ask/navbar/navbar";
import { ArrowLeft, Check, Zap, Brain, BookOpen, Sparkles, Filter, Calendar, Info } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { KNOWLEDGE_MODEL_PRIORITY, REASONING_MODEL_PRIORITY } from "@/lib/model-presets";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KnowledgeCutoffDisplay } from "@/components/ai-hub/knowledge-cutoff-display";

function AIHubContent() {
  const searchParams = useSearchParams();
  const categoryFilter = searchParams.get('category');
  const llms = useLLMStore((s) => s.llms);
  const toggleLLM = useLLMStore((s) => s.toggleLLM);
  const setEnabledLLMs = useLLMStore((s) => s.setEnabledLLMs);
  const setCustomSelection = useLLMStore((s) => s.setCustomSelection);
  const loadCustomSelection = useLLMStore((s) => s.loadCustomSelection);
  const setSelectedLLMIds = useQueryStore((s) => s.setSelectedLLMIds);
  const init = useLLMStore((s) => s.init);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<'knowledge' | 'reasoning' | null>(null);
  const [activeTab, setActiveTab] = useState<string>("configure");

  useEffect(() => {
    init();
  }, [init]);

  // Load custom selection only once after initialization
  useEffect(() => {
    if (llms.length > 0 && !llms.some(llm => llm.enabled)) {
      // Only load if no models are enabled yet
      loadCustomSelection();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [llms.length]); // Remove loadCustomSelection from deps to prevent loops

  const handleToggleModel = (modelId: string) => {
    const model = llms.find(llm => llm.id === modelId);
    if (!model) return;
    
    // Check if trying to enable and already have 5 selected
    if (!model.enabled && enabledCount >= 5) {
      alert("Maximum 5 models can be selected at a time. Please deselect another model first.");
      return;
    }
    
    toggleLLM(modelId);
    // Update query store with new selection
    const newEnabledIds = llms
      .map(llm => llm.id === modelId ? { ...llm, enabled: !llm.enabled } : llm)
      .filter(llm => llm.enabled)
      .map(llm => llm.id);
    setSelectedLLMIds(newEnabledIds);
    setCustomSelection(newEnabledIds);
  };

  // Categorize models
  const getModelCategory = (name: string | undefined) => {
    if (!name) return 'knowledge';
    const lowerName = name.toLowerCase();
    if (lowerName.includes('gpt-3.5') || lowerName.includes('haiku') || lowerName.includes('flash')) {
      return 'fast';
    }
    if (lowerName.includes('gpt-4') || lowerName.includes('claude') || lowerName.includes('opus')) {
      return 'reasoning';
    }
    return 'knowledge';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'fast': return <Zap className="w-4 h-4" />;
      case 'reasoning': return <Brain className="w-4 h-4" />;
      case 'knowledge': return <BookOpen className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  const filteredLLMs = llms.filter(llm => {
    const matchesSearch = searchQuery === "" || 
      llm.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      llm.provider?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesProvider = !selectedProvider || llm.provider === selectedProvider;
    
    // Category filtering
    let matchesCategory = true;
    if (categoryFilter) {
      const category = getModelCategory(llm.name);
      if (categoryFilter === 'knowledge') {
        matchesCategory = category === 'knowledge' || category === 'fast';
      } else if (categoryFilter === 'reasoning') {
        matchesCategory = category === 'reasoning';
      }
    }
    
    return matchesSearch && matchesProvider && matchesCategory;
  });

  const enabledCount = llms.filter(llm => llm.enabled).length;
  
  // Get unique providers
  const providers = Array.from(new Set(llms.map(llm => llm.provider).filter(Boolean)));

  // Extract select dropdown styles
  const selectStyles = {
    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
    backgroundPosition: 'right 0.5rem center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: '1.5em 1.5em',
    paddingRight: '2.5rem'
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/ask" 
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-cyan-400 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Ask</span>
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-zinc-100 flex items-center gap-3">
                <Brain className="w-8 h-8 text-cyan-400" />
                AI Hub
              </h1>
              <p className="text-zinc-400 mt-1">
                {activeTab === "configure" ? "Configure your truth consensus panel" : "Track AI model capabilities"}
              </p>
            </div>
            {activeTab === "configure" && (
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-2xl font-bold text-cyan-400">{enabledCount} / 5</p>
                  <p className="text-sm text-zinc-400">Models Selected</p>
                </div>
                {enabledCount > 0 && (
                  <Link
                    href="/ask"
                    className="px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400 hover:bg-cyan-500/20 transition-colors flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Save & Return
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2 bg-zinc-900/50 border border-zinc-800/50">
            <TabsTrigger value="configure" className="data-[state=active]:bg-zinc-800">
              <Sparkles className="w-4 h-4 mr-2" />
              Configure Models
            </TabsTrigger>
            <TabsTrigger value="knowledge" className="data-[state=active]:bg-zinc-800">
              <Calendar className="w-4 h-4 mr-2" />
              Knowledge Dates
            </TabsTrigger>
          </TabsList>

          {/* Configure Tab */}
          <TabsContent value="configure" className="space-y-6">

        {/* Search and Actions */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Search models..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
          />
          
          {/* Provider Filter */}
          <select
            value={selectedProvider || ""}
            onChange={(e) => setSelectedProvider(e.target.value || null)}
            className="px-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:border-cyan-500/50 transition-colors appearance-none cursor-pointer [&>option]:bg-zinc-900 [&>option]:text-zinc-100"
            style={selectStyles}
          >
            <option value="">All Providers</option>
            {providers.map(provider => (
              <option key={provider} value={provider}>{provider}</option>
            ))}
          </select>
          
          <div className="flex gap-2">
            <button
              onClick={() => {
                // Select top 5 knowledge-focused models from different providers
                const knowledgeModels: string[] = [];
                const providers = new Set<string>();
                
                // Use shared priority order for consistency
                for (const modelName of KNOWLEDGE_MODEL_PRIORITY) {
                  const model = llms.find(llm => llm.name === modelName);
                  if (model && knowledgeModels.length < 5) {
                    knowledgeModels.push(model.id);
                    providers.add(model.provider || '');
                  }
                }
                
                // Fill remaining slots if needed
                if (knowledgeModels.length < 5) {
                  const remaining = llms
                    .filter(llm => !knowledgeModels.includes(llm.id) && !llm.name?.includes('opus') && !llm.name?.includes('sonnet'))
                    .slice(0, 5 - knowledgeModels.length)
                    .map(llm => llm.id);
                  knowledgeModels.push(...remaining);
                }
                
                const finalSelection = knowledgeModels.slice(0, 5);
                setEnabledLLMs(finalSelection);
                setSelectedLLMIds(finalSelection);
                setCustomSelection(finalSelection);
                setActivePreset('knowledge');
              }}
              className={`px-4 py-2 border rounded-lg transition-colors flex items-center gap-2 ${
                activePreset === 'knowledge'
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                  : 'bg-zinc-900/50 border-zinc-800 text-zinc-300 hover:text-cyan-400 hover:border-cyan-500/50'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Knowledge (5)
            </button>
            <button
              onClick={() => {
                // Select top 5 reasoning models from different providers
                const reasoningModels: string[] = [];
                const providers = new Set<string>();
                
                // Use shared priority order for consistency
                for (const modelName of REASONING_MODEL_PRIORITY) {
                  const model = llms.find(llm => llm.name === modelName);
                  if (model && reasoningModels.length < 5) {
                    reasoningModels.push(model.id);
                    providers.add(model.provider || '');
                  }
                }
                
                // Fill remaining slots if needed
                if (reasoningModels.length < 5) {
                  const remaining = llms
                    .filter(llm => !reasoningModels.includes(llm.id) && (llm.name?.includes('gpt-4') || llm.name?.includes('claude') || llm.name?.includes('70b')))
                    .slice(0, 5 - reasoningModels.length)
                    .map(llm => llm.id);
                  reasoningModels.push(...remaining);
                }
                
                const finalSelection = reasoningModels.slice(0, 5);
                setEnabledLLMs(finalSelection);
                setSelectedLLMIds(finalSelection);
                setCustomSelection(finalSelection);
                setActivePreset('reasoning');
              }}
              className={`px-4 py-2 border rounded-lg transition-colors flex items-center gap-2 ${
                activePreset === 'reasoning'
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                  : 'bg-zinc-900/50 border-zinc-800 text-zinc-300 hover:text-cyan-400 hover:border-cyan-500/50'
              }`}
            >
              <Brain className="w-4 h-4" />
              Reasoning (5)
            </button>
            <button
              onClick={() => {
                setEnabledLLMs([]);
                setSelectedLLMIds([]);
                setCustomSelection([]);
                setActivePreset(null);
              }}
              className="px-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded-lg text-zinc-300 hover:text-red-400 hover:border-red-500/50 transition-colors"
            >
              Clear All
            </button>
            {categoryFilter && (
              <Link
                href="/ai-hub"
                className="px-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded-lg text-zinc-300 hover:text-cyan-400 hover:border-cyan-500/50 transition-colors flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Show All
              </Link>
            )}
          </div>
        </div>

        {/* Model Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredLLMs.map((llm, index) => {
            const category = getModelCategory(llm.name);
            return (
              <motion.div
                key={llm.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleToggleModel(llm.id)}
                className={`relative p-4 rounded-xl border backdrop-blur-sm transition-all duration-300 ${
                  llm.enabled
                    ? 'bg-cyan-500/10 border-cyan-500/30 shadow-[0_0_20px_rgba(0,255,255,0.15)] cursor-pointer'
                    : enabledCount >= 5
                    ? 'bg-zinc-900/30 border-zinc-800/50 opacity-60 cursor-not-allowed'
                    : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 cursor-pointer'
                }`}
              >
                {/* Selected Badge or Limit Indicator */}
                {llm.enabled && (
                  <div className="absolute top-2 right-2">
                    <Check className="w-5 h-5 text-cyan-400" />
                  </div>
                )}
                {!llm.enabled && enabledCount >= 5 && (
                  <div className="absolute top-2 right-2">
                    <div className="text-xs text-zinc-500 bg-zinc-800/80 px-2 py-1 rounded">
                      Max 5
                    </div>
                  </div>
                )}

                {/* Model Info */}
                <div className="mb-3">
                  <h3 className={`font-medium text-lg mb-1 ${
                    llm.enabled ? 'text-cyan-400' : 'text-zinc-100'
                  }`}>
                    {llm.name?.replace(' Validator', '') || 'Unknown Model'}
                  </h3>
                  <p className="text-xs text-zinc-500">{llm.provider || 'Unknown Provider'}</p>
                </div>

                {/* Category Badge */}
                <div className="flex items-center gap-2">
                  <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                    llm.enabled
                      ? 'bg-cyan-500/20 text-cyan-300'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}>
                    {getCategoryIcon(category)}
                    <span className="capitalize">{category}</span>
                  </div>
                </div>

                {/* Hover Indicator */}
                <div className={`absolute inset-0 rounded-xl border-2 transition-opacity duration-300 pointer-events-none ${
                  llm.enabled 
                    ? 'border-cyan-500/50 opacity-0' 
                    : 'border-cyan-500/0 hover:border-cyan-500/30 hover:opacity-100'
                }`} />
              </motion.div>
            );
          })}
        </div>

            {/* Save Button */}
            <div className="mt-8 flex justify-center">
              <Link
                href="/ask"
                className="px-8 py-3 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/30 hover:shadow-[0_0_20px_rgba(0,255,255,0.3)] transition-all duration-300 font-medium"
              >
                Save & Return to Ask
              </Link>
            </div>
          </TabsContent>

          {/* Knowledge Dates Tab */}
          <TabsContent value="knowledge" className="space-y-6">
            <KnowledgeCutoffDisplay />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function AIHubPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-400">Loading...</div>
      </div>
    }>
      <AIHubContent />
    </Suspense>
  );
}