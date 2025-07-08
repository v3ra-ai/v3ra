"use client";

import dynamic from "next/dynamic";
import { Navbar } from "@/components/shared/navbar";
import AskFooter from "@/components/ask/ask-footer";
import { useUserPoints } from "@/hooks/useUserPoints";

// Dynamic imports for heavy components
const QueryInterface = dynamic(() => import("@/components/ask/query/query-interface"), {
  loading: () => <div className="min-h-screen flex items-center justify-center">Loading...</div>,
});

const SolanaProvider = dynamic(() => import("@/components/solana-provider").then(mod => ({ default: mod.SolanaProvider })));

const LLMProvider = dynamic(() => import("@/components/llm-provider").then(mod => ({ default: mod.LLMProvider })));

export default function AskPage() {
  const { userPoints, canClaimBonus, claiming, claimDailyBonus } = useUserPoints();
  return (
    <SolanaProvider>
      <LLMProvider>
        <main className="min-h-screen bg-background dark:bg-gradient-to-b dark:from-zinc-900 dark:to-black relative">
          {/* Subtle gradient overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-black/5 dark:to-black/20 pointer-events-none" />
          <Navbar 
            userPoints={userPoints}
            canClaimBonus={canClaimBonus}
            onClaimBonus={claimDailyBonus}
            claiming={claiming}
          />
          <QueryInterface />
          <AskFooter />
        </main>
      </LLMProvider>
    </SolanaProvider>
  );
}