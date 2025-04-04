import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/vote-sessions/[voteSessionId] - Fetch a single vote session by ID
export async function GET(
  request: Request,
  { params }: { params: { voteSessionId: string } }
) {
  const { voteSessionId } = params;

  if (!voteSessionId) {
    return NextResponse.json({ error: 'Vote Session ID is required' }, { status: 400 });
  }

  try {
    const voteSession = await prisma.voteSession.findUnique({
      where: { id: voteSessionId },
      // Optionally include related data if needed on the page
      // include: { validatorResponses: true, threads: true } 
    });

    if (!voteSession) {
      return NextResponse.json({ error: 'Vote Session not found' }, { status: 404 });
    }

    return NextResponse.json(voteSession);
  } catch (error) {
    console.error('Error fetching vote session:', error);
    return NextResponse.json({ error: 'Failed to fetch vote session' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
