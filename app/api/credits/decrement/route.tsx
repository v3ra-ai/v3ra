// app/api/credits/decrement/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db/client';
import { PublicKey } from '@solana/web3.js';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { verifyCsrfToken } from '@/utils/csrf-utils';
import { QUERY_COST } from '@/lib/constants';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY',
  );
}

const decrementCreditsSchema = z.object({
  type: z.enum(['free', 'paid']),
  creditAmount: z.number().int().min(1).max(100),
  walletPublicKey: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true; // Allow undefined for free credits
        try {
          new PublicKey(val);
          return true;
        } catch {
          return false;
        }
      },
      { message: 'Invalid Solana public key' },
    ),
  email: z.string().email().optional(),
});

export async function POST(req: NextRequest) {
  // Verify CSRF token
  const csrfResponse = verifyCsrfToken(req);
  if (csrfResponse) {
    console.error('[credits/decrement] CSRF verification failed:', csrfResponse);
    return csrfResponse;
  }

  let requestBody: {
    walletPublicKey?: string;
    creditAmount?: number;
    email?: string;
    type?: 'free' | 'paid';
  } = {};

  try {
    // Await the cookie store (typed as Promise in Next 15)
    const cookieStore = await cookies();

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch (error) {
            console.error('[credits/decrement] Failed to set cookies:', error);
          }
        },
      },
    });

    // Get session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    console.log('[credits/decrement] Session fetch:', {
      sessionExists: !!session,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      sessionError: sessionError?.message,
    });
    if (sessionError || !session?.user?.id || !session?.user?.email) {
      console.error('[credits/decrement] No valid session:', {
        sessionError: sessionError?.message,
      });
      return NextResponse.json(
        { error: 'Unauthorized: No valid session' },
        { status: 401 },
      );
    }

    const userId = session.user.id;
    const sessionEmail = session.user.email;

    // Parse request body
    requestBody = await req.json();
    console.log('[credits/decrement] Request body:', requestBody);
    const parsedBody = decrementCreditsSchema.safeParse(requestBody);
    if (!parsedBody.success) {
      const errorMessage = `Invalid request body: ${parsedBody.error.message}`;
      console.error(
        '[credits/decrement] Schema validation failed:',
        parsedBody.error,
      );
      await prisma.paymentLog.create({
        data: {
          id: uuidv4(),
          walletPublicKey: requestBody.walletPublicKey ?? 'unknown',
          credits: requestBody.creditAmount ?? 0,
          solAmount: (requestBody.creditAmount ?? 0) * QUERY_COST,
          status: 'FAILED',
          error: errorMessage,
          createdAt: new Date(),
        },
      });
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    const { type, creditAmount, walletPublicKey, email } = parsedBody.data;

    // Validate email matches session
    if (email && email !== sessionEmail) {
      console.error('[credits/decrement] Email mismatch:', {
        requestEmail: email,
        sessionEmail,
      });
      return NextResponse.json(
        { error: 'Unauthorized: Email mismatch' },
        { status: 401 },
      );
    }

    if (type === 'free') {
      // Check if user exists first
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });

      if (!user) {
        const errorMessage = `User not found: ${userId}`;
        await prisma.paymentLog.create({
          data: {
            id: uuidv4(),
            walletPublicKey: walletPublicKey ?? 'unknown',
            credits: creditAmount,
            solAmount: creditAmount * QUERY_COST,
            status: 'FAILED',
            error: errorMessage,
            createdAt: new Date(),
          },
        });
        return NextResponse.json({ error: errorMessage }, { status: 400 });
      }

      // Use secure function to decrement free credits
      try {
        const result = await prisma.$queryRaw<{ decrement_free_credits: number }[]>`
          SELECT security.decrement_free_credits(
            ${userId},
            ${creditAmount}::integer,
            'Query execution'
          ) as decrement_free_credits;
        `;
        
        const newCredits = result[0].decrement_free_credits;

        await prisma.paymentLog.create({
          data: {
            id: uuidv4(),
            walletPublicKey: walletPublicKey ?? 'unknown',
            credits: creditAmount,
            solAmount: creditAmount * QUERY_COST,
            status: 'DECREMENTED',
            createdAt: new Date(),
          },
        });

        return NextResponse.json(
          {
            success: true,
            credits: newCredits,
          },
          { status: 200 },
        );
      } catch (error) {
        console.error('[credits/decrement] Secure function error:', error);
        
        // Handle specific error cases
        if (error instanceof Error && error.message.includes('Insufficient credits')) {
          return NextResponse.json({ error: error.message }, { status: 400 });
        }
        
        throw error; // Re-throw other errors
      }
    }

    /* ---------- PAID CREDITS ---------- */
    if (!walletPublicKey) {
      console.error('[credits/decrement] Missing walletPublicKey for paid credits');
      return NextResponse.json(
        { error: 'Wallet public key required for paid credits' },
        { status: 400 },
      );
    }

    const userCredit = await prisma.userCredit.findUnique({
      where: { walletPublicKey },
      select: { credits: true },
    });

    if (!userCredit || userCredit.credits < creditAmount) {
      const errorMessage = `Insufficient paid credits: Need ${creditAmount}, have ${
        userCredit?.credits ?? 0
      }`;
      await prisma.paymentLog.create({
        data: {
          id: uuidv4(),
          walletPublicKey,
          credits: creditAmount,
          solAmount: creditAmount * QUERY_COST,
          status: 'FAILED',
          error: errorMessage,
          createdAt: new Date(),
        },
      });
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    const updatedCredit = await prisma.userCredit.update({
      where: { walletPublicKey },
      data: {
        credits: { decrement: creditAmount },
        updatedAt: new Date(),
      },
    });

    await prisma.paymentLog.create({
      data: {
        id: uuidv4(),
        walletPublicKey,
        credits: creditAmount,
        solAmount: creditAmount * QUERY_COST,
        status: 'DECREMENTED',
        createdAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        success: true,
        credits: updatedCredit.credits,
      },
      { status: 200 },
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to decrement credits';
    await prisma.paymentLog.create({
      data: {
        id: uuidv4(),
        walletPublicKey: requestBody.walletPublicKey ?? 'unknown',
        credits: requestBody.creditAmount ?? 0,
        solAmount: (requestBody.creditAmount ?? 0) * QUERY_COST,
        status: 'FAILED',
        error: errorMessage,
        createdAt: new Date(),
      },
    });
    console.error('[credits/decrement] Error decrementing credits:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}