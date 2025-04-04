import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST /api/threads/[threadId]/downvote - Increment downvotes for a thread
export async function POST(
  request: Request,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const { threadId } = await params;

  if (!threadId) {
    return NextResponse.json({ error: 'Thread ID is required' }, { status: 400 });
  }

  try {
    // Check if thread exists
    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    // Atomically increment the downvotes
    const updatedThread = await prisma.thread.update({
      where: { id: threadId },
      data: {
        downvotes: {
          increment: 1,
        },
      },
    });

    return NextResponse.json(updatedThread);
  } catch (error) {
    console.error('Error downvoting thread:', error);
    // Handle potential errors like concurrent updates if necessary
    return NextResponse.json({ error: 'Failed to downvote thread' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
