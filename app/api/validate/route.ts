import { NextRequest, NextResponse } from "next/server";
// import { validatorService } from "@/lib/services/validatorService";
import { validatorRegistry } from "@/lib/validators/registry";
import { ValidationRequest, AIValidationResponse } from "@/lib/validators/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.validatorId || !body.statement) {
      return NextResponse.json(
        { error: "Missing required fields: validatorId, statement" },
        { status: 400 }
      );
    }

    const validationRequest: ValidationRequest = {
      statement: body.statement,
      context: body.context || "",
    };

    const validator = await validatorRegistry.getValidator(body.validatorId);
    if (!validator) {
      return NextResponse.json(
        { error: "Validator not found" },
        { status: 404 }
      );
    }

    try {
      const result: AIValidationResponse = await validator.validate(validationRequest);
      return NextResponse.json(result);
    } catch (validationError) {
      console.error("Error during validation:", validationError);
      const errorMessage =
        validationError instanceof Error ? validationError.message : "Unknown error";
      return NextResponse.json({
        vote: false,
        confidence: 0.5,
        rationale: `Error during validation: ${errorMessage}`,
      });
    }
  } catch (error) {
    console.error("Error processing validation request:", error);
    return NextResponse.json(
      { error: "Failed to process validation request" },
      { status: 500 }
    );
  }
}