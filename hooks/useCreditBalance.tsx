
// hooks/useCreditBalance.tsx
'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { toast } from 'sonner';
import { useCreditsStore } from '@/store/credit-store';
import { supabase } from '@/lib/supabase-client'; // Adjust import based on your Supabase client setup

export const useCreditBalance = () => {
  const { publicKey } = useWallet();
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const { fetchSavedCredits } = useCreditsStore();

  useEffect(() => {
    const fetchCreditBalance = async () => {
      try {
        // Get current user’s email from Supabase
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session?.user?.email) {
          toast.error('Please log in to view your credits');
          console.error('[useCreditBalance] Failed to get session:', {
            error: sessionError?.message || 'No session',
            session: session ? { userId: session.user?.id, email: session.user?.email } : null,
          });
          setCreditBalance(null); // Indicate unauthenticated state
          return;
        }

        const email = session.user.email;

        // Fetch credits with email query parameter
        const response = await fetch(`/api/user-credits?email=${encodeURIComponent(email)}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include', // Keep in case cookies are needed elsewhere
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMsg = errorData.error || response.statusText || 'Unknown error';
          toast.error(`Failed to fetch credit balance: ${errorMsg}`);
          console.error('[useCreditBalance] Failed to fetch credit balance:', errorMsg, {
            status: response.status,
            url: response.url,
            email,
          });
          setCreditBalance(0);
          return;
        }

        const data = await response.json();
        console.log('[useCreditBalance] Fetched credit balance:', data);

        setCreditBalance((data.freeCredits ?? 0) + (data.purchasedCredits ?? 0));
        await fetchSavedCredits(publicKey, email); // Pass email to fetchSavedCredits
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        toast.error(`Error fetching credit balance: ${errorMsg}`);
        console.error('[useCreditBalance] Error fetching credit balance:', error);
        setCreditBalance(0);
      }
    };

    fetchCreditBalance();
  }, [publicKey, fetchSavedCredits]);

  return { creditBalance, setCreditBalance };
};