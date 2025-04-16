// app/ask/payment-controls.tsx
"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Keypair, SystemProgram, Transaction } from "@solana/web3.js";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface PaymentControlsProps {
  hasPaid: boolean;
  setHasPaid: (paid: boolean) => void;
  queryAmount: number; // Add queryAmount prop to calculate SOL cost
}

export function PaymentControls({
  hasPaid,
  setHasPaid,
  queryAmount,
}: PaymentControlsProps) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [isProcessing, setIsProcessing] = useState(false);

  const solCost = queryAmount * 0.02; // Calculate SOL cost (0.02 SOL per query)

  const handlePayment = async () => {
    if (!publicKey) {
      alert("Please connect your wallet first");
      return;
    }

    setIsProcessing(true);
    try {
      const recipient = Keypair.generate().publicKey; // Replace with your recipient key
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: recipient,
          lamports: solCost * 1_000_000_000, // Convert SOL to lamports
        })
      );

      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, "processed");
      setHasPaid(true);
      alert("Payment successful!");
    } catch (error) {
      console.error("Payment failed:", error);
      alert("Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      {!publicKey && <WalletMultiButton />}
      {publicKey && !hasPaid && (
        <Button
          onClick={handlePayment}
          disabled={isProcessing}
          className="bg-[#00FF00] text-black hover:bg-[#00FF00]/80"
        >
          {isProcessing ? "Processing..." : `Pay ${solCost.toFixed(2)} SOL`}
        </Button>
      )}
    </>
  );
}