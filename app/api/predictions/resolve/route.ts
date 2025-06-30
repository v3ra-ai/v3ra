import { NextResponse } from "next/server";
import { PredictionResolver } from "@/lib/services/prediction-resolver";
import { getServerSession } from "next-auth";

export async function POST(request: Request) {
  try {
    // In a real app, you'd check authentication here
    // const session = await getServerSession();
    // if (!session) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const body = await request.json();
    const { predictionId, outcome, evidence } = body;

    if (!predictionId || !outcome) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const resolver = new PredictionResolver();
    await resolver.resolveManually(
      predictionId,
      outcome,
      evidence || "",
      "user" // In production, use actual user ID
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error resolving prediction:", error);
    return NextResponse.json(
      { error: "Failed to resolve prediction" },
      { status: 500 }
    );
  }
}