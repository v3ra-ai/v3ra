"use client";
import { CreditsTruthLayout } from "@/components/credits/credits-truth-layout";
import Navbar from "@/components/ask/navbar/navbar";
import { SolanaProvider } from "@/components/solana-provider";
import { useBackgroundImage } from "@/hooks/useBackgroundImage";

export default function CreditsTruthPage() {
  const backgroundImage = useBackgroundImage();

  return (
    <SolanaProvider>
      <div
        className="min-h-screen"
        style={{
          backgroundImage,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
          backgroundRepeat: "no-repeat",
          width: "100vw",
          height: "100vh",
        }}
      >
        <Navbar />
        <CreditsTruthLayout />
      </div>
    </SolanaProvider>
  );
}