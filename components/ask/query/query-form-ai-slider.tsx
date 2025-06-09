import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

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
  return (
    <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 rounded-md px-2 py-0">
      <div className="border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 px-2 py-1 rounded-md min-w-[120px] text-center">
        <span className="text-gray-500 dark:text-gray-200 ml-1 whitespace-nowrap">
          Query {queriesRequested} AIs:
        </span>
      </div>
      <Slider
        value={[queriesRequested]}
        onValueChange={(value) => handleQueryAmountChange(value[0])}
        min={1}
        max={allowedAmountQueries}
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
        <div className="invisible md:visible min-w-24">
          <Button
            className="border-zinc-300 dark:border-zinc-700 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 h-8 w-8 p-0 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 text-xl cursor-pointer md:visible"
            onClick={() => handleQueryAmountChange(queriesRequested - 1)}
            disabled={queriesRequested <= 1}
          >
            -
          </Button>
          <Button
            className="border-zinc-300 dark:border-zinc-800 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 h-8 w-8 p-0 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 text-xl cursor-pointer ml-1 md:visible"
            onClick={() => handleQueryAmountChange(queriesRequested + 1)}
            disabled={queriesRequested >= allowedAmountQueries}
          >
            +
          </Button>
        </div>
      )}
    </div>
  );
}