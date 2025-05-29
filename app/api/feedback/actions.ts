'use server';

import { prisma } from '@/lib/db/client';
import { Prisma } from '@prisma/client'; // Import Prisma from @prisma/client
import { createSupabaseServerClient } from '@/lib/supabase-client';

interface FeedbackInput {
  rating: 'thumbs_up' | 'thumbs_down';
  userId: string;
  username: string;
  email: string;
  url: string;
  component: string;
  action: string;
  explanation?: string;
  options?: string[];
  includeBrowserInfo: boolean;
  browserInfo?: { userAgent: string } | undefined;
}

export async function submitFeedback(input: FeedbackInput) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user || user.id !== input.userId) {
      return { error: 'Unauthorized' };
    }

    await prisma.feedback.create({
      data: {
        userId: input.userId,
        username: input.username,
        email: input.email,
        rating: input.rating,
        explanation: input.explanation,
        options: input.options || [],
        includeBrowserInfo: input.includeBrowserInfo,
        browserInfo: input.browserInfo ?? Prisma.JsonNull,
        url: input.url,
        component: input.component,
        action: input.action,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('[submitFeedback] Error:', error);
    return { error: (error as Error).message };
  }
}