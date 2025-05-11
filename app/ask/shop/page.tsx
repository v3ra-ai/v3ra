"use client";

import { useEffect } from "react";
import Navbar from "@/components/ask/navbar";
import QueryInterface from "@/components/ask/query-interface";
import { SolanaProvider } from "@/components/solana-provider";
import { useTheme } from "next-themes";
import AskFooter from "@/components/ask/ask-footer";
import { useQueryStore } from "@/store/query-store";

export default function ShopPage() {
  const { theme } = useTheme();
  const setQueryMode = useQueryStore((state) => state.setQueryMode);

  useEffect(() => {
    setQueryMode("shop");
    console.log("[shop/page] Set queryMode to shop");
  }, [setQueryMode]);

  const backgroundImage =
    theme === "dark"
      ? "url(/bg_home_black.jpg)"
      : "url(/bg_home_white.jpg)";

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