// hooks/useSolanaTransaction.ts
import { useState, useCallback } from "react";
import {
  PublicKey,
  Transaction,
  SystemProgram,
  SendTransactionError,
  ComputeBudgetProgram,
} from "@solana/web3.js";
import { connection } from "../lib/solana-constants";
import { WalletSignTransactionError } from "@solana/wallet-adapter-base";

interface TransactionResult {
  sendTransaction: (
    credits: number,
    destination: PublicKey,
  ) => Promise<{ signature: string; signedTx: Transaction }>;
  isSending: boolean;
  error: string | null;
  signature: string | null;
  signedTx: Transaction | null;
}

export const useSolanaTransaction = (
  publicKey: PublicKey | null,
  signTransaction: ((tx: Transaction) => Promise<Transaction>) | null,
): TransactionResult => {
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [signedTx, setSignedTx] = useState<Transaction | null>(null);

  const sendTransaction = useCallback(
    async (credits: number, destination: PublicKey) => {
      if (!publicKey || !signTransaction) {
        setError("Wallet not connected or cannot sign");
        throw new Error("Wallet not connected or cannot sign");
      }

      setIsSending(true);
      setError(null);
      setSignature(null);
      setSignedTx(null);

      let lastError: unknown;
      const maxAttempts = 3;
      const delayMs = 1000;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
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
              toPubkey: destination,
              lamports: Math.round(credits * 0.001 * 1_000_000_000), // CREDIT_PRICE_SOL * LAMPORTS_PER_SOL
            }),
          );

          const { blockhash, lastValidBlockHeight } =
            await connection.getLatestBlockhash("confirmed");
          transaction.recentBlockhash = blockhash;
          transaction.feePayer = publicKey;

          console.log("Transaction before signing (attempt", attempt, "):", {
            instructions: transaction.instructions.map((instr, idx) => ({
              index: idx,
              programId: instr.programId.toBase58(),
              keys: instr.keys.map((k) => k.pubkey.toBase58()),
              data: instr.data?.toString("hex") || null,
            })),
            lamports: transaction.instructions.find((instr) =>
              instr.programId.equals(SystemProgram.programId),
            )?.data
              ? Number(
                  transaction.instructions
                    .find((instr) =>
                      instr.programId.equals(SystemProgram.programId),
                    )
                    ?.data.readBigInt64LE(4),
                )
              : null,
            recentBlockhash: transaction.recentBlockhash,
            feePayer: transaction.feePayer?.toBase58(),
          });

          const signed = await signTransaction(transaction);

          if (!signed.signatures.length || !signed.verifySignatures()) {
            throw new Error("Transaction signature invalid");
          }

          const sig = await connection.sendRawTransaction(signed.serialize(), {
            skipPreflight: false,
            preflightCommitment: "confirmed",
          });
          console.log(
            `Transaction sent, attempt ${attempt}, signature: ${sig}`,
          );

          await connection.confirmTransaction(
            { signature: sig, blockhash, lastValidBlockHeight },
            "confirmed",
          );

          setSignature(sig);
          setSignedTx(signed);
          setIsSending(false);
          return { signature: sig, signedTx: signed };
        } catch (err) {
          lastError = err;
          if (err instanceof SendTransactionError) {
            console.error("SendTransactionError:", {
              message: err.message,
              logs: err.logs,
            });
            setError(`Transaction failed: ${err.message}`);
          } else if (err instanceof WalletSignTransactionError) {
            console.error("WalletSignTransactionError:", {
              message: err.message,
              error: err.error,
            });
            setError("Wallet approval denied");
          } else {
            console.error("Send error:", err);
            setError("Failed to send transaction");
          }
          if (attempt < maxAttempts) {
            console.log(
              `Attempt ${attempt} failed, retrying in ${delayMs}ms...`,
            );
            await new Promise((resolve) => setTimeout(resolve, delayMs));
          }
        }
      }
      setIsSending(false);
      throw lastError || new Error("Failed to send transaction after retries");
    },
    [publicKey, signTransaction],
  );

  return {
    sendTransaction,
    isSending,
    error,
    signature,
    signedTx,
  };
};
