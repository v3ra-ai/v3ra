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
  const { userFreeCredits, userPaidCredits, creditsLoading, fetchAllCredits, savedCreditsTimestamp, resetCredits } = useCreditsStore();
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
        console.log("[NavbarCredits] Fetched email:", session?.user?.email, {
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        console.error("[NavbarCredits] Error fetching email:", err, {
          timestamp: new Date().toISOString(),
        });
      }
    };
    fetchEmail();
  }, []);

  // Fetch credits with reset and forceFetch
  const fetchCreditsIfNeeded = useCallback(() => {
    if (!publicKey || !email) {
      console.log("[NavbarCredits] Skipping fetch: missing publicKey or email", {
        publicKey: publicKey?.toBase58(),
        email,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    console.log("[NavbarCredits] Triggering fetchAllCredits:", {
      publicKey: publicKey.toBase58(),
      email,
      timestamp: new Date().toISOString(),
    });
    resetCredits(); // Clear stale state
    fetchAllCredits(publicKey, email, true); // Force fetch
  }, [publicKey, email, fetchAllCredits, resetCredits]);

  // Trigger fetch on mount and dependencies
  useEffect(() => {
    fetchCreditsIfNeeded();
  }, [fetchCreditsIfNeeded]);

  // Refetch on navigation
  useEffect(() => {
    const handleRouteChange = () => {
      console.log("[NavbarCredits] Route changed, refetching credits:", {
        pathname: window.location.pathname,
        timestamp: new Date().toISOString(),
      });
      fetchCreditsIfNeeded();
    };

    // Next.js 13+ App Router doesn't expose router.events, use window.location
    window.addEventListener('popstate', handleRouteChange);
    return () => window.removeEventListener('popstate', handleRouteChange);
  }, [fetchCreditsIfNeeded]);

  // Update loading state
  useEffect(() => {
    if (!creditsLoading && (userFreeCredits !== 0 || userPaidCredits !== 0)) {
      setIsLoading(false);
      console.log("[NavbarCredits] Credits loaded:", {
        userFreeCredits,
        userPaidCredits,
        totalCredits,
        savedCreditsTimestamp: savedCreditsTimestamp
          ? new Date(savedCreditsTimestamp).toISOString()
          : null,
        timestamp: new Date().toISOString(),
      });
    } else {
      setIsLoading(true);
      console.log("[NavbarCredits] Credits loading or zero:", {
        creditsLoading,
        userFreeCredits,
        userPaidCredits,
        timestamp: new Date().toISOString(),
      });
    }
  }, [creditsLoading, userFreeCredits, userPaidCredits, totalCredits, savedCreditsTimestamp]);

  if (!publicKey) {
    console.log("[NavbarCredits] No publicKey, returning null", {
      timestamp: new Date().toISOString(),
    });
    return null;
  }

  console.log("[NavbarCredits] Rendering:", {
    totalCredits,
    isLoading,
    userFreeCredits,
    userPaidCredits,
    timestamp: new Date().toISOString(),
  });

  return (
    <div className="flex items-center text-md text-zinc-600 dark:text-zinc-300">
      <Link href="/credits-all/">
        <div className="flex items-center">
          <Coins size={16} /> <span className="mx-2">Total Credits:</span>
          <span className="text-sky-700 dark:text-sky-300 bg-zinc-200 dark:bg-zinc-700 ml-1 px-2 py-1 rounded-md">
            {isLoading ? (
              <>
                {console.log("[NavbarCredits] Rendering LoadingSpinner for credits fetch", {
                  timestamp: new Date().toISOString(),
                })}
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