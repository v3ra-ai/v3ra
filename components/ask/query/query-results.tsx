"use client";

import { useState, useEffect } from "react";
import DualResponseResults from "@/components/ask/results/dual-response-results";

type Props = {
  philosophyMode?: boolean;
};

export default function QueryResults({ philosophyMode = false }: Props) {
  const [isMounted, setIsMounted] = useState(false);

  // Set isMounted to true on client-side mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Render nothing until mounted to avoid hydration mismatch
  if (!isMounted) {
    return null;
  }

  // Always use dual response mode for blind testing
  return <DualResponseResults philosophyMode={philosophyMode} />;
}