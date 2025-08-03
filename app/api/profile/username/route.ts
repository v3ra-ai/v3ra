import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-client';
import { prisma } from '@/lib/db/client';
import { rateLimitRelaxed } from '@/lib/middleware/rate-limit';
import { withCSRFProtection } from '@/lib/middleware/csrf';
import { validateRequestBody, profileUpdateSchema } from '@/lib/validation/schemas';
import { createLogger } from '@/lib/logger';

const logger = createLogger('profile-username');

// PATCH /api/profile/username  { username: "new_name" }
export const PATCH = rateLimitRelaxed(withCSRFProtection(async (req: NextRequest) => {
  try {
    const { data: validated, error: validationError } = await validateRequestBody(req, profileUpdateSchema.pick({ username: true }));

    if (validationError || !validated?.username) {
      return NextResponse.json({ error: validationError || 'Username is required' }, { status: 400 });
    }

    const desiredUsername = validated.username.toLowerCase();

    // Auth
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check uniqueness
    const existing = await prisma.user.findUnique({ where: { username: desiredUsername } });
    if (existing && existing.id !== user.id) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
    }

    // Upsert
    await prisma.user.update({ where: { id: user.id }, data: { username: desiredUsername } });

    return NextResponse.json({ success: true, username: desiredUsername });
  } catch (err) {
    logger.error('Username update error', err);
    return NextResponse.json({ error: 'Failed to update username' }, { status: 500 });
  }
}));
