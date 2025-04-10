import { NextResponse } from "next/server";
import { broadcastQuery } from "@/lib/store";
import { headers } from "next/headers";

export async function POST() {
  // Force dynamic rendering
  const headersList = headers();
  console.log(headersList);

  try {
    const voteResult = await broadcastQuery();

    return NextResponse.json(voteResult);
  } catch (error) {
    console.error("Error during broadcast:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to broadcast query" },
      { status: 500 },
    );
  }
}
