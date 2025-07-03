// app/api/validators/active/route.ts
import { NextResponse } from "next/server";
import { validatorRegistry } from "@/lib/validators/registry";
import { AIValidator } from "@/lib/validators/types";

// GET /api/validators/active - Get active validators
export async function GET() {
  try {
    const activeValidators = await validatorRegistry.getActiveValidators(); // Line 7: Fixed

    // Convert AIValidators to JSON-friendly format
    const formattedValidators = activeValidators.map(
      (validator: AIValidator) => {
        // Line 10: Typed
        return {
          id: validator.id,
          name: validator.name,
          profileName: validator.name, // Add profileName for compatibility with LLM store
          provider: validator.provider,
          modelName: validator.modelName || "unknown",
          description: validator.description || undefined,
          validatorType: validator.validatorType || undefined,
          active: validator.active !== undefined ? validator.active : true,
          keyId: validator.keyId || undefined, // AIValidator uses keyId directly
          // validate function omitted as it’s not serializable
        };
      },
    );

    return NextResponse.json(formattedValidators);
  } catch (error) {
    console.error("Error getting active validators:", error);
    return NextResponse.json(
      { error: "Failed to fetch active validators" },
      { status: 500 },
    );
  }
}
