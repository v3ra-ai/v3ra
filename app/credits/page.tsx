// app/credits/page.tsx
import CreditSlider from "@/components/credit-slider";
import StakeSlider from "@/components/stake-slider";
import { TopNav } from "@/components/top-nav";

export default function CreditsPage() {
  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <TopNav />
      <h1 className="text-4xl font-bold text-center text-gray-900 dark:text-gray-100 mb-8 mt-16">
        Get Credits
      </h1>
      <div className="flex flex-row gap-6">
        <div className="flex-1">
          <CreditSlider />
        </div>
        <div className="flex-1">
          <StakeSlider />
        </div>
      </div>
    </div>
  );
}