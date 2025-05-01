"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { toast } from "sonner";

export const useCreditBalance = () => {
  const { publicKey } = useWallet();
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const BALANCE_API_ENDPOINT = "/api/credits/balance";

  useEffect(() => {
    const fetchCreditBalance = async () => {
      // Exit if no wallet is connected
      if (!publicKey) {
        setCreditBalance(null);
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
          toast.error(`Failed to fetch credit balance: ${errorMsg}`);
          console.error("Failed to fetch credit balance:", errorMsg);
          setCreditBalance(0);
          return;
        }
        const data = await response.json();
        console.log("Fetched credit balance:", data.credits); // Debug log
        setCreditBalance(data.credits || 0);
      } catch (error) {
        // Handle unexpected errors
        const errorMsg =
          error instanceof Error ? error.message : "Unknown error";
        toast.error(`Error fetching credit balance: ${errorMsg}`);
        console.error("Error fetching credit balance:", error);
        setCreditBalance(0);
      }
    };

    fetchCreditBalance();
  }, [publicKey]);

  return { creditBalance, setCreditBalance };
};