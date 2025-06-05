// app/api/credits/decrement/route.tsx
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/db/client';
import { PublicKey } from '@solana/web3.js';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { verifyCsrfToken } from '@/utils/csrf-utils';
import { QUERY_COST } from '@/lib/constants';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

interface RequestBody {
  type?: 'free' | 'paid';
  creditAmount?: number;
  walletPublicKey?: string;
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
});

export async function POST(req: NextRequest) {
  // Verify CSRF token
  const csrfResponse = verifyCsrfToken(req);
  if (csrfResponse) {
    return csrfResponse;
  }

  let body: RequestBody = {
    type: undefined,
    creditAmount: undefined,
    walletPublicKey: undefined,
  };

  try {
    // Initialize Supabase client without cookie management
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });

    // Get session using Supabase auth
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session?.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = sessionData.session.user.id;

    // Parse request body
    body = (await req.json()) as RequestBody;
    const { type, creditAmount, walletPublicKey } = decrementCreditsSchema.parse(body);

    if (type === 'free') {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { freeCredits: true },
      });

      if (!user || user.freeCredits < creditAmount) {
        const errorMessage = `Insufficient free credits: Need ${creditAmount}, have ${user?.freeCredits ?? 0}`;
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

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          freeCredits: { decrement: creditAmount },
          updatedAt: new Date(),
        },
      });

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
          credits: updatedUser.freeCredits,
        },
        { status: 200 },
      );
    } else if (type === 'paid') {
      if (!walletPublicKey) {
        return NextResponse.json({ error: 'Wallet public key required for paid credits' }, { status: 400 });
      }

      const userCredit = await prisma.userCredit.findUnique({
        where: { walletPublicKey },
        select: { credits: true },
      });

      if (!userCredit || userCredit.credits < creditAmount) {
        const errorMessage = `Insufficient paid credits: Need ${creditAmount}, have ${userCredit?.credits ?? 0}`;
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
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to decrement credits';
    await prisma.paymentLog.create({
      data: {
        id: uuidv4(),
        walletPublicKey: body.walletPublicKey ?? 'unknown',
        credits:
          body.creditAmount && Number.isInteger(body.creditAmount) ? body.creditAmount : 0,
        solAmount:
          (body.creditAmount && Number.isInteger(body.creditAmount) ? body.creditAmount : 0) * QUERY_COST,
        status: 'FAILED',
        error: errorMessage,
        createdAt: new Date(),
      },
    });
    console.error('[Credits/Decrement] Error decrementing credits:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}