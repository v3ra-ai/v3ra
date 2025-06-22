"use client";

import Link from "next/link";
import { ArrowRight, Brain } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Mock data for AI models with specializations
const aiModels = [
  {
    id: "llama-3-70b",
    name: "Llama 3 70B Validator",
    provider: "OpenRouter",
    specialization: "Open source powerhouse excelling at complex reasoning and multilingual tasks",
    category: "Open Source",
    strengths: ["Multilingual", "Privacy-focused", "Customizable"],
    stats: { reliability: 94, totalVotes: 324 }
  },
  {
    id: "gpt-4-turbo",
    name: "GPT-4 Turbo Validator",
    provider: "OpenAI",
    specialization: "Advanced reasoning and comprehensive understanding across diverse domains",
    category: "General Intelligence",
    strengths: ["Complex reasoning", "Code generation", "Analysis"],
    stats: { reliability: 96, totalVotes: 412 }
  },
  {
    id: "claude-3-opus",
    name: "Claude 3 Opus Validator",
    provider: "Anthropic",
    specialization: "Superior at complex analysis, long-form content, and nuanced understanding",
    category: "Advanced Analysis",
    strengths: ["Deep analysis", "Long context", "Ethical reasoning"],
    stats: { reliability: 95, totalVotes: 287 }
  },
  {
    id: "mixtral-8x7b",
    name: "Mixtral 8x7B Validator",
    provider: "Mistral AI",
    specialization: "Efficient expert model providing specialized responses with great speed",
    category: "Efficient Expert",
    strengths: ["Efficiency", "Technical tasks", "Speed"],
    stats: { reliability: 92, totalVotes: 198 }
  }
];

export default function SimpleAIHubPage() {
  return (
    <div className="container mx-auto py-8">
      <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-zinc-800 dark:text-zinc-200">
            A.I. Hub - Model Specializations
          </CardTitle>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
            Click on any model to view its detailed profile, specialization, and voting history
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {aiModels.map((model) => (
              <Link
                key={model.id}
                href={`/ai-hub/${model.id}/profile`}
                className="group block"
              >
                <div className="p-6 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">
                          {model.name}
                        </h3>
                        <span className="text-sm text-zinc-500 dark:text-zinc-400">
                          by {model.provider}
                        </span>
                      </div>
                      
                      <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-3">
                        {model.specialization}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs">
                        <span className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400">
                          <Brain className="w-3 h-3" />
                          {model.category}
                        </span>
                        <span className="text-emerald-600 dark:text-emerald-400">
                          {model.stats.reliability}% reliable
                        </span>
                        <span className="text-zinc-500 dark:text-zinc-400">
                          {model.stats.totalVotes} votes
                        </span>
                      </div>
                      
                      <div className="flex gap-2 mt-3">
                        {model.strengths.map((strength, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 text-xs rounded-md bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                          >
                            {strength}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <ArrowRight className="w-5 h-5 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200 transition-colors ml-4 flex-shrink-0" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
          
          <div className="mt-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              💡 <strong>Tip:</strong> Each AI model has unique strengths. Click on any model to see its complete profile including detailed voting history, performance metrics, and specialization areas.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
