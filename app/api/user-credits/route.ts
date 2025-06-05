
// app/api/user-credits/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { resetFreeCredits } from '@/lib/db/user-credits';

export async function GET(req: NextRequest) {
  try {
    // Get email from query parameter (e.g., ?email=user@example.com)
    const url = new URL(req.url);
    const email = url.searchParams.get('email');

    if (!email) {
      console.error('[user-credits] Missing email query parameter');
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) {
      console.error('[user-credits] User not found for email:', email);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Reset free credits if needed (ensures 10 daily credits)
    const { freeCredits } = await resetFreeCredits(user.id);

    // Fetch paid credits (via userCreditId if linked)
    const userCredit = await prisma.userCredit.findFirst({
      where: { user: { id: user.id } },
      select: { credits: true, walletPublicKey: true },
    });

    const purchasedCredits = userCredit?.credits ?? 0;

    console.log('[user-credits] Fetched credits:', {
      email,
      freeCredits,
      purchasedCredits,
    });

    return NextResponse.json({
      freeCredits,
      purchasedCredits,
      walletPublicKey: userCredit?.walletPublicKey ?? null,
      reset: true,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[user-credits] Error fetching credits:', errorMessage, { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}