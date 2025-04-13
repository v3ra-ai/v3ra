import { NextRequest, NextResponse } from "next/server";
import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { prisma } from "@/lib/db/client";

// Load Verafy wallet public key from .env
const VERAFY_WALLET_PUBLIC_KEY = process.env.VERAFY_WALLET_PUBLIC_KEY;

console.log("VERAFY_WALLET_PUBLIC_KEY:", VERAFY_WALLET_PUBLIC_KEY);

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

export async function POST(request: NextRequest) {
  try {
    const { transaction, credits, userWallet } = await request.json();

    if (!transaction || !credits || !userWallet) {
      return NextResponse.json(
        { error: "Missing transaction, credits, or userWallet" },
        { status: 400 }
      );
    }

    // Validate credits
    const creditsNum = parseInt(credits, 10);
    if (
      isNaN(creditsNum) ||
      creditsNum <= 0 ||
      creditsNum > 100 ||
      creditsNum !== Math.floor(creditsNum)
    ) {
      return NextResponse.json(
        { error: "Invalid credits amount (must be 1–100)" },
        { status: 400 }
      );
    }

    // Calculate expected SOL
    const expectedSol = creditsNum * CREDIT_PRICE_SOL;
    const expectedLamports = expectedSol * LAMPORTS_PER_SOL;

    // Deserialize transaction
    let tx: Transaction;
    try {
      tx = Transaction.from(Buffer.from(transaction, "base64"));
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid transaction format" },
        { status: 400 }
      );
    }

    // Verify transaction
    const instruction = tx.instructions[0];
    if (
      !instruction.programId.equals(SystemProgram.programId) ||
      instruction.keys.length < 2 ||
      !instruction.keys[1].pubkey.equals(VERAFY_WALLET)
    ) {
      return NextResponse.json(
        { error: "Invalid transaction: incorrect recipient" },
        { status: 400 }
      );
    }

    // Verify amount
    const amountLamports = instruction.data.readBigInt64LE(4);
    if (amountLamports !== BigInt(expectedLamports)) {
      return NextResponse.json(
        { error: `Invalid amount: expected ${expectedLamports} lamports` },
        { status: 400 }
      );
    }

    // Verify signature
    const signature = tx.signatures[0]?.signature?.toString("base64");
    if (!signature) {
      return NextResponse.json(
        { error: "Transaction not signed" },
        { status: 400 }
      );
    }

    // Check on-chain
    const txStatus = await connection.getSignatureStatus(signature);
    if (!txStatus?.value?.confirmationStatus) {
      return NextResponse.json(
        { error: "Transaction not confirmed" },
        { status: 400 }
      );
    }

    // Log to PaymentLog
    await prisma.paymentLog.create({
      data: {
        id: signature,
        walletPublicKey: userWallet,
        credits: creditsNum,
        solAmount: expectedSol,
        status: "SUCCESS",
        createdAt: new Date(),
      },
    });

    return NextResponse.json({
      status: "success",
      signature,
      credits: creditsNum,
      solAmount: expectedSol,
    });
  } catch (error) {
    console.error("Payment error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    try {
      await prisma.paymentLog.create({
        data: {
          id: `error-${Date.now()}`,
          walletPublicKey: (await request.json())?.userWallet || "unknown",
          credits: 0,
          solAmount: 0,
          status: "FAILED",
          error: errorMessage,
          createdAt: new Date(),
        },
      });
    } catch (logError) {
      console.error("Failed to log payment error:", logError);
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}