import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST /api/replies/[replyId]/upvote - Increment upvotes for a reply
export async function POST(
  request: Request,
  { params }: { params: { replyId: string } }
) {
  const { replyId } = params;

  if (!replyId) {
    return NextResponse.json({ error: 'Reply ID is required' }, { status: 400 });
  }

  try {
    // Check if reply exists
    const reply = await prisma.reply.findUnique({
      where: { id: replyId },
    });

    if (!reply) {
      return NextResponse.json({ error: 'Reply not found' }, { status: 404 });
    }

    // Atomically increment the upvotes
    const updatedReply = await prisma.reply.update({
      where: { id: replyId },
      data: {
        upvotes: {
          increment: 1,
        },
      },
    });

    return NextResponse.json(updatedReply);
  } catch (error) {
    console.error('Error upvoting reply:', error);
    // Handle potential errors like concurrent updates if necessary
    return NextResponse.json({ error: 'Failed to upvote reply' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
