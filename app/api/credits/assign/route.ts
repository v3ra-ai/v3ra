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