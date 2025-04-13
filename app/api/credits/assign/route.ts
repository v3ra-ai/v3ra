// app/api/credits/assign/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { PublicKey } from "@solana/web3.js";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

// Define interface for request body
interface RequestBody {
  walletPublicKey?: string;
  creditAmount?: number;
  email?: string;
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
  email: z.string().email().optional(),
});

export async function POST(req: NextRequest) {
  // Initialize body with defaults to ensure scope and type safety
  let body: RequestBody = {
    walletPublicKey: undefined,
    creditAmount: undefined,
    email: undefined,
  };

  try {
    body = (await req.json()) as RequestBody; // Cast to our interface
    const { walletPublicKey, creditAmount, email } = assignCreditsSchema.parse(body);

    const updatedCredit = await prisma.userCredit.upsert({
      where: { walletPublicKey },
      update: {
        credits: { increment: creditAmount },
        email: email || undefined,
        updatedAt: new Date(),
      },
      create: {
        walletPublicKey,
        credits: creditAmount,
        email,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    await prisma.paymentLog.create({
      data: {
        id: uuidv4(),
        walletPublicKey,
        credits: creditAmount,
        solAmount: creditAmount * 0.001,
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
        credits: body.creditAmount && Number.isInteger(body.creditAmount) ? body.creditAmount : 0,
        solAmount: (body.creditAmount && Number.isInteger(body.creditAmount) ? body.creditAmount : 0) * 0.001,
        status: "FAILED",
        error: errorMessage,
        createdAt: new Date(),
      },
    });
    console.error("Error assigning credits:", error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}