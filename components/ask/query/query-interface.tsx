"use client";

import { useState } from "react";
import { QueryForm } from "@/components/ask/query/query-form";
import ModeToggle from "@/components/ask/mode-toggle";
import dynamic from 'next/dynamic';
const WalletToggle = dynamic(() => import('@/components/ask/payments/wallet-toggle'), { ssr: false });
import QueryStats from "@/components/ask/query/query-stats";
import QueryResults from "@/components/ask/query/query-results";
import useQueryLogic from "@/hooks/useQueryLogic"; // Correct default import
import { QueryMode } from "@/lib/types";
import * as Popover from "@radix-ui/react-popover";
import Link from "next/link";
import { capitalizeWords, formatQueryMode } from "@/utils/text-utils";

export default function QueryInterface() {
  const [payWithWallet, setPayWithWallet] = useState(false);
  const [isSubmitInteracted, setIsSubmitInteracted] = useState(false);

  const {
    queriesRequested,
    queryText,
    setQueryText,
    isSubmitting,
    error,
    placeholderText,
    queriesCostTotal,
    queriesUnpaid,
    userCreditsTotal,
    userFreeCredits,
    userPaidCredits,
    queryMode,
    viewMode,
    handleSubmit,
    handleQueryAmountChange,
  } = useQueryLogic({ payWithWallet, setPayWithWallet });

  console.log("QueryInterface render:", {
    payWithWallet,
    queriesUnpaid,
    userPaidCredits,
    queriesCostTotal,
    error,
    viewMode,
    timestamp: new Date().toISOString(),
  });

  return (
    <div className="container mx-auto px-4 py-1 min-h-screen">
      <div className="flex flex-col md:flex-row items-center justify-center flex-wrap md:flex-nowrap space-x-4 mb-2">
        <div className="inline-flex">
          <ModeToggle viewMode={viewMode} />
        </div>
        <h1 className="text-zinc-900 dark:text-zinc-200 text-lg md:text-2xl font-bold text-center">
          How can we help you{" "}
          <Popover.Root>
            <Popover.Trigger asChild>
              <button
                className="text-teal-600 dark:text-teal-300 border-b border-dashed border-teal-600 dark:border-teal-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 px-1 py-0.5 rounded transition-colors cursor-pointer"
                aria-label={`Change query mode, current mode: ${formatQueryMode(queryMode)}`}
              >
                {formatQueryMode(queryMode)}
              </button>
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content
                className="bg-zinc-200 dark:bg-zinc-900 rounded-lg p-1 shadow-lg max-w-[160px] w-full z-50"
                sideOffset={5}
                align="center"
              >
                {(["fact-check", "predict", "create", "shop"] as QueryMode[]).map(
                  (mode) => (
                    <Link
                      key={mode}
                      href={`/ask/${mode}`}
                      className={`block w-full px-4 py-2 text-sm font-medium rounded-md text-left cursor-pointer transition-colors dark:border-b dark:border-zinc-700 dark:last:border-none ${
                        queryMode === mode
                          ? "bg-teal-500 text-white"
                          : "bg-transparent text-zinc-500 dark:text-zinc-400 hover:bg-zinc-300 dark:hover:bg-zinc-600"
                      }`}
                      role="menuitem"
                    >
                      {capitalizeWords(formatQueryMode(mode))}
                    </Link>
                  )
                )}
                <Popover.Arrow className="fill-zinc-200 dark:fill-zinc-900" />
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
          ?
        </h1>
      </div>
      <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-lg/20 p-4 max-w-4xl mx-auto">
        {error && (
          <p className="text-red-500 text-sm mb-2" role="alert">
            {error}
          </p>
        )}
        <WalletToggle
          payWithWallet={payWithWallet}
          setPayWithWallet={setPayWithWallet}
          queriesCostTotal={queriesCostTotal}
          userCreditsTotal={userCreditsTotal}
          userFreeCredits={userFreeCredits}
          userPaidCredits={userPaidCredits}
          queriesRequested={queriesRequested}
          queriesUnpaid={queriesUnpaid}
          highlightPayButton={isSubmitInteracted && queriesUnpaid > 0}
        />
        <QueryForm
          queryText={queryText}
          setQueryText={setQueryText}
          placeholderText={placeholderText}
          queryMode={queryMode}
          queriesRequested={queriesRequested}
          userFreeCredits={userFreeCredits}
          userPaidCredits={userPaidCredits}
          userCreditsTotal={userCreditsTotal}
          queriesUnpaid={queriesUnpaid}
          queriesCostTotal={queriesCostTotal}
          handleQueryAmountChange={handleQueryAmountChange}
          handleSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          payWithWallet={payWithWallet}
          isSubmitInteracted={isSubmitInteracted}
          setIsSubmitInteracted={setIsSubmitInteracted}
        />
        <QueryStats
          userCreditsTotal={userCreditsTotal}
          queriesUnpaid={queriesUnpaid}
          queriesCostTotal={queriesCostTotal}
          queriesRequested={queriesRequested}
        />
      </div>
      <QueryResults viewMode={viewMode} />
    </div>
  );
}