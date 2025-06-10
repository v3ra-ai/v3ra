// app/api/validators/route.ts
import { NextResponse } from "next/server";
import { validatorRegistry } from "@/lib/validators/registry";
import { AIValidator } from "@/lib/validators/types";

// GET /api/validators - Get all validators
export async function GET() {
  try {
    console.log("[validators API] Starting to fetch validators...");
    const allValidators = await validatorRegistry.getAllValidators(); // Line 8: Fixed
    console.log(`[validators API] Retrieved ${allValidators.length} validators from registry`);

    const formattedValidators = allValidators.map((validator: AIValidator) => {
      // Line 16: Typed
      return {
        id: validator.id,
        name: validator.name,
        provider: validator.provider,
        modelName: validator.modelName || "unknown",
        description: validator.description || undefined,
        validatorType: validator.validatorType || undefined,
        active: validator.active !== undefined ? validator.active : true,
        keyId: validator.keyId || undefined, // AIValidator uses keyId
      };
    });

    console.log(`[validators API] Returning ${formattedValidators.length} formatted validators`);
    return NextResponse.json(formattedValidators);
  } catch (error) {
    console.error("[validators API] Error getting validators:", error);
    return NextResponse.json(
      { error: "Failed to fetch validators" },
      { status: 500 },
    );
  }
}
