import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { validatorService } from "@/lib/services/validatorService";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ message: "Validator ID is required" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { profileName, modelName, provider } = body;

    // Basic validation: ensure at least one updatable field is present
    if (!profileName && !modelName && !provider) {
      return NextResponse.json(
        { message: "At least one field (profileName, modelName, provider) must be provided for update" },
        { status: 400 }
      );
    }

    const updateData: { profileName?: string; modelName?: string; provider?: string } = {};
    if (profileName) updateData.profileName = profileName;
    if (modelName) updateData.modelName = modelName;
    if (provider) updateData.provider = provider;

    // Ideally, this logic should be in validatorService.ts
    // For now, using Prisma directly.
    const updatedValidator = await prisma.validator.update({
      where: { id },
      data: updateData,
    });

    if (!updatedValidator) {
      return NextResponse.json({ message: "Validator not found" }, { status: 404 });
    }

    // Return the structure consistent with GET all
    const responseValidator = {
      id: updatedValidator.id,
      profileName: updatedValidator.profileName,
      provider: updatedValidator.provider,
      modelName: updatedValidator.modelName,
      active: updatedValidator.active,
    };

    return NextResponse.json(responseValidator);
  } catch (error) {
    console.error(`Error updating validator ${id}:`, error);
    const errorMessage = error instanceof Error ? error.message : "Failed to update validator";
    if (error instanceof Error && 'code' in error && error.code === 'P2025') { // Prisma error code for record not found
      return NextResponse.json({ message: "Validator not found" }, { status: 404 });
    }
    return NextResponse.json(
      { message: errorMessage },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ message: "Validator ID is required" }, { status: 400 });
  }

  try {
    // Check if validator exists before attempting delete to return a 404 if not found.
    const existingValidator = await prisma.validator.findUnique({ where: { id } });
    if (!existingValidator) {
        return NextResponse.json({ message: "Validator not found" }, { status: 404 });
    }

    await validatorService.removeValidator(id);
    return NextResponse.json({ message: "Validator removed successfully" }, { status: 200 }); // Or 204 No Content
  } catch (error) {
    console.error(`Error removing validator ${id}:`, error);
    const errorMessage = error instanceof Error ? error.message : "Failed to remove validator";

    // Use a more specific type for Prisma errors
    interface PrismaError extends Error {
      code?: string;
    }

    if ((error as PrismaError).code === 'P2025') { // Prisma error for record to delete not found (already handled by check above)
        return NextResponse.json({ message: "Validator not found" }, { status: 404 });
    }
    return NextResponse.json(
      { message: errorMessage },
      { status: 500 },
    );
  }
}