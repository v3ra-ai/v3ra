"use client";
import { CreditsLayout } from "@/components/credits/credits-layout";
import Navbar from "@/components/ask/navbar";
import { SolanaProvider } from "@/components/solana-provider";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function CreditsPage() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Handle hydration to avoid theme mismatch
  useEffect(() => {
    setMounted(true);
  }, []);



  const backgroundImage = mounted
    ? theme === "dark"
      ? "url(/bg_home_black.jpg)"
      : "url(/bg_home_white.jpg)"
    : "url(/bg_home_white.jpg)"; // Default to light theme before mounting

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
