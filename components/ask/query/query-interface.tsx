"use client";

import { useState } from "react";
import { QueryForm } from "@/components/ask/query/query-form";
import QueryStats from "@/components/ask/query/query-stats";
import QueryResults from "@/components/ask/query/query-results";
import useQueryLogic from "@/hooks/useQueryLogic";

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
    <div className="container mx-auto px-4 py-1 min-h-screen">
      <div className="text-center mb-8 mt-8">
        <h1 className="text-foreground text-4xl md:text-5xl font-semibold tracking-tight font-display">
          Ask AI Models
        </h1>
        <p className="text-muted-foreground mt-3 text-lg">
          Choose a preset and ask your question
        </p>
      </div>
      <div className="glass-morphism rounded-2xl shadow-xl dark:shadow-none p-6 max-w-4xl mx-auto">
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