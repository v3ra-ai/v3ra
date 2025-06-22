"use client";

import { useState } from "react";

interface AskResultsStandardRationaleProps {
  longestRationale: string | null;
  validatorName: string;
  validatorProvider: string;
  cleanText: string;
}

export function AskResultsStandardRationale({
  longestRationale,
  validatorName,
  validatorProvider,
  cleanText,
}: AskResultsStandardRationaleProps) {
  const [isRationaleExpanded, setIsRationaleExpanded] = useState(false);

  const toggleRationale = () => {
    setIsRationaleExpanded((prev) => !prev);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleRationale();
    }
  };

  return (
    <div>
      {longestRationale ? (
        <div>
          <div
            role="button"
            tabIndex={0}
            onClick={toggleRationale}
            onKeyDown={handleKeyDown}
            className="cursor-pointer hover:bg-zinc-800/50 dark:hover:bg-zinc-800/30 rounded-lg p-3 transition-all duration-200 border border-transparent hover:border-zinc-700/50"
            aria-expanded={isRationaleExpanded}
            aria-label={isRationaleExpanded ? "Collapse rationale" : "Expand rationale"}
          >
            <p
              className={`text-sm text-zinc-200 dark:text-zinc-300 leading-relaxed ${
                isRationaleExpanded ? "" : "line-clamp-5"
              }`}
              style={{
                maxHeight: isRationaleExpanded ? "none" : "12rem",
              }}
            >
              {cleanText.length > 600 && !isRationaleExpanded
                ? `${cleanText.slice(0, 600)}...`
                : cleanText}
            </p>
          </div>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2 pl-3">
            <span className="text-cyan-400/70">Source:</span> {validatorName} <span className="text-zinc-500">({validatorProvider})</span>
          </p>
        </div>
      ) : (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">No matching rationale available.</p>
      )}
    </div>
  );
}