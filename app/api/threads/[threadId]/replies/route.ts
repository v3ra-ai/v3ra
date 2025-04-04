import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/threads/[threadId]/replies - List replies for a thread
export async function GET(
  request: Request,
  { params }: { params: { threadId: string } }
) {
  const { threadId } = params;

  if (!threadId) {
    return NextResponse.json({ error: 'Thread ID is required' }, { status: 400 });
  }

  try {
    const replies = await prisma.reply.findMany({
      where: { threadId },
      orderBy: { createdAt: 'asc' }, // Show oldest replies first
      // Include author if you implement authentication
      // include: { author: { select: { id: true, name: true } } }
    });
    return NextResponse.json(replies);
  } catch (error) {
    console.error('Error fetching replies:', error);
    return NextResponse.json({ error: 'Failed to fetch replies' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// POST /api/threads/[threadId]/replies - Create a new reply
export async function POST(
  request: Request,
  { params }: { params: { threadId: string } }
) {
  const { threadId } = params;

  if (!threadId) {
    return NextResponse.json({ error: 'Thread ID is required' }, { status: 400 });
  }

  try {
    const { body } = await request.json();
    // TODO: Get authorId from session/auth context if implemented

    if (!body) {
      return NextResponse.json({ error: 'Reply body is required' }, { status: 400 });
    }

    // Check if thread exists (optional but good practice)
    const threadExists = await prisma.thread.findUnique({ where: { id: threadId } });
    if (!threadExists) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    const newReply = await prisma.reply.create({
      data: {
        body,
        threadId,
        // authorId: authorId, // Add this if auth is implemented
      },
    });
    return NextResponse.json(newReply, { status: 201 });
  } catch (error) {
    console.error('Error creating reply:', error);
    return NextResponse.json({ error: 'Failed to create reply' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
