"use client";

import { useState } from "react";
import { QueryForm } from "@/components/ask/query/query-form";
import QueryResults from "@/components/ask/query/query-results";
import useQueryLogic from "@/hooks/useQueryLogic";

export default function QueryInterface() {
  const [isSubmitInteracted] = useState(false);
  const [philosophyMode] = useState(false);

  const {
    queriesRequested,
    queryText,
    setQueryText,
    isSubmitting,
    error,
    placeholderText,
    queryMode,
    handleSubmit,
  } = useQueryLogic({ 
    payWithWallet: false, 
    setPayWithWallet: () => {},
    philosophyMode 
  });



  return (
    <div className="min-h-screen flex flex-col pt-20">
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-12">
            <h1 className="text-5xl sm:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300 mb-4 drop-shadow-[0_0_30px_rgba(168,85,247,0.5)]">
              Which AI is smarter?
            </h1>
            <p className="text-white/80 text-xl font-medium drop-shadow-lg">
              Ask anything. Pick the best answer. Earn rewards.
            </p>
          </div>
          
          {/* Premium glass morphism container */}
          <div className="relative group">
            {/* Animated gradient border */}
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200 animate-gradient" />
            
            {/* Glass container */}
            <div className="relative px-8 py-8 bg-black/50 backdrop-blur-xl rounded-2xl border border-white/10 hover:border-white/20 transition-all shadow-2xl">
            {error && (
              <p className="text-red-400 text-sm mb-6 text-center" role="alert">
                {error}
              </p>
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


            </div>
          </div>
        </div>
      </div>
      
      <QueryResults philosophyMode={philosophyMode} />
    </div>
  );
}