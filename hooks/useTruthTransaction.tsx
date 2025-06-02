import { useCallback, useState } from "react";
import {
  PublicKey,
  Transaction,
  SendTransactionError,
  ComputeBudgetProgram,
} from "@solana/web3.js";
import { connection, TRUTH_TOKEN_MINT, TRUTH_TOKEN_DECIMALS } from "@/lib/solana-constants";
import { WalletSignTransactionError } from "@solana/wallet-adapter-base";
import { TRUTH_QUERY_COST } from "@/lib/constants";
import { sanitizeError } from "@/utils/security-utils";
import { TruthTransactionResult } from "@/lib/types";
import { createTransferInstruction, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, getAccount } from "@solana/spl-token";

export const useTruthTransaction = (
  publicKey: PublicKey | null,
  signTransaction: ((tx: Transaction) => Promise<Transaction>) | null | undefined,
): {
  sendTransaction: (
    credits: number,
    destination: PublicKey,
  ) => Promise<TruthTransactionResult>;
  isSending: boolean;
  error: string | null;
  signature: string | null;
  signedTx: Transaction | null;
} => {
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
      const delayMs = 2000;

      console.log("[TruthTransaction] Connection endpoint:", connection.rpcEndpoint);

      // Validate accounts
      try {
        const senderAccount = await connection.getAccountInfo(publicKey);
        const destAccount = await connection.getAccountInfo(destination);
        console.log("[TruthTransaction] Account validation:", {
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
      } catch (accountError) {
        console.error("[TruthTransaction] Account validation failed:", accountError);
        const errorMessage = accountError instanceof Error ? accountError.message : "Unknown account validation error";
        setError(`Failed to validate accounts: ${errorMessage}`);
        setIsSending(false);
        throw new Error(errorMessage);
      }

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          // Create transaction
          const transaction = new Transaction();
          const senderATA = await getAssociatedTokenAddress(TRUTH_TOKEN_MINT, publicKey);
          const recipientATA = await getAssociatedTokenAddress(TRUTH_TOKEN_MINT, destination);

          console.log("[TruthTransaction] ATAs:", {
            senderATA: senderATA.toBase58(),
            recipientATA: recipientATA.toBase58(),
          });

          // Check if recipient token account exists, create if not
          try {
            const recipientAccount = await getAccount(connection, recipientATA);
            console.log("[TruthTransaction] Recipient ATA exists:", {
              amount: recipientAccount.amount.toString(),
            });
          } catch {
            console.log("[TruthTransaction] Creating recipient ATA");
            transaction.add(
              createAssociatedTokenAccountInstruction(
                publicKey, // Payer
                recipientATA, // Token account
                destination, // Owner
                TRUTH_TOKEN_MINT
              )
            );
          }

          // Check sender ATA
          try {
            const senderAccount = await getAccount(connection, senderATA);
            console.log("[TruthTransaction] Sender ATA exists:", {
              amount: senderAccount.amount.toString(),
            });
          } catch (error) {
            console.error("[TruthTransaction] Sender ATA not found:", error);
            throw new Error("Sender $truth token account not initialized");
          }

          transaction.add(
            ComputeBudgetProgram.setComputeUnitLimit({
              units: 400_000,
            }),
            ComputeBudgetProgram.setComputeUnitPrice({
              microLamports: 500_000,
            }),
            createTransferInstruction(
              senderATA,
              recipientATA,
              publicKey,
              Math.round(credits * TRUTH_QUERY_COST * 10 ** TRUTH_TOKEN_DECIMALS)
            )
          );

          // Validate transaction
          const transferInstruction = transaction.instructions.find((instr) =>
            instr.programId.equals(new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"))
          );
          if (!transferInstruction) {
            throw new Error("No SPL Token transfer instruction found");
          }

          const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
          console.log("[TruthTransaction] Fetched blockhash:", {
            blockhash,
            lastValidBlockHeight,
          });

          transaction.recentBlockhash = blockhash;
          transaction.feePayer = publicKey;

          console.log("[TruthTransaction] Transaction before signing (attempt", attempt, "):", {
            instructions: transaction.instructions.map((instr, idx) => ({
              index: idx,
              programId: instr.programId.toBase58(),
              keys: instr.keys.map((k) => k.pubkey.toBase58()),
              data: instr.data?.toString("hex") || null,
            })),
            tokenAmount: transaction.instructions.find((instr) =>
              instr.programId.equals(new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"))
            )?.data
              ? Number(
                  transaction.instructions
                    .find((instr) =>
                      instr.programId.equals(new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"))
                    )
                    ?.data.readBigInt64LE(4)
                )
              : null,
            recentBlockhash: transaction.recentBlockhash,
            feePayer: transaction.feePayer?.toBase58(),
          });

          const signed = await signTransaction(transaction);

          if (!signed.signatures.length || !signed.verifySignatures()) {
            throw new Error("Transaction signature invalid");
          }

          const serializedTx = signed.serialize();
          console.log("[TruthTransaction] Serialized transaction:", {
            size: serializedTx.length,
            signatures: signed.signatures.map((s) => s.signature?.toString("hex")),
          });

          const sig = await connection.sendRawTransaction(serializedTx, {
            skipPreflight: false,
            preflightCommitment: "confirmed",
          });
          console.log("[TruthTransaction] Transaction sent, attempt", attempt, "signature:", sig);

          await connection.confirmTransaction(
            { signature: sig, blockhash, lastValidBlockHeight },
            "confirmed",
          );
          console.log("[TruthTransaction] Transaction confirmed:", sig);

          setSignature(sig);
          setSignedTx(signed);
          setIsSending(false);
          return { signature: sig, signedTx: signed, tokenAmount: credits * TRUTH_QUERY_COST };
        } catch (transactionError) {
          lastError = transactionError;
          if (transactionError instanceof SendTransactionError) {
            console.error("[TruthTransaction] SendTransactionError:", {
              message: transactionError.message,
              logs: transactionError.logs,
            });
            setError(
              `Transaction failed: ${transactionError.message}. Logs: ${transactionError.logs?.join(", ") || "[]"}`
            );
          } else if (transactionError instanceof WalletSignTransactionError) {
            console.error("[TruthTransaction] WalletSignTransactionError:", sanitizeError(transactionError));
            setError("Wallet approval denied: " + transactionError.message);
          } else {
            const errorMessage = transactionError instanceof Error
              ? transactionError.message
              : String(transactionError) || "Unknown transaction error";
            console.error("[TruthTransaction] Transaction error:", {
              error: transactionError,
              message: errorMessage,
            });
            setError(`Transaction failed: ${errorMessage}`);
          }
          if (attempt < maxAttempts) {
            console.log("[TruthTransaction] Attempt", attempt, "failed, retrying in", delayMs, "ms...");
            await new Promise((resolve) => setTimeout(resolve, delayMs));
          } else {
            console.error("[TruthTransaction] All attempts failed:", lastError);
            setIsSending(false);
            throw lastError || new Error("Failed to send transaction after retries");
          }
        }
      }
      console.error("[TruthTransaction] Transaction failed after all attempts");
      setIsSending(false);
      throw lastError || new Error("Failed to send transaction after retries");
    },
    [publicKey, signTransaction]
  );

  return {
    sendTransaction,
    isSending,
    error,
    signature,
    signedTx,
  };
};