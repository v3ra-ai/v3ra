import { NextResponse } from "next/server"
import { broadcastQuery } from "@/lib/store"
import { headers } from "next/headers"

// This endpoint can be called by a cron job service like Vercel Cron
export async function GET() {
  // Force dynamic rendering
  headers()

  try {
    const result = await broadcastQuery()
    return NextResponse.json({
      success: true,
      message: "Broadcast triggered successfully",
      result,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to trigger broadcast",
        error: (error as Error).message,
      },
      { status: 500 },
    )
  }
}

