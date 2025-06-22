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
    <div className="flex items-center gap-2">
      <div className="bg-card dark:bg-white/5 border border-border dark:border-white/10 rounded-lg px-3 py-2 min-w-[120px] text-center">
        <span className="text-sm font-medium text-muted-foreground dark:text-zinc-300 whitespace-nowrap">
          Query {isClient ? displayValue : allowedAmountQueries} AIs
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
          [&_[role=slider]]:bg-white
          [&_[role=slider]]:dark:bg-cyan-400
          [&_[role=slider]]:border
          [&_[role=slider]]:border-border
          [&_[role=slider]]:dark:border-cyan-400/30
          [&_[role=slider]]:shadow-sm
          [&_[role=slider]]:dark:shadow-[0_0_10px_rgba(0,255,255,0.3)]
          [&_[role=slider]]:focus:ring-2
          [&_[role=slider]]:focus:ring-primary/50
          [&_[role=slider]]:dark:focus:ring-cyan-400/50
          [&>*]:h-2
          [&>*]:bg-muted
          [&>*]:dark:bg-white/10
          [&>*]:rounded-full"
      />
      {context !== "scrollbar" && !hideButtons && (
        <div className="invisible md:visible min-w-18">
          <Button
            className="bg-card dark:bg-white/5 border border-border dark:border-white/10 h-8 w-8 p-0 rounded-lg hover:border-primary/50 dark:hover:border-cyan-500/30 text-lg cursor-pointer transition-all duration-200"
            onClick={() => handleQueryAmountChange(queriesRequested - 1)}
            disabled={isMinusDisabled}
          >
            −
          </Button>
          <Button
            className="bg-card dark:bg-white/5 border border-border dark:border-white/10 h-8 w-8 p-0 rounded-lg hover:border-primary/50 dark:hover:border-cyan-500/30 text-lg cursor-pointer ml-1 transition-all duration-200"
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