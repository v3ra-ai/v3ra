"use client";

import { Dispatch, SetStateAction } from "react";
import WalletToggle from "@/components/ask/wallet-toggle";
import { QueryMode, ViewMode } from "@/lib/types";

interface NavbarScrollbarUIProps {
  queryText: string;
  setQueryText: Dispatch<SetStateAction<string>>;
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
  updateQueryAmountRequested: (amount: number) => void;
  handleKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
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
  handleKeyDown,
}: NavbarScrollbarUIProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-zinc-100 dark:bg-zinc-800">
      <input
        type="text"
        value={queryText}
        onChange={(e) => setQueryText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Enter your query..."
        className="flex-1 p-2 rounded-md bg-white dark:bg-zinc-700 text-gray-700 dark:text-zinc-300"
        disabled={isSubmitting}
      />
      <WalletToggle
        payWithWallet={payWithWallet}
        setPayWithWallet={setPayWithWallet}
        queriesCostTotal={queriesCostTotal}
        userCreditsTotal={userCreditsTotal}
        userFreeCredits={userFreeCredits}
        userPaidCredits={userPaidCredits}
        queriesRequested={queriesRequested}
        queriesUnpaid={queriesUnpaid}
        highlightPayButton={hasAttemptedSubmit && queriesUnpaid > 0}
        context="scrollbar"
      />
    </div>
  );
}