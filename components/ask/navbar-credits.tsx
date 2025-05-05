"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";
import { LoadingSpinner } from "@/components/loading-spinner-new"; // Import LoadingSpinner

export default function NavbarCredits() {
  const { publicKey } = useWallet();
  const [paidCredits, setPaidCredits] = useState<number | null>(null);
  const BALANCE_API_ENDPOINT = "/api/credits/balance";

  useEffect(() => {
    const fetchPaidCredits = async () => {
      // Exit if no wallet is connected
      if (!publicKey) {
        setPaidCredits(null);
        return;
      }
      try {
        // Fetch balance from server
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
          console.error("Failed to fetch paid credits:", errorMsg);
          setPaidCredits(0);
          return;
        }
        const data = await response.json();
        console.log("Fetched paid credits:", data); // Debug log
        // Use paidCredits if available, fallback to credits
        setPaidCredits(data.paidCredits ?? data.credits ?? 0);
      } catch (error) {
        console.error("Error fetching paid credits:", error);
        setPaidCredits(0);
      }
    };

    fetchPaidCredits();
  }, [publicKey]);

  // Don't render if no wallet is connected
  if (!publicKey) {
    return null;
  }

  return (
    <div className="flex items-center text-md text-zinc-600 dark:text-zinc-300">
      <Link href="/credits/">
        <span>Saved Credits:</span>{" "}
        <span className="text-sky-700 dark:text-sky-300 bg-zinc-200 dark:bg-zinc-700 ml-1 px-2 py-1 rounded-md">
          {paidCredits !== null ? (
            paidCredits
          ) : (
            <>
              {console.log("Rendering LoadingSpinner for credits fetch")} {/* Debug log */}
              <LoadingSpinner
                noWrapper
                type="pulse"
                color="#d946ef"
                size={5}
                message={""} // No message to keep it compact
              />
            </>
          )}
        </span>
      </Link>
    </div>
  );
}