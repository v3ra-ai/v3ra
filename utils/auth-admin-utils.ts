/**
 * Utility functions for server-side admin authentication and authorization.
 */

import { createSupabaseServerClient } from '@/lib/supabase-client';
import { ADMIN_EMAILS } from '@/lib/constants';

// Server-side admin email restriction
export async function restrictToAdminEmails() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (!user || error) {
    return { isAuthorized: false, error: 'User not authenticated' };
  }
  if (!user.email || !ADMIN_EMAILS.includes(user.email)) {
    return { isAuthorized: false, error: `User email ${user.email} not authorized` };
  }
  return { isAuthorized: true, user };
}