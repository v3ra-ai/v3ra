"use client";

import { useState } from "react";
import { QueryForm } from "@/components/ask/query/query-form";
import QueryResults from "@/components/ask/query/query-results";
import useQueryLogic from "@/hooks/useQueryLogic";
import { QueryModelSelector } from "@/components/ask/query/query-model-selector";
import { PopularQuestions } from "@/components/ask/query/popular-questions";
import { SelectedModelsDisplay } from "@/components/ask/query/selected-models-display";

export default function QueryInterface() {
  const [isSubmitInteracted] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const {
    queriesRequested,
    queryText,
    setQueryText,
    isSubmitting,
    error,
    placeholderText,
    queryMode,
    viewMode,
    handleSubmit,
  } = useQueryLogic({ payWithWallet: false, setPayWithWallet: () => {} });

  const handleSelectPopularQuestion = (question: string) => {
    setQueryText(question);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-12">
            <h1 className="text-zinc-50 text-4xl sm:text-5xl font-medium tracking-tight mb-2">
              AI Consensus
            </h1>
            <p className="text-zinc-600 text-sm">
              Multiple AI models. One truth.
            </p>
          </div>
          
          <div className="relative rounded-xl border border-cyan-500/20 bg-zinc-950/40 p-6 backdrop-blur-sm shadow-[0_0_30px_rgba(0,255,255,0.1)]">
            {error && (
              <p className="text-red-400 text-sm mb-6 text-center" role="alert">
                {error}
              </p>
            )}
            
            {!queryText && (
              <PopularQuestions onSelectQuestion={handleSelectPopularQuestion} />
            )}
            
            <QueryForm
              queryText={queryText}
              setQueryText={setQueryText}
              placeholderText={placeholderText}
              queryMode={queryMode}
              queriesRequested={queriesRequested}
              handleSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              isSubmitInteracted={isSubmitInteracted}
            />

            <div className="mt-8">
              <QueryModelSelector onDropdownChange={setIsDropdownOpen} />
              <SelectedModelsDisplay hide={isDropdownOpen} />
            </div>
          </div>
        </div>
      </div>
      
      <QueryResults viewMode={viewMode} />
    </div>
  );
}