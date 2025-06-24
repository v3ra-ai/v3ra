"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Dispatch, ReactNode, SetStateAction } from "react";
import { QueryMode } from "@/lib/types";
import { useCreditsStore } from "@/store/credit-store";
import { useLLMStore } from "@/store/llm-store";
import { useQueryStore } from "@/store/query-store";
import { toast } from "sonner";
import { useButtonTextTimer } from "@/utils/button-text-timer";
import { formatQueryMode } from "@/utils/text-utils";

interface QueryFormInputProps {
  queryText: string;
  setQueryText: Dispatch<SetStateAction<string>>;
  placeholderText: string;
  handleSubmit: () => void;
  isSubmitting: boolean;
  queriesUnpaid: number;
  queriesCostTotal: number;
  userFreeCredits: number;
  userPaidCredits: number;
  userCreditsTotal: number;
  isSubmitInteracted: boolean;
  setIsSubmitInteracted: Dispatch<SetStateAction<boolean>>;
  queryMode: QueryMode;
  queriesRequested: number;
}

const QueryFormInputComponent = function QueryFormInput({
  queryText,
  setQueryText,
  placeholderText,
  handleSubmit,
  isSubmitting,
  queriesUnpaid: _queriesUnpaid,
  queriesCostTotal: _queriesCostTotal,
  userFreeCredits: _userFreeCredits,
  userPaidCredits: _userPaidCredits,
  userCreditsTotal: _userCreditsTotal,
  isSubmitInteracted,
  setIsSubmitInteracted,
  queryMode,
  queriesRequested,
}: QueryFormInputProps) {
  const { displayUnpaid, totalCredits } = useCreditsStore();
  const { llms } = useLLMStore();
  const { setQueriesRequested } = useQueryStore();
  const [buttonText, setButtonText] = useState<ReactNode>(formatQueryMode(queryMode));
  const { startTimer, cancelTimer } = useButtonTextTimer(setButtonText);

  const selectedLLMCount = llms.filter((llm) => llm.enabled).length;
  const hasSelectedLLMs = selectedLLMCount > 0;

  // Sync queriesRequested with selectedLLMCount on mount
  useEffect(() => {
    if (hasSelectedLLMs && queriesRequested !== selectedLLMCount) {
      setQueriesRequested(selectedLLMCount, totalCredits);
    }
  }, [hasSelectedLLMs, selectedLLMCount, queriesRequested, setQueriesRequested, totalCredits]);

  const onSubmit = () => {
    // Credits check removed - app is now free to use

    if (hasSelectedLLMs && queriesRequested > selectedLLMCount) {
      toast.error(`Cannot query ${queriesRequested} AIs when only ${selectedLLMCount} are selected.`, {
        style: { background: "#fee2e2", color: "#dc2626" },
      });
      return;
    }

    try {
      startTimer();
      handleSubmit();
    } catch {
      toast.error("Failed to submit query, please try again", {
        style: { background: "#fee2e2", color: "#dc2626" },
      });
    }
  };

  useEffect(() => {
    if (!isSubmitting) {
      cancelTimer();
      setButtonText(formatQueryMode(queryMode));
    }
  }, [isSubmitting, queryMode, cancelTimer]);

  // Ensure button text updates when queryMode changes
  useEffect(() => {
    setButtonText(formatQueryMode(queryMode));
  }, [queryMode]);

  const _creditsLeft = useMemo(
    () => Math.max(0, totalCredits - queriesRequested),
    [totalCredits, queriesRequested]
  );
  
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
          className={`bg-primary text-primary-foreground dark:bg-gradient-to-r dark:from-cyan-500 dark:to-pink-500 dark:hover:from-cyan-400 dark:hover:to-pink-400 rounded-full px-6 py-3 min-h-[48px] w-full transition-all duration-300 hover:-translate-y-0.5 dark:animate-pulse-neon text-base sm:text-lg ${
            isSubmitInteracted && displayUnpaid > 0 ? "ring-2 ring-primary dark:ring-cyan-500/50" : ""
          }`}
          onClick={onSubmit}
          disabled={isSubmitDisabled}
          onMouseEnter={() => displayUnpaid > 0 && setIsSubmitInteracted(true)}
          onMouseLeave={() => setIsSubmitInteracted(false)}
          onMouseDown={() => displayUnpaid > 0 && setIsSubmitInteracted(true)}
          onMouseUp={() => setIsSubmitInteracted(false)}
        >
          {buttonText}
        </Button>
      </div>
    </div>
  );
};

export { QueryFormInputComponent as QueryFormInput };