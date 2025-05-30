/**
 * Utility functions for admin authentication and authorization.
 */

import { createSupabaseServerClient } from '@/lib/supabase-client';
import { ADMIN_EMAILS } from '@/lib/constants';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';

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

// Client-side admin auth hook
export function useAdminAuth() {
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check auth status on mount
    async function checkAuth() {
      try {
        setIsLoading(true);
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          setIsAuthenticated(false);
          setIsAuthorized(false);
          setError('User not authenticated');
          setUserEmail(null);
          return;
        }

        setIsAuthenticated(true);
        setUserEmail(user.email ?? null);

        if (!user.email || !ADMIN_EMAILS.includes(user.email)) {
          setIsAuthorized(false);
          setError(`User email ${user.email} not authorized`);
        } else {
          setIsAuthorized(true);
          setError(null);
        }
      } catch {
        setIsAuthenticated(false);
        setIsAuthorized(false);
        setError('Authentication check failed');
        setUserEmail(null);
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setIsAuthenticated(true);
        setUserEmail(session.user.email ?? null);
        setIsAuthorized(session.user.email ? ADMIN_EMAILS.includes(session.user.email) : false);
        setError(session.user.email && !ADMIN_EMAILS.includes(session.user.email)
          ? `User email ${session.user.email} not authorized`
          : null);
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setIsAuthorized(false);
        setUserEmail(null);
        setError('User not authenticated');
      }
    });

    // Cleanup subscription
    return () => subscription.unsubscribe();
  }, []);

  return { isAuthorized, isAuthenticated, userEmail, error, isLoading };
}