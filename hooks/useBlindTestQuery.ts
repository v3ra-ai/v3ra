'use client';

import { useState, useEffect } from 'react';
import type { VoteResult } from '@/lib/types';
import { Dispatch, SetStateAction } from 'react';
import { sanitizeError } from '@/utils/security-utils';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase-client';
import { sessionCache } from '@/lib/utils/cache';
import { getCSRFToken } from '@/lib/utils/csrf';
import { logger } from '@/lib/utils/client-logger';

interface BlindTestQueryOptions {
  csrfToken?: string;
  pairingStrategy?: 'SMART' | 'UNDERDOG' | 'TITANS' | 'OPEN_SOURCE';
}

interface BlindTestQueryParams {
  query: string;
  options?: BlindTestQueryOptions;
}

interface BlindTestQueryResult {
  broadcastQuery: (params: BlindTestQueryParams) => Promise<void>;
}

function isErrorResponse(result: VoteResult | { error: string }): result is { error: string } {
  return 'error' in result && typeof result.error === 'string';
}

export function useBlindTestQuery(
  setVoteHistory: Dispatch<SetStateAction<VoteResult[]>>,
  setLastVoteResult: Dispatch<SetStateAction<VoteResult | null>>,
): BlindTestQueryResult {
  const [email, setEmail] = useState<string | undefined>(undefined);

  // Fetch email on mount
  useEffect(() => {
    const fetchEmail = async () => {
      try {
        const cachedSession = sessionCache.get('user-session');
        if (cachedSession?.user?.email) {
          setEmail(cachedSession.user.email);
          logger.debug('Using cached email', { email: cachedSession.user.email });
          return;
        }
        
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (session) {
          sessionCache.set('user-session', session);
        }
        
        setEmail(session?.user?.email);
        logger.debug('Fetched and cached email', { email: session?.user?.email });
      } catch {
        logger.error('Error fetching email');
      }
    };
    fetchEmail();
  }, []);

  const broadcastQuery = async ({ query, options = {} }: BlindTestQueryParams) => {
    logger.debug('Starting blind test query', {
      query,
      pairingStrategy: options.pairingStrategy || 'SMART',
      timestamp: new Date().toISOString(),
    });

    try {
      // Get CSRF token if not provided
      const csrfToken = options.csrfToken || await getCSRFToken();
      
      const response = await fetch('/api/blind-test-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'x-csrf-token': csrfToken }),
        },
        body: JSON.stringify({
          queryText: query,
          pairingStrategy: options.pairingStrategy || 'SMART',
        }),
        credentials: 'include',
      });

      const rawBody = await response.text();
      type QueryResponse = VoteResult | { error: string };
      let voteResult: QueryResponse;
      try {
        voteResult = JSON.parse(rawBody);
      } catch {
        logger.error('Invalid JSON response', { rawBody });
        throw new Error(`Invalid JSON response from server: ${rawBody}`);
      }

      logger.debug('Blind test response', {
        status: response.status,
        body: voteResult,
        timestamp: new Date().toISOString(),
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      if (isErrorResponse(voteResult)) {
        throw new Error(voteResult.error);
      }

      const result = voteResult as VoteResult;
      
      // Ensure we have exactly 2 responses for blind testing
      if (!result.validatorResponses || result.validatorResponses.length !== 2) {
        throw new Error('Blind testing requires exactly 2 AI responses');
      }
      
      logger.debug('Setting results', {
        id: result.id,
        queryText: result.queryText,
        model1: result.validatorResponses[0].profileName,
        model2: result.validatorResponses[1].profileName,
      });
      
      setLastVoteResult(result);
      setVoteHistory((prevHistory: VoteResult[]) => {
        const newHistory = [result, ...prevHistory].slice(0, 10);
        logger.debug('Updating voteHistory', { count: newHistory.length });
        return newHistory;
      });

      // Toast notification with blind testing message
      toast.success('Blind test ready! Pick the better response without knowing which AI wrote it.', {
        style: { background: '#22c55e', color: '#ffffff' },
        duration: 5000,
      });

    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('useBlindTestQuery error', { error: sanitizeError(error),
        query,
        timestamp: new Date().toISOString(),
      });
      toast.error(error.message);
      throw error;
    }
  };

  return { broadcastQuery };
}