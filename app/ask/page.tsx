"use client";

import dynamic from "next/dynamic";
import { Navbar } from "@/components/shared/navbar";
import { useUserPoints } from "@/hooks/useUserPoints";

// Dynamic imports for heavy components
const QueryInterface = dynamic(() => import("@/components/ask/query/query-interface"), {
  loading: () => <div className="min-h-screen flex items-center justify-center">Loading...</div>,
});

const SolanaProvider = dynamic(() => import("@/components/solana-provider").then(mod => ({ default: mod.SolanaProvider })), {
  ssr: false
});

const LLMProvider = dynamic(() => import("@/components/llm-provider").then(mod => ({ default: mod.LLMProvider })), {
  ssr: false
});

export default function AskPage() {
  const { userPoints } = useUserPoints();
  return (
    <SolanaProvider>
      <LLMProvider>
        <main className="min-h-screen bg-black relative overflow-hidden">
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-pink-900/20" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-pink-900/20 via-transparent to-transparent" />
          <Navbar userPoints={userPoints} />
          <QueryInterface />
        </main>
      </LLMProvider>
    </SolanaProvider>
  );
}