"use client";

import { useState, useEffect } from "react";
import { ViewMode, useQueryStore } from "@/store/query-store";
import WalletToggle from "@/components/ask/wallet-toggle";
import { QUERY_COST, INITIAL_AVAILABLE_QUERIES } from "@/lib/constants";

// Define props interface
interface NavbarScrollbarProps {
  mounted: boolean;
  showSearch: boolean;
  viewMode: ViewMode;
}

/**
 * Renders a scroll-based search bar that appears when scrolling past 50px.
 * Includes a query input and wallet toggle with dynamic cost based on AI queries slider.
 */
export function NavbarScrollbar({ mounted, showSearch }: NavbarScrollbarProps) {
  // Initialize payWithWallet to true to match query form
  const [payWithWallet, setPayWithWallet] = useState(true);
  const [hasPaid, setHasPaid] = useState(false);
  // Get userAiQueryAmountRequested and totalQueries from Zustand
  const { userAiQueryAmountRequested, totalQueries } = useQueryStore();

  // Calculate costToQuery dynamically to match query form
  const queriesNeeded = Math.max(0, userAiQueryAmountRequested - INITIAL_AVAILABLE_QUERIES);
  const costToQuery = (queriesNeeded * QUERY_COST).toFixed(3);

  // Sync payWithWallet with costToQuery
  useEffect(() => {
    setPayWithWallet(parseFloat(costToQuery) > 0);
  }, [costToQuery]);

  if (!mounted || !showSearch) return null;

  return (
    <div className="container mx-auto px-4 py-2 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-700">
      <div className="flex flex-col md:flex-row md:items-center md:space-x-2">
        <div className="w-full h-full md:w-1/3">
          <div className="flex items-center space-x-2">
            <label className="text-gray-700 dark:text-gray-300 font-medium">
              Ask:
            </label>
            <input
              type="text"
              className="flex-1 p-2 border border-zinc-300 dark:border-zinc-600 rounded-md
                bg-white dark:bg-zinc-800 text-gray-800 dark:text-gray-200
                focus:outline-none focus:ring-1 focus:ring-teal-500"
              placeholder="Enter your query..."
            />
          </div>
        </div>
        <div className="flex flex-row md:w-2/3 items-center h-full md:text-left">
          <div className="flex items-center">
            <WalletToggle
              payWithWallet={payWithWallet}
              setPayWithWallet={setPayWithWallet}
              hasPaid={hasPaid}
              setHasPaid={setHasPaid}
              costToQuery={costToQuery}
              totalQueries={totalQueries}
              userAiQueryAmountRequested={userAiQueryAmountRequested}
              highlightPayButton={false} // Placeholder
              context="scrollbar"
            />
          </div>
        </div>
      </div>
    </div>
  );
}