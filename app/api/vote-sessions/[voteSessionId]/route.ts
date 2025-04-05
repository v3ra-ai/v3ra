import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/vote-sessions/[voteSessionId] - Fetch a single vote session by ID
export async function GET(req: NextRequest) {
  try {
    // Extract voteSessionId from the URL
    const voteSessionId = req.nextUrl.pathname.split('/')[3]; // Assuming path is /api/vote-sessions/{id}

    if (!voteSessionId) {
      return NextResponse.json(
        { error: 'Vote Session ID is required' },
        { status: 400 }
      );
    }

    const voteSession = await prisma.voteSession.findUnique({
      where: { id: voteSessionId },
      // Optionally include related data
      // include: { validatorResponses: true, threads: true },
    });

    if (!voteSession) {
      return NextResponse.json(
        { error: 'Vote Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(voteSession);
  } catch (error) {
    console.error('Error fetching vote session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vote session' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
