"use client";

import { CreditsAllLayout } from "@/components/credits/credits-all-layout";
import Navbar from "@/components/ask/navbar/navbar";
import { SolanaProvider } from "@/components/solana-provider";
import { useBackgroundImage } from "@/hooks/useBackgroundImage";
import AskFooter from "@/components/ask/ask-footer";

export default function CreditsAllPage() {
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
        <CreditsAllLayout />
        <AskFooter />
      </div>
    </SolanaProvider>
  );
}