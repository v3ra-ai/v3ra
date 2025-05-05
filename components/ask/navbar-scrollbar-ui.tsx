"use client";

import { ViewMode, QueryMode } from "@/lib/types";
import { QueryFormModeSelector } from "@/components/ask/query-form-mode-selector";
import { QueryFormAISlider } from "@/components/ask/query-form-ai-slider";
import WalletToggle from "@/components/ask/wallet-toggle";
import { getPlaceholderText } from "@/lib/query-utils";
import { ALLOWED_AMOUNT_QUERIES } from "@/lib/constants";

interface NavbarScrollbarUIProps {
  queryText: string;
  setQueryText: (text: string) => void;
  isSubmitting: boolean;
  payWithWallet: boolean;
  setPayWithWallet: (value: boolean) => void;
  hasPaid: boolean;
  setHasPaid: (value: boolean) => void;
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

/**
 * Presentational component for the scroll-based search bar UI.
 * Renders query mode selector, input field, AI query slider, and wallet toggle.
 */
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
  return (
    <div className="container mx-auto px-4 py-2 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
      <div className="flex flex-col md:flex-row md:items-center md:space-x-2">
        <div className="w-full md:w-1/3">
          <div className="flex items-center space-x-2 flex-wrap">
            <QueryFormModeSelector queryMode={queryMode} />
            <input
              type="text"
              className={`flex-1 p-2 border rounded-md bg-white dark:bg-zinc-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-teal-500 min-w-[150px] ${
                hasAttemptedSubmit && !queryText.trim() ? "border-red-400" : "border-zinc-300 dark:border-zinc-600"
              }`}
              placeholder={getPlaceholderText(queryMode)}
              value={isSubmitting ? "Submitting..." : queryText}
              onChange={(e) => setQueryText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSubmitting}
              aria-label={`Enter query to submit, current mode: ${queryMode}`}
              aria-busy={isSubmitting}
            />
          </div>
        </div>
        <div className="flex flex-row md:w-2/3 items-center h-full md:text-left flex-wrap gap-2">
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
              queriesRequested={queriesRequested}
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