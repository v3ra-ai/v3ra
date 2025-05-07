import { NextResponse, NextRequest } from "next/server";
import { validatorService } from "@/lib/services/validatorService";
import { prisma } from "@/lib/db/client";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  if (!id) {
    return NextResponse.json({ message: "Validator ID is required" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { active } = body;

    if (typeof active !== 'boolean') {
      return NextResponse.json(
        { message: "The 'active' field (boolean) is required in the request body" },
        { status: 400 }
      );
    }
    
    // Check if validator exists
    const existingValidator = await prisma.validator.findUnique({ where: { id } });
    if (!existingValidator) {
        return NextResponse.json({ message: "Validator not found" }, { status: 404 });
    }

    await validatorService.toggleValidator(id, active);
    
    // Fetch the updated validator to return its new state
    const updatedValidator = await prisma.validator.findUnique({ where: {id} });
    if (!updatedValidator) { // Should not happen if toggle succeeded
        return NextResponse.json({ message: "Validator not found after toggle" }, { status: 404 });
    }

    const responseValidator = {
        id: updatedValidator.id,
        profileName: updatedValidator.profileName,
        provider: updatedValidator.provider,
        modelName: updatedValidator.modelName,
        active: updatedValidator.active,
      };

    return NextResponse.json(responseValidator);
  } catch (error) {
    console.error(`Error toggling validator ${id}:`, error);
    const errorMessage = error instanceof Error ? error.message : "Failed to toggle validator active status";
    return NextResponse.json(
      { message: errorMessage },
      { status: 500 },
    );
  }
}
