import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/vote-sessions/[voteSessionId]/threads - List threads for a vote session
export async function GET(
  request: Request,
  { params }: { params: Promise<{ voteSessionId: string }> },
) {
  // Properly await params before destructuring
  const { voteSessionId } = await params;

  if (!voteSessionId) {
    return NextResponse.json(
      { error: "Vote Session ID is required" },
      { status: 400 },
    );
  }

  try {
    const threads = await prisma.thread.findMany({
      where: { voteSessionId },
      orderBy: { createdAt: "desc" },
      // Include author if you implement authentication
      // include: { author: { select: { id: true, name: true } } }
    });
    return NextResponse.json(threads);
  } catch (error) {
    console.error("Error fetching threads:", error);
    return NextResponse.json(
      { error: "Failed to fetch threads" },
      { status: 500 },
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST /api/vote-sessions/[voteSessionId]/threads - Create a new thread
export async function POST(
  request: Request,
  { params }: { params: Promise<{ voteSessionId: string }> },
) {
  // Properly await params before destructuring
  const { voteSessionId } = await params;

  if (!voteSessionId) {
    return NextResponse.json(
      { error: "Vote Session ID is required" },
      { status: 400 },
    );
  }

  try {
    const { title, body } = await request.json();
    // TODO: Get authorId from session/auth context if implemented

    if (!title || !body) {
      return NextResponse.json(
        { error: "Title and body are required" },
        { status: 400 },
      );
    }

    const newThread = await prisma.thread.create({
      data: {
        title,
        body,
        voteSessionId,
        // authorId: authorId, // Add this if auth is implemented
      },
    });
    return NextResponse.json(newThread, { status: 201 });
  } catch (error) {
    console.error("Error creating thread:", error);
    return NextResponse.json(
      { error: "Failed to create thread" },
      { status: 500 },
    );
  } finally {
    await prisma.$disconnect();
  }
}
