"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import {
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryStore } from "@/store/query-store";

interface PaymentControlsProps {
  hasPaid: boolean;
  setHasPaid: (value: boolean) => void;
  solCost: number;
  totalQueries: number;
  userAiQueryAmountRequested: number;
  highlightPayButton?: boolean;
  context?: "scrollbar" | "query-form";
}

/**
 * Renders wallet connection and payment buttons for SOL transactions.
 * Shows "Pay: ${solCost}" in scrollbar context and "Pay ${solCost} Dev SOL" in query-form context.
 * In scrollbar context, WalletMultiButton is shown only when wallet is disconnected.
 */
export function PaymentControls({
  hasPaid,
  setHasPaid,
  solCost,
  totalQueries,
  userAiQueryAmountRequested,
  highlightPayButton = false,
  context = "query-form",
}: PaymentControlsProps) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [isProcessing, setIsProcessing] = useState(false);
  const { incrementQueries } = useQueryStore();

  const PAYMENT_RECEIVER_ADDRESS =
    process.env.NEXT_PUBLIC_PAYMENT_RECEIVER_ADDRESS;
  if (!PAYMENT_RECEIVER_ADDRESS) {
    throw new Error(
      "NEXT_PUBLIC_PAYMENT_RECEIVER_ADDRESS environment variable is not set",
    );
  }
  const PAYMENT_RECIPIENT = new PublicKey(PAYMENT_RECEIVER_ADDRESS);
  const PAYMENT_AMOUNT = solCost * LAMPORTS_PER_SOL;

  const handlePayment = async () => {
    if (!publicKey || !sendTransaction) {
      toast.error("Please connect your wallet first", {
        style: { background: "#fee2e2", color: "#dc2626" },
      });
      return;
    }

    setIsProcessing(true);
    try {
      console.log("Payment inputs:", { solCost, PAYMENT_AMOUNT, publicKey: publicKey.toBase58() });

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: PAYMENT_RECIPIENT,
          lamports: PAYMENT_AMOUNT,
        }),
      );

      const { blockhash } = await connection.getLatestBlockhash("confirmed");
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, "confirmed");

      setHasPaid(true);
      incrementQueries(solCost); // Increment totalQueries by costToQuery (e.g., 5 or 3)
      console.log("Payment successful, solCost:", solCost, "totalQueries:", useQueryStore.getState().totalQueries);
      toast.success(`Payment of ${solCost} SOL successful!`, {
        style: { background: "#dcfce7", color: "#16a34a" },
      });
    } catch (error: unknown) {
      console.error("Payment failed:", error);
      let errorMessage = "Payment failed. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message.includes("insufficient funds")
          ? "Insufficient SOL in wallet"
          : error.message.includes("blockhash")
          ? "Transaction expired, please try again"
          : errorMessage;
      }
      toast.error(errorMessage, {
        style: { background: "#fee2e2", color: "#dc2626" },
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      {!hasPaid && (
        <>
          {(context === "query-form" || !publicKey) && (
            <WalletMultiButton
              style={{
                backgroundColor: "#e5e7eb",
                color: "#111827",
                padding: "10px 12px",
                borderRadius: "0.375rem",
                fontSize: "0.95rem",
                fontWeight: "normal",
                height: "2rem",
                margin: "0 0rem",
                border: "1px solid #d1d5db",
              }}
            />
          )}
          <button
            type="button"
            onClick={handlePayment}
            disabled={!publicKey || hasPaid || isProcessing || totalQueries >= userAiQueryAmountRequested}
            className={`px-4 py-[6px] rounded-sm focus:outline-none focus:ring-2
              focus:ring-offset-2 focus:ring-gray-500 flex items-center text-sm border ${
              highlightPayButton
                ? "bg-green-500 text-white hover:bg-green-600 cursor-pointer"
                : !publicKey || hasPaid || isProcessing || solCost == 0
                  ? "bg-gray-200 text-zinc-900 cursor-not-allowed"
                  : "bg-blue-500 text-white hover:bg-blue-500 cursor-pointer"
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : solCost === 0 ? (
              "Paid"
            ) : context === "scrollbar" ? (
              `Pay: ${solCost}`
            ) : (
              `Pay ${solCost} Dev SOL`
            )}
          </button>
        </>
      )}
    </>
  );
}