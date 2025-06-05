// components/credits/credits-layout.tsx
'use client';

import CreditSlider from '@/components/credits/credit-slider';
import StakeSlider from '@/components/credits/stake-slider';
import { Landmark } from 'lucide-react';
import { useCreditBalance } from '@/hooks/useCreditBalance';
import { useCreditsStore } from '@/store/credit-store';
import { motion } from 'framer-motion';

export function CreditsLayout() {
  const { creditBalance, setCreditBalance } = useCreditBalance();
  const { userFreeCredits, userPaidCredits } = useCreditsStore();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-4xl mx-auto p-6 dark:bg-zinc-950 dark:border-zinc-700"
    >
      <h1 className="text-4xl font-bold text-center text-zinc-800 dark:text-zinc-200 mb-4">
        Get Credits
      </h1>
      <div className="flex flex-col sm:flex-row gap-4 justify-center text-xl font-semibold text-center text-zinc-700 dark:text-zinc-300 mb-8">
        <div className="flex flex-col items-center w-full sm:w-auto">
          <div className="flex items-center">
            <Landmark className="mr-2" />
            <span>Free Credits: {userFreeCredits}</span>
          </div>
          <div className="text-xs mt-1 text-zinc-300 dark:text-zinc-600">
            Daily Free Credits
          </div>
        </div>
        <div className="flex flex-col items-center w-full sm:w-auto">
          <div className="flex items-center">
            <Landmark className="mr-2" />
            <span>Paid Credits: {userPaidCredits}</span>
          </div>
          <div className="text-xs mt-1 text-zinc-300 dark:text-zinc-600">
            Purchased Credits
          </div>
        </div>
        <div className="flex flex-col items-center w-full sm:w-auto">
          <div className="flex items-center">
            <Landmark className="mr-2" />
            <span>Total Credits: {creditBalance ?? 0}</span>
          </div>
          <div className="text-xs mt-1 text-zinc-300 dark:text-zinc-600">
            Total Available
          </div>
        </div>
      </div>
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 p-4 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-sm">
          <CreditSlider creditBalance={creditBalance} setCreditBalance={setCreditBalance} />
        </div>
        <div className="flex-1 p-4 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-sm">
          <StakeSlider />
        </div>
      </div>
    </motion.div>
  );
}