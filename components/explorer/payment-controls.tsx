"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useState } from "react";
import { Loader2 } from "lucide-react"; // For loading animation
import { toast } from "sonner"; // Sonner toast for notifications

interface PaymentControlsProps {
  hasPaid: boolean;
  setHasPaid: (value: boolean) => void;
}

export function PaymentControls({ hasPaid, setHasPaid }: PaymentControlsProps) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [isProcessing, setIsProcessing] = useState(false); // New loading state

  const PAYMENT_RECEIVER_ADDRESS = process.env.NEXT_PUBLIC_PAYMENT_RECEIVER_ADDRESS;
  if (!PAYMENT_RECEIVER_ADDRESS) {
    throw new Error("NEXT_PUBLIC_PAYMENT_RECEIVER_ADDRESS environment variable is not set");
  }
  const PAYMENT_RECIPIENT = new PublicKey(PAYMENT_RECEIVER_ADDRESS);
  const PAYMENT_AMOUNT = 0.01 * LAMPORTS_PER_SOL;

  const handlePayment = async () => {
    if (!publicKey || !sendTransaction) {
      toast.error("Please connect your wallet first", {
        style: { background: "#fee2e2", color: "#dc2626" }, // Red error style
      });
      return;
    }

    setIsProcessing(true); // Start loading
    try {
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: PAYMENT_RECIPIENT,
          lamports: PAYMENT_AMOUNT,
        })
      );

      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, "confirmed");

      setHasPaid(true);
      toast.success("Payment of 0.01 SOL successful!", {
        style: { background: "#dcfce7", color: "#16a34a" }, // Green success style
      });
    } catch (error) {
      console.error("Payment failed:", error);
      toast.error("Payment failed. Please try again.", {
        style: { background: "#fee2e2", color: "#dc2626" }, // Red error style
      });
    } finally {
      setIsProcessing(false); // Stop loading
    }
  };

  return (
    <>
      {!hasPaid && (
        <>
          <WalletMultiButton
            style={{
              backgroundColor: "#9333ea",
              color: "white",
              padding: "8px 16px",
              borderRadius: "0.375rem",
              fontSize: "0.875rem",
            }}
          />
          <button
            type="button"
            onClick={handlePayment}
            disabled={!publicKey || hasPaid || isProcessing}
            className={`px-4 py-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 flex items-center ${
              !publicKey || hasPaid || isProcessing
                ? "bg-purple-400 cursor-not-allowed"
                : "bg-purple-600 hover:bg-purple-700"
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Pay 0.01 Devnet SOL"
            )}
          </button>
        </>
      )}
    </>
  );
}