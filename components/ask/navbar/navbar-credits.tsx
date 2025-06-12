"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";
import { LoadingSpinner } from "@/components/loading-spinner-new";
import { Wallet } from "lucide-react";
import { useCreditsStore, useCreditsStoreWalletSync } from "@/store/credit-store";
import { supabase } from "@/lib/supabase-client";
import { memo } from "react";

function NavbarCredits() {
  const { publicKey } = useWallet();
  const { userFreeCredits, userPaidCredits, creditsLoading, fetchAllCredits } = useCreditsStore();
  const [email, setEmail] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  // Sync wallet state changes
  useCreditsStoreWalletSync(email);

  // Calculate total credits with useMemo for performance
  const totalCredits = useMemo(
    () => userFreeCredits + userPaidCredits,
    [userFreeCredits, userPaidCredits]
  );

  // Fetch email on mount
  useEffect(() => {
    const fetchEmail = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const userEmail = session?.user?.email;
        setEmail(userEmail);
        console.log("[NavbarCredits] Fetched email:", userEmail, {
          timestamp: new Date().toISOString(),
        });
      } catch {
        console.error("[NavbarCredits] Error fetching email", {
          timestamp: new Date().toISOString(),
        });
      }
    };
    fetchEmail();
  }, []);

  // Fetch credits when publicKey or email changes
  const fetchCreditsIfNeeded = useCallback(() => {
    if (!email) {
      console.log("[NavbarCredits] Skipping fetch: missing email", {
        publicKey: publicKey?.toBase58() || "none",
        email,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    console.log("[NavbarCredits] Triggering fetchAllCredits:", {
      publicKey: publicKey?.toBase58() || "none",
      email,
      timestamp: new Date().toISOString(),
    });
    fetchAllCredits(publicKey, email, true); // Force fetch to bypass cache
  }, [publicKey, email, fetchAllCredits]);

  useEffect(() => {
    fetchCreditsIfNeeded();
  }, [fetchCreditsIfNeeded]);

  // Listen for credits-updated event to refresh credits
  useEffect(() => {
    const handleCreditsUpdated = () => {
      console.log("[NavbarCredits] Received credits-updated event, fetching credits", {
        publicKey: publicKey?.toBase58() || "none",
        email,
        timestamp: new Date().toISOString(),
      });
      fetchCreditsIfNeeded();
    };

    window.addEventListener("credits-updated", handleCreditsUpdated);
    return () => window.removeEventListener("credits-updated", handleCreditsUpdated);
  }, [fetchCreditsIfNeeded, publicKey, email]);

  // Update loading state
  useEffect(() => {
    if (!creditsLoading) {
      setIsLoading(false);
      console.log("[NavbarCredits] Credits loaded:", {
        userFreeCredits,
        userPaidCredits,
        totalCredits,
        timestamp: new Date().toISOString(),
      });
    } else {
      setIsLoading(true);
      console.log("[NavbarCredits] Credits loading:", {
        creditsLoading,
        userFreeCredits,
        userPaidCredits,
        timestamp: new Date().toISOString(),
      });
    }
  }, [creditsLoading, userFreeCredits, userPaidCredits, totalCredits]);

  if (!email) {
    console.log("[NavbarCredits] No email, returning null", {
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
          <Wallet size={16} /> <span className="mx-2">Credits:</span>
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