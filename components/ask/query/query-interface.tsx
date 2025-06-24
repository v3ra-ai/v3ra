"use client";

import { useState } from "react";
import { QueryForm } from "@/components/ask/query/query-form";
import QueryResults from "@/components/ask/query/query-results";
import useQueryLogic from "@/hooks/useQueryLogic"; // Correct default import
import { QueryModelSelector } from "@/components/ask/query/query-model-selector";

export default function QueryInterface() {
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
  } = useQueryLogic({ payWithWallet: false, setPayWithWallet: () => {} });

  // console.log("QueryInterface render:", {
  //   payWithWallet,
  //   queriesUnpaid,
  //   userPaidCredits,
  //   queriesCostTotal,
  //   error,
  //   viewMode,
  //   timestamp: new Date().toISOString(),
  // });

  return (
    <div className="container mx-auto px-4 py-2 min-h-[calc(100vh-4rem)]">
      <div className="flex flex-col items-center justify-center mb-4">
        <h1 className="text-foreground text-xl sm:text-2xl md:text-3xl font-light tracking-tight text-center mb-4">
          Ask AI Models a <span className="text-emerald-400 dark:text-emerald-400 dark:drop-shadow-[0_0_10px_rgba(52,211,153,0.5)] font-medium">Yes</span>/<span className="text-rose-400 dark:text-rose-400 dark:drop-shadow-[0_0_10px_rgba(251,113,133,0.5)] font-medium">No</span> Question
        </h1>
      </div>
      <div className="glass-morphism rounded-2xl shadow-xl dark:shadow-none p-4 sm:p-6 max-w-4xl mx-auto">
        {error && (
          <p className="text-red-500 text-sm mb-2" role="alert">
            {error}
          </p>
        )}
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
          handleSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          isSubmitInteracted={isSubmitInteracted}
          setIsSubmitInteracted={setIsSubmitInteracted}
        />
      </div>
      <div className="flex justify-center">
        <QueryModelSelector />
      </div>
      <QueryResults viewMode={viewMode} />
    </div>
  );
}