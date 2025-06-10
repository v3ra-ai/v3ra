import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { limitVoteRequest } from "@/utils/simple-rate-limit-utils";

const prisma = new PrismaClient();

// POST /api/replies/[replyId]/upvote - Increment upvotes for a reply
export async function POST(req: NextRequest) {
  // Apply rate-limiting
  const rateLimitResponse = await limitVoteRequest(req);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // Extract replyId directly from the request URL segment
  const replyId = req.nextUrl.pathname.split("/").pop();

  if (!replyId) {
    return NextResponse.json(
      { error: "Reply ID is required" },
      { status: 400 },
    );
  }

  try {
    const reply = await prisma.reply.findUnique({
      where: { id: replyId },
    });

    if (!reply) {
      return NextResponse.json({ error: "Reply not found" }, { status: 404 });
    }

    const updatedReply = await prisma.reply.update({
      where: { id: replyId },
      data: {
        upvotes: { increment: 1 },
      },
    });

    return NextResponse.json(updatedReply);
  } catch (error) {
    console.error("[Replies/Upvote] Error upvoting reply:", error);
    return NextResponse.json(
      { error: "Failed to upvote reply" },
      { status: 500 },
    );
  }
}