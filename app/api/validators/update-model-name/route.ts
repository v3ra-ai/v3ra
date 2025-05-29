import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// POST /api/validators/update-model-name - Update a validator's model name
export async function POST(req: NextRequest) {
  try {
    const { oldModelName, newModelName } = await req.json();
    
    if (!oldModelName || !newModelName) {
      return NextResponse.json(
        { error: "Both oldModelName and newModelName are required" },
        { status: 400 }
      );
    }

    // Update all validators with the old model name
    const result = await prisma.validator.updateMany({
      where: { modelName: oldModelName },
      data: { modelName: newModelName }
    });

    return NextResponse.json({
      success: true,
      message: `Updated ${result.count} validators from '${oldModelName}' to '${newModelName}'`
    });
  } catch (error) {
    console.error("Error updating validator model names:", error);
    return NextResponse.json(
      { error: "Failed to update model names" },
      { status: 500 }
    );
  }
}
