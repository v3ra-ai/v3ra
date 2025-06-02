import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { PublicKey } from "@solana/web3.js";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { verifyCsrfToken } from "@/utils/csrf-utils";
import { TRUTH_QUERY_COST, TRUTH_TOKEN_MINT_ADDRESS } from "@/lib/constants";

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

export async function POST(req: NextRequest) {
  const csrfResponse = verifyCsrfToken(req);
  if (csrfResponse) {
    return csrfResponse;
  }

  let body: RequestBody = {
    walletPublicKey: undefined,
    creditAmount: undefined,
  };

  try {
    body = (await req.json()) as RequestBody;
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
        otherAmount: creditAmount * TRUTH_QUERY_COST,
        otherPayType: TRUTH_TOKEN_MINT_ADDRESS,
        status: "ASSIGNED_TRUTH",
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
    const errorMessage = error instanceof Error ? error.message : "Failed to assign credits";
    await prisma.paymentLog.create({
      data: {
        id: uuidv4(),
        walletPublicKey: body.walletPublicKey ?? "unknown",
        credits: body.creditAmount && Number.isInteger(body.creditAmount) ? body.creditAmount : 0,
        otherAmount: body.creditAmount && Number.isInteger(body.creditAmount) ? body.creditAmount * TRUTH_QUERY_COST : 0,
        otherPayType: TRUTH_TOKEN_MINT_ADDRESS,
        status: "FAILED_TRUTH",
        error: errorMessage,
        createdAt: new Date(),
      },
    });
    console.error("[Credits-Truth/Assign] Error assigning credits:", error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}