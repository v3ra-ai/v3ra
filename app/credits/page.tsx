import { CreditsLayout } from "@/components/credits/credits-layout";
import Navbar from "@/components/ask/navbar";
import { SolanaProvider } from "@/components/solana-provider";

export default function CreditsPage() {
  return (
    <SolanaProvider>
      <Navbar />
      <CreditsLayout />
    </SolanaProvider>
  );
}