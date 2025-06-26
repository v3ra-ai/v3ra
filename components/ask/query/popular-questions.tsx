"use client";

import { useState, useEffect } from "react";
import { getRandomStatement } from "@/lib/example-statements";

interface PopularQuestionsProps {
  onSelectQuestion: (question: string) => void;
}

export function PopularQuestions({ onSelectQuestion }: PopularQuestionsProps) {
  const [example, setExample] = useState("");
  
  useEffect(() => {
    setExample(getRandomStatement());
  }, []);
  
  const handleNewExample = () => {
    const newExample = getRandomStatement();
    setExample(newExample);
  };
  
  if (!example) return null;
  
  return (
    <div className="mb-8 relative">
      <div className="flex justify-center">
        <button
          onClick={() => onSelectQuestion(example)}
          className="group relative px-5 py-3 rounded-lg border border-cyan-500/20 hover:border-cyan-500/40 
            bg-zinc-950/30 hover:bg-zinc-950/50 transition-all duration-200
            shadow-[0_0_15px_rgba(0,255,255,0.05)] hover:shadow-[0_0_20px_rgba(0,255,255,0.15)]"
        >
          <span className="block text-xs text-zinc-500 mb-1">Try this example</span>
          <span className="block text-sm text-zinc-300 group-hover:text-zinc-100 transition-colors duration-200 max-w-md text-center">
            {example}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNewExample();
            }}
            className="absolute -right-8 top-1/2 -translate-y-1/2 p-1 text-zinc-600 hover:text-zinc-400 transition-colors duration-200"
            aria-label="Get new example"
          >
            ↻
          </button>
        </button>
      </div>
    </div>
  );
}