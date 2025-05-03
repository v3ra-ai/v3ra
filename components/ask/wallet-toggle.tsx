"use client";

import { useCallback } from "react";
import { Switch } from "@/components/ui/switch";
import { PaymentControls } from "@/components/ask/payment-controls";
import { QUERY_COST, QUERY_COST_FIXED_DECIMALS } from "@/lib/constants";

interface WalletToggleProps {
  payWithWallet: boolean;
  setPayWithWallet: (value: boolean) => void;
  hasPaid: boolean;
  setHasPaid: (value: boolean) => void;
  queriesCostTotal: number;
  userCreditsTotal: number;
  userFreeCredits: number;
  userPaidCredits: number;
  queriesRequested: number;
  queriesUnpaid: number;
  highlightPayButton?: boolean;
  context?: "scrollbar" | "default"; // Added to differentiate scrollbar view
}

export default function WalletToggle({
  payWithWallet,
  setPayWithWallet,
  hasPaid,
  setHasPaid,
  queriesCostTotal,
  userCreditsTotal,
  userFreeCredits,
  userPaidCredits,
  queriesRequested,
  queriesUnpaid,
  highlightPayButton = false,
  context = "default", // Default to non-scrollbar view
}: WalletToggleProps) {
  const handleCheckedChange = useCallback(
    (checked: boolean) => {
      setPayWithWallet(checked);
    },
    [setPayWithWallet]
  );

  const queriesLeft = Math.max(0, userCreditsTotal - queriesRequested); // Credits left after reserving queriesRequested
  const displayUnpaid = Math.max(0, queriesUnpaid); // Never show negative queriesUnpaid

  return (
    <div className={`flex items-center justify-between ${context==="default" ? "mb-3" : "mb-1"} `}>
      <div className="flex items-center gap-3 flex-wrap">
        {context !== "scrollbar" && (
          <div className="flex items-center gap-3 hidden md:flex">
            <Switch
              checked={payWithWallet}
              onCheckedChange={handleCheckedChange}
              className="switch data-[state=checked]:bg-[#46BBA6]"
            />
            <span className="font-medium text-gray-500 dark:text-gray-400">
              Pay with Wallet ({(queriesCostTotal * QUERY_COST).toFixed(QUERY_COST_FIXED_DECIMALS)} SOL)
            </span>
          </div>
        )}
        {payWithWallet && (
          <PaymentControls
            hasPaid={hasPaid}
            setHasPaid={setHasPaid}
            queriesCostTotal={queriesCostTotal}
            userCreditsTotal={userCreditsTotal}
            userFreeCredits={userFreeCredits}
            userPaidCredits={userPaidCredits}
            queriesUnpaid={displayUnpaid} // Use displayUnpaid to avoid negative values
            highlightPayButton={highlightPayButton}
          />
        )}
        {!payWithWallet && (
          <div className="md:flex items-center gap-2 hidden">
            <span className="text-gray-700 dark:text-zinc-400">Credits left</span>
            <span className="bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full text-zinc-700 dark:text-zinc-300">
              {queriesLeft}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}