"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/ask/navbar";
import QueryInterface from "@/components/ask/query-interface";
import { SolanaProvider } from "@/components/solana-provider";
import { useTheme } from "next-themes";
import AskFooter from "@/components/ask/ask-footer";
import { useNavStore } from "@/store/nav-store";
import { QueryMode } from "@/lib/types";

export default function Home({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const setQueryMode = useNavStore((state) => state.setQueryMode);

  // Handle hydration to avoid theme mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Set query mode from searchParams on mount
  useEffect(() => {
    async function initializeQueryMode() {
      const params = await searchParams;
      const q = params.q;
      const validModes: QueryMode[] = ["factCheck", "predict", "create", "shop"];
      if (q && validModes.includes(q as QueryMode)) {
        console.log("[ask/page] Setting queryMode from URL param q:", q);
        setQueryMode(q as QueryMode);
      } else if (q) {
        console.warn("[ask/page] Invalid q param:", q);
        setQueryMode(null);
      } else {
        setQueryMode(null);
      }
    }
    initializeQueryMode();
  }, [searchParams, setQueryMode]);

  // Select background image based on theme
  const backgroundImage = mounted
    ? theme === "dark"
      ? "url(/bg_home_black.jpg)"
      : "url(/bg_home_white.jpg)"
    : "url(/bg_home_white.jpg)"; // Default to light theme before mounting

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