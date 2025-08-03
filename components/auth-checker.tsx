'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { createLogger } from '@/lib/logger';

const logger = createLogger('auth-checker');

export function AuthChecker() {
  const [authStatus, setAuthStatus] = useState<{
    hasSession: boolean;
    hasUser: boolean;
    cookies: string[];
  } | null>(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        // Check session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        logger.info('Session check', { 
          hasSession: !!sessionData.session,
          sessionError: sessionError?.message 
        });

        // Check user
        const { data: userData, error: userError } = await supabase.auth.getUser();
        logger.info('User check', { 
          hasUser: !!userData.user,
          userError: userError?.message 
        });

        // Check cookies
        const cookies = document.cookie.split('; ').filter(c => 
          c.includes('sb-') || c.includes('csrf')
        );
        logger.info('Cookie check', { cookies });

        setAuthStatus({
          hasSession: !!sessionData.session,
          hasUser: !!userData.user,
          cookies
        });

        // If we have a session, test the API
        if (sessionData.session) {
          const response = await fetch('/api/test/auth-check', {
            credentials: 'include'
          });
          const apiData = await response.json();
          logger.info('API auth check', apiData);
        }
      } catch (error) {
        logger.error('Auth check failed', error);
      }
    }

    checkAuth();
  }, []);

  if (!authStatus) return null;

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-black/80 text-white text-xs rounded-lg max-w-xs">
      <div>Session: {authStatus.hasSession ? '✓' : '✗'}</div>
      <div>User: {authStatus.hasUser ? '✓' : '✗'}</div>
      <div>Cookies: {authStatus.cookies.length}</div>
    </div>
  );
}