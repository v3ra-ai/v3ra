import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface QueryFormAISliderProps {
  userAiQueryAmountRequested: number;
  handleQueryAmountChange: (newAmount: number) => void;
  allowedAmountQueries: number;
  context?: "scrollbar" | "query-form";
}

export function QueryFormAISlider({
  userAiQueryAmountRequested,
  handleQueryAmountChange,
  allowedAmountQueries,
  context = "query-form",
}: QueryFormAISliderProps) {
  return (
    <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 rounded-md px-2 py-0">
      <div className="border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 px-2 py-1 rounded-md min-w-[20px] text-center">
        <span className="text-gray-500 dark:text-gray-200 ml-1">
          Query {userAiQueryAmountRequested} AIs
        </span>
      </div>
      <Slider
        value={[userAiQueryAmountRequested]}
        onValueChange={(value) => handleQueryAmountChange(value[0])}
        min={1}
        max={allowedAmountQueries}
        step={1}
        className="w-20
          [&_[role=slider]]:h-5 [&_[role=slider]]:w-5
          [&>*]:bg-gray-100
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
      {context !== "scrollbar" && (
        <>
          <Button
            className="border-zinc-300 dark:border-zinc-700 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 h-8 w-8 p-0 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 text-xl cursor-pointer"
            onClick={() => handleQueryAmountChange(userAiQueryAmountRequested - 1)}
            disabled={userAiQueryAmountRequested <= 1}
          >
            -
          </Button>
          <Button
            className="border-zinc-300 dark:border-zinc-800 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 h-8 w-8 p-0 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 text-xl cursor-pointer"
            onClick={() => handleQueryAmountChange(userAiQueryAmountRequested + 1)}
            disabled={userAiQueryAmountRequested >= allowedAmountQueries}
          >
            +
          </Button>
        </>
      )}
    </div>
  );
}