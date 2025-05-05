import { useCallback, useState } from "react";
import {
  PublicKey,
  Transaction,
  SystemProgram,
  SendTransactionError,
  ComputeBudgetProgram,
} from "@solana/web3.js";
import { connection } from "../lib/solana-constants";
import { WalletSignTransactionError } from "@solana/wallet-adapter-base";
import { QUERY_COST } from "@/lib/constants";
import { sanitizeError } from "@/utils/security-utils";

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
  signTransaction: ((tx: Transaction) => Promise<Transaction>) | null | undefined,
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
      const delayMs = 2000; // Increased delay for retries

      // Log connection endpoint
      console.log("Connection endpoint:", connection.rpcEndpoint);

      // Validate accounts before transaction
      try {
        const senderAccount = await connection.getAccountInfo(publicKey);
        const destAccount = await connection.getAccountInfo(destination);
        console.log("Account validation:", {
          sender: {
            address: publicKey.toBase58(),
            initialized: !!senderAccount,
            lamports: senderAccount?.lamports || 0,
          },
          destination: {
            address: destination.toBase58(),
            initialized: !!destAccount,
            lamports: destAccount?.lamports || 0,
          },
        });
        if (!senderAccount) {
          setError("Sender account not initialized");
          setIsSending(false);
          throw new Error("Sender account not initialized");
        }
        if (!destAccount) {
          setError("Recipient account not initialized");
          setIsSending(false);
          throw new Error("Recipient account not initialized");
        }
      } catch (accountError: unknown) {
        console.error("Account validation failed:", accountError);
        const errorMessage =
          accountError instanceof Error ? accountError.message : "Unknown account validation error";
        setError(`Failed to validate accounts: ${errorMessage}`);
        setIsSending(false);
        throw new Error(errorMessage);
      }

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          // Create transaction
          const transaction = new Transaction();
          transaction.add(
            ComputeBudgetProgram.setComputeUnitLimit({
              units: 400_000, // Increased for reliability
            }),
            ComputeBudgetProgram.setComputeUnitPrice({
              microLamports: 500_000, // Increased for priority
            }),
            SystemProgram.transfer({
              fromPubkey: publicKey,
              toPubkey: destination,
              lamports: Math.round(credits * QUERY_COST * 1_000_000_000),
            }),
          );

          // Validate transaction destination
          const transferInstruction = transaction.instructions.find((instr) =>
            instr.programId.equals(SystemProgram.programId),
          );
          if (!transferInstruction) {
            throw new Error("No SystemProgram.transfer instruction found");
          }
          if (!transferInstruction.keys[1]?.pubkey.equals(destination)) {
            throw new Error("Transaction destination does not match expected recipient");
          }

          // Fetch fresh blockhash per attempt
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

          // Log serialized transaction
          const serializedTx = signed.serialize();
          console.log("Serialized transaction:", {
            size: serializedTx.length,
            signatures: signed.signatures.map((s) => s.signature?.toString("hex")),
          });

          const sig = await connection.sendRawTransaction(serializedTx, {
            skipPreflight: false,
            preflightCommitment: "confirmed",
          });
          console.log(`Transaction sent, attempt ${attempt}, signature: ${sig}`);

          await connection.confirmTransaction(
            { signature: sig, blockhash, lastValidBlockHeight },
            "confirmed",
          );

          setSignature(sig);
          setSignedTx(signed);
          setIsSending(false);
          return { signature: sig, signedTx: signed };
        } catch (transactionError: unknown) {
          lastError = transactionError;
          if (transactionError instanceof SendTransactionError) {
            console.error("SendTransactionError:", {
              message: transactionError.message,
              logs: transactionError.logs,
            });
            setError(
              `Transaction failed: Simulation failed. Message: ${transactionError.message}. Logs: ${transactionError.logs?.join(", ") || "[]"}`,
            );
          } else if (transactionError instanceof WalletSignTransactionError) {
            console.error(sanitizeError(transactionError));
            setError("Wallet approval denied");
          } else {
            // Handle non-Error types
            const errorMessage =
              transactionError instanceof Error
                ? transactionError.message
                : String(transactionError) || "Unknown transaction error";
            console.error("Transaction error:", {
              error: transactionError,
              message: errorMessage,
            });
            setError(`Transaction failed: ${errorMessage}`);
          }
          if (attempt < maxAttempts) {
            console.log(`Attempt ${attempt} failed, retrying in ${delayMs}ms...`);
            await new Promise((resolve) => setTimeout(resolve, delayMs));
          } else {
            setIsSending(false); // Ensure isSending is reset on final failure
            throw lastError || new Error("Failed to send transaction after retries");
          }
        }
      }
      setIsSending(false); // Ensure isSending is reset
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