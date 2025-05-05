"use client";

import { useEffect } from "react";
import CreditSlider from "@/components/credits/credit-slider";
import StakeSlider from "@/components/credits/stake-slider";
import { useCreditsStore } from "@/store/credit-store";
import { useWallet } from "@solana/wallet-adapter-react";
import { Landmark } from "lucide-react";

export function CreditsLayout() {
  const { savedCredits, fetchSavedCredits } = useCreditsStore();
  const { publicKey } = useWallet();

  // Fetch saved credits when the page loads or publicKey changes
  useEffect(() => {
    fetchSavedCredits(publicKey);
  }, [publicKey, fetchSavedCredits]);

  return (
    <div className="w-full md-round max-w-4xl mx-auto p-6 dark:bg-zinc-950 dark:border-zinc-700">
      <h1 className="text-4xl font-bold text-center text-zinc-800 dark:text-zinc-200 mb-4">
        Get Credits
      </h1>
      <p className="text-xl font-semibold text-center text-zinc-700 dark:text-zinc-300 mb-8">
        <div className="flex w-full justify-center">
          <Landmark /> <span className="ml-2">Balance: {savedCredits} Credits</span>
        </div>
      </p>
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 p-4 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-sm">
          <CreditSlider />
        </div>
        <div className="flex-1 p-4 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-sm">
          <StakeSlider />
        </div>
      </div>
    </div>
  );
}