"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Clock, 
  Wifi, 
  AlertCircle, 
  ChevronUp, 
  ChevronDown,
  Search,
  Sparkles,
  TrendingUp,
  Zap
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface ModelInfo {
  company: string;
  model: string;
  cutoffDate: string | "real-time";
  notes?: string;
  category: "legacy" | "current" | "latest" | "real-time";
  apiAvailable?: boolean;
}

const modelData: ModelInfo[] = [
  // OpenAI - Models in your system
  { company: "OpenAI", model: "GPT-4o", cutoffDate: "2023-10", category: "current", notes: "Latest flagship", apiAvailable: true },
  { company: "OpenAI", model: "GPT-4o Mini", cutoffDate: "2023-10", category: "current", notes: "Efficient variant", apiAvailable: true },
  { company: "OpenAI", model: "o1", cutoffDate: "2023-10", category: "current", notes: "Reasoning model", apiAvailable: true },
  { company: "OpenAI", model: "o1 Mini", cutoffDate: "2023-10", category: "current", notes: "Fast reasoning", apiAvailable: true },
  { company: "OpenAI", model: "GPT-4 Turbo", cutoffDate: "2023-04", category: "current", notes: "128k context", apiAvailable: true },
  { company: "OpenAI", model: "GPT-3.5 Turbo", cutoffDate: "2021-09", category: "legacy", notes: "Fast & affordable", apiAvailable: true },
  
  // Anthropic - Models in your system
  { company: "Anthropic", model: "Claude Opus 4", cutoffDate: "2025-03", category: "latest", notes: "Most advanced", apiAvailable: true },
  { company: "Anthropic", model: "Claude Sonnet 4", cutoffDate: "2025-03", category: "latest", notes: "Balanced performance", apiAvailable: true },
  { company: "Anthropic", model: "Claude 3.5 Sonnet", cutoffDate: "2024-04", category: "latest", notes: "Current flagship", apiAvailable: true },
  { company: "Anthropic", model: "Claude 3.5 Haiku", cutoffDate: "2024-04", category: "latest", notes: "Fast & efficient", apiAvailable: true },
  { company: "Anthropic", model: "Claude 3 Opus", cutoffDate: "2023-08", category: "current", notes: "Powerful reasoning", apiAvailable: true },
  { company: "Anthropic", model: "Claude 3 Haiku", cutoffDate: "2023-08", category: "current", notes: "Speed optimized", apiAvailable: true },
  
  // Google - Models in your system
  { company: "Google", model: "Gemini 2.0 Pro", cutoffDate: "2025-01", category: "latest", notes: "Latest flagship", apiAvailable: true },
  { company: "Google", model: "Gemini 2.0 Flash", cutoffDate: "2025-01", category: "latest", notes: "Fast multimodal", apiAvailable: true },
  { company: "Google", model: "Gemini 1.5 Pro", cutoffDate: "2023-11", category: "current", notes: "1M context window", apiAvailable: true },
  { company: "Google", model: "Gemini 1.5 Flash", cutoffDate: "2023-11", category: "current", notes: "Speed optimized", apiAvailable: true },
  
  // Meta - Models in your system
  { company: "Meta", model: "Llama 3.1 405B", cutoffDate: "2024-04", category: "latest", notes: "Largest open model", apiAvailable: true },
  { company: "Meta", model: "Llama 3.1 70B", cutoffDate: "2024-04", category: "latest", notes: "High performance", apiAvailable: true },
  { company: "Meta", model: "Llama 3.1 8B", cutoffDate: "2024-04", category: "latest", notes: "Efficient size", apiAvailable: true },
  { company: "Meta", model: "Code Llama 70B", cutoffDate: "2024-01", category: "current", notes: "Code specialized", apiAvailable: true },
  
  // xAI - Models in your system
  { company: "xAI", model: "Grok-3", cutoffDate: "2025-02", category: "latest", notes: "Latest release", apiAvailable: true },
  { company: "xAI", model: "Grok-2", cutoffDate: "2024-08", category: "current", notes: "X integration", apiAvailable: true },
  { company: "xAI", model: "Grok-1", cutoffDate: "2023-11", category: "current", notes: "Original model", apiAvailable: true },
  
  // Mistral - Models in your system
  { company: "Mistral", model: "Mistral Large", cutoffDate: "2024-07", category: "latest", notes: "Flagship model", apiAvailable: true },
  { company: "Mistral", model: "Mistral Medium", cutoffDate: "2024-07", category: "latest", notes: "Balanced model", apiAvailable: true },
  { company: "Mistral", model: "Mixtral 8x22B", cutoffDate: "2024-04", category: "current", notes: "MoE architecture", apiAvailable: true },
  { company: "Mistral", model: "Mixtral 8x7B", cutoffDate: "2023-12", category: "current", notes: "Efficient MoE", apiAvailable: true },
  
  // Others in your system
  { company: "DeepSeek", model: "DeepSeek Chat", cutoffDate: "2024-06", category: "current", notes: "General chat", apiAvailable: true },
  { company: "DeepSeek", model: "DeepSeek Coder", cutoffDate: "2024-06", category: "current", notes: "Code focused", apiAvailable: true },
  { company: "Perplexity", model: "Perplexity Online", cutoffDate: "real-time", category: "real-time", notes: "Live web search", apiAvailable: true },
  { company: "Microsoft", model: "WizardLM 2", cutoffDate: "2024-04", category: "current", notes: "Instruction tuned", apiAvailable: true },
  { company: "Qwen", model: "Qwen 2.5 72B", cutoffDate: "2024-11", category: "latest", notes: "Multilingual", apiAvailable: true },
];

export function KnowledgeCutoffDisplay() {
  const [sortBy, setSortBy] = useState<"date" | "company">("date");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const getDateObject = (cutoffDate: string | "real-time") => {
    if (cutoffDate === "real-time") return new Date();
    const [year, month] = cutoffDate.split("-");
    return new Date(parseInt(year), parseInt(month) - 1);
  };

  const getRecencyColor = (cutoffDate: string | "real-time") => {
    if (cutoffDate === "real-time") return "text-green-400 bg-green-500/10";
    
    const date = getDateObject(cutoffDate);
    const monthsOld = (new Date().getTime() - date.getTime()) / (1000 * 60 * 60 * 24 * 30);
    
    if (monthsOld < 3) return "text-green-400 bg-green-500/10";
    if (monthsOld < 6) return "text-yellow-400 bg-yellow-500/10";
    if (monthsOld < 12) return "text-orange-400 bg-orange-500/10";
    return "text-zinc-400 bg-zinc-500/10";
  };

  const getRecencyIcon = (cutoffDate: string | "real-time") => {
    if (cutoffDate === "real-time") return <Wifi className="w-4 h-4" />;
    
    const date = getDateObject(cutoffDate);
    const monthsOld = (new Date().getTime() - date.getTime()) / (1000 * 60 * 60 * 24 * 30);
    
    if (monthsOld < 3) return <Zap className="w-4 h-4" />;
    if (monthsOld < 6) return <TrendingUp className="w-4 h-4" />;
    return <Clock className="w-4 h-4" />;
  };

  const filteredAndSortedModels = useMemo(() => {
    let filtered = modelData;
    
    // Filter by category
    if (filterCategory !== "all") {
      filtered = filtered.filter(m => m.category === filterCategory);
    }
    
    // Filter by search
    if (searchTerm) {
      filtered = filtered.filter(m => 
        m.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.model.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Sort
    return [...filtered].sort((a, b) => {
      if (sortBy === "date") {
        if (a.cutoffDate === "real-time") return -1;
        if (b.cutoffDate === "real-time") return 1;
        return getDateObject(b.cutoffDate).getTime() - getDateObject(a.cutoffDate).getTime();
      } else {
        return a.company.localeCompare(b.company);
      }
    });
  }, [sortBy, filterCategory, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-cyan-400" />
            LLM Knowledge Cutoff Dates
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            Stay informed about what each AI model knows
          </p>
        </div>
        <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
          {modelData.length} Models Tracked
        </Badge>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search models..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-500 focus:border-cyan-500/50 focus:outline-none"
          />
        </div>

        {/* Category Filter */}
        <div className="flex gap-2">
          {["all", "real-time", "latest", "current", "legacy"].map((cat) => (
            <Button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              variant={filterCategory === cat ? "default" : "ghost"}
              size="sm"
              className={cn(
                "capitalize",
                filterCategory === cat && "bg-cyan-600 hover:bg-cyan-500"
              )}
            >
              {cat === "all" ? "All" : cat.replace("-", " ")}
            </Button>
          ))}
        </div>

        {/* Sort Toggle */}
        <Button
          onClick={() => setSortBy(sortBy === "date" ? "company" : "date")}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          {sortBy === "date" ? (
            <>
              <Clock className="w-4 h-4" />
              Sort by Date
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Sort by Company
            </>
          )}
        </Button>
      </div>

      {/* Grid Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAndSortedModels.map((model, index) => (
          <motion.div
            key={`${model.company}-${model.model}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className={cn(
              "p-4 bg-zinc-900/50 border-zinc-800/50 hover:border-cyan-500/30 transition-all duration-200",
              model.cutoffDate === "real-time" && "border-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.1)]"
            )}>
              <div className="space-y-3">
                {/* Company & Model */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-zinc-100">{model.model}</h3>
                    <p className="text-sm text-zinc-400">{model.company}</p>
                  </div>
                  {model.apiAvailable && (
                    <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-xs">
                      API
                    </Badge>
                  )}
                </div>

                {/* Cutoff Date */}
                <div className="flex items-center gap-2">
                  <div className={cn("flex items-center gap-1.5", getRecencyColor(model.cutoffDate))}>
                    {getRecencyIcon(model.cutoffDate)}
                    <span className="text-sm font-medium">
                      {model.cutoffDate === "real-time" ? (
                        "Real-time data"
                      ) : (
                        <>
                          {new Date(getDateObject(model.cutoffDate)).toLocaleDateString('en-US', { 
                            month: 'short', 
                            year: 'numeric' 
                          })}
                          <span className="text-xs opacity-75 ml-1">
                            ({formatDistanceToNow(getDateObject(model.cutoffDate), { addSuffix: true })})
                          </span>
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* Notes */}
                {model.notes && (
                  <p className="text-xs text-zinc-500">{model.notes}</p>
                )}

                {/* Visual Timeline Bar */}
                {model.cutoffDate !== "real-time" && (
                  <div className="relative h-2 bg-black/30 rounded-full overflow-hidden">
                    <motion.div
                      className={cn(
                        "absolute inset-y-0 left-0 rounded-full",
                        getRecencyColor(model.cutoffDate).includes("green") && "bg-gradient-to-r from-green-500 to-emerald-500",
                        getRecencyColor(model.cutoffDate).includes("yellow") && "bg-gradient-to-r from-yellow-500 to-amber-500",
                        getRecencyColor(model.cutoffDate).includes("orange") && "bg-gradient-to-r from-orange-500 to-red-500",
                        getRecencyColor(model.cutoffDate).includes("zinc") && "bg-gradient-to-r from-zinc-600 to-zinc-500"
                      )}
                      initial={{ width: 0 }}
                      animate={{ 
                        width: `${Math.max(10, 100 - ((new Date().getTime() - getDateObject(model.cutoffDate).getTime()) / (1000 * 60 * 60 * 24 * 365) * 50))}%` 
                      }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Legend */}
      <Card className="p-4 bg-zinc-900/50 border-zinc-800/50">
        <h4 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-cyan-500" />
          Knowledge Recency Guide
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4 text-green-400" />
            <span className="text-zinc-400">Real-time: Live data access</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-green-400" />
            <span className="text-zinc-400">&lt; 3 months: Very recent</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-yellow-400" />
            <span className="text-zinc-400">3-6 months: Recent</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-400" />
            <span className="text-zinc-400">&gt; 6 months: Dated</span>
          </div>
        </div>
      </Card>
    </div>
  );
}