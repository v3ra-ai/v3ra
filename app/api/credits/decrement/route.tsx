import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { PublicKey } from "@solana/web3.js";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { verifyCsrfToken } from "@/utils/csrf-utils";
import { QUERY_COST } from "@/lib/constants";

interface RequestBody {
  walletPublicKey?: string;
  creditAmount?: number;
}

const decrementCreditsSchema = z.object({
  walletPublicKey: z.string().refine(
    (val) => {
      try {
        new PublicKey(val);
        return true;
      } catch {
        return false;
      }
    },
    { message: "Invalid Solana public key" }
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
    const { walletPublicKey, creditAmount } = decrementCreditsSchema.parse(body);

    const userCredit = await prisma.userCredit.findUnique({
      where: { walletPublicKey },
    });

    if (!userCredit || userCredit.credits < creditAmount) {
      const errorMessage = `Insufficient credits: Need ${creditAmount}, have ${userCredit?.credits ?? 0}`;
      await prisma.paymentLog.create({
        data: {
          id: uuidv4(),
          walletPublicKey,
          credits: creditAmount,
          solAmount: creditAmount * QUERY_COST,
          status: "FAILED",
          error: errorMessage,
          createdAt: new Date(),
        },
      });
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    const updatedCredit = await prisma.userCredit.update({
      where: { walletPublicKey },
      data: {
        credits: { decrement: creditAmount },
        updatedAt: new Date(),
      },
    });

    await prisma.paymentLog.create({
      data: {
        id: uuidv4(),
        walletPublicKey,
        credits: creditAmount,
        solAmount: creditAmount * QUERY_COST,
        status: "DECREMENTED",
        createdAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        success: true,
        credits: updatedCredit.credits,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to decrement credits";
    await prisma.paymentLog.create({
      data: {
        id: uuidv4(),
        walletPublicKey: body.walletPublicKey ?? "unknown",
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
    console.error("[Credits/Decrement] Error decrementing credits:", error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}