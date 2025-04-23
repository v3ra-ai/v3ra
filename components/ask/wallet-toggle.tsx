"use client";

import { useCallback } from "react";
import { Switch } from "@/components/ui/switch";
import { PaymentControls } from "@/components/ask/payment-controls";
import { INITIAL_AVAILABLE_QUERIES } from "@/lib/constants";

interface WalletToggleProps {
  payWithWallet: boolean;
  setPayWithWallet: (value: boolean) => void;
  hasPaid: boolean;
  setHasPaid: (value: boolean) => void;
  costToQuery: string;
  totalQueries: number;
  userAiQueryAmountRequested: number;
  highlightPayButton?: boolean;
  context?: "scrollbar" | "query-form" | undefined;
}

/**
 * Renders a toggle for enabling wallet payments, with payment controls and a queries left display.
 * Displays "Pay" in scrollbar context and "Pay with Wallet" in query-form context.
 * In scrollbar context, shows Queries left badge on desktop when no payment is needed.
 */
export default function WalletToggle({
  payWithWallet,
  setPayWithWallet,
  hasPaid,
  setHasPaid,
  costToQuery,
  totalQueries,
  userAiQueryAmountRequested,
  highlightPayButton = false,
  context = "query-form",
}: WalletToggleProps) {
  // Memoize the onCheckedChange handler
  const handleCheckedChange = useCallback(
    (checked: boolean) => {
      setPayWithWallet(checked);
    },
    [setPayWithWallet]
  );

  const queriesLeft = Math.max(0, INITIAL_AVAILABLE_QUERIES - userAiQueryAmountRequested);

  return (
    <div className={`flex items-center justify-between ${context === "query-form" && "mb-6"}`}>
      <div className="flex items-center gap-3 flex-wrap">
        {/* Hide Switch and span on mobile, and hide entirely for scrollbar context */}
        <div className={`flex items-center gap-3 ${context === "scrollbar" ? "hidden" : "hidden md:flex"}`}>
          <Switch
            checked={payWithWallet}
            onCheckedChange={handleCheckedChange}
            className="switch data-[state=checked]:bg-[#46BBA6]"
          />
          <span className="font-medium text-gray-500 dark:text-gray-400">
            {context === "scrollbar" ? "" : `Pay with Wallet (${costToQuery} SOL)`}
          </span>
        </div>
        {payWithWallet && (
          <PaymentControls
            hasPaid={hasPaid}
            setHasPaid={setHasPaid}
            solCost={parseFloat(costToQuery)}
            totalQueries={totalQueries}
            userAiQueryAmountRequested={userAiQueryAmountRequested}
            highlightPayButton={highlightPayButton}
            context={context}
          />
        )}
        {context === "scrollbar" && !payWithWallet && (
          <div className="md:flex items-center gap-2 hidden">
            <span className="text-gray-700 dark:text-zinc-400">Queries left</span>
            <span className="bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full text-zinc-700 dark:text-zinc-300">
              {queriesLeft}
            </span>
          </div>
        )}
      </div>
      {/* <Button variant="ghost" className="text-gray-500">
        <RefreshCw size={20} />
      </Button> */}
    </div>
  );
}