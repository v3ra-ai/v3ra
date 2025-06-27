import Navbar from "@/components/ask/navbar/navbar";
import QueryInterface from "@/components/ask/query/query-interface";
import { SolanaProvider } from "@/components/solana-provider";
import AskFooter from "@/components/ask/ask-footer";
import { LLMProvider } from "@/components/llm-provider";

export default async function AskPage() {
  return (
    <SolanaProvider>
      <LLMProvider>
        <main className="min-h-screen bg-background dark:bg-gradient-to-b dark:from-zinc-900 dark:to-black relative">
          {/* Subtle gradient overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-black/5 dark:to-black/20 pointer-events-none" />
          <Navbar />
          <QueryInterface />
          <AskFooter />
        </main>
      </LLMProvider>
    </SolanaProvider>
  );
}