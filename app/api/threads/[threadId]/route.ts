import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/threads/[threadId] - Fetch a single thread by ID
export async function GET(req: NextRequest) {
  // Extract threadId from the URL
  const threadId = req.nextUrl.pathname.split('/').pop();

  if (!threadId) {
    return NextResponse.json({ error: 'Thread ID is required' }, { status: 400 });
  }

  try {
    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
      // Optionally include related data
      // include: { replies: true }
    });

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    return NextResponse.json(thread);
  } catch (error) {
    console.error('Error fetching thread:', error);
    return NextResponse.json({ error: 'Failed to fetch thread' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}