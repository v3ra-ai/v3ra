import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useLLMStore } from "@/store/llm-store";
import { useEffect, useState } from "react";

interface QueryFormAISliderProps {
  queriesRequested: number;
  handleQueryAmountChange: (newAmount: number) => void;
  allowedAmountQueries: number;
  context?: string;
  hideButtons?: boolean;
}

export function QueryFormAISlider({
  queriesRequested,
  handleQueryAmountChange,
  allowedAmountQueries,
  context,
  hideButtons = false,
}: QueryFormAISliderProps) {
  const { llms } = useLLMStore();
  const [isClient, setIsClient] = useState(false);
  const [displayValue, setDisplayValue] = useState(allowedAmountQueries);
  
  useEffect(() => {
    setIsClient(true);
    // Update display value once client-side
    setDisplayValue(queriesRequested);
  }, [queriesRequested]);
  
  // During SSR, use allowedAmountQueries to avoid hydration mismatch
  const selectedLLMCount = isClient ? llms.filter((llm) => llm.enabled).length : 0;
  const maxQueries = selectedLLMCount > 0 ? selectedLLMCount : allowedAmountQueries;
  
  // Ensure boolean values for disabled props to avoid hydration mismatch
  const currentValue = isClient ? displayValue : allowedAmountQueries;
  const isMinusDisabled = currentValue <= 1;
  const isPlusDisabled = currentValue >= maxQueries;

  return (
    <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 rounded-md px-0 py-0">
      <div className="border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 px-0 py-1 rounded-md min-w-[120px] text-center">
        <span className="text-gray-500 dark:text-gray-200 ml-1 whitespace-nowrap">
          Query {isClient ? displayValue : allowedAmountQueries} AIs:
        </span>
      </div>
      <Slider
        value={[isClient ? displayValue : allowedAmountQueries]}
        onValueChange={(value) => handleQueryAmountChange(value[0])}
        min={1}
        max={maxQueries}
        step={1}
        className="w-20
          [&_[role=slider]]:h-5 [&_[role=slider]]:w-5
          [&_[role=slider]]:bg-zinc-300
          [&_[role=slider]]:dark:bg-zinc-300
          [&_[role=slider]]:border
          [&_[role=slider]]:border-zinc-400 [&_[role=slider]]:dark:border-zinc-500
          [&_[role=slider]]:focus:ring-1
          [&_[role=slider]]:focus:ring-zinc-500
          [&>*]:h-5
          [&>*]:bg-zinc-200
          [&>*]:dark:bg-zinc-600
          [&>*]:rounded-full"
      />
      {context !== "scrollbar" && !hideButtons && (
        <div className="invisible md:visible min-w-18">
          <Button
            className="border-zinc-300 dark:border-zinc-700 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 h-8 w-8 p-0 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 text-xl cursor-pointer md:visible"
            onClick={() => handleQueryAmountChange(queriesRequested - 1)}
            disabled={isMinusDisabled}
          >
            -
          </Button>
          <Button
            className="border-zinc-300 dark:border-zinc-800 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 h-8 w-8 p-0 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 text-xl cursor-pointer ml-1 md:visible"
            onClick={() => handleQueryAmountChange(queriesRequested + 1)}
            disabled={isPlusDisabled}
          >
            +
          </Button>
        </div>
      )}
    </div>
  );
}