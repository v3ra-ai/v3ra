"use client";

import { Button } from "@/components/ui/button";
import { useQueryStore } from "@/store/query-store";
import { useLLMStore } from "@/store/llm-store";
import { useTokenStore } from "@/store/token-store";
import { cn } from "@/lib/utils";
import { Zap, Gauge, Brain } from "lucide-react";

interface PresetOption {
  id: string;
  name: string;
  icon: React.ReactNode;
  models: number;
  cost: number;
  description: string;
  modelIds?: string[];
}

const PRESETS: PresetOption[] = [
  {
    id: "fast",
    name: "Fast",
    icon: <Zap className="w-4 h-4" />,
    models: 2,
    cost: 2,
    description: "Quick answers from 2 models"
  },
  {
    id: "balanced",
    name: "Balanced",
    icon: <Gauge className="w-4 h-4" />,
    models: 4,
    cost: 5,
    description: "Default mix of 4 models"
  },
  {
    id: "maximum",
    name: "Maximum",
    icon: <Brain className="w-4 h-4" />,
    models: 6,
    cost: 10,
    description: "Complex queries with 6+ models"
  }
];

interface QueryPresetSelectorProps {
  selectedPreset: string;
  onPresetChange: (presetId: string) => void;
}

export function QueryPresetSelector({ selectedPreset, onPresetChange }: QueryPresetSelectorProps) {
  const { tokens } = useTokenStore();
  const { setQueriesRequested } = useQueryStore();
  const { llms, selectLLMsForPreset } = useLLMStore();

  const handlePresetSelect = (preset: PresetOption) => {
    // Select appropriate number of LLMs for this preset
    // Filter by isWorking if available, otherwise use all enabled LLMs
    const availableLLMs = llms.filter(llm => llm.isWorking !== false);
    const selectedLLMs = availableLLMs.slice(0, preset.models);
    
    // Update LLM selection
    selectLLMsForPreset(selectedLLMs.map(llm => llm.id));
    
    // Update queries requested
    setQueriesRequested(selectedLLMs.length, tokens);
    
    // Notify parent
    onPresetChange(preset.id);
  };

  return (
    <div className="flex gap-3 justify-center mt-4">
      {PRESETS.map((preset) => {
        const isSelected = selectedPreset === preset.id;
        const canAfford = tokens >= preset.cost;
        
        return (
          <Button
            key={preset.id}
            onClick={() => handlePresetSelect(preset)}
            variant={isSelected ? "default" : "outline"}
            className={cn(
              "flex flex-col items-center gap-2 p-4 h-auto min-w-[120px] transition-all",
              isSelected && "ring-2 ring-cyan-400 dark:ring-cyan-400",
              !canAfford && "opacity-50 cursor-not-allowed"
            )}
            disabled={!canAfford}
          >
            <div className="flex items-center gap-2">
              {preset.icon}
              <span className="font-medium">{preset.name}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {preset.description}
            </div>
            <div className="text-sm font-semibold">
              {preset.cost} tokens
            </div>
          </Button>
        );
      })}
    </div>
  );
}