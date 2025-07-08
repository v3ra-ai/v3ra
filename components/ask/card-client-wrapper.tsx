"use client";

import { useState } from "react";
import AskResultsStandardCard from "@/components/ask/results/ask-results-standard-card";
import { VoteResult } from "@/lib/types";

interface CardViewerProps {
  query: VoteResult;
  layoutMode: "grid" | "row";
  philosophyMode?: boolean;
}

export default function CardViewer({ query, layoutMode, philosophyMode = false }: CardViewerProps) {
  const [isOpen, setIsOpen] = useState(true);

  const toggleItem = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <AskResultsStandardCard
      query={query}
      layoutMode={layoutMode}
      isOpen={isOpen}
      toggleItem={toggleItem}
      philosophyMode={philosophyMode}
    />
  );
}