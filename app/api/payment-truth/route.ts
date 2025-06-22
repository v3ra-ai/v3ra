import { NextRequest, NextResponse } from "next/server";
import {
  PublicKey,
  Transaction,
  ComputeBudgetProgram,
} from "@solana/web3.js";
import { prisma } from "@/lib/db/client";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { verifyCsrfToken } from "@/utils/csrf-utils";
import { TRUTH_QUERY_COST, TRUTH_TOKEN_MINT_ADDRESS, TRUTH_TOKEN_DECIMALS } from "@/lib/constants";
import { connection, V3RA_WALLET } from "@/lib/solana-constants";
import { getAssociatedTokenAddress, getAccount } from "@solana/spl-token";

interface RequestBody {
  transaction?: string;
  signature?: string;
  credits?: unknown;
  userWallet?: string;
}

const paymentSchema = z.object({
  transaction: z.string().min(1, "Transaction is required"),
  signature: z.string().min(1, "Signature is required"),
  credits: z
    .number()
    .int()
    .min(1, "Credits must be at least 1")
    .max(100, "Credits cannot exceed 100"),
  userWallet: z
    .string({ required_error: "userWallet is required" })
    .min(1, "userWallet cannot be empty")
    .refine(
      (val) => {
        try {
          new PublicKey(val);
          return true;
        } catch {
          return false;
        }
      },
      { message: "Invalid Solana public key" },
    ),
});

async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 1000,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        console.log(`Attempt ${attempt} failed, retrying in ${delayMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
  throw lastError;
}

export async function POST(req: NextRequest) {
  const csrfResponse = verifyCsrfToken(req);
  if (csrfResponse) {
    return csrfResponse;
  }

  let body: RequestBody = {
    transaction: undefined,
    signature: undefined,
    credits: undefined,
    userWallet: undefined,
  };

  try {
    body = (await req.json()) as RequestBody;
    const parsedBody = paymentSchema.parse({
      transaction: body.transaction,
      signature: body.signature,
      credits:
        typeof body.credits === "string"
          ? parseInt(body.credits, 10)
          : body.credits,
      userWallet: body.userWallet,
    });
    const { transaction, signature, credits, userWallet } = parsedBody;

    console.log("[Payment-Truth] Received payment request:", {
      signature,
      userWallet,
      credits,
    });

    // Validate $truth balance
    const userPublicKey = new PublicKey(userWallet);
    const expectedTruth = credits * TRUTH_QUERY_COST;
    const expectedAmount = Math.round(expectedTruth * 10 ** TRUTH_TOKEN_DECIMALS);
    let userTokenAccount: PublicKey;
    try {
      userTokenAccount = await getAssociatedTokenAddress(new PublicKey(TRUTH_TOKEN_MINT_ADDRESS), userPublicKey);
      const accountInfo = await getAccount(connection, userTokenAccount);
      const balance = Number(accountInfo.amount);
      if (balance < expectedAmount) {
        const errorMessage = `Insufficient $truth: Need ${expectedTruth.toFixed(0)}, have ${(balance / 10 ** TRUTH_TOKEN_DECIMALS).toFixed(0)}`;
        await prisma.paymentLog.create({
          data: {
            id: uuidv4(),
            walletPublicKey: userWallet,
            credits,
            otherAmount: expectedTruth,
            otherPayType: TRUTH_TOKEN_MINT_ADDRESS,
            status: "FAILED_TRUTH",
            error: errorMessage,
            createdAt: new Date(),
          },
        });
        return NextResponse.json({ error: errorMessage }, { status: 400 });
      }
    } catch {
      const errorMessage = "User $truth token account not found or invalid";
      await prisma.paymentLog.create({
        data: {
          id: uuidv4(),
          walletPublicKey: userWallet,
          credits,
          otherAmount: expectedTruth,
          otherPayType: TRUTH_TOKEN_MINT_ADDRESS,
          status: "FAILED_TRUTH",
          error: errorMessage,
          createdAt: new Date(),
        },
      });
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    // Deserialize transaction
    let tx: Transaction;
    try {
      tx = Transaction.from(Buffer.from(transaction, "base64"));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error
        ? `Invalid transaction format: ${error.message}`
        : "Invalid transaction format";
      await prisma.paymentLog.create({
        data: {
          id: uuidv4(),
          walletPublicKey: userWallet,
          credits,
          otherAmount: expectedTruth,
          otherPayType: TRUTH_TOKEN_MINT_ADDRESS,
          status: "FAILED_TRUTH",
          error: errorMessage,
          createdAt: new Date(),
        },
      });
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    // Verify transaction
    let transferInstruction = null;
    let errorMessage: string | null = null;

    for (let i = 0; i < tx.instructions.length; i++) {
      const instruction = tx.instructions[i];
      if (instruction.programId.equals(new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"))) {
        transferInstruction = instruction;
        break;
      } else if (
        !instruction.programId.equals(ComputeBudgetProgram.programId)
      ) {
        errorMessage = `Invalid transaction: unexpected program ID at instruction ${i}, got ${instruction.programId.toBase58()}`;
        break;
      }
    }

    if (!transferInstruction) {
      errorMessage = errorMessage || "Invalid transaction: no SPL Token transfer instruction found";
      console.log("[Payment-Truth] Transaction validation failed:", {
        instructions: tx.instructions.map((instr, idx) => ({
          index: idx,
          programId: instr.programId.toBase58(),
          keys: instr.keys.map((k) => k.pubkey.toBase58()),
        })),
        expectedRecipient: V3RA_WALLET.toBase58(),
      });
      await prisma.paymentLog.create({
        data: {
          id: uuidv4(),
          walletPublicKey: userWallet,
          credits,
          otherAmount: expectedTruth,
          otherPayType: TRUTH_TOKEN_MINT_ADDRESS,
          status: "FAILED_TRUTH",
          error: errorMessage,
          createdAt: new Date(),
        },
      });
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    // Validate transfer instruction
    const instruction = transferInstruction;
    const recipientATA = await getAssociatedTokenAddress(new PublicKey(TRUTH_TOKEN_MINT_ADDRESS), V3RA_WALLET);
    if (instruction.keys.length < 2) {
      errorMessage = "Invalid transaction: insufficient keys, expected at least 2";
    } else if (!instruction.keys[1].pubkey.equals(recipientATA)) {
      errorMessage = `Invalid transaction: incorrect recipient token account, expected ${recipientATA.toBase58()}, got ${instruction.keys[1].pubkey.toBase58()}`;
    }

    if (errorMessage) {
      console.log("[Payment-Truth] Transfer instruction validation failed:", {
        programId: instruction.programId.toBase58(),
        keys: instruction.keys.map((k) => k.pubkey.toBase58()),
        expectedRecipient: recipientATA.toBase58(),
      });
      await prisma.paymentLog.create({
        data: {
          id: uuidv4(),
          walletPublicKey: userWallet,
          credits,
          otherAmount: expectedTruth,
          otherPayType: TRUTH_TOKEN_MINT_ADDRESS,
          status: "FAILED_TRUTH",
          error: errorMessage,
          createdAt: new Date(),
        },
      });
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    // Verify amount
    const amount = instruction.data.readBigInt64LE(4);
    if (amount !== BigInt(expectedAmount)) {
      const errorMessage = `Invalid amount: expected ${expectedAmount} $truth units, got ${amount}`;
      await prisma.paymentLog.create({
        data: {
          id: uuidv4(),
          walletPublicKey: userWallet,
          credits,
          otherAmount: expectedTruth,
          otherPayType: TRUTH_TOKEN_MINT_ADDRESS,
          status: "FAILED_TRUTH",
          error: errorMessage,
          createdAt: new Date(),
        },
      });
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    // Verify signature
    if (!tx.signatures.length || !tx.signatures[0].signature) {
      const errorMessage = "Transaction not signed";
      await prisma.paymentLog.create({
        data: {
          id: uuidv4(),
          walletPublicKey: userWallet,
          credits,
          otherAmount: expectedTruth,
          otherPayType: TRUTH_TOKEN_MINT_ADDRESS,
          status: "FAILED_TRUTH",
          error: errorMessage,
          createdAt: new Date(),
        },
      });
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    // Validate blockhash
    if (!tx.recentBlockhash) {
      const errorMessage = "Transaction missing recentBlockhash";
      await prisma.paymentLog.create({
        data: {
          id: uuidv4(),
          walletPublicKey: userWallet,
          credits,
          otherAmount: expectedTruth,
          otherPayType: TRUTH_TOKEN_MINT_ADDRESS,
          status: "FAILED_TRUTH",
          error: errorMessage,
          createdAt: new Date(),
        },
      });
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    // Verify transaction status
    try {
      await withRetry(async () => {
        try {
          const txStatus = await connection.getSignatureStatus(signature, {
            searchTransactionHistory: true,
          });
          if (!txStatus?.value?.confirmationStatus) {
            throw new Error("Transaction not confirmed");
          }
          return txStatus;
        } catch (error) {
          console.error("[Payment-Truth] Signature status check failed:", {
            signature,
            error: error instanceof Error ? error.message : String(error),
          });
          throw error;
        }
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error
        ? `Failed to verify transaction signature: ${error.message}`
        : "Failed to verify transaction signature";
      console.log("[Payment-Truth] Signature verification failed:", { signature, error });
      await prisma.paymentLog.create({
        data: {
          id: uuidv4(),
          walletPublicKey: userWallet,
          credits,
          otherAmount: expectedTruth,
          otherPayType: TRUTH_TOKEN_MINT_ADDRESS,
          status: "FAILED_TRUTH",
          error: errorMessage,
          createdAt: new Date(),
        },
      });
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    // Log success
    await prisma.paymentLog.create({
      data: {
        id: signature,
        walletPublicKey: userWallet,
        credits,
        otherAmount: expectedTruth,
        otherPayType: TRUTH_TOKEN_MINT_ADDRESS,
        status: "SUCCESS_TRUTH",
        createdAt: new Date(),
      },
    });

    return NextResponse.json({
      status: "success",
      signature,
      credits,
      truthAmount: expectedTruth,
    });
  } catch (error: unknown) {
    let errorMessage = "Payment failed";
    if (error instanceof z.ZodError) {
      errorMessage = error.errors.map((e) => e.message).join(", ");
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    await prisma.paymentLog.create({
      data: {
        id: uuidv4(),
        walletPublicKey: body.userWallet ?? "unknown",
        credits: body.credits && Number.isInteger(Number(body.credits)) ? Number(body.credits) : 0,
        otherAmount: body.credits && Number.isInteger(Number(body.credits)) ? Number(body.credits) * TRUTH_QUERY_COST : 0,
        otherPayType: TRUTH_TOKEN_MINT_ADDRESS,
        status: "FAILED_TRUTH",
        error: errorMessage,
        createdAt: new Date(),
      },
    });

    console.error("[Payment-Truth] Payment error:", error);
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}