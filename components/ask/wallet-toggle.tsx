"use client";

import { useCallback } from "react";
import { Switch } from "@/components/ui/switch";
import { PaymentControls } from "@/components/ask/payment-controls";
import { QUERY_COST, QUERY_COST_FIXED_DECIMALS } from "@/lib/constants";
import { useCreditsStore } from "@/store/credit-store";

interface WalletToggleProps {
  payWithWallet: boolean;
  setPayWithWallet: (value: boolean) => void;
  queriesCostTotal: number;
  userCreditsTotal: number;
  userFreeCredits: number;
  userPaidCredits: number;
  queriesRequested: number;
  queriesUnpaid: number;
  highlightPayButton?: boolean;
  context?: "scrollbar" | "default";
}

export default function WalletToggle({
  payWithWallet,
  setPayWithWallet,
  queriesCostTotal,
  userCreditsTotal,
  userFreeCredits,
  userPaidCredits,
  queriesRequested,
  queriesUnpaid,
  highlightPayButton = false,
  context = "default",
}: WalletToggleProps) {
  const { totalCredits } = useCreditsStore();

  const handleCheckedChange = useCallback(
    (checked: boolean) => {
      console.log("[WalletToggle] handleCheckedChange:", { checked, queriesUnpaid, context });
      setPayWithWallet(checked);
    },
    [setPayWithWallet]
  );

  const queriesLeft = Math.max(0, totalCredits - queriesRequested);
  const displayUnpaid = Math.max(0, queriesUnpaid);
  const shouldShowPaymentControls = totalCredits < queriesRequested;
  const paymentAmount = Math.max(0, queriesRequested - totalCredits) * QUERY_COST;

  console.log("[WalletToggle] render:", {
    payWithWallet,
    queriesUnpaid,
    totalCredits,
    queriesCostTotal,
    queriesRequested,
    queriesLeft,
    paymentAmount,
    userPaidCredits,
    context,
    shouldShowPaymentControls,
    screenWidth: typeof window !== "undefined" ? window.innerWidth : "unknown",
  });

  return (
    <div className={`flex items-center justify-between ${context === "default" ? "mb-3" : "mb-1"}`}>
      <div className="flex items-center gap-3 flex-wrap">
        {context !== "scrollbar" && (
          <div className="flex items-center gap-3 hidden md:flex">
            <Switch
              checked={payWithWallet}
              onCheckedChange={handleCheckedChange}
              className="switch data-[state=checked]:bg-[#46BBA6]"
            />
            <span className="font-medium text-gray-500 dark:text-gray-400">
              Pay ({paymentAmount.toFixed(QUERY_COST_FIXED_DECIMALS)} SOL)
            </span>
          </div>
        )}
        {(context === "scrollbar" ? payWithWallet && shouldShowPaymentControls : shouldShowPaymentControls) && (
          <PaymentControls
            queriesCostTotal={queriesCostTotal}
            userCreditsTotal={userCreditsTotal}
            userFreeCredits={userFreeCredits}
            userPaidCredits={userPaidCredits}
            queriesUnpaid={displayUnpaid}
            queriesRequested={queriesRequested}
            highlightPayButton={highlightPayButton}
          />
        )}
        <div className="flex flex-row md:flex-row flex-col gap-1 items-center">
          {!shouldShowPaymentControls && (
            <>
              <span className="text-gray-700 dark:text-zinc-400 text-sm">Credits left</span>
              <span className="bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full text-zinc-700 dark:text-zinc-300 text-sm">
                {queriesLeft}
              </span>
            </>
          )}
          {context === "scrollbar" && !shouldShowPaymentControls && queriesCostTotal > 0 && (
            <span className="text-gray-700 dark:text-zinc-400 text-sm">
              Query cost: {queriesCostTotal} credits
            </span>
          )}
        </div>
      </div>
    </div>
  );
}