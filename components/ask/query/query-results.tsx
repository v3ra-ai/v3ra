"use client";

import { useState, useEffect } from "react";
import { useQueryStore } from "@/store/query-store";
import { ViewMode } from "@/lib/types";
import AskResultsStandard from "@/components/ask/results/ask-results-standard";

type Props = {
  viewMode: ViewMode;
  philosophyMode?: boolean;
};

export default function QueryResults({ viewMode: _viewMode, philosophyMode = false }: Props) {
  const { setViewMode } = useQueryStore();
  const [isMounted, setIsMounted] = useState(false);

  // Set isMounted to true and viewMode to viewStandard on client-side mount
  useEffect(() => {
    setIsMounted(true);
    setViewMode("viewStandard");
  }, [setViewMode]);


  // Render nothing until mounted to avoid hydration mismatch
  if (!isMounted) {
    return null;
  }

  // For now, both view modes use the same component
  // TODO: Implement expert view when requirements are clear
  return <AskResultsStandard philosophyMode={philosophyMode} />;
}