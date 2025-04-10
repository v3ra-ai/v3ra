"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import {
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { Ban, Check, CircleCheckBig } from "lucide-react";

interface CustomQueryFormProps {
  onSubmit: (query: string) => Promise<void>;
  isOpen: boolean;
  onToggle: () => void;
}

export function CustomQueryForm({
  onSubmit,
  isOpen,
  onToggle,
}: CustomQueryFormProps) {
  const [query, setQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isWalletEnabled, setIsWalletEnabled] = useState(false);
  const [hasPaid, setHasPaid] = useState(false);

  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  // Payment recipient address from environment variable
  const PAYMENT_RECEIVER_ADDRESS =
    process.env.NEXT_PUBLIC_PAYMENT_RECEIVER_ADDRESS;
  if (!PAYMENT_RECEIVER_ADDRESS) {
    throw new Error(
      "NEXT_PUBLIC_PAYMENT_RECEIVER_ADDRESS environment variable is not set"
    );
  }
  const PAYMENT_RECIPIENT = new PublicKey(PAYMENT_RECEIVER_ADDRESS);
  const PAYMENT_AMOUNT = 0.01 * LAMPORTS_PER_SOL; // 0.01 SOL

  const handlePayment = async () => {
    if (!publicKey || !sendTransaction) {
      alert("Please connect your wallet first");
      return;
    }

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
      alert("Payment was successful!");
    } catch (error) {
      console.error("Payment failed:", error);
      alert("Payment failed. Please try again.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    if (isWalletEnabled && !hasPaid) {
      alert("Please make a payment of 0.01 SOL first");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(query);
      setQuery("");
      if (isWalletEnabled) setHasPaid(false); // Reset payment status after successful submission
    } catch (error) {
      console.error("Error submitting query:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mb-6">
      <button
        onClick={onToggle}
        className="flex items-center text-sm text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 mb-2"
      >
        <span className="mr-1">{isOpen ? "Hide" : "Show"} validator query</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{
          height: isOpen ? "auto" : 0,
          opacity: isOpen ? 1 : 0,
        }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-800">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <div className="flex">
                <label
                  htmlFor="custom-query"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Ask the validator network a yes/no question
                </label>
                {!hasPaid && isWalletEnabled ? (
                  <div className="flex ml-2 my-auto">
                    <label
                      className="flex px-2 rounded text-xs text-red-700
                    dark:text-red-300 bg-gray-300 dark:bg-gray-800 my-auto"
                    >
                      <Ban size="14" className="mr-1"/> Payment required
                    </label>
                  </div>
                ) : hasPaid && isWalletEnabled ? (
                  <div className="flex ml-2 my-auto">
                    <label
                      className="flex px-2 rounded text-xs text-green-700
                    dark:text-green-300 bg-gray-300 dark:bg-gray-800 my-auto">

                      <CircleCheckBig size="14" className="mr-1"/> Paid .01 SOL
                    </label>
                  </div>
                ): ``}
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="wallet-toggle"
                    checked={isWalletEnabled}
                    onChange={(e) => setIsWalletEnabled(e.target.checked)}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="wallet-toggle"
                    className="text-sm text-gray-700 dark:text-gray-300"
                  >
                    Pay with SOL
                  </label>
                </div>
              </div>
              <textarea
                id="custom-query"
                rows={3}
                className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed`}
                placeholder="Is artificial intelligence beneficial for society?"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={isWalletEnabled && !hasPaid} // Disable when payment is required but not made
              />
            </div>
            <div className="flex justify-end space-x-2">
              {isWalletEnabled && (
                <>
                  {!hasPaid &&  <WalletMultiButton
                    style={{
                      backgroundColor: "#9333ea", // Tailwind purple-600
                      color: "white",
                      padding: "8px 16px",
                      borderRadius: "0.375rem",
                      fontSize: "0.875rem",
                    }}
                  />}
                   {!hasPaid &&
                  <button
                    type="button"
                    onClick={handlePayment}
                    disabled={!publicKey || hasPaid}
                    className={`px-4 py-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 ${
                      !publicKey || hasPaid
                        ? "bg-purple-400 cursor-not-allowed"
                        : "bg-purple-600 hover:bg-purple-700"
                    }`}
                  >
                    {"Pay 0.01 SOL"}
                  </button>}
                </>
              )}
              <button
                type="submit"
                disabled={
                  isSubmitting || !query.trim() || (isWalletEnabled && !hasPaid)
                }
                className={`px-4 py-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 flex items-center justify-center ${
                  isWalletEnabled && !hasPaid
                    ? "bg-silver-500 cursor-not-allowed"
                    : isSubmitting || !query.trim()
                      ? "bg-silver-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-purple-700"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <span className="inline-block animate-spin mr-2">⏳</span>
                    Broadcasting...
                  </>
                ) : (
                  <>
                    {/* {isWalletEnabled && !hasPaid && (
                     <></>
                    )} */}
                    {!query.trim() && hasPaid ? `` : `Ask Question`}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
