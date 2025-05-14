"use client";

import { useState, useEffect } from "react";
import { useQueryStore } from "@/store/query-store";
import { ViewMode } from "@/lib/types";
import AskResultsStandard from "@/components/ask/ask-results-standard";
import AskResultsExpert from "@/components/ask/ask-results-expert";

type Props = {
  viewMode: ViewMode;
};

export default function QueryResults({ viewMode }: Props) {
  const { setViewMode } = useQueryStore();
  const [isMounted, setIsMounted] = useState(false);

  // Set isMounted to true and viewMode to viewStandard on client-side mount
  useEffect(() => {
    console.log("[QueryResults] Client-side mounted, setting viewMode to viewStandard");
    setIsMounted(true);
    setViewMode("viewStandard");
  }, [setViewMode]);

  console.log("[QueryResults] Rendering with viewMode:", viewMode, "isMounted:", isMounted);

  // Render nothing until mounted to avoid hydration mismatch
  if (!isMounted) {
    console.log("[QueryResults] Not rendering: waiting for client-side mount");
    return null;
  }

  return viewMode === "viewStandard" ? <AskResultsStandard /> : <AskResultsExpert />;
}