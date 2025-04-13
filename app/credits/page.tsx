// app/credits/page.tsx
import CreditSlider from "@/components/credit-slider";
import { TopNav

 } from "@/components/top-nav";
export default function CreditsPage() {
  return (
    <div className="min-h-screen bg-black flex flex-col">
      <TopNav />
      <div className="flex-grow flex items-center justify-center">
        <CreditSlider />
      </div>
    </div>
  );
}