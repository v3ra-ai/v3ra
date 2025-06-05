
'use client';

import { useCallback, useState, useEffect } from 'react';
import type { VoteResult } from '@/lib/types';
import { Dispatch, SetStateAction } from 'react';
import { sanitizeError } from '@/utils/security-utils';
import { RESULT_QUERIES_CARDS, QUERIES_COST_EACH_DEFAULT, QUERIES_REQUESTED_DEFAULT } from '@/lib/constants';
import { useCreditsStore } from '@/store/credit-store';
import { useWallet } from '@solana/wallet-adapter-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase-client';

interface BroadcastQueryOptions {
  csrfToken?: string;
  queryMode?: string;
  queriesRequested?: number;
}

interface BroadcastQueryResult {
  broadcastQuery: (query: string, options?: BroadcastQueryOptions) => Promise<void>;
}

export function useBroadcastQuery(
  setVoteHistory: Dispatch<SetStateAction<VoteResult[]>>,
  setLastVoteResult: Dispatch<SetStateAction<VoteResult | null>>,
  refetchNetworkState?: () => Promise<void>,
  fetchVoteHistory?: () => Promise<void>,
): BroadcastQueryResult {
  const { userFreeCredits, userPaidCredits, decrementFreeCredits, decrementPaidCredits, fetchAllCredits } = useCreditsStore(); // Line 52: Replaced fetchSavedCredits
  const { publicKey } = useWallet();
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | undefined>(undefined);

  // Fetch email on mount
  useEffect(() => {
    const fetchEmail = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        setEmail(session?.user?.email);
        console.log('[useBroadcastQuery] Fetched email:', session?.user?.email);
      } catch (err) {
        console.error('[useBroadcastQuery] Error fetching email:', err);
      }
    };
    fetchEmail();
  }, []);

  const fetchCsrfToken = useCallback(async () => {
    try {
      const response = await fetch('/api/csrf-token', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to fetch CSRF token');
      const data = await response.json();
      setCsrfToken(data.csrfToken);
      return data.csrfToken;
    } catch (error) {
      console.error('[useBroadcastQuery] Error fetching CSRF token:', error);
      throw error;
    }
  }, []);

  const broadcastQuery = useCallback(
    async (query: string, options: BroadcastQueryOptions = {}) => {
      console.log('[useBroadcastQuery] Received query with options:', {
        query,
        queryMode: options.queryMode,
        queriesRequested: options.queriesRequested,
        csrfToken: options.csrfToken ? '[REDACTED]' : undefined,
      });

      const queriesRequested = options.queriesRequested || QUERIES_REQUESTED_DEFAULT;
      const queryCost = queriesRequested * QUERIES_COST_EACH_DEFAULT;

      // Validate credits
      if (userFreeCredits + userPaidCredits < queryCost) {
        toast.error('Insufficient credits for query');
        throw new Error('Insufficient credits for query');
      }

      // Fetch CSRF token if not cached
      const token = csrfToken || (await fetchCsrfToken());

      // Deduct credits (free first, then paid)
      let remainingCost = queryCost;
      if (userFreeCredits >= remainingCost) {
        decrementFreeCredits(remainingCost);
        const response = await fetch('/api/credits/decrement', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': token,
          },
          body: JSON.stringify({ type: 'free', creditAmount: remainingCost }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          toast.error(errorData.error || 'Failed to deduct free credits');
          throw new Error(errorData.error || 'Failed to deduct free credits');
        }
        remainingCost = 0;
      } else {
        remainingCost -= userFreeCredits;
        if (userFreeCredits > 0) {
          decrementFreeCredits(userFreeCredits);
          const response = await fetch('/api/credits/decrement', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRF-Token': token,
            },
            body: JSON.stringify({ type: 'free', creditAmount: userFreeCredits }),
          });
          if (!response.ok) {
            const errorData = await response.json();
            toast.error(errorData.error || 'Failed to deduct free credits');
            throw new Error(errorData.error || 'Failed to deduct free credits');
          }
        }
      }

      if (remainingCost > 0) {
        if (!publicKey) {
          toast.error('Wallet not connected for paid credits');
          throw new Error('Wallet not connected for paid credits');
        }
        decrementPaidCredits(remainingCost);
        const response = await fetch('/api/credits/decrement', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': token,
          },
          body: JSON.stringify({
            type: 'paid',
            creditAmount: remainingCost,
            walletPublicKey: publicKey.toBase58(),
          }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          toast.error(errorData.error || 'Failed to deduct paid credits');
          throw new Error(errorData.error || 'Failed to deduct paid credits');
        }
      }

      try {
        const response = await fetch('/api/broadcast-query', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(options.csrfToken && { 'X-CSRF-Token': options.csrfToken }),
          },
          body: JSON.stringify({
            queryText: query,
            queryMode: options.queryMode,
            queriesRequested,
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
        });

        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}`);
        }

        if ('error' in voteResult && typeof voteResult.error === 'string') {
          throw new Error(voteResult.error);
        }

        const result = voteResult as VoteResult;
        setLastVoteResult(result);
        setVoteHistory((prevHistory: VoteResult[]) => {
          const newHistory = [result, ...prevHistory].slice(0, RESULT_QUERIES_CARDS);
          console.log('[useBroadcastQuery] Updating voteHistory:', newHistory.length, 'items');
          return newHistory;
        });

        await new Promise((resolve) => setTimeout(resolve, 500));
        await refetchWithRetry(1, fetchVoteHistory, refetchNetworkState);
        if (publicKey && email) {
          await fetchAllCredits(publicKey, email); // Updated to fetchAllCredits
        }
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error('[useBroadcastQuery] Error:', sanitizeError(error), {
          query,
          queryMode: options.queryMode,
          queriesRequested,
        });
        toast.error(error.message);
        throw error;
      }
    },
    [
      setVoteHistory,
      setLastVoteResult,
      refetchNetworkState,
      fetchVoteHistory,
      userFreeCredits,
      userPaidCredits,
      decrementFreeCredits,
      decrementPaidCredits,
      publicKey,
      csrfToken,
      fetchCsrfToken,
      email,
      fetchAllCredits, // Updated dependency
    ],
  );

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