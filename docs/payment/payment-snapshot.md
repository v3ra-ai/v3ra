This is code related to payments being made on Verafy Testnet


# Verafy Testnet Payments

app/api/credits/assign/route.ts, app/api/credits/balance/route.ts, app/api/payment/route.ts, app/credits/page.tsx, components/credits/credit-slider-ui.tsx, components/credits/credit-slider.tsx, components/credits/credits-layout.tsx, components/credits/stake-slider.tsx, components/ask/wallet-toggle.tsx, components/ask/navbar-credits.tsx, components/ask/payment-controls.tsx, components/ask/query-form-ai-slider.tsx, components/ask/query-form-input.tsx, components/ask/query-form.tsx, components/ask/query-interface.tsx, hooks/useCreditAssignment.tsx, hooks/useCreditBalance.tsx, hooks/useSolanaTransaction.tsx, hooks/useSolanaWallet.tsx, hooks/useBroadcastQuery.ts, store/credit-store.ts, lib/constants.ts, utils/csrf-utils.ts, app/api/csrf-token/route.ts, components/ask/query-stats.tsx, components/ask/consensus/current-query.tsx, hooks/useNavbarScrollbar.ts


app/api/credits/assign/route.ts
app/api/credits/balance/route.ts
app/api/payment/route.ts
app/credits/page.tsx
components/credits/credit-slider-ui.tsx
components/credits/credit-slider.tsx
components/credits/credits-layout.tsx
components/credits/stake-slider.tsx
components/ask/wallet-toggle.tsx
components/ask/navbar-credits.tsx
components/ask/payment-controls.tsx
components/ask/query-form-ai-slider.tsx
components/ask/query-form-input.tsx
components/ask/query-form.tsx
components/ask/query-interface.tsx
components/ask/wallet-toggle.tsx
hooks/useCreditAssignment.tsx
hooks/useCreditBalance.tsx
hooks/useSolanaTransaction.tsx
hooks/useSolanaWallet.tsx
hooks/useBroadcastQuery.ts
store/credit-store.ts
lib/constants.ts
utils/csrf-utils.ts
app/api/csrf-token/route.ts
components/ask/query-stats.tsx
components/ask/consensus/current-query.tsx
hooks/useBroadcastQuery.ts
hooks/useCreditAssignment.tsx
hooks/useCreditBalance.tsx
app/api/credits/assign/route.ts
hooks/useNavbarScrollbar.ts



import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { PublicKey } from "@solana/web3.js";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { verifyCsrfToken } from "@/utils/csrf-utils";
import { QUERY_COST } from "@/lib/constants";

// Define interface for request body
interface RequestBody {
  walletPublicKey?: string;
  creditAmount?: number;
}

const assignCreditsSchema = z.object({
  walletPublicKey: z.string().refine(
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
  creditAmount: z.number().int().min(1).max(100),
});

// Assigns credits to a user's Solana wallet and logs the transaction
export async function POST(req: NextRequest) {
  // Verify CSRF token
  const csrfResponse = verifyCsrfToken(req);
  if (csrfResponse) {
    return csrfResponse;
  }

  // Initialize body with defaults to ensure scope and type safety
  let body: RequestBody = {
    walletPublicKey: undefined,
    creditAmount: undefined,
  };

  try {
    body = (await req.json()) as RequestBody; // Cast to our interface
    const { walletPublicKey, creditAmount } = assignCreditsSchema.parse(body);

    const updatedCredit = await prisma.userCredit.upsert({
      where: { walletPublicKey },
      update: {
        credits: { increment: creditAmount },
        updatedAt: new Date(),
      },
      create: {
        walletPublicKey,
        credits: creditAmount,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    await prisma.paymentLog.create({
      data: {
        id: uuidv4(),
        walletPublicKey,
        credits: creditAmount,
        solAmount: creditAmount * QUERY_COST,
        status: "ASSIGNED",
        createdAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        success: true,
        credits: updatedCredit.credits,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to assign credits";
    await prisma.paymentLog.create({
      data: {
        id: uuidv4(),
        walletPublicKey: body.walletPublicKey ?? "unknown", // Use ?? for undefined check
        credits:
          body.creditAmount && Number.isInteger(body.creditAmount)
            ? body.creditAmount
            : 0,
        solAmount:
          (body.creditAmount && Number.isInteger(body.creditAmount)
            ? body.creditAmount
            : 0) * QUERY_COST,
        status: "FAILED",
        error: errorMessage,
        createdAt: new Date(),
      },
    });
    console.error("[Credits/Assign] Error assigning credits:", error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}


app/api/credits/balance/route.ts

// app/api/credits/balance/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { walletPublicKey } = await request.json();

    // console.log(walletPublicKey);

    if (!walletPublicKey) {
      return NextResponse.json(
        { error: "Wallet public key is required" },
        { status: 400 },
      );
    }

    // Query the UserCredit table for the user's credit balance
    const userCredit = await prisma.userCredit.findUnique({
      where: { walletPublicKey },
      select: { credits: true },
    });

    const credits = userCredit?.credits ?? 0; // Default to 0 if no record found

    return NextResponse.json({ credits }, { status: 200 });
  } catch (error) {
    console.error("Error fetching credit balance:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  } finally {
    await prisma.$disconnect();
  }
}


app/api/payment/route.ts

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
import { verifyCsrfToken } from "@/utils/csrf-utils";
import { CURRENT_SOLANA_NETWORK_RPC, QUERY_COST } from "@/lib/constants";

// Load Verafy wallet public key from .env
const VERAFY_WALLET_PUBLIC_KEY = process.env.VERAFY_WALLET_PUBLIC_KEY;

if (!VERAFY_WALLET_PUBLIC_KEY) {
  throw new Error("VERAFY_WALLET_PUBLIC_KEY is not defined in .env");
}

let VERAFY_WALLET: PublicKey;
try {
  VERAFY_WALLET = new PublicKey(VERAFY_WALLET_PUBLIC_KEY);
} catch {
  throw new Error(
    "Invalid VERAFY_WALLET_PUBLIC_KEY: must be a valid base58 Solana public key",
  );
}

// Solana devnet connection
const connection = new Connection(CURRENT_SOLANA_NETWORK_RPC || "", "confirmed");

// Price per credit in SOL (0.001 SOL = 1 credit)
const CREDIT_PRICE_SOL = QUERY_COST

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

// Processes a Solana payment and logs the transaction
export async function POST(req: NextRequest) {
  // Verify CSRF token
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

    // Parse and validate input
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

    console.log("[Payment] Received payment request:", {
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

    // Verify transaction
    let transferInstruction = null;
    let errorMessage: string | null = null;

    for (let i = 0; i < tx.instructions.length; i++) {
      const instruction = tx.instructions[i];
      if (instruction.programId.equals(SystemProgram.programId)) {
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
      errorMessage =
        errorMessage ||
        "Invalid transaction: no SystemProgram.transfer instruction found";
      console.log("[Payment] Transaction validation failed:", {
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
      errorMessage =
        "Invalid transaction: insufficient keys, expected at least 2";
    } else if (!instruction.keys[1].pubkey.equals(VERAFY_WALLET)) {
      errorMessage = `Invalid transaction: incorrect recipient, expected ${VERAFY_WALLET.toBase58()}, got ${instruction.keys[1].pubkey.toBase58()}`;
    }

    if (errorMessage) {
      console.log("[Payment] Transfer instruction validation failed:", {
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
          console.error("[Payment] Signature status check failed:", {
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
      console.log("[Payment] Signature verification failed:", { signature, error });
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
        credits:
          body.credits && Number.isInteger(Number(body.credits))
            ? Number(body.credits)
            : 0,
        solAmount:
          (body.credits && Number.isInteger(Number(body.credits))
            ? Number(body.credits)
            : 0) * CREDIT_PRICE_SOL,
        status: "FAILED",
        error: errorMessage,
        createdAt: new Date(),
      },
    });

    console.error("[Payment] Payment error:", error);
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}

app/credits/page.tsx

"use client";
import { CreditsLayout } from "@/components/credits/credits-layout";
import Navbar from "@/components/ask/navbar";
import { SolanaProvider } from "@/components/solana-provider";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function CreditsPage() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Handle hydration to avoid theme mismatch
  useEffect(() => {
    setMounted(true);
  }, []);



  const backgroundImage = mounted
    ? theme === "dark"
      ? "url(/bg_home_black.jpg)"
      : "url(/bg_home_white.jpg)"
    : "url(/bg_home_black.jpg)"; // Default to light theme before mounting

  return (
    <SolanaProvider>
      <div
        className="min-h-screen"
        style={{
          backgroundImage,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
          backgroundRepeat: "no-repeat",
          width: "100vw",
          height: "100vh",
        }}
      >
      <Navbar />
      <CreditsLayout />
      </div>
    </SolanaProvider>
  );
}


components/credits/credit-slider-ui.tsx


import * as Slider from "@radix-ui/react-slider";
import { Coins, Square } from "lucide-react";

interface CreditSliderUIProps {
  creditAmount: number;
  setCreditAmount: (value: number) => void;
  requiredSol: number;
  creditBalance: number | null;
  solBalance: number | null;
  isLoading: boolean;
  isValid: boolean;
  hasEnoughSol: boolean;
  isWalletConnected: boolean;
  onPay: () => void;
  onChangeWallet: () => void;
  decimalPlaces: number;
}

export default function CreditSliderUI({
  creditAmount,
  setCreditAmount,
  requiredSol,
  creditBalance,
  solBalance,
  isLoading,
  isValid,
  hasEnoughSol,
  isWalletConnected,
  onPay,
  onChangeWallet,
  decimalPlaces,
}: CreditSliderUIProps) {
  // Debug log to confirm cost display
  if (process.env.NODE_ENV === "development") {
    console.log("CreditSliderUI cost display:", {
      requiredSol,
      decimalPlaces,
      formattedCost: requiredSol.toFixed(decimalPlaces),
    });
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-zinc-200 dark:bg-zinc-800 rounded-lg shadow-md">
      <div className="flex flex-row w-full text-center justify-center items-center mx-auto">
        <div className="flex justify-center items-center mb-2">
          {" "}
          <Coins size={22} />
          <h2 className="w-full text-2xl font-semibold ml-2 text-zinc-900 dark:text-zinc-100">
            Purchase Credits
          </h2>
        </div>
      </div>
      <div className="text-center mb-6">
        <span className="text-5xl font-bold text-zinc-900 dark:text-zinc-100">
          {creditAmount}
        </span>
      </div>
      <div className="mb-6">
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
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
            <Slider.Track className="bg-zinc-300 dark:bg-zinc-600 relative grow rounded-full h-1">
              <Slider.Range className="absolute bg-blue-500 dark:bg-blue-400 rounded-full h-full" />
            </Slider.Track>
            <Slider.Thumb
              className="block w-5 h-5 bg-blue-500 dark:bg-blue-400 rounded-full hover:bg-blue-600 dark:hover:bg-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              aria-label="Credits"
            />
          </Slider.Root>
          <div className="flex justify-between mt-2 text-sm text-zinc-700 dark:text-zinc-300">
            <span>Min. (0)</span>
            <span>Max. (100)</span>
          </div>
        </div>
      </div>
      <div className="mb-6 block">
        <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
          Cost: {requiredSol.toFixed(decimalPlaces)} SOL
        </p>
      </div>
      <div className="mb-4">
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          Current Balance:{" "}
          {isWalletConnected && creditBalance !== null
            ? `${creditBalance} credits`
            : "n/a - connect wallet"}
        </p>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          SOL Balance:{" "}
          {isWalletConnected && solBalance !== null
            ? `${solBalance.toFixed(decimalPlaces)} SOL`
            : "n/a - connect wallet"}
        </p>
      </div>
      <button
        onClick={onPay}
        disabled={
          isLoading ||
          creditAmount === 0 ||
          (!isWalletConnected ? false : !isValid || !hasEnoughSol)
        }
        className={`w-full py-2 px-4 rounded-md font-medium text-white ${
          isLoading ||
          creditAmount === 0 ||
          (!isWalletConnected ? false : !isValid || !hasEnoughSol)
            ? "bg-zinc-400 dark:bg-zinc-600 cursor-not-allowed"
            : "bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-500 cursor-pointer"
        }`}
      >
        {isLoading
          ? "Processing..."
          : creditAmount === 0
            ? "Select Credits"
            : isWalletConnected
              ? "Pay Now"
              : "Connect Wallet"}
      </button>
      {isWalletConnected && (
        <div className="text-center mt-2 flex items-center justify-center gap-2">
          <Square
            className="h-4 w-4"
            fill={isWalletConnected ? "#22c55e" : "#ef4444"}
          />
          <button
            onClick={onChangeWallet}
            className="text-sm text-blue-500 dark:text-blue-400 hover:underline"
          >
            Change Wallet
          </button>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useMemo, useCallback, useEffect, Dispatch, SetStateAction } from "react";
import { toast } from "sonner";
import CreditSliderUI from "./credit-slider-ui";
import { useSolanaTransaction } from "@/hooks/useSolanaTransaction";
import { useCreditAssignment } from "@/hooks/useCreditAssignment";
import { VERAFY_WALLET } from "@/lib/solana-constants";
import { QUERY_COST, QUERY_COST_FIXED_DECIMALS } from "@/lib/constants";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction, Connection, SendTransactionError } from "@solana/web3.js";
import { WalletSignTransactionError } from "@solana/wallet-adapter-base";

interface CreditSliderProps {
  creditBalance: number | null;
  setCreditBalance: Dispatch<SetStateAction<number | null>>;
}

export default function CreditSlider({creditBalance, setCreditBalance}: CreditSliderProps) {
  const [creditAmount, setCreditAmount] = useState(10);
  const { publicKey, signTransaction, connected: isWalletConnected, disconnect } = useWallet();
  const {
    sendTransaction,
    isSending,
    error: txError,
  } = useSolanaTransaction(
    publicKey,
    signTransaction
      ? (tx: Transaction) => signTransaction(tx)
      : null
  );
  const {
    assignCredits,
    isAssigning,
    error: assignError,
  } = useCreditAssignment();
  const { setVisible } = useWalletModal();

  // State for solBalance
  const [solBalance, setSolBalance] = useState<number | null>(null);

  console.log(`NEXT_PUBLIC_CURRENT_SOLANA_NETWORK_NAME ${process.env.NEXT_PUBLIC_CURRENT_SOLANA_NETWORK_NAME}`);
  console.log(`NEXT_PUBLIC_DEVNET_SOLANA_NETWORK_RPC ${process.env.NEXT_PUBLIC_DEVNET_SOLANA_NETWORK_RPC}`);

  // Fetch SOL balance when wallet is connected
  useEffect(() => {
    const fetchSolBalance = async () => {
      if (!publicKey) {
        setSolBalance(null);
        return;
      }
      try {
        const connection = new Connection("https://api.devnet.solana.com", "confirmed");
        const balanceInLamports = await connection.getBalance(publicKey);
        const balanceInSol = balanceInLamports / 1_000_000_000; // Convert lamports to SOL
        setSolBalance(balanceInSol);
        if (process.env.NODE_ENV === "development") {
          console.log("Fetched solBalance:", balanceInSol);
        }
      } catch (error) {
        console.error("Error fetching SOL balance:", error);
        setSolBalance(0);
      }
    };

    fetchSolBalance();
  }, [publicKey]);

  const requiredSol = creditAmount * QUERY_COST;
  const hasEnoughSol = solBalance !== null && solBalance >= requiredSol;
  const isValid =
    creditAmount >= 1 && creditAmount <= 100 && Number.isInteger(creditAmount);

  // Debug log to confirm QUERY_COST_FIXED_DECIMALS and button state
  if (process.env.NODE_ENV === "development") {
    console.log({
      QUERY_COST,
      QUERY_COST_FIXED_DECIMALS,
      creditAmount,
      requiredSol,
      solBalance,
      hasEnoughSol,
      isValid,
      isLoading: isSending || isAssigning,
      isWalletConnected,
    });
  }

  const handlePayment = useCallback(async () => {
    if (!isWalletConnected) {
      setVisible(true);
      toast.error("Please connect your wallet to proceed.");
      return;
    }
    if (!isValid) {
      toast.error("Credits must be a whole number between 1 and 100");
      return;
    }
    if (!hasEnoughSol) {
      toast.error(
        `Insufficient SOL: Need ${requiredSol.toFixed(QUERY_COST_FIXED_DECIMALS)}, have ${solBalance?.toFixed(QUERY_COST_FIXED_DECIMALS) ?? "0"}`,
      );
      return;
    }
    if (!publicKey || !signTransaction) {
      setVisible(true);
      toast.error("Wallet not fully connected. Please reconnect and try again.");
      return;
    }

    const attemptTransaction = async (): Promise<boolean> => {
      console.log(
        `Initiating transaction for ${creditAmount} credits to ${VERAFY_WALLET}`,
        { creditAmount, recipient: VERAFY_WALLET, requiredSol, walletPublicKey: publicKey.toBase58() }
      );

      // Debug wallet state before transaction
      if (process.env.NODE_ENV === "development") {
        console.log("Wallet state before transaction:", {
          publicKey: publicKey.toBase58(),
          signTransactionAvailable: !!signTransaction,
          isWalletConnected,
        });
      }

      // Check VERAFY_WALLET initialization
      try {
        const connection = new Connection("https://api.devnet.solana.com", "confirmed");
        const verafyBalance = await connection.getBalance(new PublicKey(VERAFY_WALLET));
        console.log("VERAFY_WALLET initialization:", {
          address: VERAFY_WALLET,
          balanceInSol: verafyBalance / 1_000_000_000,
        });
        if (verafyBalance === 0) {
          toast.error("Recipient wallet (VERAFY_WALLET) is not initialized. Contact support.");
          return false;
        }
      } catch (error) {
        console.error("Error checking VERAFY_WALLET initialization:", error);
        toast.error("Failed to verify recipient wallet. Please try again.");
        return false;
      }

      try {
        const result = await sendTransaction(
          creditAmount,
          new PublicKey(VERAFY_WALLET),
        );
        console.log("Transaction result:", {
          signature: result.signature,
          signedTx: result.signedTx ? "Transaction" : "null",
          publicKey: publicKey?.toString(),
        });

        if (result.signature && result.signedTx && publicKey) {
          console.log(
            "Transaction sent, assigning credits with signature:",
            result.signature,
          );
          const newBalance = await assignCredits(
            result.signature,
            result.signedTx,
            creditAmount,
            publicKey,
          );
          setCreditBalance(newBalance.credits ?? 0); // Extract credits
          toast.success(`Successfully purchased ${creditAmount} credits!`);
          return true;
        } else {
          console.error("Missing transaction data:", {
            signature: result.signature ?? "undefined",
            signedTx: result.signedTx ? "Transaction" : "null",
            publicKey: publicKey?.toString() ?? "undefined",
          });
          return false;
        }
      } catch (error: unknown) {
        console.error("Transaction failed:", error);
        if (error instanceof Error) {
          if (error instanceof WalletSignTransactionError) {
            console.error("WalletSignTransactionError details:", {
              message: error.message,
              name: error.name,
            });
            toast.error(
              "Wallet signing failed: Ensure your wallet (e.g., Phantom) is open, unlocked, set to Devnet, and approve the transaction.",
            );
          } else if (error instanceof SendTransactionError) {
            console.error("SendTransactionError details:", {
              message: error.message,
              logs: error.logs,
            });
            toast.error(`Transaction failed: ${error.message}. Check console for logs.`);
          } else {
            console.error("Generic error details:", {
              message: error.message,
              name: error.name,
            });
            toast.error(`Transaction failed: ${error.message}. Please try again.`);
          }
        } else {
          toast.error("Transaction failed: Unknown error. Please try again.");
        }
        return false;
      }
    };

    // Execute transaction
    const success = await attemptTransaction();
    if (!success) {
      toast.error("Transaction failed. Please ensure your wallet is set to Devnet and try again.");
    }
  }, [
    isWalletConnected,
    isValid,
    hasEnoughSol,
    publicKey,
    signTransaction,
    creditAmount,
    solBalance,
    requiredSol,
    sendTransaction,
    assignCredits,
    setCreditBalance,
    setVisible,
  ]);

  const handleChangeWallet = async () => {
    await disconnect();
    setVisible(true);
  };

  useMemo(() => {
    if (txError) toast.error(txError);
    if (assignError) toast.error(assignError);
  }, [txError, assignError]);

  return (
    <CreditSliderUI
      creditAmount={creditAmount}
      setCreditAmount={setCreditAmount}
      requiredSol={requiredSol}
      creditBalance={creditBalance}
      solBalance={solBalance}
      isLoading={isSending || isAssigning}
      isValid={isValid}
      hasEnoughSol={hasEnoughSol}
      isWalletConnected={isWalletConnected}
      onPay={handlePayment}
      onChangeWallet={handleChangeWallet}
      decimalPlaces={QUERY_COST_FIXED_DECIMALS}
    />
  );
}


"use client";

// import { useEffect } from "react";
import CreditSlider from "@/components/credits/credit-slider";
import StakeSlider from "@/components/credits/stake-slider";
// import { useCreditsStore } from "@/store/credit-store";
// import { useWallet } from "@solana/wallet-adapter-react";
import { Landmark } from "lucide-react";
import { useCreditBalance } from "@/hooks/useCreditBalance";

export function CreditsLayout() {
  // const { savedCredits, fetchSavedCredits } = useCreditsStore();
  // const { publicKey } = useWallet();
  const { creditBalance, setCreditBalance } = useCreditBalance();

  // Fetch saved credits when the page loads or publicKey changes
  // useEffect(() => {
  //   fetchSavedCredits(publicKey);
  // }, [publicKey, fetchSavedCredits, savedCredits]);

  return (
    <div className="w-full md-round max-w-4xl mx-auto p-6 dark:bg-zinc-950 dark:border-zinc-700">
      <h1 className="text-4xl font-bold text-center text-zinc-800 dark:text-zinc-200 mb-4">
        Get Credits
      </h1>
      <div className="flex text-xl font-semibold text-center text-zinc-700 dark:text-zinc-300 mb-8">
        <div className="flex flex-col  w-full justify-center">
          <div className="flex justify-center">
            <Landmark />{" "}
            <span className="ml-2">Balance: {creditBalance} Credits</span>
          </div>
          <div className="text-xs mt-1 text-zinc-300 dark:text-zinc-600">
            Paid Credits
          </div>
        </div>
      </div>
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 p-4 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-sm">
          <CreditSlider creditBalance={creditBalance} setCreditBalance={setCreditBalance}/>
        </div>
        <div className="flex-1 p-4 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-sm">
          <StakeSlider />
        </div>
      </div>
    </div>
  );
}



components/credits/stake-slider.tsx


"use client";

import { useState } from "react";
import * as Slider from "@radix-ui/react-slider";
import { Layers, Square } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { QUERY_COST } from "@/lib/constants";

export default function StakeSlider() {
  const [stakeAmount, setStakeAmount] = useState(0);
  const { connected: isWalletConnected } = useWallet();

  const stakeSol = stakeAmount * QUERY_COST;

  const onChangeWallet = () => {
    // Implement wallet change logic here
    console.log("Changing wallet");
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-zinc-200 dark:bg-zinc-800 rounded-lg shadow-md">
      <div className="flex flex-col w-full text-center justify-center items-center mx-auto">
        <div className="flex justify-center items-center mb-2">
          {" "}
          <Layers size={22} />
          <h2 className="w-full text-2xl font-semibold ml-2 text-zinc-900 dark:text-zinc-100">
            Stake for Credits
          </h2>
        </div>
        <div className="flex text-center mb-6">
            <span className="text-5xl font-bold text-zinc-900 dark:text-zinc-100">
              {stakeAmount}
            </span>
          </div>
      </div>
      <div className="mb-6">
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
          Select Stake Amount
        </label>
        <div className="relative">
          <Slider.Root
            className="relative flex items-center select-none touch-none w-full h-5"
            value={[stakeAmount]}
            onValueChange={(value) => setStakeAmount(value[0])}
            min={0}
            max={100}
            step={1}
          >
            <Slider.Track className="bg-zinc-300 dark:bg-zinc-600 relative grow rounded-full h-1">
              <Slider.Range className="absolute bg-blue-500 dark:bg-blue-400 rounded-full h-full" />
            </Slider.Track>
            <Slider.Thumb
              className="block w-5 h-5 bg-blue-500 dark:bg-blue-400 rounded-full hover:bg-blue-600 dark:hover:bg-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              aria-label="Stake Amount"
            />
          </Slider.Root>
          <div className="flex justify-between mt-2 text-sm text-zinc-700 dark:text-zinc-300">
            <span>Min. (0)</span>
            <span>Max. (100)</span>
          </div>
        </div>
      </div>
      <div className="mb-6">
        <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
          Stake: {stakeSol.toFixed(3)} SOL
        </p>
      </div>
      <p className="mb-4 text-sm text-zinc-700 dark:text-zinc-300">
        Current Staked SOL: 0 SOL
      </p>
      <button
        disabled={true}
        className="w-full py-2 px-4 rounded-md font-medium text-white bg-zinc-400 dark:bg-zinc-600 cursor-not-allowed"
      >
        Stake Now
      </button>
      {isWalletConnected && (
        <div className="text-center mt-2 flex items-center justify-center gap-2">
          <Square
            className="h-4 w-4"
            fill={isWalletConnected ? "#22c55e" : "#ef4444"}
          />
          <button
            onClick={onChangeWallet}
            className="text-sm text-blue-500 dark:text-blue-400 hover:underline"
          >
            Change Wallet
          </button>
        </div>
      )}
    </div>
  );
}


components/ask/wallet-toggle.tsx



"use client";

import { useCallback } from "react";
import { Switch } from "@/components/ui/switch";
import { PaymentControls } from "@/components/ask/payment-controls";
import { QUERY_COST, QUERY_COST_FIXED_DECIMALS } from "@/lib/constants";

interface WalletToggleProps {
  payWithWallet: boolean;
  setPayWithWallet: (value: boolean) => void;
  queriesCostTotal: number;
  userCreditsTotal: number;
  userFreeCredits: number;
  userPaidCredits: number;
  queriesRequested: number;
  queriesUnpaid: number;
  highlightPayButton?: boolean;
  context?: "scrollbar" | "default";
}

export default function WalletToggle({
  payWithWallet,
  setPayWithWallet,
  queriesCostTotal,
  userCreditsTotal,
  userFreeCredits,
  userPaidCredits,
  queriesRequested,
  queriesUnpaid,
  highlightPayButton = false,
  context = "default",
}: WalletToggleProps) {
  const handleCheckedChange = useCallback(
    (checked: boolean) => {
      setPayWithWallet(checked);
    },
    [setPayWithWallet]
  );

  const queriesLeft = Math.max(0, userCreditsTotal - queriesRequested);
  const displayUnpaid = Math.max(0, queriesUnpaid);

  return (
    <div className={`flex items-center justify-between ${context === "default" ? "mb-3" : "mb-1"} `}>
      <div className="flex items-center gap-3 flex-wrap">
        {context !== "scrollbar" && (
          <div className="flex items-center gap-3 hidden md:flex">
            <Switch
              checked={payWithWallet}
              onCheckedChange={handleCheckedChange}
              className="switch data-[state=checked]:bg-[#46BBA6]"
            />
            <span className="font-medium text-gray-500 dark:text-gray-400">
              Pay ({(queriesCostTotal * QUERY_COST).toFixed(QUERY_COST_FIXED_DECIMALS)} SOL)
            </span>
          </div>
        )}
        {payWithWallet && (
          <PaymentControls
            queriesCostTotal={queriesCostTotal}
            userCreditsTotal={userCreditsTotal}
            userFreeCredits={userFreeCredits}
            userPaidCredits={userPaidCredits}
            queriesUnpaid={displayUnpaid}
            highlightPayButton={highlightPayButton}
          />
        )}
        {!payWithWallet && (
          <div className="md:flex items-center gap-2 hidden">
            <span className="text-gray-700 dark:text-zinc-400">Credits left</span>
            <span className="bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full text-zinc-700 dark:text-zinc-300">
              {queriesLeft}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

components/ask/navbar-credits.tsx


"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";
import { LoadingSpinner } from "@/components/loading-spinner-new"; // Import LoadingSpinner
import { Coins } from "lucide-react";

export default function NavbarCredits() {
  const { publicKey } = useWallet();
  const [paidCredits, setPaidCredits] = useState<number | null>(null);
  const BALANCE_API_ENDPOINT = "/api/credits/balance";

  useEffect(() => {
    const fetchPaidCredits = async () => {
      // Exit if no wallet is connected
      if (!publicKey) {
        setPaidCredits(null);
        return;
      }
      try {
        // Fetch balance from server
        const response = await fetch(BALANCE_API_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            walletPublicKey: publicKey.toBase58(),
          }),
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMsg =
            errorData.error || response.statusText || "Unknown error";
          console.error("Failed to fetch paid credits:", errorMsg);
          setPaidCredits(0);
          return;
        }
        const data = await response.json();
        console.log("Fetched paid credits:", data); // Debug log
        // Use paidCredits if available, fallback to credits
        setPaidCredits(data.paidCredits ?? data.credits ?? 0);
      } catch (error) {
        console.error("Error fetching paid credits:", error);
        setPaidCredits(0);
      }
    };

    fetchPaidCredits();
  }, [publicKey]);

  // Don't render if no wallet is connected
  if (!publicKey) {
    return null;
  }

  return (
    <div className="flex items-center text-md text-zinc-600 dark:text-zinc-300">
      <Link href="/credits/">
        <div className="flex items-center ">
          <Coins size={16}/> <span className="mx-2">Paid Credits:</span>
          <span className="text-sky-700 dark:text-sky-300 bg-zinc-200 dark:bg-zinc-700 ml-1 px-2 py-1 rounded-md">
            {paidCredits !== null ? (
              paidCredits
            ) : (
              <>
                {console.log("Rendering LoadingSpinner for credits fetch")}{" "}
                {/* Debug log */}
                <LoadingSpinner
                  noWrapper
                  type="pulse"
                  color="#d946ef"
                  size={5}
                  message={""} // No message to keep it compact
                />
              </>
            )}
          </span>
        </div>
      </Link>
    </div>
  );
}




"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import {
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useCreditsStore } from "@/store/credit-store";
import { QUERY_COST, QUERY_COST_FIXED_DECIMALS } from "@/lib/constants";

interface PaymentControlsProps {
  queriesCostTotal: number;
  userCreditsTotal: number;
  userFreeCredits: number;
  userPaidCredits: number;
  queriesUnpaid: number;
  highlightPayButton?: boolean;
}

export function PaymentControls({
  queriesCostTotal,
  highlightPayButton = false,
}: PaymentControlsProps) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [isProcessing, setIsProcessing] = useState(false);
  const { resetCreditsAfterPayment, displayUnpaid, hasPaid, setHasPaid } = useCreditsStore();

  const PAYMENT_RECEIVER_ADDRESS =
    process.env.NEXT_PUBLIC_PAYMENT_RECEIVER_ADDRESS;
  if (!PAYMENT_RECEIVER_ADDRESS) {
    throw new Error(
      "NEXT_PUBLIC_PAYMENT_RECEIVER_ADDRESS environment variable is not set",
    );
  }
  const PAYMENT_RECIPIENT = new PublicKey(PAYMENT_RECEIVER_ADDRESS);
  const PAYMENT_AMOUNT = Math.floor(queriesCostTotal * QUERY_COST * LAMPORTS_PER_SOL);

  const handlePayment = async () => {
    if (!publicKey || !sendTransaction) {
      toast.error("Please connect your wallet first", {
        style: { background: "#fee2e2", color: "#dc2626" },
      });
      return;
    }

    setIsProcessing(true);
    try {
      console.log("Payment inputs:", {
        queriesCostTotal,
        QUERY_COST,
        LAMPORTS_PER_SOL,
        PAYMENT_AMOUNT,
        publicKey: publicKey.toBase58(),
        displayUnpaid,
        hasPaid,
      });

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: PAYMENT_RECIPIENT,
          lamports: PAYMENT_AMOUNT,
        }),
      );

      const { blockhash } = await connection.getLatestBlockhash("confirmed");
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, "confirmed");

      setHasPaid(true);
      resetCreditsAfterPayment();
      console.log("Payment successful, queriesCostTotal:", queriesCostTotal, "userCreditsTotal:", useCreditsStore.getState().userCreditsTotal, "hasPaid:", useCreditsStore.getState().hasPaid);
      toast.success(`Payment of ${queriesCostTotal} credits (${(queriesCostTotal * QUERY_COST).toFixed(QUERY_COST_FIXED_DECIMALS)} SOL) completed! Credits reset to 0.`, {
        style: { background: "#dcfce7", color: "#16a34a" },
      });
    } catch (error: unknown) {
      console.error("Payment failed:", error);
      let errorMessage = "Payment failed. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message.includes("insufficient funds")
          ? "Insufficient SOL in wallet"
          : error.message.includes("blockhash")
          ? "Transaction expired, please try again"
          : error.message.includes("BigInt")
          ? "Invalid payment amount, please try again"
          : errorMessage;
      }
      toast.error(errorMessage, {
        style: { background: "#fee2e2", color: "#dc2626" },
      });
    } finally {
      setIsProcessing(false);
    }
  };

  console.log("PaymentControls render state:", {
    hasPaid,
    displayUnpaid,
    isProcessing,
    publicKey: publicKey?.toBase58() || "none",
    PAYMENT_AMOUNT,
  });

  return (
    <>
      {!hasPaid && displayUnpaid > 0 && (
        <>
          <WalletMultiButton
            style={{
              backgroundColor: "#e5e7eb",
              color: "#111827",
              padding: "10px 12px",
              borderRadius: "0.375rem",
              fontSize: "0.95rem",
              fontWeight: "normal",
              height: "2rem",
              margin: "0 0rem",
              border: "1px solid #d1d5db",
            }}
          />
          <button
            type="button"
            onClick={handlePayment}
            disabled={!publicKey || hasPaid || isProcessing || displayUnpaid <= 0}
            className={`px-4 py-[6px] rounded-sm focus:outline-none focus:ring-2
              focus:ring-offset-2 focus:ring-gray-500 flex items-center text-sm border ${
              highlightPayButton
                ? "bg-green-500 text-white hover:bg-green-600 cursor-pointer"
                : !publicKey || hasPaid || isProcessing || displayUnpaid <= 0
                  ? "bg-gray-200 text-zinc-900 cursor-not-allowed"
                  : "bg-blue-500 text-white hover:bg-blue-500 cursor-pointer"
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              `Pay ${(queriesCostTotal * QUERY_COST).toFixed(QUERY_COST_FIXED_DECIMALS)} Dev SOL`
            )}
          </button>
        </>
      )}
    </>
  );
}



hooks/useCreditAssignment.tsx
import { useCallback, useState } from "react";
import { PublicKey, Transaction } from "@solana/web3.js";

export const useCreditAssignment = () => {
  const [isAssigning, setIsAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);

  // Fetch CSRF token
  const fetchCsrfToken = useCallback(async () => {
    try {
      const response = await fetch("/api/csrf-token", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch CSRF token");
      }
      const data = await response.json();
      console.log("Fetched CSRF token:", { csrfToken: data.csrfToken });
      setCsrfToken(data.csrfToken);
      return data.csrfToken;
    } catch (err) {
      console.error("Error fetching CSRF token:", err);
      throw err;
    }
  }, []);

  const assignCredits = useCallback(
    async (
      signature: string,
      signedTx: Transaction,
      creditAmount: number,
      walletPublicKey: PublicKey,
    ) => {
      setIsAssigning(true);
      setError(null);
      try {
        // Fetch CSRF token if not cached
        const token = csrfToken || (await fetchCsrfToken());

        console.log("Sending request to /api/credits/assign with CSRF token:", { token });

        const response = await fetch("/api/credits/assign", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": token, // Include CSRF token in header
          },
          credentials: "include", // Ensure cookies are sent
          body: JSON.stringify({
            walletPublicKey: walletPublicKey.toBase58(),
            creditAmount,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Failed to assign credits");
        }

        console.log("Credit assignment response:", {
          credits: data.credits,
          unpaidQueries: data.unpaidQueries,
        });

        setIsAssigning(false);
        return { credits: data.credits, unpaidQueries: data.unpaidQueries }; // Return credits and unpaidQueries
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        console.error("Credit assignment failed:", { error: err, message: errorMessage });
        setError(errorMessage);
        setIsAssigning(false);
        throw err;
      }
    },
    [csrfToken, fetchCsrfToken],
  );

  return { assignCredits, isAssigning, error };
};


hooks/useCreditBalance.tsx


"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { toast } from "sonner";

export const useCreditBalance = () => {
  const { publicKey } = useWallet();
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const BALANCE_API_ENDPOINT = "/api/credits/balance";

  useEffect(() => {
    const fetchCreditBalance = async () => {
      // Exit if no wallet is connected
      if (!publicKey) {
        setCreditBalance(null);
        return;
      }
      try {
        // Fetch balance from server
        const response = await fetch(BALANCE_API_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            walletPublicKey: publicKey.toBase58(),
          }),
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMsg =
            errorData.error || response.statusText || "Unknown error";
          toast.error(`Failed to fetch credit balance: ${errorMsg}`);
          console.error("Failed to fetch credit balance:", errorMsg);
          setCreditBalance(0);
          return;
        }
        const data = await response.json();
        console.log("Fetched credit balance:", data.credits); // Debug log
        setCreditBalance(data.credits || 0);
      } catch (error) {
        // Handle unexpected errors
        const errorMsg =
          error instanceof Error ? error.message : "Unknown error";
        toast.error(`Error fetching credit balance: ${errorMsg}`);
        console.error("Error fetching credit balance:", error);
        setCreditBalance(0);
      }
    };

    fetchCreditBalance();
  }, [publicKey]);

  return { creditBalance, setCreditBalance };
};




hooks/useSolanaTransaction.tsx

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



hooks/useSolanaWallet.tsx

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
import { QUERY_COST } from "@/lib/constants";

// Utility to sanitize error messages for safe logging
const sanitizeError = (error: unknown): string => {
  if (error instanceof SendTransactionError) {
    return `Transaction failed: ${error.message}`;
  } else if (error instanceof WalletSignTransactionError) {
    return `Wallet approval failed: ${error.message}`;
  } else if (error instanceof Error) {
    return `Error: ${error.message}`;
  }
  return "Unknown error occurred";
};

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
          // Create and configure transaction
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
              lamports: Math.round(credits * QUERY_COST * 1_000_000_000), // CREDIT_PRICE_SOL * LAMPORTS_PER_SOL
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
        } catch (transactionError) {
          lastError = transactionError;
          if (transactionError instanceof SendTransactionError) {
            console.error(sanitizeError(transactionError));
            setError(`Transaction failed: ${transactionError.message}`);
          } else if (transactionError instanceof WalletSignTransactionError) {
            console.error(sanitizeError(transactionError));
            setError("Wallet approval denied");
          } else {
            console.error(sanitizeError(transactionError));
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



import { create } from "zustand";
import { DEFAULTS } from "@/lib/types";
import { PublicKey } from "@solana/web3.js";

interface CreditsStore {
  userFreeCredits: number;
  userPaidCredits: number;
  userCreditsTotal: number;
  savedCredits: number | null;
  queriesUnpaid: number;
  queriesCostTotal: number;
  totalCredits: number;
  displayUnpaid: number;
  hasPaid: boolean;
  decrementFreeCredits: (amount: number) => void;
  decrementPaidCredits: (amount: number) => void;
  incrementPaidCredits: (amount: number) => void;
  resetCreditsAfterPayment: () => void;
  setUserCreditsTotal: (credits: number) => void;
  setQueriesUnpaid: (queries: number) => void;
  setQueriesCostTotal: (cost: number) => void;
  setHasPaid: (paid: boolean) => void;
  fetchSavedCredits: (publicKey: PublicKey | null) => Promise<void>;
}

export const useCreditsStore = create<CreditsStore>((set, get) => ({
  userFreeCredits: DEFAULTS.USER_FREE_CREDITS,
  userPaidCredits: DEFAULTS.USER_PAID_CREDITS,
  userCreditsTotal: DEFAULTS.USER_FREE_CREDITS + DEFAULTS.USER_PAID_CREDITS,
  savedCredits: null,
  queriesUnpaid: 0,
  queriesCostTotal: 0,
  totalCredits: DEFAULTS.USER_FREE_CREDITS + DEFAULTS.USER_PAID_CREDITS,
  displayUnpaid: 0,
  hasPaid: false,

  decrementFreeCredits: (amount: number) =>
    set((state) => {
      const newFreeCredits = Math.max(0, state.userFreeCredits - amount);
      const newUserCreditsTotal = newFreeCredits + state.userPaidCredits;
      const newTotalCredits = (state.savedCredits ?? 0) + newUserCreditsTotal;
      const newState = {
        userFreeCredits: newFreeCredits,
        userCreditsTotal: newUserCreditsTotal,
        totalCredits: newTotalCredits,
        displayUnpaid: state.hasPaid ? 0 : Math.max(0, state.queriesUnpaid),
      };
      console.log("decrementFreeCredits: Updated state:", { ...newState, previousHasPaid: state.hasPaid });
      return newState;
    }),

  decrementPaidCredits: (amount: number) =>
    set((state) => {
      const newPaidCredits = Math.max(0, state.userPaidCredits - amount);
      const newUserCreditsTotal = state.userFreeCredits + newPaidCredits;
      const newTotalCredits = (state.savedCredits ?? 0) + newUserCreditsTotal;
      const newState = {
        userPaidCredits: newPaidCredits,
        userCreditsTotal: newUserCreditsTotal,
        totalCredits: newTotalCredits,
        displayUnpaid: state.hasPaid ? 0 : Math.max(0, state.queriesUnpaid),
      };
      console.log("decrementPaidCredits: Updated state:", { ...newState, previousHasPaid: state.hasPaid });
      return newState;
    }),

  incrementPaidCredits: (amount: number) =>
    set((state) => {
      const newPaidCredits = state.userPaidCredits + amount;
      const newUserCreditsTotal = state.userFreeCredits + newPaidCredits;
      const newTotalCredits = (state.savedCredits ?? 0) + newUserCreditsTotal;
      const newState = {
        userPaidCredits: newPaidCredits,
        userCreditsTotal: newUserCreditsTotal,
        totalCredits: newTotalCredits,
        displayUnpaid: state.hasPaid ? 0 : Math.max(0, state.queriesUnpaid),
      };
      console.log("incrementPaidCredits: Updated state:", { ...newState, previousHasPaid: state.hasPaid });
      return newState;
    }),

  resetCreditsAfterPayment: () =>
    set((state) => {
      const newTotalCredits = state.savedCredits ?? 0;
      const newState = {
        userFreeCredits: 0,
        userPaidCredits: 0,
        userCreditsTotal: 0,
        queriesUnpaid: 0,
        queriesCostTotal: 0,
        totalCredits: newTotalCredits,
        displayUnpaid: 0,
        hasPaid: true,
      };
      console.log("resetCreditsAfterPayment: Updated state:", { ...newState, previousHasPaid: state.hasPaid });
      return newState;
    }),

  setUserCreditsTotal: (credits) =>
    set((state) => {
      const newUserCreditsTotal = credits;
      const newTotalCredits = (state.savedCredits ?? 0) + newUserCreditsTotal;
      const newState = {
        userCreditsTotal: newUserCreditsTotal,
        totalCredits: newTotalCredits,
        displayUnpaid: state.hasPaid ? 0 : Math.max(0, state.queriesUnpaid),
      };
      console.log("setUserCreditsTotal: Updated state:", { ...newState, previousHasPaid: state.hasPaid });
      return newState;
    }),

  setQueriesUnpaid: (queries) =>
    set((state) => {
      const newQueriesCostTotal = queries; // 1 credit per query
      const newState = {
        queriesUnpaid: queries,
        queriesCostTotal: newQueriesCostTotal,
        displayUnpaid: state.hasPaid ? 0 : Math.max(0, queries),
      };
      console.log("setQueriesUnpaid: Updated state:", { ...newState, previousHasPaid: state.hasPaid });
      return newState;
    }),

  setQueriesCostTotal: (cost) =>
    set((state) => {
      const newState = {
        queriesCostTotal: cost,
        queriesUnpaid: cost, // 1 credit per query
        displayUnpaid: state.hasPaid ? 0 : Math.max(0, cost),
      };
      console.log("setQueriesCostTotal: Updated state:", { ...newState, previousHasPaid: state.hasPaid });
      return newState;
    }),

  setHasPaid: (paid) =>
    set((state) => {
      const newState = {
        hasPaid: paid,
        displayUnpaid: paid ? 0 : Math.max(0, state.queriesUnpaid),
      };
      console.log("setHasPaid: Updated state:", { ...newState, previousHasPaid: state.hasPaid });
      return newState;
    }),

  fetchSavedCredits: async (publicKey) => {
    const currentState = get();
    if (!publicKey) {
      const newTotalCredits = currentState.userCreditsTotal;
      const newState = {
        savedCredits: null,
        totalCredits: newTotalCredits,
        displayUnpaid: currentState.hasPaid ? 0 : Math.max(0, currentState.queriesUnpaid),
      };
      console.log("fetchSavedCredits: No publicKey, updated state:", { ...newState, previousHasPaid: currentState.hasPaid });
      set(newState);
      return;
    }
    try {
      const response = await fetch("/api/credits/balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletPublicKey: publicKey.toBase58() }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.error || response.statusText || "Unknown error";
        console.error("Failed to fetch saved credits:", errorMsg);
        const newTotalCredits = currentState.userCreditsTotal;
        const newState = {
          savedCredits: 0,
          totalCredits: newTotalCredits,
          displayUnpaid: currentState.hasPaid ? 0 : Math.max(0, currentState.queriesUnpaid),
        };
        console.log("fetchSavedCredits: API failure, updated state:", { ...newState, previousHasPaid: currentState.hasPaid });
        set(newState);
        return;
      }
      const data = await response.json();
      console.log("Fetched saved credits for store:", data);
      const newTotalCredits = (data.credits ?? 0) + currentState.userCreditsTotal;
      const newState = {
        savedCredits: data.credits ?? 0,
        totalCredits: newTotalCredits,
        displayUnpaid: currentState.hasPaid ? 0 : Math.max(0, currentState.queriesUnpaid),
      };
      console.log("fetchSavedCredits: Success, updated state:", { ...newState, previousHasPaid: currentState.hasPaid });
      set(newState);
    } catch (error) {
      console.error("Error fetching saved credits:", error);
      const newTotalCredits = currentState.userCreditsTotal;
      const newState = {
        savedCredits: 0,
        totalCredits: newTotalCredits,
        displayUnpaid: currentState.hasPaid ? 0 : Math.max(0, currentState.queriesUnpaid),
      };
      console.log("fetchSavedCredits: Error, updated state:", { ...newState, previousHasPaid: currentState.hasPaid });
      set(newState);
    }
  },
}));

lib/constants.ts

// Solana Network Configuration
// Constants for configuring the Solana network (Devnet or Mainnet) based on environment variables
export const CURRENT_SOLANA_NETWORK_NAME =
  process.env.NEXT_PUBLIC_CURRENT_SOLANA_NETWORK_NAME;
export const DEV_SOLANA_NETWORK_RPC = process.env.NEXT_PUBLIC_DEVNET_SOLANA_NETWORK_RPC;
export const MAINNET_SOLANA_NETWORK_RPC =
  process.env.NEXT_PUBLIC_MAINNET_SOLANA_NETWORK_RPC;
export const CURRENT_SOLANA_NETWORK_RPC =
  CURRENT_SOLANA_NETWORK_NAME === "Devnet"
    ? DEV_SOLANA_NETWORK_RPC
    : MAINNET_SOLANA_NETWORK_RPC;

// Credits and Queries
// Constants for managing credits, query costs, and query limits in the application
export const QUERY_COST = 0.00001; // SOL per credit

// Calculate the number of decimal places in QUERY_COST for display
const getDecimalPlaces = (num: number): number => {
  if (!Number.isFinite(num)) return 0;
  const str = num.toFixed(20).replace(/\.?0+$/, ""); // Handle scientific notation and trailing zeros
  const decimalIndex = str.indexOf(".");
  return decimalIndex === -1 ? 0 : str.length - decimalIndex - 1;
};

export const QUERY_COST_FIXED_DECIMALS = getDecimalPlaces(QUERY_COST); // Derived from QUERY_COST
export const USER_FREE_CREDITS_DEFAULT = 10;
export const USER_PAID_CREDITS_DEFAULT = 0;
export const QUERIES_REQUESTED_DEFAULT = 4;
export const USER_CREDIT_CONVERSION_DEFAULT = 1;
export const QUERIES_COST_EACH_DEFAULT = 1;
export const ALLOWED_AMOUNT_QUERIES = 20;
export const INITIAL_AVAILABLE_QUERIES = USER_FREE_CREDITS_DEFAULT; // Initial queries available, matches USER_FREE_CREDITS_DEFAULT
export const INITIAL_AI_QUERY_AMOUNT_REQUESTED = QUERIES_REQUESTED_DEFAULT; // Default AI query amount, matches QUERIES_REQUESTED_DEFAULT

// Voting Outcomes
// Constants for representing possible voting results
export const VOTE_YES = "YES";
export const VOTE_NO = "NO";
export const VOTE_ERROR = "ERROR";

export const MAX_VOTE_HISTORY_RESULTS = 300;
export const RECENT_HISTORY_RESULTS = 50;
export const RESULT_QUERIES_CARDS = 12;

export const EXPORT_MAX_VALIDATORS = 20;

"use client";

import { useCallback, useState, useEffect } from "react";
import { useCreditsStore } from "@/store/credit-store";
import { useQueryStore } from "@/store/query-store";
import { useVoteStore } from "@/store/vote-store";
import { useBroadcastQuery } from "@/hooks/useBroadcastQuery";
import { Dispatch, SetStateAction } from "react";
import { getPlaceholderText } from "@/lib/query-utils";
import { toast } from "sonner";
import type { VoteResult } from "@/lib/types";
import { ALLOWED_AMOUNT_QUERIES } from "@/lib/constants";
import { sanitizeQueryText } from "@/utils/security-utils";

interface UseQueryLogicProps {
  payWithWallet: boolean;
  setPayWithWallet: Dispatch<SetStateAction<boolean>>;
}

export function useQueryLogic({
  payWithWallet,
  setPayWithWallet,
}: UseQueryLogicProps) {
  const [queryText, setQueryText] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    userFreeCredits,
    userPaidCredits,
    userCreditsTotal,
    hasPaid: storeHasPaid,
  } = useCreditsStore();
  const {
    queriesRequested,
    queriesUnpaid,
    queriesCostTotal,
    queryMode,
    viewMode,
    setQueriesRequested,
    setQueryMode,
    resetAfterSubmission,
  } = useQueryStore();
  const { voteHistory, lastVoteResult, setVoteHistory, setLastVoteResult } =
    useVoteStore();

  const placeholderText = getPlaceholderText(queryMode);

  // Log queryMode on hook initialization
  console.log("[useQueryLogic] Initial queryMode:", queryMode);

  // Fetch CSRF token dynamically
  const fetchCsrfToken = async (): Promise<string> => {
    console.log("[useQueryLogic] Starting CSRF token fetch");
    try {
      const response = await fetch("/api/csrf-token", {
        method: "GET",
        credentials: "include",
      });
      console.log(
        "[useQueryLogic] CSRF fetch response status:",
        response.status
      );
      const data = await response.json();
      if (!response.ok || !data.csrfToken) {
        throw new Error(
          data.error || `Failed to fetch CSRF token: ${response.status}`
        );
      }
      console.log(
        "[useQueryLogic] CSRF token fetched successfully:",
        data.csrfToken
      );
      return data.csrfToken;
    } catch (err) {
      console.error("[useQueryLogic] CSRF token fetch failed:", err);
      throw new Error(
        err instanceof Error ? err.message : "Unknown error fetching CSRF token"
      );
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const q = params.get("q");
      if (q === "shop") {
        setQueryMode("shop");
      }
      console.log(
        "[useQueryLogic] URL param 'q':",
        q,
        "Current queryMode:",
        queryMode
      );
    }
  }, [setQueryMode]);

  const handleSetVoteHistory: Dispatch<SetStateAction<VoteResult[]>> = (
    history
  ) => {
    setVoteHistory(history);
  };

  const handleSetLastVoteResult: Dispatch<SetStateAction<VoteResult | null>> = (
    result
  ) => {
    setLastVoteResult(result);
  };

  const { broadcastQuery } = useBroadcastQuery(
    handleSetVoteHistory,
    handleSetLastVoteResult,
    undefined,
    undefined
  );

  const handleQueryAmountChange = useCallback(
    (newAmount: number) => {
      const clampedAmount = Math.max(
        1,
        Math.min(ALLOWED_AMOUNT_QUERIES, newAmount)
      );
      console.log("[useQueryLogic] Updating queriesRequested:", clampedAmount);
      setQueriesRequested(clampedAmount, userCreditsTotal);
    },
    [setQueriesRequested, userCreditsTotal]
  );

  const handleSubmit = async () => {
    console.log("[useQueryLogic] handleSubmit called", {
      queryText,
      queryMode,
      userCreditsTotal,
      queriesRequested,
      queriesUnpaid,
      queriesCostTotal,
      payWithWallet,
      storeHasPaid,
    });

    console.log("[useQueryLogic] Proceeding to validation");

    // Validate query submission in a separate try-catch to catch silent errors
    try {
      console.log("[useQueryLogic] Checking query text:", queryText);
      if (!queryText.trim()) {
        console.log("[useQueryLogic] Validation failed: Query cannot be empty");
        toast.error("Query cannot be empty", {
          style: { background: "#fee2e2", color: "#dc2626" },
          duration: 5000,
        });
        return;
      }
      console.log("[useQueryLogic] Query text validation passed");

      console.log("[useQueryLogic] Checking queriesUnpaid and payWithWallet:", {
        queriesUnpaid,
        payWithWallet,
      });
      if (queriesUnpaid > 0 && !payWithWallet) {
        console.log(
          "[useQueryLogic] Validation failed: Pay with Wallet required"
        );
        toast.error("Please enable Pay with Wallet for additional queries", {
          style: { background: "#fee2e2", color: "#dc2626" },
          duration: 5000,
        });
        return;
      }
      console.log("[useQueryLogic] Wallet validation passed");

      console.log("[useQueryLogic] Checking payment status:", {
        payWithWallet,
        queriesUnpaid,
        storeHasPaid,
      });
      if (payWithWallet && queriesUnpaid > 0 && !storeHasPaid) {
        console.log("[useQueryLogic] Validation failed: Payment required", {
          queriesUnpaid,
          storeHasPaid,
        });
        toast.error("Please make a payment first", {
          style: { background: "#fee2e2", color: "#dc2626" },
          duration: 5000,
        });
        return;
      }
      console.log("[useQueryLogic] Payment validation passed");
    } catch (err: unknown) {
      console.error("[useQueryLogic] Validation error:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Validation failed unexpectedly";
      setError(sanitizeQueryText(errorMessage));
      toast.error(errorMessage, {
        style: { background: "#fee2e2", color: "#dc2626" },
        duration: 5000,
      });
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    console.log("[useQueryLogic] Entering try block");
    try {
      // Fetch fresh CSRF token for each submission
      const csrfToken = await fetchCsrfToken();
      console.log(
        "[useQueryLogic] Broadcasting query with queryMode:",
        queryMode,
        "queriesRequested:",
        queriesRequested
      );
      await broadcastQuery(queryText, {
        csrfToken,
        queryMode,
        queriesRequested,
      }); // Pass queriesRequested
      console.log("[useQueryLogic] Broadcast successful");
      resetAfterSubmission(userCreditsTotal);
      setQueryText("");
      setPayWithWallet(queriesRequested > userCreditsTotal);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to submit query";
      setError(sanitizeQueryText(errorMessage));
      console.error("[useQueryLogic] Submission failed:", {
        errorMessage,
        queryText,
        queryMode,
        queriesRequested,
        queriesUnpaid,
        payWithWallet,
        storeHasPaid,
        responseStatus:
          err instanceof Error && err.message.includes("Server responded")
            ? err.message
            : "Unknown",
      });
      toast.error(errorMessage, {
        style: { background: "#fee2e2", color: "#dc2626" },
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
      console.log("[useQueryLogic] Submission completed, isSubmitting:", false);
    }
  };

  return {
    queriesRequested,
    queryText,
    setQueryText,
    isSubmitting,
    error,
    setError,
    placeholderText,
    availableQueries: userCreditsTotal,
    queriesCostTotal,
    queriesUnpaid,
    userFreeCredits,
    userPaidCredits,
    userCreditsTotal,
    queryMode,
    viewMode,
    voteHistory,
    lastVoteResult,
    handleSubmit,
    handleQueryAmountChange,
  };
}




"use client";

import { useCallback } from "react";
import { useVoteStore } from "@/store/vote-store";
import { VoteResult, QueryMode } from "@/lib/types";
import { submitQueryService } from "@/lib/services/query-service";
import { sanitizeQueryText } from "@/utils/security-utils";
import { RESULT_QUERIES_CARDS } from "@/lib/constants";

// Log to confirm file is loaded
console.log("[useSubmitQuery] File loaded");

interface SubmitQueryOptions {
  queryMode?: QueryMode; // Allow QueryMode for type safety
  queriesRequested?: number; // Number of validators to query
}

interface SubmitQueryReturn {
  submitQuery: (
    queryText: string,
    options?: SubmitQueryOptions
  ) => Promise<void>;
}

export function useSubmitQuery(): SubmitQueryReturn {
  const { setVoteHistory, setLastVoteResult } = useVoteStore();

  const submitQuery = useCallback(
    async (queryText: string, options: SubmitQueryOptions = {}) => {
      console.log("[useSubmitQuery] Received query with options:", {
        queryText,
        queryMode: options.queryMode,
        queriesRequested: options.queriesRequested,
      });

      // Submit query and update vote history
      const sanitizedQuery = sanitizeQueryText(queryText);
      console.log("[useSubmitQuery] Submitting query with queryMode:", options.queryMode, "queriesRequested:", options.queriesRequested);
      const queryResponse = await submitQueryService(
        sanitizedQuery,
        options.queryMode,
        options.queriesRequested
      );
      console.log("[useSubmitQuery] Submission successful, response:", queryResponse);
      setVoteHistory((prev: VoteResult[]) => {
        const newHistory = [...prev, queryResponse.voteResult].slice(0, RESULT_QUERIES_CARDS);
        console.log("[useSubmitQuery] Updating voteHistory:", newHistory.length, "items");
        return newHistory;
      });
      setLastVoteResult(queryResponse.voteResult);
    },
    [setVoteHistory, setLastVoteResult]
  );

  return { submitQuery };
}

