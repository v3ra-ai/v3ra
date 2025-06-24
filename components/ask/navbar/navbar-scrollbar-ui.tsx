
"use client";

import { useState, useEffect } from "react";
import { ViewMode, QueryMode } from "@/lib/types";
import { QueryFormAISlider } from "@/components/ask/query/query-form-ai-slider";
import WalletToggle from "@/components/ask/payments/wallet-toggle";
import { getPlaceholderText } from "@/lib/query-utils";
import { ALLOWED_AMOUNT_QUERIES } from "@/lib/constants";
import { useButtonTextTimer } from "@/utils/button-text-timer";
import { ReactNode } from "react";
import { useLLMStore } from "@/store/llm-store";
import { useQueryStore } from "@/store/query-store";
import { useCreditsStore } from "@/store/credit-store";


interface NavbarScrollbarUIProps {
  queryText: string;
  setQueryText: (text: string) => void;
  isSubmitting: boolean;
  payWithWallet: boolean;
  setPayWithWallet: (value: boolean) => void;
  hasAttemptedSubmit: boolean;
  queriesRequested: number;
  userCreditsTotal: number;
  userFreeCredits: number;
  userPaidCredits: number;
  queriesUnpaid: number;
  queriesCostTotal: number;
  queryMode: QueryMode;
  viewMode: ViewMode;
  updateQueryAmountRequested: (newAmount: number) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export function NavbarScrollbarUI({
  queryText,
  setQueryText,
  isSubmitting,
  payWithWallet,
  setPayWithWallet,
  hasAttemptedSubmit,
  queriesRequested,
  userCreditsTotal,
  userFreeCredits,
  userPaidCredits,
  queriesUnpaid,
  queriesCostTotal,
  queryMode,
  updateQueryAmountRequested,
  handleKeyDown,
}: NavbarScrollbarUIProps) {
  const [placeholderContent, setPlaceholderContent] = useState<ReactNode>(getPlaceholderText(queryMode));
  const { startTimer, cancelTimer } = useButtonTextTimer(setPlaceholderContent);
  const { llms } = useLLMStore();
  const { setQueriesRequested } = useQueryStore();
  const { totalCredits } = useCreditsStore();

  const selectedLLMCount = llms.filter((llm) => llm.enabled).length;
  const hasSelectedLLMs = selectedLLMCount > 0;

  // Sync queriesRequested with selectedLLMCount on mount
  useEffect(() => {
    if (hasSelectedLLMs && queriesRequested !== selectedLLMCount) {
      console.log("[NavbarScrollbarUI] Syncing queriesRequested with selectedLLMCount on mount:", {
        selectedLLMCount,
        queriesRequested,
      });
      setQueriesRequested(selectedLLMCount, totalCredits);
    }
  }, [hasSelectedLLMs, selectedLLMCount, queriesRequested, setQueriesRequested, totalCredits]);

  // Start timer when submitting, reset placeholder when not submitting
  useEffect(() => {
    if (isSubmitting) {
      startTimer();
      console.log("[NavbarScrollbarUI] Started timer for placeholder content");
    } else {
      cancelTimer();
      setPlaceholderContent(getPlaceholderText(queryMode));
      console.log("[NavbarScrollbarUI] Reset placeholder to:", getPlaceholderText(queryMode));
    }
  }, [isSubmitting, queryMode, startTimer, cancelTimer]);


  const displayNumber = hasSelectedLLMs ? selectedLLMCount : queriesRequested;

  return (
    <div className="container mx-auto px-4 py-2 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
      <div className="flex flex-col md:flex-row md:items-center md:space-x-2">
        <div className="w-full md:w-1/3">
          <input
            type="text"
            className={`flex-1 p-2 border rounded-md bg-white dark:bg-zinc-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-teal-500 ${
              hasAttemptedSubmit && !queryText.trim()
                ? "border-red-400"
                : "border-zinc-300 dark:border-zinc-600"
            }`}
            placeholder={placeholderContent as string}
            value={isSubmitting ? "" : queryText}
            onChange={(e) => setQueryText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSubmitting}
            aria-label="Enter query to submit"
            aria-busy={isSubmitting}
          />
        </div>
        <div
          className="flex flex-row md:w-2/3 items-center h-full md:text-left flex-wrap gap-2 py-2 md:py-0"
        >
          <QueryFormAISlider
            queriesRequested={queriesRequested}
            handleQueryAmountChange={updateQueryAmountRequested}
            allowedAmountQueries={ALLOWED_AMOUNT_QUERIES}
            context="scrollbar"
          />
          <div className="flex items-center h-full">
            <WalletToggle
              payWithWallet={payWithWallet}
              setPayWithWallet={setPayWithWallet}
              queriesCostTotal={queriesCostTotal}
              userCreditsTotal={userCreditsTotal}
              userFreeCredits={userFreeCredits}
              userPaidCredits={userPaidCredits}
              queriesRequested={displayNumber}
              queriesUnpaid={queriesUnpaid}
              highlightPayButton={false}
              context="scrollbar"
            />
          </div>
        </div>
      </div>
    </div>
  );
}