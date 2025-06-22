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
    <div className="flex items-center text-sm font-medium">
      <Link href="/credits-all/" className="group">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card dark:bg-white/5 border border-border dark:border-white/10 hover:border-primary/50 dark:hover:border-cyan-500/30 transition-all duration-200">
          <Wallet className="w-4 h-4 text-muted-foreground group-hover:text-foreground dark:group-hover:text-cyan-400" />
          <span className="text-muted-foreground group-hover:text-foreground dark:group-hover:text-cyan-400">Credits</span>
          <span className="font-semibold text-foreground dark:text-cyan-400 min-w-[2rem] text-center">
            {isLoading ? (
              <>
                {console.log("[NavbarCredits] Rendering LoadingSpinner for credits fetch", {
                  timestamp: new Date().toISOString(),
                })}
                <LoadingSpinner
                  noWrapper
                  type="pulse"
                  color="currentColor"
                  size={4}
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