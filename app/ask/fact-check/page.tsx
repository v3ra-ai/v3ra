"use client";

import { useEffect } from "react";
import Navbar from "@/components/ask/navbar/navbar";
import QueryInterface from "@/components/ask/query/query-interface";
import { SolanaProvider } from "@/components/solana-provider";
import AskFooter from "@/components/ask/ask-footer";
import { useQueryStore } from "@/store/query-store";
import { useBackgroundImage } from "@/hooks/useBackgroundImage";

export default function FactCheckPage() {
  const backgroundImage = useBackgroundImage();
  const setQueryMode = useQueryStore((state) => state.setQueryMode);

  useEffect(() => {
    setQueryMode("fact-check");
    console.log("[fact-check/page] Set queryMode to fact-check");
  }, [setQueryMode]);


  return (
    <SolanaProvider>
      <main
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
        <QueryInterface />
        <AskFooter />
      </main>
    </SolanaProvider>
  );
}