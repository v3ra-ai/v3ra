import Navbar from "@/components/ask/navbar";
import QueryInterface from "@/components/ask/query-interface";
import { SolanaProvider } from "@/components/solana-provider";

export default function Home() {
  return (
    <SolanaProvider>
      <main className="min-h-screen bg-white">
        <Navbar />
        <QueryInterface />
      </main>
    </SolanaProvider>
  );
}