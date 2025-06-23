'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { QUERY_COST, QUERY_COST_FIXED_DECIMALS } from "@/lib/constants";
import { useWallet } from "@solana/wallet-adapter-react";
import { useCreditsStore } from "@/store/credit-store";
import { supabase } from '@/lib/supabase-client';
import { LoadingSpinner } from "@/components/loading-spinner-new";

interface QueryStatsProps {
  userCreditsTotal: number;
  queriesUnpaid: number;
  queriesCostTotal: number;
  queriesRequested: number;
}

export default function QueryStats({
  userCreditsTotal,
  queriesUnpaid,
  queriesCostTotal,
  queriesRequested,
}: QueryStatsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasTriggeredOpen, setHasTriggeredOpen] = useState(false);
  const [hasTriggeredClose, setHasTriggeredClose] = useState(false);
  const [email, setEmail] = useState<string | undefined>(undefined);
  const [isCreditsLoading, setIsCreditsLoading] = useState(true);
  const { publicKey } = useWallet();
  const {
    fetchAllCredits,
    savedCredits,
    totalCredits,
    displayUnpaid,
    setUserCreditsTotal,
    setQueriesUnpaid,
    setQueriesCostTotal,
    hasPaid,
    creditsLoading,
    savedCreditsTimestamp,
    resetCredits,
  } = useCreditsStore();

  // Fetch email on mount
  useEffect(() => {
    const fetchEmail = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setEmail(session?.user?.email);
        console.log('[QueryStats] Fetched email:', session?.user?.email, {
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        console.error('[QueryStats] Error fetching email:', err);
      }
    };
    fetchEmail();
  }, []);

  // Fetch credits with reset
  useEffect(() => {
    if (publicKey && email) {
      console.log("[QueryStats] Triggering fetchAllCredits:", {
        publicKey: publicKey.toBase58(),
        email,
        timestamp: new Date().toISOString(),
      });
      resetCredits(); // Clear stale state
      fetchAllCredits(publicKey, email, true); // Force fetch
    } else {
      console.log("[QueryStats] Skipping fetchAllCredits:", {
        publicKey: publicKey?.toBase58(),
        email,
        timestamp: new Date().toISOString(),
      });
    }
    setUserCreditsTotal(userCreditsTotal);
    setQueriesUnpaid(queriesUnpaid);
    setQueriesCostTotal(queriesCostTotal);
  }, [
    publicKey,
    email,
    userCreditsTotal,
    queriesUnpaid,
    queriesCostTotal,
    queriesRequested,
    hasPaid,
    fetchAllCredits,
    setUserCreditsTotal,
    setQueriesUnpaid,
    setQueriesCostTotal,
    resetCredits,
  ]);

  // Update loading state
  useEffect(() => {
    if (!creditsLoading && savedCreditsTimestamp !== null && totalCredits >= 0) {
      setIsCreditsLoading(false);
      console.log("[QueryStats] Credits loaded:", {
        totalCredits,
        savedCredits,
        queriesRequested,
        creditsLeft: Math.max(0, totalCredits - queriesRequested),
        timestamp: new Date(savedCreditsTimestamp).toISOString(),
      });
    } else {
      setIsCreditsLoading(true);
      console.log("[QueryStats] Credits still loading:", {
        creditsLoading,
        savedCreditsTimestamp,
        totalCredits,
        timestamp: new Date().toISOString(),
      });
    }
  }, [creditsLoading, savedCreditsTimestamp, totalCredits, queriesRequested, savedCredits]);

  // Auto-trigger open/close based on displayUnpaid
  useEffect(() => {
    if (displayUnpaid > 0 && !hasTriggeredOpen) {
      setIsOpen(true);
      setHasTriggeredOpen(true);
      setHasTriggeredClose(false);
    } else if (displayUnpaid <= 0 && !hasTriggeredClose) {
      setIsOpen(false);
      setHasTriggeredClose(true);
      setHasTriggeredOpen(false);
    }
  }, [displayUnpaid, hasTriggeredOpen, hasTriggeredClose]);

  // Debug logging
  console.log("[QueryStats] Collapsible state:", {
    displayUnpaid,
    isOpen,
    hasTriggeredOpen,
    hasTriggeredClose,
    hasPaid,
    timestamp: new Date().toISOString(),
  });
  console.log("[QueryStats] Credits left calculation:", {
    savedCredits,
    userCreditsTotal,
    totalCreditsFromStore: totalCredits,
    queriesRequested,
    creditsLeft: Math.max(0, totalCredits - queriesRequested),
    timestamp: new Date().toISOString(),
  });
  console.log("[QueryStats] Queries unpaid calculation:", {
    queriesUnpaid,
    queriesCostTotal,
    totalCredits,
    displayUnpaid,
    hasPaid,
    timestamp: new Date().toISOString(),
  });
  console.log("[QueryStats] Showing query cost:", {
    queriesCostTotal,
    solCost: queriesCostTotal * QUERY_COST,
    timestamp: new Date().toISOString(),
  });

  return (
    <div className="w-full mt-4">
      {/* Mobile: Collapsible; Desktop: Always visible */}
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="md:hidden">
        <CollapsibleTrigger asChild>
          <Button
            variant="outline"
            className="flex items-center justify-between w-full bg-zinc-200 dark:bg-zinc-700 text-gray-700 dark:text-zinc-300 cursor-pointer truncate"
          >
            <span>
              Credits left:{' '}
              {isCreditsLoading ? (
                <LoadingSpinner
                  noWrapper
                  type="pulse"
                  color="#d946ef"
                  size={5}
                  message=""
                />
              ) : (
                Math.max(0, totalCredits - queriesRequested)
              )}
            </span>
            <ChevronDown
              className={`h-5 w-5 transition-transform ${isOpen ? "rotate-180" : ""}`}
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="flex flex-col gap-4 mt-4">
            <div className="flex items-center gap-2">
              <span className="text-gray-700 dark:text-zinc-400">
                Query cost: ({displayUnpaid})
              </span>
              {displayUnpaid > 0 && (
                <span className="bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full text-zinc-700 dark:text-zinc-300">
                  {queriesCostTotal} credits (
                  {(queriesCostTotal * QUERY_COST).toFixed(
                    QUERY_COST_FIXED_DECIMALS
                  )}{' '}
                  SOL)
                </span>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Desktop: Always visible */}
      <div className="hidden md:flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-gray-700 dark:text-zinc-400">Credits left</span>
          <span className="bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full text-zinc-700 dark:text-zinc-300">
            {isCreditsLoading ? (
              <LoadingSpinner
                noWrapper
                type="pulse"
                color="#d946ef"
                size={5}
                message=""
              />
            ) : (
              Math.max(0, totalCredits - queriesRequested)
            )}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-700 dark:text-zinc-400">
            Query cost: ({displayUnpaid})
          </span>
          {displayUnpaid > 0 && (
            <span className="bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full text-zinc-700 dark:text-zinc-300">
              {queriesCostTotal} credits (
              {(queriesCostTotal * QUERY_COST).toFixed(
                QUERY_COST_FIXED_DECIMALS
              )}{' '}
              SOL)
            </span>
          )}
        </div>
      </div>
    </div>
  );
}