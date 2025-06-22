// app/api/credits/decrement/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-client';
import { prisma } from '@/lib/db/client';
import { PublicKey } from '@solana/web3.js';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { verifyCsrfToken } from '@/utils/csrf-utils';
import { QUERY_COST } from '@/lib/constants';

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
    // Use the server client from our lib
    const supabase = await createSupabaseServerClient();

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
        const result = await prisma.$queryRaw<{ decrement_free_credits: { success: boolean; message?: string; new_balance?: number } }[]>`
          SELECT decrement_free_credits(
            ${userId},
            ${creditAmount}::integer,
            ${'Query execution'},
            ${JSON.stringify({ 
              email: sessionEmail,
              ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
              userAgent: req.headers.get('user-agent')
            })}::jsonb
          ) as decrement_free_credits;
        `;
        
        const decrementResult = result[0].decrement_free_credits;
        
        if (!decrementResult.success) {
          throw new Error(decrementResult.message || 'Failed to decrement credits');
        }
        
        const newCredits = decrementResult.new_balance;

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

    try {
      const result = await prisma.$queryRaw<{ decrement_paid_credits: { success: boolean; message?: string; new_balance?: number } }[]>`
        SELECT decrement_paid_credits(
          ${walletPublicKey},
          ${creditAmount}::integer,
          ${'Query execution'},
          ${JSON.stringify({ 
            email: sessionEmail,
            ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
            userAgent: req.headers.get('user-agent')
          })}::jsonb
        ) as decrement_paid_credits;
      `;
      
      const decrementResult = result[0].decrement_paid_credits;
      
      if (!decrementResult.success) {
        throw new Error(decrementResult.message || 'Failed to decrement credits');
      }

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
          credits: decrementResult.new_balance,
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