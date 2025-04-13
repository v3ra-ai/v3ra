// app/api/credits/balance/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { walletPublicKey } = await request.json();

    if (!walletPublicKey) {
      return NextResponse.json({ error: "Wallet public key is required" }, { status: 400 });
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
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}