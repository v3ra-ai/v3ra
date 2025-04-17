// app/ask/wallet-toggle.tsx
"use client";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface WalletToggleProps {
  isWalletEnabled: boolean;
  setIsWalletEnabled: (enabled: boolean) => void;
  queryAmount: number; // Add queryAmount prop to calculate SOL cost
}

export function WalletToggle({
  isWalletEnabled,
  setIsWalletEnabled,
  queryAmount,
}: WalletToggleProps) {
  const solCost = (queryAmount * 0.02).toFixed(2); // Calculate SOL cost dynamically

  return (
    <div className="flex items-center space-x-2 mb-4">
      <Switch
        id="wallet-toggle"
        checked={isWalletEnabled}
        onCheckedChange={setIsWalletEnabled}
      />
      <Label htmlFor="wallet-toggle" className="text-white">
        Pay with Wallet ({solCost} SOL)
      </Label>
    </div>
  );
}
