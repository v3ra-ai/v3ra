"use client";

import { useState, useEffect } from "react";
import QueryForm from "@/components/ask/query-form";
import ModeToggle from "@/components/ask/mode-toggle";
import WalletToggle from "@/components/ask/wallet-toggle";
import QueryStats from "@/components/ask/query-stats";
import QueryResults from "@/components/ask/query-results";
import { useQueryLogic } from "@/hooks/useQueryLogic";
import { useQueryStore, QueryMode } from "@/store/query-store";
import * as Popover from "@radix-ui/react-popover";

export default function QueryInterface() {
  const [payWithWallet, setPayWithWallet] = useState(false);
  const [hasPaid, setHasPaid] = useState(false);
  const [isSubmitInteracted, setIsSubmitInteracted] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const {
    userAiQueryAmountRequested,
    question,
    setQuestion,
    isSubmitting,
    error,
    placeholderText,
    availableQueries,
    costToQuery,
    queriesNeeded,
    totalQueries,
    queryMode,
    viewMode,
    handleSubmit,
    handleQueryAmountChange,
  } = useQueryLogic({ payWithWallet, setPayWithWallet, hasPaid, setHasPaid });

  const { setQueryMode } = useQueryStore();

  // Automatically toggle payWithWallet based on queriesNeeded
  useEffect(() => {
    const shouldPayWithWallet = queriesNeeded > 0;
    if (payWithWallet !== shouldPayWithWallet) {
      setPayWithWallet(shouldPayWithWallet);
    }
  }, [queriesNeeded, payWithWallet]);

  // Format queryMode for display with capitalized first letters (e.g., factCheck → "Fact Check")
  const formatQueryMode = (mode: QueryMode) => {
    if (mode === "factCheck") {
      return "Fact Check";
    }
    return mode.charAt(0).toUpperCase() + mode.slice(1);
  };

  // Handle mode selection and close popover
  const handleModeSelect = (mode: QueryMode) => {
    setQueryMode(mode);
    setIsPopoverOpen(false);
  };

  return (
    <div className="container mx-auto px-4 py-1">
      <ModeToggle viewMode={viewMode} />
      <h1 className="text-zinc-900 dark:text-zinc-200 text-2xl font-bold text-center mb-8 mt-2">
        How can we help you{" "}
        <Popover.Root open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <Popover.Trigger asChild>
            <button
              className="text-teal-600 dark:text-teal-300 border-b border-dashed border-teal-600 dark:border-teal-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 px-1 py-0.5 rounded transition-colors cursor-pointer "
              aria-label={`Change query mode, current mode: ${formatQueryMode(queryMode)}`}
            >
              {queryMode === "factCheck" ? "fact check" : queryMode}
            </button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              className="bg-zinc-200 dark:bg-zinc-900 rounded-lg p-1 shadow-lg max-w-[160px] w-full z-50"
              sideOffset={5}
              align="center"
            >
              {(["factCheck", "predict", "create", "shop"] as QueryMode[]).map(
                (mode) => (
                  <button
                    key={mode}
                    onClick={() => handleModeSelect(mode)}
                    className={`w-full px-4 py-2 text-sm font-medium rounded-md text-left cursor-pointer transition-colors dark:border-b dark:border-zinc-700 dark:last:border-none ${
                      queryMode === mode
                        ? "bg-teal-500 text-white"
                        : "bg-transparent text-zinc-500 dark:text-zinc-400 hover:bg-zinc-300 dark:hover:bg-zinc-600"
                    }`}
                    role="menuitem"
                  >
                    {formatQueryMode(mode)}
                  </button>
                )
              )}
              <Popover.Arrow className="fill-zinc-200 dark:fill-zinc-900" />
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
        ?
      </h1>
      <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-lg/20 p-6 max-w-4xl mx-auto">
        {error && (
          <p className="text-red-500 text-sm mb-2" role="alert">
            {error}
          </p>
        )}
        <WalletToggle
          payWithWallet={payWithWallet}
          setPayWithWallet={setPayWithWallet}
          hasPaid={hasPaid}
          setHasPaid={setHasPaid}
          costToQuery={costToQuery}
          totalQueries={totalQueries}
          userAiQueryAmountRequested={userAiQueryAmountRequested}
          highlightPayButton={isSubmitInteracted && totalQueries < 1}
        />
        <QueryForm
          question={question}
          setQuestion={setQuestion}
          placeholderText={placeholderText}
          queryMode={queryMode}
          userAiQueryAmountRequested={userAiQueryAmountRequested}
          handleQueryAmountChange={handleQueryAmountChange}
          handleSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          payWithWallet={payWithWallet}
          queriesNeeded={queriesNeeded}
          hasPaid={hasPaid}
          totalQueries={totalQueries}
          isSubmitInteracted={isSubmitInteracted}
          setIsSubmitInteracted={setIsSubmitInteracted}
        />
        <QueryStats
          availableQueries={availableQueries}
          queriesNeeded={queriesNeeded}
          costToQuery={costToQuery}
        />
      </div>
      <p className="text-center text-gray-700 dark:text-zinc-200 mt-6 max-w-4xl mx-auto">
        Submit Questions to the network intelligence,{" "}
        <span className="font-medium">(187)</span> will compete to respond.
      </p>
      <p className="text-center text-gray-700 dark:text-zinc-200 max-w-4xl mx-auto">
        Stake to unlock more queries and earn{" "}
        <span className="font-medium">11%</span> yield
      </p>
      <QueryResults viewMode={viewMode} />
    </div>
  );
}
