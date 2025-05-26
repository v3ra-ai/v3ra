"use client";

import { useState } from "react";
import AskResultsStandardCard from "@/components/ask/ask-results-standard-card";
import { VoteResult } from "@/lib/types";

interface CardViewerProps {
  query: VoteResult;
  layoutMode: "grid" | "row";
}

export default function CardViewer({ query, layoutMode }: CardViewerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleItem = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <AskResultsStandardCard
      query={query}
      layoutMode={layoutMode}
      isOpen={isOpen}
      toggleItem={toggleItem}
    />
  );
}