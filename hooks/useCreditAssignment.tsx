// hooks/useCreditAssignment.ts
"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { PublicKey, Transaction } from "@solana/web3.js";

interface CreditAssignment {
  assignCredits: (
    signature: string,
    signedTx: Transaction,
    credits: number,
    userWallet: PublicKey,
  ) => Promise<number>;
  isAssigning: boolean;
  error: string | null;
}

export const useCreditAssignment = (): CreditAssignment => {
  const [isAssigning, setIsAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const assignCredits = useCallback(
    async (signature: string, signedTx: Transaction, credits: number, userWallet: PublicKey) => {
      setIsAssigning(true);
      setError(null);

      try {
        const response = await fetch("/api/payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transaction: signedTx.serialize().toString("base64"),
            signature,
            credits,
            userWallet: userWallet.toBase58(),
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Payment failed");
        }

        const paymentData = await response.json();
        if (paymentData.status !== "success") {
          throw new Error("Payment verification failed");
        }

        const assignResponse = await fetch("/api/credits/assign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            walletPublicKey: userWallet.toBase58(),
            creditAmount: credits,
          }),
        });

        if (!assignResponse.ok) {
          const errorData = await assignResponse.json();
          throw new Error(errorData.error || "Credit assignment failed");
        }

        const assignData = await assignResponse.json();
        toast.success(`${credits} credits added! New balance: ${assignData.credits}`);
        return assignData.credits || 0;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error processing payment";
        setError(message);
        toast.error(message);
        console.error("Credit assignment error:", err);
        throw err;
      } finally {
        setIsAssigning(false);
      }
    },
    [],
  );

  return {
    assignCredits,
    isAssigning,
    error,
  };
};