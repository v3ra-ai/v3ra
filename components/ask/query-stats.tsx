import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, Coins, Layers } from "lucide-react";
import { QUERY_COST, QUERY_COST_FIXED_DECIMALS } from "@/lib/constants";
import { useWallet } from "@solana/wallet-adapter-react";
import { useCreditsStore } from "@/store/credit-store";

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
  const { publicKey } = useWallet();
  const {
    fetchSavedCredits,
    savedCredits,
    totalCredits,
    displayUnpaid,
    setUserCreditsTotal,
    setQueriesUnpaid,
    setQueriesCostTotal,
    hasPaid,
  } = useCreditsStore();

  // Fetch saved credits and sync store props
  useEffect(() => {
    console.log("QueryStats syncing store:", {
      userCreditsTotal,
      queriesUnpaid,
      queriesCostTotal,
      queriesRequested,
      hasPaid,
      publicKey: publicKey?.toBase58() || "none",
    });
    fetchSavedCredits(publicKey);
    setUserCreditsTotal(userCreditsTotal);
    setQueriesUnpaid(queriesUnpaid);
    setQueriesCostTotal(queriesCostTotal);
  }, [
    publicKey,
    userCreditsTotal,
    queriesUnpaid,
    queriesCostTotal,
    queriesRequested,
    hasPaid,
    fetchSavedCredits,
    setUserCreditsTotal,
    setQueriesUnpaid,
    setQueriesCostTotal,
  ]);

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
  }, [displayUnpaid, hasTriggeredOpen, hasTriggeredClose, isOpen]);

  // Debug logging
  console.log("QueryStats collapsible state:", {
    displayUnpaid,
    isOpen,
    hasTriggeredOpen,
    hasTriggeredClose,
    hasPaid,
  });
  console.log("Credits left calculation:", {
    savedCredits,
    userCreditsTotal,
    queriesRequested,
    creditsLeft: Math.max(0, totalCredits - queriesRequested),
  });
  console.log("Queries unpaid calculation:", {
    queriesUnpaid,
    queriesCostTotal,
    totalCredits,
    displayUnpaid,
    hasPaid,
  });
  console.log("Showing query cost:", {
    queriesCostTotal,
    solCost: queriesCostTotal * QUERY_COST,
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
              Credits left: {Math.max(0, totalCredits - queriesRequested)}
            </span>
            <ChevronDown
              className={`h-5 w-5 transition-transform ${isOpen ? "rotate-180" : ""}`}
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="flex flex-col gap-4 mt-4">
            <div className="md:flex items-center gap-2 hidden">
              <span className="text-gray-700 dark:text-zinc-400">
                Credits left
              </span>
              <span className="bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full text-zinc-700 dark:text-zinc-300">
                {Math.max(0, totalCredits - queriesRequested)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-700 dark:text-zinc-400">
                Cost to query: ({displayUnpaid})
              </span>
              {displayUnpaid > 0 && (
                <span className="bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full text-zinc-700 dark:text-zinc-300">
                  {queriesCostTotal} credits (
                  {(queriesCostTotal * QUERY_COST).toFixed(
                    QUERY_COST_FIXED_DECIMALS
                  )}{" "}
                  SOL)
                </span>
              )}
            </div>
            <Link href="/credits">
              <Button className="rounded-md bg-zinc-100 dark:bg-zinc-800 border border-gray-300 dark:border-gray-700 pl-2 py-1 text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-900 cursor-pointer w-full">
              Stake to get more
              </Button>
            </Link>
            <Link href="/credits">
              <Button className="rounded-md bg-zinc-100 dark:bg-zinc-600 border border-gray-300 dark:border-gray-700 pl-2 py-1 text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-900 cursor-pointer w-full">
                Buy Credits
              </Button>
            </Link>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Desktop: Always visible */}
      <div className="hidden md:flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-gray-700 dark:text-zinc-400">Credits left</span>
          <span className="bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full text-zinc-700 dark:text-zinc-300">
            {Math.max(0, totalCredits - queriesRequested)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-700 dark:text-zinc-400">
            Cost to query: ({displayUnpaid})
          </span>
          {displayUnpaid > 0 && (
            <span className="bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full text-zinc-700 dark:text-zinc-300">
              {queriesCostTotal} credits (
              {(queriesCostTotal * QUERY_COST).toFixed(
                QUERY_COST_FIXED_DECIMALS
              )}{" "}
              SOL)
            </span>
          )}
        </div>
        <div className="flex justify-between gap-2">
          <Link href="/credits">
            <Button className="rounded-md bg-zinc-100 dark:bg-zinc-800 border border-gray-300 dark:border-gray-700 pl-2 py-1 text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-900 cursor-pointer">
            <Layers /> Stake to get more
            </Button>
          </Link>
          <Link href="/credits">
          <Button className="rounded-md bg-zinc-100 dark:bg-zinc-800 border border-gray-300 dark:border-gray-700 pl-2 py-1 text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-900 cursor-pointer">
          <Coins /> Buy Credits
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
