/**
 * Utility functions for client-side admin authentication and authorization.
 */

'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';

export function useAdminAuth() {
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check auth status with retry
    async function checkAuth(retryCount = 0) {
      try {
        setIsLoading(true);
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError) {
          console.error('Supabase auth error:', authError.message);
          if (retryCount < 2) {
            // Retry after 1 second if error (e.g., session not yet synced)
            setTimeout(() => checkAuth(retryCount + 1), 1000);
            return;
          }
          setIsAuthenticated(false);
          setIsAuthorized(false);
          setError(`Authentication failed: ${authError.message}`);
          setUserEmail(null);
          return;
        }

        if (!user) {
          console.warn('No user found in Supabase session');
          setIsAuthenticated(false);
          setIsAuthorized(false);
          setError('User not authenticated');
          setUserEmail(null);
          return;
        }

        setIsAuthenticated(true);
        setUserEmail(user.email ?? null);

        // Call server-side API to check admin status
        const response = await fetch('/api/check-admin', {
          credentials: 'include', // Ensure cookies are sent
        });
        const result = await response.json();

        if (!response.ok) {
          console.error('Check admin API error:', result.message);
          setIsAuthorized(false);
          setError(result.message || 'Admin check failed');
        } else {
          setIsAuthorized(result.isAdmin);
          setError(null);
        }
      } catch (err) {
        console.error('Authentication check exception:', err);
        if (retryCount < 2) {
          setTimeout(() => checkAuth(retryCount + 1), 1000);
          return;
        }
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.email);
      if (event === 'SIGNED_IN' && session?.user) {
        setIsAuthenticated(true);
        setUserEmail(session.user.email ?? null);

        try {
          const response = await fetch('/api/check-admin', {
            credentials: 'include',
          });
          const result = await response.json();
          setIsAuthorized(response.ok ? result.isAdmin : false);
          setError(response.ok ? null : result.message || 'Admin check failed');
        } catch (err) {
          console.error('Admin check on sign-in failed:', err);
          setIsAuthorized(false);
          setError('Admin check failed');
        }
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