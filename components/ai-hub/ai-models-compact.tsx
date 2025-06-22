"use client";

import Link from "next/link";
import { ArrowRight, Brain, Activity, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Mock data for AI models with specializations
const aiModels = [
  {
    id: "llama-3-70b",
    name: "Llama 3 70B",
    provider: "OpenRouter",
    model: "meta-llama/llama-3-70b-instruct",
    specialization: "Open source powerhouse excelling at complex reasoning and multilingual tasks",
    category: "Open Source",
    strengths: ["Multilingual", "Privacy-focused", "Customizable"],
    stats: { reliability: 94, totalVotes: 324 },
    active: true
  },
  {
    id: "gpt-4-turbo",
    name: "GPT-4 Turbo",
    provider: "OpenAI",
    model: "gpt-4-turbo-preview",
    specialization: "Advanced reasoning and comprehensive understanding across diverse domains",
    category: "General Intelligence",
    strengths: ["Complex reasoning", "Code generation", "Analysis"],
    stats: { reliability: 96, totalVotes: 412 },
    active: true
  },
  {
    id: "claude-3-opus",
    name: "Claude 3 Opus",
    provider: "Anthropic",
    model: "claude-3-opus-20240229",
    specialization: "Superior at complex analysis, long-form content, and nuanced understanding",
    category: "Advanced Analysis",
    strengths: ["Deep analysis", "Long context", "Ethical reasoning"],
    stats: { reliability: 95, totalVotes: 287 },
    active: false
  },
  {
    id: "mixtral-8x7b",
    name: "Mixtral 8x7B",
    provider: "Mistral AI",
    model: "mistralai/mixtral-8x7b-instruct",
    specialization: "Efficient expert model providing specialized responses with great speed",
    category: "Efficient Expert",
    strengths: ["Efficiency", "Technical tasks", "Speed"],
    stats: { reliability: 92, totalVotes: 198 },
    active: true
  },
  {
    id: "gemini-pro",
    name: "Gemini Pro",
    provider: "Google",
    model: "google/gemini-pro",
    specialization: "Multimodal AI with strong reasoning capabilities across text and visual inputs",
    category: "Multimodal",
    strengths: ["Multimodal", "Math", "Science"],
    stats: { reliability: 93, totalVotes: 256 },
    active: true
  },
  {
    id: "gpt-3.5-turbo",
    name: "GPT-3.5 Turbo",
    provider: "OpenAI",
    model: "gpt-3.5-turbo",
    specialization: "Fast, efficient conversational AI for general-purpose tasks",
    category: "Conversational",
    strengths: ["Speed", "Cost-effective", "General knowledge"],
    stats: { reliability: 91, totalVotes: 523 },
    active: true
  }
];

export default function AIModelsCompact() {
  return (
    <div className="space-y-3">
      {/* Compact grid layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {aiModels.map((model) => (
          <Link
            key={model.id}
            href={`/ai-hub/${model.id}/profile`}
            className="group block"
          >
            <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/30 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:border-zinc-300 dark:hover:border-zinc-600 transition-all">
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-zinc-800 dark:text-zinc-100 truncate">
                      {model.name}
                    </h3>
                    {model.active && (
                      <Activity className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                    {model.provider} • {model.model}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200 transition-colors flex-shrink-0 mt-0.5" />
              </div>
              
              {/* Specialization - Compact */}
              <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-2 line-clamp-2">
                {model.specialization}
              </p>
              
              {/* Stats row */}
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-xs">
                  <Brain className="w-3 h-3 mr-1" />
                  {model.category}
                </Badge>
                <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                  <span className="flex items-center gap-1">
                    <BarChart3 className="w-3 h-3" />
                    {model.stats.reliability}%
                  </span>
                  <span>{model.stats.totalVotes} votes</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
      
      {/* Info note */}
      <div className="mt-6 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/50">
        <p className="text-xs text-blue-800 dark:text-blue-200">
          <strong>Tip:</strong> Click any model to view its complete profile with voting history and detailed metrics.
        </p>
      </div>
    </div>
  );
}
