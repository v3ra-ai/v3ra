// app/api/admin/keys/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

export async function GET() {
  try {
    console.log("Fetching API keys from Supabase");
    const keys = await prisma.apiKey.findMany({
      select: {
        id: true,
        name: true,
        provider: true,
        isActive: true,
        validatorKeys: {
          select: {
            validator: {
              // Navigate to Validator through ValidatorKey
              select: {
                id: true,
                profileName: true,
              },
            },
          },
        },
      },
    });
    return NextResponse.json(keys);
  } catch (error) {
    console.error("Error fetching keys:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
