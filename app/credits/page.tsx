// app/credits/page.tsx
import TopNav from "@/components/top-nav";
import CreditSlider from "@/components/credit-slider";
import StakeSlider from "@/components/stake-slider";

export default function CreditsPage() {
  return (
    <>
      <TopNav />
      <div className="w-full max-w-4xl mx-auto p-6">
        <h1 className="text-4xl font-bold text-center text-gray-900 dark:text-gray-100 mb-8">
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
    </>
  );
}
