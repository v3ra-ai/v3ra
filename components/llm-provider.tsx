"use client";

import { useEffect } from "react";
import { useLLMStore } from "@/store/llm-store";

export function LLMProvider({ children }: { children: React.ReactNode }) {
  const init = useLLMStore((s) => s.init);

  useEffect(() => {
    init();
  }, [init]);

  return <>{children}</>;
}