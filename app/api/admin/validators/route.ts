import { NextResponse, NextRequest } from "next/server";
import { validatorService } from "@/lib/services/validatorService";
import { AIValidator, ValidationRequest } from "@/lib/validators/types";

export async function GET() {
  try {
    const validators = await validatorService.getAllValidators();
    return NextResponse.json(validators.map(v => ({
      id: v.id,
      profileName: v.profileName,
      provider: v.provider,
      modelName: v.modelName,
      active: v.active,
    })));
  } catch (error) {
    console.error("Error fetching validators:", error);
    return NextResponse.json(
      { message: (error as Error).message || "Failed to fetch validators" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Received validator data:', body); // Debug log
    const { name, provider, modelName, active, description, validatorType, keyId } = body;

    if (!name || !provider || !modelName) {
      return NextResponse.json(
        { message: "Name, provider, and model name are required" },
        { status: 400 },
      );
    }

    const newValidatorData: Omit<AIValidator, 'validate' | 'id'> & { keyId?: string } = {
      name: name,
      provider: provider,
      modelName: modelName,
      active: active !== undefined ? active : true,
      description: description || '',
      validatorType: validatorType || 'model_validator',
      keyId: keyId,
    };

    const createdValidator = await validatorService.addValidator({
      ...newValidatorData,
      validate: async (_: ValidationRequest) => ({
        vote: false,
        confidence: 0,
        rationale: 'Not implemented'
      })
    });

    return NextResponse.json(createdValidator, { status: 201 });
  } catch (error) {
    console.error("Error creating validator:", error);
    return NextResponse.json(
      { message: (error as Error).message || "Failed to create validator" },
      { status: 500 },
    );
  }
}