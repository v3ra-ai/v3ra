// app/api/broadcast/route.ts
import { NextRequest, NextResponse } from "next/server";
import { broadcastCustomQuery } from "@/app/actions";

export async function POST(request: NextRequest) {
  try {
    const { queryText } = await request.json();

    if (!queryText) {
      return NextResponse.json({ error: "Missing queryText" }, { status: 400 });
    }

    const result = await broadcastCustomQuery(queryText);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in broadcast API:", error);
    return NextResponse.json({ error: "Failed to broadcast query" }, { status: 500 });
  }
}