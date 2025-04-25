"use client";

import CreditSlider from "@/components/credits/credit-slider";
import StakeSlider from "@/components/credits/stake-slider";

// interface CreditsLayoutProps {}

/**
 * Presentational component for the Credits page UI.
 * Renders a heading and two sliders (CreditSlider, StakeSlider) in a responsive layout
 * with Zinc-based styling to match other pages.
 */
export function CreditsLayout() {
  return (
    <div className="w-full md-round max-w-4xl mx-auto p-6  dark:bg-zinc-950 dark:border-zinc-700">
      <h1 className="text-4xl font-bold text-center text-zinc-800 dark:text-zinc-200 mb-8">
        Get Credits
      </h1>
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