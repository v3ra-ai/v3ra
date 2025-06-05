"use client";

import { useEffect, useState, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";
import { LoadingSpinner } from "@/components/loading-spinner-new";
import { Coins } from "lucide-react";
import { useCreditsStore } from "@/store/credit-store";
import { supabase } from "@/lib/supabase-client";
import { memo } from "react";

function NavbarCredits() {
  const { publicKey } = useWallet();
  const { userFreeCredits, userPaidCredits, creditsLoading, fetchAllCredits, savedCreditsTimestamp } = useCreditsStore();
  const [email, setEmail] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  // Calculate total credits
  const totalCredits = userFreeCredits + userPaidCredits;

  // Fetch email on mount
  useEffect(() => {
    const fetchEmail = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setEmail(session?.user?.email);
        console.log("[NavbarCredits] Fetched email:", session?.user?.email);
      } catch (err) {
        console.error("[NavbarCredits] Error fetching email:", err);
      }
    };
    fetchEmail();
  }, []);

  // Fetch credits when publicKey, email, or savedCreditsTimestamp changes
  const fetchCreditsIfNeeded = useCallback(() => {
    if (!publicKey || !email) {
      console.log("[NavbarCredits] Skipping fetch: missing publicKey or email");
      return;
    }

    // Rely on store's caching logic
    console.log("[NavbarCredits] Triggering fetchAllCredits, timestamp:", savedCreditsTimestamp);
    fetchAllCredits(publicKey, email);
  }, [publicKey, email, fetchAllCredits, savedCreditsTimestamp]);

  // Trigger fetch when dependencies change
  useEffect(() => {
    fetchCreditsIfNeeded();
  }, [fetchCreditsIfNeeded]);

  // Update loading state
  useEffect(() => {
    if (!creditsLoading && (userFreeCredits !== 0 || userPaidCredits !== 0)) {
      setIsLoading(false);
      console.log("[NavbarCredits] Credits loaded:", { userFreeCredits, userPaidCredits, totalCredits });
    } else {
      setIsLoading(true);
    }
  }, [creditsLoading, userFreeCredits, userPaidCredits, totalCredits]);

  if (!publicKey) {
    console.log("[NavbarCredits] No publicKey, returning null");
    return null;
  }

  console.log("[NavbarCredits] Rendering:", { totalCredits, isLoading, savedCreditsTimestamp });

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

export default memo(NavbarCredits);