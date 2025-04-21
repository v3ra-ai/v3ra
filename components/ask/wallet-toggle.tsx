import { useCallback } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { PaymentControls } from "@/components/ask/payment-controls";

interface WalletToggleProps {
  payWithWallet: boolean;
  setPayWithWallet: (value: boolean) => void;
  hasPaid: boolean;
  setHasPaid: (value: boolean) => void;
  costToQuery: string;
  totalQueries: number;
  userAiQueryAmountRequested: number;
  highlightPayButton?: boolean;
}

export default function WalletToggle({
  payWithWallet,
  setPayWithWallet,
  hasPaid,
  setHasPaid,
  costToQuery,
  totalQueries,
  userAiQueryAmountRequested,
  highlightPayButton = false,
}: WalletToggleProps) {
  // Memoize the onCheckedChange handler
  const handleCheckedChange = useCallback((checked: boolean) => {
    setPayWithWallet(checked);
  }, [setPayWithWallet]);

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        {/* Hide Switch and span on mobile, show on md: */}
        <div className="hidden md:flex items-center gap-3">
          <Switch
            checked={payWithWallet}
            onCheckedChange={handleCheckedChange}
            className="switch data-[state=checked]:bg-[#46BBA6]"
          />
          <span className="font-medium text-gray-500 dark:text-gray-400">
            Pay with Wallet ({costToQuery} SOL)
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
          />
        )}
      </div>
      <Button variant="ghost" className="text-gray-500">
        <RefreshCw size={20} />
      </Button>
    </div>
  );
}