// app/api/admin/validators/add/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { randomUUID } from "crypto";

export async function POST(request: Request) {
  try {
    const { provider, modelName, keyId } = await request.json();

    if (!provider || !modelName) {
      return NextResponse.json(
        { message: "Provider and model name are required" },
        { status: 400 },
      );
    }

    const validator = await prisma.validator.create({
      data: {
        profileName: `${provider} ${modelName} Validator`,
        provider,
        modelName,
        publicKey: randomUUID(),
        active: true,
        ...(keyId && {
          apiKeys: {
            create: {
              apiKeyId: keyId,
            },
          },
        }),
      },
    });

    return NextResponse.json({
      message: "Validator added successfully",
      validator,
    });
  } catch (error) {
    console.error("Error adding validator:", error);
    return NextResponse.json(
      { message: (error as Error).message || "Failed to add validator" },
      { status: 500 },
    );
  }
}
