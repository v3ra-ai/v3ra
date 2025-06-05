
'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { toast } from 'sonner';
import { useCreditsStore } from '@/store/credit-store';
import { supabase } from '@/lib/supabase-client';

export const useCreditBalance = () => {
  const { publicKey } = useWallet();
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const [email, setEmail] = useState<string | undefined>(undefined);
  const { fetchAllCredits } = useCreditsStore(); // Line 14: Replaced fetchSavedCredits

  // Fetch email on mount
  useEffect(() => {
    const fetchEmail = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        setEmail(session?.user?.email);
        console.log('[useCreditBalance] Fetched email:', session?.user?.email);
      } catch (err) {
        console.error('[useCreditBalance] Error fetching email:', err);
      }
    };
    fetchEmail();
  }, []);

  useEffect(() => {
    const fetchCreditBalance = async () => {
      try {
        if (!email) {
          console.log('[useCreditBalance] No email, skipping credit fetch');
          return;
        }

        // Fetch credits using fetchAllCredits
        await fetchAllCredits(publicKey, email); // Updated to fetchAllCredits

        // Get updated credits from store
        const { userFreeCredits, userPaidCredits } = useCreditsStore.getState();
        const totalCredits = (userFreeCredits ?? 0) + (userPaidCredits ?? 0);
        console.log('[useCreditBalance] Fetched credit balance:', { userFreeCredits, userPaidCredits, totalCredits });

        setCreditBalance(totalCredits);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        toast.error(`Error fetching credit balance: ${errorMsg}`);
        console.error('[useCreditBalance] Error fetching credit balance:', error);
        setCreditBalance(0);
      }
    };

    fetchCreditBalance();
  }, [publicKey, email, fetchAllCredits]);

  return { creditBalance, setCreditBalance };
};