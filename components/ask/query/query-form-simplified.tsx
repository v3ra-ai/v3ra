"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { QueryPresetSelector } from "./query-preset-selector";
import { useButtonTextTimer } from "@/utils/button-text-timer";
import { BeatLoader } from "react-spinners";
import { cn } from "@/lib/utils";
import { useTokenStore } from "@/store/token-store";
import { toast } from "sonner";

interface QueryFormSimplifiedProps {
  queryText: string;
  setQueryText: (text: string) => void;
  placeholderText: string;
  handleSubmit: () => void;
  isSubmitting: boolean;
  queriesCostTotal: number;
  userCreditsTotal: number;
  selectedPreset?: string;
}

export function QueryFormSimplified({
  queryText,
  setQueryText,
  placeholderText,
  handleSubmit,
  isSubmitting,
  queriesCostTotal,
  userCreditsTotal,
  selectedPreset: initialPreset,
}: QueryFormSimplifiedProps) {
  const [selectedPreset, setSelectedPreset] = useState(initialPreset || "balanced");
  const [isSubmitInteracted, setIsSubmitInteracted] = useState(false);
  const { buttonText, startTimer, cancelTimer } = useButtonTextTimer("Ask");
  const { tokens, spendTokens } = useTokenStore();

  // Get cost based on preset
  const presetCosts: Record<string, number> = {
    fast: 2,
    balanced: 5,
    maximum: 10
  };
  const currentCost = presetCosts[selectedPreset] || 5;

  const canAfford = tokens >= currentCost;
  const isSubmitDisabled = isSubmitting || !queryText.trim() || !canAfford;

  const onSubmit = () => {
    if (!isSubmitDisabled) {
      // Try to spend tokens
      if (spendTokens(currentCost)) {
        startTimer();
        handleSubmit();
      } else {
        toast.error("Insufficient tokens!", {
          description: `You need ${currentCost} tokens for this query.`
        });
      }
    }
  };

  useEffect(() => {
    if (!isSubmitting) {
      cancelTimer();
    }
  }, [isSubmitting, cancelTimer]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <textarea
          className={cn(
            "w-full p-4 rounded-lg min-h-[120px] resize-none",
            "text-lg bg-background/50 backdrop-blur-sm",
            "border-2 transition-all duration-200",
            "placeholder:text-muted-foreground/60",
            "focus:outline-none focus:ring-2 focus:ring-cyan-400/20",
            isSubmitInteracted && !queryText.trim()
              ? "border-red-500/50 ring-2 ring-red-500/20"
              : "border-border/50 hover:border-cyan-400/30 focus:border-cyan-400"
          )}
          placeholder={placeholderText}
          value={queryText}
          onChange={(e) => setQueryText(e.target.value)}
          onKeyPress={handleKeyPress}
        />
      </div>

      <QueryPresetSelector
        selectedPreset={selectedPreset}
        onPresetChange={setSelectedPreset}
      />

      <div className="flex justify-center">
        <Button
          className={cn(
            "px-8 py-3 text-lg font-medium rounded-full",
            "bg-gradient-to-r from-cyan-500 to-blue-500",
            "hover:from-cyan-400 hover:to-blue-400",
            "text-white shadow-lg",
            "transition-all duration-300 hover:scale-105",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          )}
          onClick={onSubmit}
          disabled={isSubmitDisabled}
          onMouseEnter={() => setIsSubmitInteracted(true)}
          onMouseLeave={() => setIsSubmitInteracted(false)}
        >
          {isSubmitting ? (
            <BeatLoader color="#ffffff" size={8} />
          ) : (
            buttonText
          )}
        </Button>
      </div>

      {!canAfford && (
        <p className="text-center text-sm text-red-500">
          Insufficient tokens. You need {currentCost} tokens.
        </p>
      )}
    </div>
  );
}