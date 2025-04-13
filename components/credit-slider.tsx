// components/credit-slider.tsx
"use client";

import { useState } from "react";
import * as Slider from "@radix-ui/react-slider";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { toast } from "sonner";

const CREDIT_PRICE_SOL = 0.001;
const VERAFY_WALLET_PUBLIC_KEY = "GFY1U36t5HjVv8Gtq33bCdepUnPURtX46mPQXdAPaM4d";

export default function CreditSlider() {
  const [credits, setCredits] = useState(0);
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [isLoading, setIsLoading] = useState(false);

  const solCost = credits * CREDIT_PRICE_SOL;

  const handlePayment = async () => {
    if (!publicKey) {
      toast.error("Please connect your wallet");
      return;
    }

    if (credits === 0) {
      toast.error("Please select at least 1 credit");
      return;
    }

    setIsLoading(true);

    try {
      const lamports = Math.round(solCost * LAMPORTS_PER_SOL);
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(VERAFY_WALLET_PUBLIC_KEY),
          lamports,
        })
      );

      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      const signature = await sendTransaction(transaction, connection);
      const confirmation = await connection.confirmTransaction(signature, "confirmed");

      if (confirmation.value.err) {
        throw new Error("Transaction failed");
      }

      const response = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transaction: Buffer.from(transaction.serialize()).toString("base64"),
          credits,
          userWallet: publicKey.toBase58(),
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(`Purchased ${credits} credits for ${solCost.toFixed(3)} SOL!`);
      } else {
        throw new Error(result.error || "Payment processing failed");
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error(error instanceof Error ? error.message : "Payment failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-gray-200 dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
        Purchase Credits
      </h2>
      <div className="text-center mb-6">
        <span className="text-5xl font-bold text-gray-900 dark:text-gray-100">
          {credits}
        </span>
      </div>
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Select Credits
        </label>
        <div className="relative">
          <Slider.Root
            className="relative flex items-center select-none touch-none w-full h-5"
            value={[credits]}
            onValueChange={(value) => setCredits(value[0])}
            min={0}
            max={100}
            step={1}
          >
            <Slider.Track className="bg-gray-300 dark:bg-gray-600 relative grow rounded-full h-1">
              <Slider.Range className="absolute bg-blue-500 dark:bg-blue-400 rounded-full h-full" />
            </Slider.Track>
            <Slider.Thumb
              className="block w-5 h-5 bg-blue-500 dark:bg-blue-400 rounded-full hover:bg-blue-600 dark:hover:bg-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              aria-label="Credits"
            />
          </Slider.Root>
          <div className="flex justify-between mt-2 text-sm text-gray-700 dark:text-gray-300">
            <span>Min. (0)</span>
            <span>Max. (100)</span>
          </div>
        </div>
      </div>
      <div className="mb-6">
        <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
          Cost: {solCost.toFixed(3)} SOL
        </p>
      </div>
      <button
        onClick={handlePayment}
        disabled={isLoading || !publicKey}
        className={`w-full py-2 px-4 rounded-md font-medium text-white ${
          isLoading || !publicKey
            ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed"
            : "bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-500"
        }`}
      >
        {isLoading ? "Processing..." : publicKey ? "Pay Now" : "Connect Wallet"}
      </button>
    </div>
  );
}