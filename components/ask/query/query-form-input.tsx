"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Dispatch, ReactNode, SetStateAction } from "react";
import { QueryMode } from "@/lib/types";
import { useLLMStore } from "@/store/llm-store";
import { useQueryStore } from "@/store/query-store";
import { toast } from "sonner";
import { formatQueryMode } from "@/utils/text-utils";

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
  isSubmitInteracted,
  queryMode,
  queriesRequested,
}: QueryFormInputProps) {
  const { llms } = useLLMStore();
  const { setQueriesRequested } = useQueryStore();
  const [buttonText, setButtonText] = useState<ReactNode>(formatQueryMode(queryMode));

  const selectedLLMCount = llms.filter((llm) => llm.enabled).length;
  const hasSelectedLLMs = selectedLLMCount > 0;

  // Sync queriesRequested with selectedLLMCount on mount
  useEffect(() => {
    if (hasSelectedLLMs && queriesRequested !== selectedLLMCount) {
      setQueriesRequested(selectedLLMCount, 100);
    }
  }, [hasSelectedLLMs, selectedLLMCount, queriesRequested, setQueriesRequested]);

  const onSubmit = () => {
    // Credits check removed - app is now free to use

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

  useEffect(() => {
    if (!isSubmitting) {
      setButtonText(formatQueryMode(queryMode));
    }
  }, [isSubmitting, queryMode]);

  // Ensure button text updates when queryMode changes
  useEffect(() => {
    setButtonText(formatQueryMode(queryMode));
  }, [queryMode]);

  
  const isSubmitDisabled = useMemo(
    () => isSubmitting || !queryText.trim() || (hasSelectedLLMs && queriesRequested > selectedLLMCount),
    [isSubmitting, queryText, hasSelectedLLMs, queriesRequested, selectedLLMCount]
  );

  return (
    <div>
      <div className="flex flex-col mb-2">
        <textarea
          className={`w-full p-3 sm:p-4 rounded-lg h-20 sm:h-24 focus:outline-none text-foreground placeholder-muted-foreground text-base sm:text-lg
            bg-card dark:bg-card/50 border transition-all duration-200
            ${
              isSubmitInteracted && !queryText.trim()
                ? "border-primary ring-2 ring-primary/50 dark:border-neon-cyan dark:ring-cyan-500/30"
                : "border-border hover:border-primary/50 focus:border-primary dark:hover:border-cyan-500/30 dark:focus:border-cyan-500/50"
            }
          `}
          placeholder={placeholderText}
          value={queryText}
          onChange={(e) => setQueryText(e.target.value)}
        />
      </div>
      <div className="flex justify-center">
        <Button
          className="bg-primary text-primary-foreground dark:bg-gradient-to-r dark:from-cyan-500 dark:to-pink-500 dark:hover:from-cyan-400 dark:hover:to-pink-400 rounded-full px-6 py-3 min-h-[48px] w-full transition-all duration-300 hover:-translate-y-0.5 dark:animate-pulse-neon text-base sm:text-lg"
          onClick={onSubmit}
          disabled={isSubmitDisabled}
        >
          {buttonText}
        </Button>
      </div>
    </div>
  );
};

export { QueryFormInputComponent as QueryFormInput };