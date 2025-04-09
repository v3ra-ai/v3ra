// app/api/validators/[id]/toggle/route.ts
import { NextRequest, NextResponse } from "next/server";
import { validatorRegistry } from "@/lib/validators/registry";

// POST /api/validators/[id]/toggle - Toggle a validator's active status
export async function POST(req: NextRequest) {
  try {
    // Extract id from the URL
    const id = req.nextUrl.pathname.split("/")[3]; // Assuming path is /api/validators/{id}/toggle

    if (!id) {
      return NextResponse.json(
        { error: "Validator ID is required" },
        { status: 400 },
      );
    }

    const body = await req.json();

    if (body.active === undefined) {
      return NextResponse.json(
        { error: "Missing active status in request body" },
        { status: 400 },
      );
    }

    const success = await validatorRegistry.toggleValidator(id, body.active); // Line 26: Fixed
    if (!success) {
      return NextResponse.json(
        { error: "Failed to toggle validator" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error toggling validator status:", error);
    return NextResponse.json(
      { error: "Failed to toggle validator status" },
      { status: 500 },
    );
  }
}
