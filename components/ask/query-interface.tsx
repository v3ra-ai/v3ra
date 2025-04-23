"use client";

import { useState, useEffect } from "react";
import QueryForm from "@/components/ask/query-form";
import ModeToggle from "@/components/ask/mode-toggle";
import WalletToggle from "@/components/ask/wallet-toggle";
import QueryStats from "@/components/ask/query-stats";
import QueryResults from "@/components/ask/query-results";
import { useQueryLogic } from "@/hooks/useQueryLogic";

export default function QueryInterface() {
  const [payWithWallet, setPayWithWallet] = useState(false);
  const [hasPaid, setHasPaid] = useState(false);
  const [isSubmitInteracted, setIsSubmitInteracted] = useState(false);

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

  // Automatically toggle payWithWallet based on queriesNeeded
  useEffect(() => {
    const shouldPayWithWallet = queriesNeeded > 0;
    if (payWithWallet !== shouldPayWithWallet) {
      setPayWithWallet(shouldPayWithWallet);
    }
  }, [queriesNeeded, payWithWallet]);

  return (
    <div className="container mx-auto px-4 py-1">
      <ModeToggle viewMode={viewMode} />
      <h1 className="text-zinc-900 dark:text-zinc-200 text-2xl font-bold text-center mb-8 mt-2">
        How can we help you <span className="text-teal-600 dark:text-teal-300">{queryMode==="factCheck" ? "fact check" :queryMode}?</span>
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