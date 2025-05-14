"use client";
import { CreditsLayout } from "@/components/credits/credits-layout";
import Navbar from "@/components/ask/navbar";
import { SolanaProvider } from "@/components/solana-provider";
import { useBackgroundImage } from "@/hooks/useBackgroundImage";

export default function CreditsPage() {
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
      <CreditsLayout />
      </div>
    </SolanaProvider>
  );
}
