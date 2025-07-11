'use client';

import { useState, useEffect } from 'react';
import type { VoteResult } from '@/lib/types';
import { Dispatch, SetStateAction } from 'react';
import { sanitizeError } from '@/utils/security-utils';
import { RESULT_QUERIES_CARDS, QUERIES_COST_EACH_DEFAULT, QUERIES_REQUESTED_DEFAULT } from '@/lib/constants';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase-client';
import { sessionCache } from '@/lib/utils/cache';
import { getCSRFToken } from '@/lib/utils/csrf';

interface BroadcastQueryOptions {
  csrfToken?: string;
  queryMode?: string;
  queriesRequested?: number;
  isFreeQuery?: boolean;
  selectedLLMIds?: string[];
  philosophyMode?: boolean;
}

interface BroadcastQueryParams {
  query: string;
  options?: BroadcastQueryOptions;
}

interface BroadcastQueryResult {
  broadcastQuery: (params: BroadcastQueryParams) => Promise<void>;
}

function isErrorResponse(result: VoteResult | { error: string }): result is { error: string } {
  return 'error' in result && typeof result.error === 'string';
}

export function useBroadcastQuery(
  setVoteHistory: Dispatch<SetStateAction<VoteResult[]>>,
  setLastVoteResult: Dispatch<SetStateAction<VoteResult | null>>,
  refetchNetworkState?: () => Promise<void>,
  fetchVoteHistory?: () => Promise<void>,
): BroadcastQueryResult {
  // Removed useWallet - not needed anymore
  const [email, setEmail] = useState<string | undefined>(undefined);

  // Fetch email on mount
  useEffect(() => {
    const fetchEmail = async () => {
      try {
        // Check cache first
        const cachedSession = sessionCache.get('user-session');
        if (cachedSession?.user?.email) {
          setEmail(cachedSession.user.email);
          console.log('[useBroadcastQuery] Using cached email:', cachedSession.user.email);
          return;
        }
        
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        // Cache the session
        if (session) {
          sessionCache.set('user-session', session);
        }
        
        setEmail(session?.user?.email);
        console.log('[useBroadcastQuery] Fetched and cached email:', session?.user?.email);
      } catch {
        console.error('[useBroadcastQuery] Error fetching email');
      }
    };
    fetchEmail();
  }, []);

  const broadcastQuery = async ({ query, options = {} }: BroadcastQueryParams) => {
    console.log('[useBroadcastQuery] Received query with options:', {
      query,
      queryMode: options.queryMode,
      queriesRequested: options.queriesRequested,
      isFreeQuery: options.isFreeQuery,
      selectedLLMIds: options.selectedLLMIds,
      csrfToken: options.csrfToken ? '[REDACTED]' : undefined,
      timestamp: new Date().toISOString(),
    });

    const queriesRequested = options.queriesRequested || QUERIES_REQUESTED_DEFAULT;
    const queryCost = queriesRequested * QUERIES_COST_EACH_DEFAULT;

    // Credit validation removed - all queries are now free

    try {
      // Get CSRF token if not provided
      const csrfToken = options.csrfToken || await getCSRFToken();
      
      const response = await fetch('/api/broadcast-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'X-CSRF-Token': csrfToken }),
        },
        body: JSON.stringify({
          queryText: query,
          queryMode: options.queryMode,
          queriesRequested,
          selectedLLMIds: options.selectedLLMIds,
          philosophyMode: options.philosophyMode,
        }),
        credentials: 'include',
      });

      const rawBody = await response.text();
      type QueryResponse = VoteResult | { error: string };
      let voteResult: QueryResponse;
      try {
        voteResult = JSON.parse(rawBody);
      } catch {
        console.error('[useBroadcastQuery] Invalid JSON response:', rawBody);
        throw new Error(`Invalid JSON response from server: ${rawBody}`);
      }

      console.log('[useBroadcastQuery] Broadcast query response:', {
        status: response.status,
        url: response.url,
        headers: Object.fromEntries(response.headers),
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
      console.log('[useBroadcastQuery] Setting lastVoteResult with data:', {
        id: result.id,
        queryText: result.queryText,
        validatorResponsesCount: result.validatorResponses?.length || 0,
        isConsensusReached: result.isConsensusReached,
        consensusValue: result.consensusValue,
      });
      
      setLastVoteResult(result);
      setVoteHistory((prevHistory: VoteResult[]) => {
        const newHistory = [result, ...prevHistory].slice(0, RESULT_QUERIES_CARDS);
        console.log('[useBroadcastQuery] Updating voteHistory:', newHistory.length, 'items');
        return newHistory;
      });

      await new Promise((resolve) => setTimeout(resolve, 500));
      await refetchWithRetry(1, fetchVoteHistory, refetchNetworkState);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('[useBroadcastQuery] Error:', sanitizeError(error), {
        query,
        queryMode: options.queryMode,
        queriesRequested,
        selectedLLMIds: options.selectedLLMIds,
        timestamp: new Date().toISOString(),
      });
      toast.error(error.message);
      throw error;
    }
  };

  return { broadcastQuery };
}

// Utility function to retry async operations
async function refetchWithRetry(
  retries: number,
  fetchVoteHistory?: () => Promise<void>,
  refetchNetworkState?: () => Promise<void>,
): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      if (fetchVoteHistory) await fetchVoteHistory();
      if (refetchNetworkState) await refetchNetworkState();
      return;
    } catch (error) {
      console.error('[useBroadcastQuery] Refetch attempt failed:', error);
      if (i === retries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}