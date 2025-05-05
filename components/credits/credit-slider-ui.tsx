import * as Slider from "@radix-ui/react-slider";
import { Square } from "lucide-react";

interface CreditSliderUIProps {
  creditAmount: number;
  setCreditAmount: (value: number) => void;
  requiredSol: number;
  creditBalance: number | null;
  isLoading: boolean;
  isValid: boolean;
  hasEnoughSol: boolean;
  isWalletConnected: boolean;
  onPay: () => void;
  onChangeWallet: () => void;
  decimalPlaces: number;
}

export default function CreditSliderUI({
  creditAmount,
  setCreditAmount,
  requiredSol,
  creditBalance,
  isLoading,
  isValid,
  hasEnoughSol,
  isWalletConnected,
  onPay,
  onChangeWallet,
  decimalPlaces,
}: CreditSliderUIProps) {
  return (
    <div className="max-w-md mx-auto p-6 bg-zinc-200 dark:bg-zinc-800 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-zinc-100">
        Purchase Credits
      </h2>
      <div className="text-center mb-6">
        <span className="text-5xl font-bold text-zinc-900 dark:text-zinc-100">
          {creditAmount}
        </span>
      </div>
      <div className="mb-6">
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
          Select Credits
        </label>
        <div className="relative">
          <Slider.Root
            className="relative flex items-center select-none touch-none w-full h-5"
            value={[creditAmount]}
            onValueChange={(value) => setCreditAmount(value[0])}
            min={0}
            max={100}
            step={1}
          >
            <Slider.Track className="bg-zinc-300 dark:bg-zinc-600 relative grow rounded-full h-1">
              <Slider.Range className="absolute bg-blue-500 dark:bg-blue-400 rounded-full h-full" />
            </Slider.Track>
            <Slider.Thumb
              className="block w-5 h-5 bg-blue-500 dark:bg-blue-400 rounded-full hover:bg-blue-600 dark:hover:bg-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              aria-label="Credits"
            />
          </Slider.Root>
          <div className="flex justify-between mt-2 text-sm text-zinc-700 dark:text-zinc-300">
            <span>Min. (0)</span>
            <span>Max. (100)</span>
          </div>
        </div>
      </div>
      <div className="mb-6">
        <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
          Cost: {requiredSol.toFixed(decimalPlaces)} SOL
        </p>
      </div>
      <p className="mb-4 text-sm text-zinc-700 dark:text-zinc-300">
        Current Balance:{" "}
        {isWalletConnected && creditBalance !== null
          ? `${creditBalance} credits`
          : "n/a - connect wallet"}
      </p>
      <button
        onClick={onPay}
        disabled={
          isLoading ||
          creditAmount === 0 ||
          (!isWalletConnected ? false : !isValid || !hasEnoughSol)
        }
        className={`w-full py-2 px-4 rounded-md font-medium text-white ${
          isLoading ||
          creditAmount === 0 ||
          (!isWalletConnected ? false : !isValid || !hasEnoughSol)
            ? "bg-zinc-400 dark:bg-zinc-600 cursor-not-allowed"
            : "bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-500"
        }`}
      >
        {isLoading
          ? "Processing..."
          : creditAmount === 0
            ? "Select Credits"
            : isWalletConnected
              ? "Pay Now"
              : "Connect Wallet"}
      </button>
      {isWalletConnected && (
        <div className="text-center mt-2 flex items-center justify-center gap-2">
          <Square
            className="h-4 w-4"
            fill={isWalletConnected ? "#22c55e" : "#ef4444"}
          />
          <button
            onClick={onChangeWallet}
            className="text-sm text-blue-500 dark:text-blue-400 hover:underline"
          >
            Change Wallet
          </button>
        </div>
      )}
    </div>
  );
}