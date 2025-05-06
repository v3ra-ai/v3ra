This is code related to payments being made on Verafy Testnet


# Verafy Testnet Payments

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
hooks/useCreditAssignment.tsx
hooks/useCreditBalance.tsx
hooks/useSolanaTransaction.tsx
hooks/useSolanaWallet.tsx
store/credit-store.ts
lib/constants.ts
utils/csrf-utils.ts
app/api/csrf-token/route.ts
components/ask/query-stats.tsx
components/ask/consensus/current-query.tsx


--------------

# Files

app/api/credits/assign/route.ts

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

import { CreditsLayout } from "@/components/credits/credits-layout";
import Navbar from "@/components/ask/navbar";
import { SolanaProvider } from "@/components/solana-provider";

export default function CreditsPage() {
  return (
    <SolanaProvider>
      <Navbar />
      <CreditsLayout />
    </SolanaProvider>
  );
}


components/credits/credit-slider-ui.tsx


import * as Slider from "@radix-ui/react-slider";
import { Square } from "lucide-react";

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
      <h2 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-zinc-100">
        Purchase Credits
      </h2>
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



components/credits/credit-slider.tsx



"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { toast } from "sonner";
import CreditSliderUI from "./credit-slider-ui";
import { useSolanaTransaction } from "@/hooks/useSolanaTransaction";
import { useCreditAssignment } from "@/hooks/useCreditAssignment";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import { VERAFY_WALLET } from "@/lib/solana-constants";
import { QUERY_COST, QUERY_COST_FIXED_DECIMALS } from "@/lib/constants";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction, Connection, SendTransactionError } from "@solana/web3.js";
import { WalletSignTransactionError } from "@solana/wallet-adapter-base";

export default function CreditSlider() {
  const [creditAmount, setCreditAmount] = useState(10);
  const { creditBalance, setCreditBalance } = useCreditBalance();
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
          setCreditBalance(newBalance);
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



components/credits/credits-layout.tsx


"use client";

import CreditSlider from "@/components/credits/credit-slider";
import StakeSlider from "@/components/credits/stake-slider";

// interface CreditsLayoutProps {}

/**
 * Presentational component for the Credits page UI.
 * Renders a heading and two sliders (CreditSlider, StakeSlider) in a responsive layout
 * with Zinc-based styling to match other pages.
 */
export function CreditsLayout() {
  return (
    <div className="w-full md-round max-w-4xl mx-auto p-6  dark:bg-zinc-950 dark:border-zinc-700">
      <h1 className="text-4xl font-bold text-center text-zinc-800 dark:text-zinc-200 mb-8">
        Get Credits
      </h1>
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 p-4 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-sm">
          <CreditSlider />
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
import { Square } from "lucide-react";
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
      <h2 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-zinc-100">
        Stake for Credits
      </h2>
      <div className="text-center mb-6">
        <span className="text-5xl font-bold text-zinc-900 dark:text-zinc-100">
          {stakeAmount}
        </span>
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
  hasPaid: boolean;
  setHasPaid: (value: boolean) => void;
  queriesCostTotal: number;
  userCreditsTotal: number;
  userFreeCredits: number;
  userPaidCredits: number;
  queriesRequested: number;
  queriesUnpaid: number;
  highlightPayButton?: boolean;
  context?: "scrollbar" | "default"; // Added to differentiate scrollbar view
}

export default function WalletToggle({
  payWithWallet,
  setPayWithWallet,
  hasPaid,
  setHasPaid,
  queriesCostTotal,
  userCreditsTotal,
  userFreeCredits,
  userPaidCredits,
  queriesRequested,
  queriesUnpaid,
  highlightPayButton = false,
  context = "default", // Default to non-scrollbar view
}: WalletToggleProps) {
  const handleCheckedChange = useCallback(
    (checked: boolean) => {
      setPayWithWallet(checked);
    },
    [setPayWithWallet]
  );

  const queriesLeft = Math.max(0, userCreditsTotal - queriesRequested); // Credits left after reserving queriesRequested
  const displayUnpaid = Math.max(0, queriesUnpaid); // Never show negative queriesUnpaid

  return (
    <div className={`flex items-center justify-between ${context==="default" ? "mb-3" : "mb-1"} `}>
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
            hasPaid={hasPaid}
            setHasPaid={setHasPaid}
            queriesCostTotal={queriesCostTotal}
            userCreditsTotal={userCreditsTotal}
            userFreeCredits={userFreeCredits}
            userPaidCredits={userPaidCredits}
            queriesUnpaid={displayUnpaid} // Use displayUnpaid to avoid negative values
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
        // const errorMsg = error instanceof Error ? error.message : "Unknown error";
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
        <span>Saved Credits:</span>{" "}
        <span className="text-sky-700 dark:text-sky-300 bg-zinc-200 dark:bg-zinc-700 ml-1 px-2 py-1 rounded-md">
          {paidCredits !== null ? paidCredits : "Loading..."}
        </span>
      </Link>
    </div>
  );
}


components/ask/payment-controls.tsx



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
  hasPaid: boolean;
  setHasPaid: (value: boolean) => void;
  queriesCostTotal: number;
  userCreditsTotal: number;
  userFreeCredits: number;
  userPaidCredits: number;
  queriesUnpaid: number;
  highlightPayButton?: boolean;
}

export function PaymentControls({
  hasPaid,
  setHasPaid,
  queriesCostTotal,
  queriesUnpaid,
  highlightPayButton = false,
}: PaymentControlsProps) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [isProcessing, setIsProcessing] = useState(false);
  const { resetCreditsAfterPayment } = useCreditsStore();

  const PAYMENT_RECEIVER_ADDRESS =
    process.env.NEXT_PUBLIC_PAYMENT_RECEIVER_ADDRESS;
  if (!PAYMENT_RECEIVER_ADDRESS) {
    throw new Error(
      "NEXT_PUBLIC_PAYMENT_RECEIVER_ADDRESS environment variable is not set",
    );
  }
  const PAYMENT_RECIPIENT = new PublicKey(PAYMENT_RECEIVER_ADDRESS);
  const PAYMENT_AMOUNT = queriesCostTotal * QUERY_COST * LAMPORTS_PER_SOL;

  const handlePayment = async () => {
    if (!publicKey || !sendTransaction) {
      toast.error("Please connect your wallet first", {
        style: { background: "#fee2e2", color: "#dc2626" },
      });
      return;
    }

    setIsProcessing(true);
    try {
      console.log("Payment inputs:", { queriesCostTotal, PAYMENT_AMOUNT, publicKey: publicKey.toBase58() });

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
      resetCreditsAfterPayment(); // Reset all credits to 0 after payment
      console.log("Payment successful, queriesCostTotal:", queriesCostTotal, "userCreditsTotal:", useCreditsStore.getState().userCreditsTotal);
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
          : errorMessage;
      }
      toast.error(errorMessage, {
        style: { background: "#fee2e2", color: "#dc2626" },
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const displayUnpaid = Math.max(0, queriesUnpaid); // Never show negative queriesUnpaid

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

"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { PublicKey, Transaction, SystemProgram } from "@solana/web3.js";
import { CREDIT_PRICE_SOL } from "../lib/solana-constants";

interface CreditAssignment {
  assignCredits: (
    signature: string,
    signedTx: Transaction,
    credits: number,
    userWallet: PublicKey,
  ) => Promise<number>;
  isAssigning: boolean;
  error: string | null;
}

export const useCreditAssignment = (): CreditAssignment => {
  const [isAssigning, setIsAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const assignCredits = useCallback(
    async (
      signature: string,
      signedTx: Transaction,
      credits: number,
      userWallet: PublicKey,
    ) => {
      setIsAssigning(true);
      setError(null);

      try {
        // Validate transaction amount
        const transferInstruction = signedTx.instructions.find((instr) =>
          instr.programId.equals(SystemProgram.programId),
        );
        if (!transferInstruction) {
          throw new Error("No SystemProgram.transfer instruction found");
        }
        if (transferInstruction.data.length < 12) {
          throw new Error(
            "Invalid instruction data: too short to contain lamports",
          );
        }
        const lamports = transferInstruction.data.readBigInt64LE(4);
        const expectedLamports = BigInt(
          credits * CREDIT_PRICE_SOL * 1_000_000_000,
        );
        console.log("Validating transaction:", {
          lamports,
          expectedLamports,
          credits,
        });

        if (lamports !== expectedLamports) {
          throw new Error(
            `Invalid amount: expected ${expectedLamports} lamports, got ${lamports}`,
          );
        }

        const apiResponse = await fetch("/api/payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transaction: signedTx.serialize().toString("base64"),
            signature,
            credits,
            userWallet: userWallet.toBase58(),
          }),
        });

        if (!apiResponse.ok) {
          const errorData = await apiResponse.json();
          throw new Error(errorData.error || "Payment failed");
        }

        const paymentData = await apiResponse.json();
        if (paymentData.status !== "success") {
          throw new Error("Payment verification failed");
        }

        const assignApiResponse = await fetch("/api/credits/assign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            walletPublicKey: userWallet.toBase58(),
            creditAmount: credits,
          }),
        });

        if (!assignApiResponse.ok) {
          const errorData = await assignApiResponse.json();
          throw new Error(errorData.error || "Credit assignment failed");
        }

        const assignData = await assignApiResponse.json();
        toast.success(
          `${credits} credits added! New balance: ${assignData.credits}`,
        );
        return assignData.credits || 0;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Error processing payment";
        setError(message);
        toast.error(message);
        console.error("Credit assignment error:", err);
        throw err;
      } finally {
        setIsAssigning(false);
      }
    },
    [],
  );

  return {
    assignCredits,
    isAssigning,
    error,
  };
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
      const delayMs = 1000;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          // Create and configure transaction
          const transaction = new Transaction();
          transaction.add(
            ComputeBudgetProgram.setComputeUnitLimit({
              units: 700_000,
            }),
            ComputeBudgetProgram.setComputeUnitPrice({
              microLamports: 500_000,
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


store/credit-store.ts


import { create } from "zustand";
import { DEFAULTS } from "@/lib/types";

export interface CreditsStore {
  userFreeCredits: number;
  userPaidCredits: number;
  userCreditsTotal: number;
  decrementFreeCredits: (amount: number) => void;
  decrementPaidCredits: (amount: number) => void;
  incrementPaidCredits: (amount: number) => void;
  resetCreditsAfterPayment: () => void;
}

export const useCreditsStore = create<CreditsStore>((set) => ({
  userFreeCredits: DEFAULTS.USER_FREE_CREDITS,
  userPaidCredits: DEFAULTS.USER_PAID_CREDITS,
  userCreditsTotal: DEFAULTS.USER_FREE_CREDITS + DEFAULTS.USER_PAID_CREDITS,

  decrementFreeCredits: (amount: number) => set((state) => {
    const newFreeCredits = Math.max(0, state.userFreeCredits - amount);
    return {
      userFreeCredits: newFreeCredits,
      userCreditsTotal: newFreeCredits + state.userPaidCredits,
    };
  }),

  decrementPaidCredits: (amount: number) => set((state) => {
    const newPaidCredits = Math.max(0, state.userPaidCredits - amount);
    return {
      userPaidCredits: newPaidCredits,
      userCreditsTotal: state.userFreeCredits + newPaidCredits,
    };
  }),

  incrementPaidCredits: (amount: number) => set((state) => {
    const newPaidCredits = state.userPaidCredits + amount;
    return {
      userPaidCredits: newPaidCredits,
      userCreditsTotal: state.userFreeCredits + newPaidCredits,
    };
  }),

  resetCreditsAfterPayment: () => set(() => ({
    userFreeCredits: 0,
    userPaidCredits: 0,
    userCreditsTotal: 0,
  })),
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


utils/csrf-utils.ts

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export function generateCsrfToken(response: NextResponse): string {
  const token = crypto.randomBytes(32).toString("hex");
  response.cookies.set("csrf-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax", // Relaxed for debugging
    maxAge: 60 * 60, // 1 hour
  });
  console.log("CSRF Token Generated:", {
    token,
    cookieSettings: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60,
    },
  });
  return token;
}

app/api/csrf-token/route.ts

export function verifyCsrfToken(request: NextRequest): NextResponse | null {
  const tokenFromHeader = request.headers.get("X-CSRF-Token");
  const tokenFromCookie = request.cookies.get("csrf-token")?.value;
  console.log("CSRF Verification:", {
    tokenFromHeader,
    tokenFromCookie,
    cookies: request.cookies.getAll(),
  });
  if (!tokenFromHeader || !tokenFromCookie || tokenFromHeader !== tokenFromCookie) {
    console.error("CSRF validation failed:", {
      tokenFromHeader,
      tokenFromCookie,
    });
    return NextResponse.json(
      { error: "Invalid or missing CSRF token" },
      { status: 403 },
    );
  }
  return null;
}


app/api/csrf-token/route.ts

import { NextResponse } from "next/server";
import { generateCsrfToken } from "@/utils/csrf-utils";

export async function GET() {
  try {
    // Create response without committing JSON yet
    const response = new NextResponse();
    const csrfToken = generateCsrfToken(response);
    // Set JSON body after setting cookie
    return NextResponse.json({ csrfToken }, { status: 200, headers: response.headers });
  } catch (error) {
    console.error("Error generating CSRF token:", error);
    return NextResponse.json({ error: "Failed to generate CSRF token" }, { status: 500 });
  }
}


-------

components/ask/query-stats.tsx


import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { QUERY_COST, QUERY_COST_FIXED_DECIMALS } from "@/lib/constants";

interface QueryStatsProps {
  userCreditsTotal: number;
  queriesUnpaid: number;
  queriesCostTotal: number;
  queriesRequested: number;
}

export default function QueryStats({
  userCreditsTotal,
  queriesUnpaid,
  queriesCostTotal,
  queriesRequested,
}: QueryStatsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasTriggeredOpen, setHasTriggeredOpen] = useState(false);
  const [hasTriggeredClose, setHasTriggeredClose] = useState(false);

  // Auto-trigger open/close based on queriesUnpaid
  useEffect(() => {
    if (queriesUnpaid > 0 && !hasTriggeredOpen) {
      setIsOpen(true);
      setHasTriggeredOpen(true);
      setHasTriggeredClose(false);
    } else if (queriesUnpaid <= 0 && !hasTriggeredClose) {
      setIsOpen(false);
      setHasTriggeredClose(true);
      setHasTriggeredOpen(false);
    }
  }, [queriesUnpaid, hasTriggeredOpen, hasTriggeredClose]);

  const creditsLeft = Math.max(0, userCreditsTotal - queriesRequested); // Credits left after reserving queriesRequested
  const displayUnpaid = Math.max(0, queriesUnpaid); // Never show negative queriesUnpaid

  return (
    <div className="w-full mt-4">
      {/* Mobile: Collapsible; Desktop: Always visible */}
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className="md:hidden"
      >
        <CollapsibleTrigger asChild>
          <Button
            variant="outline"
            className="flex items-center justify-between w-full bg-zinc-200 dark:bg-zinc-700 text-gray-700 dark:text-zinc-300 cursor-pointer truncate"
          >
            <span>Credits left: {creditsLeft}</span>
            <ChevronDown className={`h-5 w-5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="flex flex-col gap-4 mt-4">
            <div className="md:flex items-center gap-2 hidden">
              <span className="text-gray-700 dark:text-zinc-400">Credits left</span>
              <span className="bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full text-zinc-700 dark:text-zinc-300">
                {creditsLeft}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-700 dark:text-zinc-400">
                Cost to query: ({displayUnpaid})
              </span>
              <span className="bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full text-zinc-700 dark:text-zinc-300">
                {queriesCostTotal} credits ({(queriesCostTotal * QUERY_COST).toFixed(QUERY_COST_FIXED_DECIMALS)} SOL)
              </span>
            </div>
            <Link href="/credits">
              <Button
                className="rounded-md bg-zinc-100 dark:bg-zinc-800 border border-gray-300 dark:border-gray-700 pl-2 py-1 text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-900 cursor-pointer w-full"
              >
                Stake to get more
              </Button>
            </Link>
            <Link href="/credits">
              <Button
                className="rounded-md bg-zinc-100 dark:bg-zinc-600 border border-gray-300 dark:border-gray-700 pl-2 py-1 text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-900 cursor-pointer w-full"
              >
                Buy Credits
              </Button>
            </Link>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Desktop: Always visible */}
      <div className="hidden md:flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-gray-700 dark:text-zinc-400">Credits left</span>
          <span className="bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full text-zinc-700 dark:text-zinc-300">
            {creditsLeft}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-700 dark:text-zinc-400">
            Cost to query: ({displayUnpaid})
          </span>
          <span className="bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full text-zinc-700 dark:text-zinc-300">
            {queriesCostTotal} credits ({(queriesCostTotal * QUERY_COST).toFixed(QUERY_COST_FIXED_DECIMALS)} SOL)
          </span>
        </div>
        <Link href="/credits">
          <Button
            className="rounded-md bg-zinc-100 dark:bg-zinc-800 border border-gray-300 dark:border-gray-700 pl-2 py-1 text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-900 cursor-pointer"
          >
            Stake to get more
          </Button>
        </Link>
        <Link href="/credits">
          <Button
            className="rounded-md bg-zinc-100 dark:bg-zinc-600 border border-gray-300 dark:border-gray-700 pl-2 py-1 text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-900 cursor-pointer"
          >
            Buy Credits
          </Button>
        </Link>
      </div>
    </div>
  );
}

components/ask/consensus/current-query.tsx

"use client";

import { useNetworkState } from "@/hooks/useNetworkState";
import { VoteResultContext } from "@/components/ask/ask-results-expert";
import { useContext } from "react";
import { motion } from "framer-motion";
import { sanitizeQueryText } from "@/utils/security-utils";
import { calculateVotePercentages } from "@/utils/vote-utils";
import { formatErrorMessage } from "@/utils/error-utils";
import { LoadingSpinner } from "@/components/loading-spinner-new";

const QueryState = ({ state }: { state: "loading" | { error: string } }) => (
  <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md p-6 h-64 w-full">
    <h3 className="text-md font-medium text-gray-800 dark:text-zinc-200 mb-4">
      Current Query
    </h3>
    <div className="bg-zinc-100 dark:bg-zinc-800 rounded-xl h-40 w-full flex items-center justify-center">
      {state === "loading" ? (
        <span className="">
          <LoadingSpinner type="beat" message="Loading..." />
        </span>
      ) : (
        <span className="text-red-500">
          Error: {formatErrorMessage(state.error)}
        </span>
      )}
    </div>
  </div>
);

export default function CurrentQuery() {
  const { isLoading, error } = useNetworkState();
  const voteResult = useContext(VoteResultContext);

  if (isLoading) {
    return <QueryState state="loading" />;
  }

  if (error) {
    return <QueryState state={{ error: formatErrorMessage(error) }} />;
  }
  // Sanitize queryText to prevent XSS
  const sanitizedQueryText =
    sanitizeQueryText(voteResult?.queryText) || "No query available";

  const {
    yes: yesPercentage,
    no: noPercentage,
    notVoted: notVotedPercentage,
  } = calculateVotePercentages(voteResult);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md p-6 h-64 w-full">
      <h3 className="text-md font-medium text-gray-800 dark:text-zinc-200 mb-4">
        Current Query
      </h3>
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {sanitizedQueryText}
        </p>
        <div
          className={`
            h-8 w-full
            bg-gray-200 dark:bg-zinc-700
            rounded-full overflow-hidden
            flex
          `}
        >
          {yesPercentage > 0 && (
            <motion.div
              className="h-full bg-green-500"
              initial={{ width: 0 }}
              animate={{ width: `${yesPercentage}%` }}
              transition={{ duration: 0.5 }}
            />
          )}
          {noPercentage > 0 && (
            <motion.div
              className="h-full bg-red-500"
              initial={{ width: 0 }}
              animate={{ width: `${noPercentage}%` }}
              transition={{ duration: 0.5 }}
            />
          )}
          {notVotedPercentage > 0 && (
            <motion.div
              className="h-full bg-gray-400 dark:bg-zinc-600"
              initial={{ width: 0 }}
              animate={{ width: `${notVotedPercentage}%` }}
              transition={{ duration: 0.5 }}
            />
          )}
        </div>
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
          <span>Yes: {yesPercentage.toFixed(0)}%</span>
          <span>No: {noPercentage.toFixed(0)}%</span>
          <span>Not Voted: {notVotedPercentage.toFixed(0)}%</span>
        </div>
      </div>
    </div>
  );
}
