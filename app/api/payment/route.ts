// app/api/payment/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  ComputeBudgetProgram,
} from "@solana/web3.js";
import { prisma } from "@/lib/db/client";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

// Load Verafy wallet public key from .env
const VERAFY_WALLET_PUBLIC_KEY = process.env.VERAFY_WALLET_PUBLIC_KEY;

if (!VERAFY_WALLET_PUBLIC_KEY) {
  throw new Error("VERAFY_WALLET_PUBLIC_KEY is not defined in .env");
}

let VERAFY_WALLET: PublicKey;
try {
  VERAFY_WALLET = new PublicKey(VERAFY_WALLET_PUBLIC_KEY);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
} catch (error) {
  throw new Error("Invalid VERAFY_WALLET_PUBLIC_KEY: must be a valid base58 Solana public key");
}

// Solana devnet connection
const connection = new Connection("https://api.devnet.solana.com", "confirmed");

// Price per credit in SOL (0.001 SOL = 1 credit)
const CREDIT_PRICE_SOL = 0.001;

// Request body schema
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

// Retry utility
async function withRetry<T>(fn: () => Promise<T>, maxAttempts: number = 3, delayMs: number = 1000): Promise<T> {
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
  let body: RequestBody = {
    transaction: undefined,
    signature: undefined,
    credits: undefined,
    userWallet: undefined,
  };

  try {
    body = (await req.json()) as RequestBody;

    // Parse and validate input
    const parsedBody = paymentSchema.parse({
      transaction: body.transaction,
      signature: body.signature,
      credits: typeof body.credits === "string" ? parseInt(body.credits, 10) : body.credits,
      userWallet: body.userWallet,
    });
    const { transaction, signature, credits, userWallet } = parsedBody;

    console.log("Received payment request:", {
      signature,
      userWallet,
      credits,
    });

    // Validate SOL balance
    const userPublicKey = new PublicKey(userWallet);
    const expectedSol = credits * CREDIT_PRICE_SOL;
    const expectedLamports = Math.round(expectedSol * LAMPORTS_PER_SOL);
    const balance = await connection.getBalance(userPublicKey);

    if (balance < expectedLamports) {
      const errorMessage = `Insufficient SOL: Need ${expectedSol.toFixed(3)}, have ${(balance / LAMPORTS_PER_SOL).toFixed(3)}`;
      await prisma.paymentLog.create({
        data: {
          id: uuidv4(),
          walletPublicKey: userWallet,
          credits,
          solAmount: expectedSol,
          status: "FAILED",
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
      const errorMessage =
        error instanceof Error
          ? `Invalid transaction format: ${error.message}`
          : "Invalid transaction format";
      await prisma.paymentLog.create({
        data: {
          id: uuidv4(),
          walletPublicKey: userWallet,
          credits,
          solAmount: expectedSol,
          status: "FAILED",
          error: errorMessage,
          createdAt: new Date(),
        },
      });
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    console.log("Deserialized transaction:", {
      signatures: tx.signatures.map((sig) => sig.signature?.toString("base64") || "null"),
      instructions: tx.instructions.map((instr, idx) => ({
        index: idx,
        programId: instr.programId.toBase58(),
        keys: instr.keys.map((k) => k.pubkey.toBase58()),
      })),
    });

    // Verify transaction
    let transferInstruction = null;
    let errorMessage: string | null = null;

    for (let i = 0; i < tx.instructions.length; i++) {
      const instruction = tx.instructions[i];
      if (instruction.programId.equals(SystemProgram.programId)) {
        transferInstruction = instruction;
        break;
      } else if (!instruction.programId.equals(ComputeBudgetProgram.programId)) {
        errorMessage = `Invalid transaction: unexpected program ID at instruction ${i}, got ${instruction.programId.toBase58()}`;
        break;
      }
    }

    if (!transferInstruction) {
      errorMessage = errorMessage || "Invalid transaction: no SystemProgram.transfer instruction found";
      console.log("Transaction validation failed:", {
        instructions: tx.instructions.map((instr, idx) => ({
          index: idx,
          programId: instr.programId.toBase58(),
          keys: instr.keys.map((k) => k.pubkey.toBase58()),
        })),
        expectedRecipient: VERAFY_WALLET.toBase58(),
      });
      await prisma.paymentLog.create({
        data: {
          id: uuidv4(),
          walletPublicKey: userWallet,
          credits,
          solAmount: expectedSol,
          status: "FAILED",
          error: errorMessage,
          createdAt: new Date(),
        },
      });
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    // Validate transfer instruction
    const instruction = transferInstruction;
    if (instruction.keys.length < 2) {
      errorMessage = "Invalid transaction: insufficient keys, expected at least 2";
    } else if (!instruction.keys[1].pubkey.equals(VERAFY_WALLET)) {
      errorMessage = `Invalid transaction: incorrect recipient, expected ${VERAFY_WALLET.toBase58()}, got ${instruction.keys[1].pubkey.toBase58()}`;
    }

    if (errorMessage) {
      console.log("Transfer instruction validation failed:", {
        programId: instruction.programId.toBase58(),
        keys: instruction.keys.map((k) => k.pubkey.toBase58()),
        expectedRecipient: VERAFY_WALLET.toBase58(),
      });
      await prisma.paymentLog.create({
        data: {
          id: uuidv4(),
          walletPublicKey: userWallet,
          credits,
          solAmount: expectedSol,
          status: "FAILED",
          error: errorMessage,
          createdAt: new Date(),
        },
      });
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    // Verify amount
    const amountLamports = instruction.data.readBigInt64LE(4);
    if (amountLamports !== BigInt(expectedLamports)) {
      const errorMessage = `Invalid amount: expected ${expectedLamports} lamports, got ${amountLamports}`;
      await prisma.paymentLog.create({
        data: {
          id: uuidv4(),
          walletPublicKey: userWallet,
          credits,
          solAmount: expectedSol,
          status: "FAILED",
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
          solAmount: expectedSol,
          status: "FAILED",
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
          solAmount: expectedSol,
          status: "FAILED",
          error: errorMessage,
          createdAt: new Date(),
        },
      });
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    // Verify transaction status with retries
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
          console.error("Signature status check failed:", {
            signature,
            error: error instanceof Error ? error.message : String(error),
          });
          throw error;
        }
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? `Failed to verify transaction signature: ${error.message}`
          : "Failed to verify transaction signature";
      console.log("Signature verification failed:", { signature, error });
      await prisma.paymentLog.create({
        data: {
          id: uuidv4(),
          walletPublicKey: userWallet,
          credits,
          solAmount: expectedSol,
          status: "FAILED",
          error: errorMessage,
          createdAt: new Date(),
        },
      });
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    // Log success to PaymentLog
    await prisma.paymentLog.create({
      data: {
        id: signature,
        walletPublicKey: userWallet,
        credits,
        solAmount: expectedSol,
        status: "SUCCESS",
        createdAt: new Date(),
      },
    });

    return NextResponse.json({
      status: "success",
      signature,
      credits,
      solAmount: expectedSol,
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
        solAmount: (body.credits && Number.isInteger(Number(body.credits)) ? Number(body.credits) : 0) * CREDIT_PRICE_SOL,
        status: "FAILED",
        error: errorMessage,
        createdAt: new Date(),
      },
    });

    console.error("Payment error:", error);
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}