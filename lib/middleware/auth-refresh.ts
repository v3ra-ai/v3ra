import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-client';
import { createLogger } from '@/lib/logger';

const logger = createLogger('auth-refresh');

/**
 * Middleware to refresh Supabase auth session
 * This ensures the session is valid and refreshed on each request
 */
export async function refreshAuthSession(request: NextRequest): Promise<void> {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      logger.error('Session retrieval error', { error: sessionError.message });
      return;
    }
    
    if (!session) {
      logger.debug('No session to refresh');
      return;
    }
    
    // Check if session needs refresh (within 5 minutes of expiry)
    const expiresAt = new Date(session.expires_at || 0).getTime();
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    
    if (expiresAt - now < fiveMinutes) {
      logger.info('Refreshing auth session', { expiresAt: new Date(expiresAt).toISOString() });
      
      const { data: { session: newSession }, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        logger.error('Session refresh error', { error: refreshError.message });
      } else if (newSession) {
        logger.info('Session refreshed successfully', { 
          newExpiresAt: newSession.expires_at 
        });
      }
    }
  } catch (error) {
    logger.error('Error in auth refresh middleware', error);
  }
}

/**
 * Wrapper to add auth refresh to handlers
 */
export function withAuthRefresh(
  handler: (req: NextRequest) => Promise<NextResponse>
): (req: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest) => {
    await refreshAuthSession(request);
    return handler(request);
  };
}