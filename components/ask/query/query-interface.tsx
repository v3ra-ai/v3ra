"use client";

import { useState } from "react";
import { QueryForm } from "@/components/ask/query/query-form";
import ModeToggle from "@/components/ask/mode-toggle";
import QueryStats from "@/components/ask/query/query-stats";
import QueryResults from "@/components/ask/query/query-results";
import useQueryLogic from "@/hooks/useQueryLogic"; // Correct default import
import { QueryMode } from "@/lib/types";
import * as Popover from "@radix-ui/react-popover";
import Link from "next/link";
import { capitalizeWords, formatQueryMode } from "@/utils/text-utils";

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
      <div className="flex flex-col md:flex-row items-center justify-center flex-wrap md:flex-nowrap space-x-4 mb-2">
        <div className="inline-flex">
          <ModeToggle viewMode={viewMode} />
        </div>
        <h1 className="text-foreground text-2xl md:text-3xl font-light tracking-tight text-center">
          Ask AI models a{" "}
          <Popover.Root>
            <Popover.Trigger asChild>
              <button
                className="text-primary dark:text-cyan-400 font-medium hover:text-primary/80 dark:hover:text-cyan-300 transition-colors cursor-pointer border-b-2 border-dashed border-primary/50 dark:border-cyan-400/50"
                aria-label={`Change query mode, current mode: ${formatQueryMode(queryMode)}`}
              >
                {queryMode === "fact-check" ? "yes/no" : formatQueryMode(queryMode).toLowerCase()}
              </button>
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content
                className="glass-morphism rounded-xl p-2 shadow-2xl max-w-[180px] w-full z-50"
                sideOffset={8}
                align="center"
              >
                {(["fact-check", "predict", "create", "shop"] as QueryMode[]).map(
                  (mode) => (
                    <Link
                      key={mode}
                      href={`/ask/${mode}`}
                      className={`block w-full px-4 py-2.5 text-sm rounded-lg text-left cursor-pointer transition-all duration-200 ${
                        queryMode === mode
                          ? "bg-primary text-primary-foreground dark:bg-cyan-500 dark:text-black"
                          : "text-foreground/70 hover:bg-accent hover:text-foreground dark:hover:bg-white/10"
                      }`}
                      role="menuitem"
                    >
                      {mode === "fact-check" ? "Yes/No Questions" : capitalizeWords(formatQueryMode(mode))}
                    </Link>
                  )
                )}
                <Popover.Arrow className="fill-card dark:fill-zinc-900" />
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
          {" "}question
        </h1>
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