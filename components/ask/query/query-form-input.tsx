"use client";

import React, { useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Dispatch, SetStateAction } from "react";
import { QueryMode } from "@/lib/types";
import { useLLMStore } from "@/store/llm-store";
import { useQueryStore } from "@/store/query-store";
import { toast } from "sonner";

interface QueryFormInputProps {
  queryText: string;
  setQueryText: Dispatch<SetStateAction<string>>;
  placeholderText: string;
  handleSubmit: () => void;
  isSubmitting: boolean;
  isSubmitInteracted: boolean;
  queryMode: QueryMode;
  queriesRequested: number;
}

const QueryFormInputComponent = function QueryFormInput({
  queryText,
  setQueryText,
  placeholderText,
  handleSubmit,
  isSubmitting,
  isSubmitInteracted: _isSubmitInteracted,
  queryMode: _queryMode,
  queriesRequested,
}: QueryFormInputProps) {
  const { llms } = useLLMStore();
  const { setQueriesRequested } = useQueryStore();

  const selectedLLMCount = llms.filter((llm) => llm.enabled).length;
  const hasSelectedLLMs = selectedLLMCount > 0;

  // Sync queriesRequested with selectedLLMCount on mount
  useEffect(() => {
    if (hasSelectedLLMs && queriesRequested !== selectedLLMCount) {
      setQueriesRequested(selectedLLMCount, 100);
    }
  }, [hasSelectedLLMs, selectedLLMCount, queriesRequested, setQueriesRequested]);

  const onSubmit = () => {
    if (hasSelectedLLMs && queriesRequested > selectedLLMCount) {
      toast.error(`Cannot query ${queriesRequested} AIs when only ${selectedLLMCount} are selected.`, {
        style: { background: "#fee2e2", color: "#dc2626" },
      });
      return;
    }

    try {
      handleSubmit();
    } catch {
      toast.error("Failed to submit query, please try again", {
        style: { background: "#fee2e2", color: "#dc2626" },
      });
    }
  };

  const isSubmitDisabled = useMemo(
    () => isSubmitting || !queryText.trim() || (hasSelectedLLMs && queriesRequested > selectedLLMCount),
    [isSubmitting, queryText, hasSelectedLLMs, queriesRequested, selectedLLMCount]
  );

  return (
    <div className="space-y-6">
      <div className="relative">
        <textarea
          className="w-full p-3 rounded-lg h-20 resize-none
            bg-zinc-950/30
            border border-cyan-500/20 
            text-zinc-100 placeholder-zinc-600
            focus:outline-none focus:border-cyan-500/40 focus:bg-zinc-950/50
            transition-all duration-200
            shadow-[0_0_15px_rgba(0,255,255,0.05)] focus:shadow-[0_0_20px_rgba(0,255,255,0.15)]"
          placeholder={placeholderText}
          value={queryText}
          onChange={(e) => setQueryText(e.target.value)}
        />
      </div>
      
      <div className="flex justify-center">
        <Button
          onClick={onSubmit}
          disabled={isSubmitDisabled}
          className="px-16 h-10 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400
            text-white font-medium rounded-lg transition-all duration-200 
            disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20"
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Analyzing...</span>
            </div>
          ) : (
            "Ask"
          )}
        </Button>
      </div>
    </div>
  );
};

export const QueryFormInput = QueryFormInputComponent;