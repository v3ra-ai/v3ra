"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { PublicKey, Transaction, SystemProgram } from "@solana/web3.js";
import { CREDIT_PRICE_SOL } from "../lib/solana-constants";

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
    async (
      signature: string,
      signedTx: Transaction,
      credits: number,
      userWallet: PublicKey,
    ) => {
      setIsAssigning(true);
      setError(null);

      try {
        // Validate transaction amount
        const transferInstruction = signedTx.instructions.find((instr) =>
          instr.programId.equals(SystemProgram.programId),
        );
        if (!transferInstruction) {
          throw new Error("No SystemProgram.transfer instruction found");
        }
        if (transferInstruction.data.length < 12) {
          throw new Error(
            "Invalid instruction data: too short to contain lamports",
          );
        }
        const lamports = transferInstruction.data.readBigInt64LE(4);
        const expectedLamports = BigInt(
          credits * CREDIT_PRICE_SOL * 1_000_000_000,
        );
        console.log("Validating transaction:", {
          lamports,
          expectedLamports,
          credits,
        });

        if (lamports !== expectedLamports) {
          throw new Error(
            `Invalid amount: expected ${expectedLamports} lamports, got ${lamports}`,
          );
        }

        const apiResponse = await fetch("/api/payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transaction: signedTx.serialize().toString("base64"),
            signature,
            credits,
            userWallet: userWallet.toBase58(),
          }),
        });

        if (!apiResponse.ok) {
          const errorData = await apiResponse.json();
          throw new Error(errorData.error || "Payment failed");
        }

        const paymentData = await apiResponse.json();
        if (paymentData.status !== "success") {
          throw new Error("Payment verification failed");
        }

        const assignApiResponse = await fetch("/api/credits/assign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            walletPublicKey: userWallet.toBase58(),
            creditAmount: credits,
          }),
        });

        if (!assignApiResponse.ok) {
          const errorData = await assignApiResponse.json();
          throw new Error(errorData.error || "Credit assignment failed");
        }

        const assignData = await assignApiResponse.json();
        toast.success(
          `${credits} credits added! New balance: ${assignData.credits}`,
        );
        return assignData.credits || 0;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Error processing payment";
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