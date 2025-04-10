import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// POST /api/threads/[threadId]/upvote - Increment upvotes for a thread
export async function POST(req: NextRequest) {
  // Extract threadId from the URL
  const threadId = req.nextUrl.pathname.split("/")[3]; // Assuming path is /api/threads/{threadId}/upvote

  if (!threadId) {
    return NextResponse.json(
      { error: "Thread ID is required" },
      { status: 400 },
    );
  }

  try {
    // Check if thread exists
    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    // Atomically increment the upvotes
    const updatedThread = await prisma.thread.update({
      where: { id: threadId },
      data: {
        upvotes: {
          increment: 1,
        },
      },
    });

    return NextResponse.json(updatedThread);
  } catch (error) {
    console.error("Error upvoting thread:", error);
    // Handle potential errors like concurrent updates if necessary
    return NextResponse.json(
      { error: "Failed to upvote thread" },
      { status: 500 },
    );
  } finally {
    await prisma.$disconnect();
  }
}
