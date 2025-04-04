import { NextRequest, NextResponse } from "next/server";
import { broadcastCustomQuery } from "@/app/actions";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { queryText } = body || { queryText: "Is artificial intelligence beneficial for society?" }; // Default query if none provided

    // Use the real implementation that interacts with validators
    const result = await broadcastCustomQuery(queryText);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error broadcasting query:", error);
    return NextResponse.json(
      { error: "Failed to broadcast query", message: (error as Error).message },
      { status: 500 }
    );
  }
}
