
"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";
import { LoadingSpinner } from "@/components/loading-spinner-new";
import { Coins } from "lucide-react";
import { useCreditsStore } from '@/store/credit-store';
import { supabase } from '@/lib/supabase-client';

export default function NavbarCredits() {
  const { publicKey } = useWallet();
  const { userFreeCredits, userPaidCredits, creditsLoading, fetchAllCredits } = useCreditsStore();
  const [email, setEmail] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true); // Local loading state

  // Calculate total credits
  const totalCredits = userFreeCredits + userPaidCredits;

  // Fetch email on mount
  useEffect(() => {
    const fetchEmail = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setEmail(session?.user?.email);
        console.log('[NavbarCredits] Fetched email:', session?.user?.email);
      } catch (err) {
        console.error('[NavbarCredits] Error fetching email:', err);
      }
    };
    fetchEmail();
  }, []);

  // Fetch credits when publicKey or email changes
  useEffect(() => {
    if (publicKey && email) {
      fetchAllCredits(publicKey, email);
    }
  }, [publicKey, email, fetchAllCredits]);

  // Update loading state based on credits
  useEffect(() => {
    if (!creditsLoading && userFreeCredits !== 0 && userPaidCredits !== 0) {
      setIsLoading(false);
      console.log('[NavbarCredits] Credits loaded:', { userFreeCredits, userPaidCredits, totalCredits });
    } else {
      setIsLoading(true);
    }
  }, [creditsLoading, userFreeCredits, userPaidCredits, totalCredits]);

  if (!publicKey) {
    return null;
  }

  console.log('[NavbarCredits] Rendering:', { totalCredits, isLoading });

  return (
    <div className="flex items-center text-md text-zinc-600 dark:text-zinc-300">
      <Link href="/credits-all/">
        <div className="flex items-center">
          <Coins size={16} /> <span className="mx-2">Total Credits:</span>
          <span className="text-sky-700 dark:text-sky-300 bg-zinc-200 dark:bg-zinc-700 ml-1 px-2 py-1 rounded-md">
            {isLoading ? (
              <>
                {console.log("[NavbarCredits] Rendering LoadingSpinner for credits fetch")}
                <LoadingSpinner
                  noWrapper
                  type="pulse"
                  color="#d946ef"
                  size={5}
                  message=""
                />
              </>
            ) : (
              totalCredits
            )}
          </span>
        </div>
      </Link>
    </div>
  );
}