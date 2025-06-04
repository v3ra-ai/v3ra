"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";
import { LoadingSpinner } from "@/components/loading-spinner-new";
import { Coins } from "lucide-react";

export default function NavbarCredits() {
  const { publicKey } = useWallet();
  const [paidCredits, setPaidCredits] = useState<number | null>(null);
  const BALANCE_API_ENDPOINT = "/api/credits/balance";

  const fetchPaidCredits = useCallback(async () => {
    if (!publicKey) {
      setPaidCredits(null);
      return;
    }
    try {
      const response = await fetch(BALANCE_API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletPublicKey: publicKey.toBase58(),
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg =
          errorData.error || response.statusText || "Unknown error";
        console.error("[NavbarCredits] Failed to fetch paid credits:", errorMsg);
        setPaidCredits(0);
        return;
      }
      const data = await response.json();
      console.log("[NavbarCredits] Fetched paid credits:", data);
      setPaidCredits(data.paidCredits ?? data.credits ?? 0);
    } catch (error) {
      console.error("[NavbarCredits] Error fetching paid credits:", error);
      setPaidCredits(0);
    }
  }, [publicKey]);

  useEffect(() => {
    fetchPaidCredits();

    // Listen for credits-updated event
    const handleCreditsUpdated = () => {
      console.log("[NavbarCredits] Credits updated event received");
      fetchPaidCredits();
    };

    window.addEventListener("credits-updated", handleCreditsUpdated);

    // Cleanup listener on unmount
    return () => {
      window.removeEventListener("credits-updated", handleCreditsUpdated);
    };
  }, [fetchPaidCredits, publicKey]);

  if (!publicKey) {
    return null;
  }

  return (
    <div className="flex items-center text-md text-zinc-600 dark:text-zinc-300">
      <Link href="/credits-all/">
        <div className="flex items-center">
          <Coins size={16} /> <span className="mx-2">Paid Credits:</span>
          <span className="text-sky-700 dark:text-sky-300 bg-zinc-200 dark:bg-zinc-700 ml-1 px-2 py-1 rounded-md">
            {paidCredits !== null ? (
              paidCredits
            ) : (
              <>
                {console.log("[NavbarCredits] Rendering LoadingSpinner for credits fetch")}
                <LoadingSpinner
                  noWrapper
                  type="pulse"
                  color="#d946ef"
                  size={5}
                  message={""}
                />
              </>
            )}
          </span>
        </div>
      </Link>
    </div>
  );
}