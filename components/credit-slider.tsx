// components/credit-slider.tsx
"use client";

import { useState, useCallback, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import * as Slider from "@radix-ui/react-slider";
import { toast } from "sonner";
import {
  PublicKey,
  Connection,
  LAMPORTS_PER_SOL,
  Transaction,
  SystemProgram,
  SendTransactionError,
  ComputeBudgetProgram,
} from "@solana/web3.js";
import { WalletSignTransactionError } from "@solana/wallet-adapter-base";

const connection = new Connection("https://api.devnet.solana.com", "confirmed");
const CREDIT_PRICE_SOL = 0.001;

// Use environment variable for Verafy wallet
const VERAFY_WALLET_PUBLIC_KEY = process.env.NEXT_PUBLIC_VERAFY_WALLET_PUBLIC_KEY;
let VERAFY_WALLET: PublicKey;
try {
  if (!VERAFY_WALLET_PUBLIC_KEY) {
    throw new Error("NEXT_PUBLIC_VERAFY_WALLET_PUBLIC_KEY is not defined");
  }
  VERAFY_WALLET = new PublicKey(VERAFY_WALLET_PUBLIC_KEY);
} catch (error) {
  console.error("Invalid NEXT_PUBLIC_VERAFY_WALLET_PUBLIC_KEY:", error);
  throw error;
}

// Retry utility for sending transaction
async function sendTransactionWithRetry(
  connection: Connection,
  publicKey: PublicKey,
  signTransaction: (tx: Transaction) => Promise<Transaction>,
  credits: number,
  maxAttempts: number = 3,
  delayMs: number = 1000,
): Promise<{ signature: string; signedTx: Transaction }> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // Create fresh transaction
      const transaction = new Transaction();
      transaction.add(
        ComputeBudgetProgram.setComputeUnitLimit({
          units: 200_000,
        }),
        ComputeBudgetProgram.setComputeUnitPrice({
          microLamports: 100_000,
        }),
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: VERAFY_WALLET,
          lamports: Math.round(credits * CREDIT_PRICE_SOL * LAMPORTS_PER_SOL),
        }),
      );

      // Set recent blockhash and fee payer
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      console.log("Transaction before signing (attempt", attempt, "):", {
        instructions: transaction.instructions.map((instr, idx) => ({
          index: idx,
          programId: instr.programId.toBase58(),
          keys: instr.keys.map((k) => k.pubkey.toBase58()),
          data: instr.data?.toString("hex") || null,
        })),
        lamports:
          transaction.instructions.find((instr) => instr.programId.equals(SystemProgram.programId))
            ?.data
            ? Number(
                transaction.instructions
                  .find((instr) => instr.programId.equals(SystemProgram.programId))
                  ?.data.readBigInt64LE(4),
              )
            : null,
        recentBlockhash: transaction.recentBlockhash,
        feePayer: transaction.feePayer?.toBase58(),
      });

      // Sign transaction
      const signedTx = await signTransaction(transaction);

      // Verify signature
      if (!signedTx.signatures.length || !signedTx.verifySignatures()) {
        throw new Error("Transaction signature invalid");
      }

      // Send transaction
      const signature = await connection.sendRawTransaction(signedTx.serialize(), {
        skipPreflight: false,
        preflightCommitment: "confirmed",
      });
      console.log(`Transaction sent, attempt ${attempt}, signature: ${signature}`);

      // Confirm transaction
      await connection.confirmTransaction(
        { signature, blockhash, lastValidBlockHeight },
        "confirmed",
      );

      return { signature, signedTx };
    } catch (error) {
      lastError = error;
      if (error instanceof SendTransactionError) {
        console.error("SendTransactionError:", {
          message: error.message,
          logs: error.logs,
        });
      } else if (error instanceof WalletSignTransactionError) {
        console.error("WalletSignTransactionError:", {
          message: error.message,
          error: (error as WalletSignTransactionError).error,
        });
      } else {
        console.error("Send error:", error);
      }
      if (attempt < maxAttempts) {
        console.log(`Attempt ${attempt} failed, retrying in ${delayMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
  throw lastError || new Error("Failed to send transaction after retries");
}

export default function CreditSlider() {
  const { publicKey, signTransaction } = useWallet();
  const [creditAmount, setCreditAmount] = useState(0);
  const [creditBalance, setCreditBalance] = useState(0);
  const [solBalance, setSolBalance] = useState(0);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (publicKey) {
      connection.getBalance(publicKey).then((balance) => {
        setSolBalance(balance / LAMPORTS_PER_SOL);
      });
    }
  }, [publicKey]);

  const requiredSol = creditAmount * CREDIT_PRICE_SOL;
  const hasEnoughSol = solBalance >= requiredSol;
  const isValid = creditAmount >= 1 && creditAmount <= 100 && Number.isInteger(creditAmount);
  const isEmailValid = !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handlePayment = useCallback(async () => {
    if (!publicKey || !signTransaction) {
      toast.error("Wallet not connected or cannot sign");
      return;
    }
    if (!isValid) {
      toast.error("Credits must be a whole number between 1 and 100");
      return;
    }
    if (!hasEnoughSol) {
      toast.error(`Insufficient SOL: Need ${requiredSol.toFixed(3)}, have ${solBalance.toFixed(3)}`);
      return;
    }
    if (email && !isEmailValid) {
      toast.error("Invalid email address");
      return;
    }

    setIsLoading(true);

    try {
      // Send transaction and get signed transaction
      const { signature, signedTx } = await sendTransactionWithRetry(
        connection,
        publicKey,
        signTransaction,
        creditAmount,
      );

      console.log("Sending to API:", {
        signature,
        transactionSignatures: signedTx.signatures.map((sig) => sig.signature?.toString("base64") || "null"),
        instructions: signedTx.instructions.map((instr, idx) => ({
          index: idx,
          programId: instr.programId.toBase58(),
        })),
      });

      // Send to payment API
      const response = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transaction: signedTx.serialize().toString("base64"),
          signature,
          credits: creditAmount,
          userWallet: publicKey.toBase58(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Payment failed");
      }

      const paymentData = await response.json();
      if (paymentData.status === "success") {
        // Assign credits
        const assignResponse = await fetch("/api/credits/assign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            walletPublicKey: publicKey.toBase58(),
            creditAmount,
            email: email || undefined,
          }),
        });

        if (!assignResponse.ok) {
          const errorData = await assignResponse.json();
          throw new Error(errorData.error || "Credit assignment failed");
        }

        const assignData = await assignResponse.json();
        setCreditBalance(assignData.credits);
        toast.success(`${creditAmount} credits added! New balance: ${assignData.credits}`);
      }
    } catch (error: unknown) {
      let message = "Error processing payment";
      if (error instanceof SendTransactionError) {
        message = `Transaction failed: ${error.message}${
          error.logs && error.logs.length ? `, Logs: ${error.logs.join(", ")}` : ""
        }`;
      } else if (error instanceof WalletSignTransactionError) {
        message = "Wallet approval denied. Please approve the transaction in your wallet.";
      } else if (error instanceof Error) {
        message = error.message;
      }
      toast.error(message);
      console.error("Payment error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, signTransaction, creditAmount, hasEnoughSol, email, isEmailValid, solBalance]);

  return (
    <div className="max-w-md mx-auto p-6 bg-gray-200 dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
        Purchase Credits
      </h2>
      <div className="text-center mb-6">
        <span className="text-5xl font-bold text-gray-900 dark:text-gray-100">
          {creditAmount}
        </span>
      </div>
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Select Credits
        </label>
        <div className="relative">
          <Slider.Root
            className="relative flex items-center select-none touch-none w-full h-5"
            value={[creditAmount]}
            onValueChange={(value) => setCreditAmount(value[0])}
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
          Cost: {requiredSol.toFixed(3)} SOL
        </p>
      </div>
      {/* <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email (optional)"
        className="mb-6 w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
      /> */}
      {!isEmailValid && email && (
        <p className="mb-4 text-sm text-red-500 dark:text-red-400">
          Please enter a valid email or leave blank.
        </p>
      )}
      <p className="mb-4 text-sm text-gray-700 dark:text-gray-300">
        Current Balance: {creditBalance} credits
      </p>
      <button
        onClick={handlePayment}
        disabled={isLoading || !publicKey || !isValid || !hasEnoughSol || !isEmailValid}
        className={`w-full py-2 px-4 rounded-md font-medium text-white ${
          isLoading || !publicKey || !isValid || !hasEnoughSol || !isEmailValid
            ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed"
            : "bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-500"
        }`}
      >
        {isLoading ? "Processing..." : publicKey ? "Pay Now" : "Connect Wallet"}
      </button>
    </div>
  );
}