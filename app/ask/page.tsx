"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/ask/navbar";
import QueryInterface from "@/components/ask/query-interface";
import { SolanaProvider } from "@/components/solana-provider";
import { useTheme } from "next-themes";
import ConsensusStatus from "@/components/ask/consensus-status"


export default function Home() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Handle hydration to avoid theme mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

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
        <ConsensusStatus />
      </main>
    </SolanaProvider>
  );
}