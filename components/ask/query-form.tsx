import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Slider } from "@/components/ui/slider";
import { useQueryStore } from "@/store/query-store";

interface QueryFormProps {
  question: string;
  setQuestion: (value: string) => void;
  placeholderText: string;
  queryMode: "factCheck" | "predict" | "create" | "shop";
  userAiQueryAmountRequested: number;
  handleQueryAmountChange: (newAmount: number) => void;
  handleSubmit: () => void;
  isSubmitting: boolean;
  payWithWallet: boolean;
  queriesNeeded: number;
  hasPaid: boolean;
  totalQueries: number;
  isSubmitInteracted: boolean;
  setIsSubmitInteracted: (value: boolean) => void;
}

export default function QueryForm({
  question,
  setQuestion,
  placeholderText,
  queryMode,
  userAiQueryAmountRequested,
  handleQueryAmountChange,
  handleSubmit,
  isSubmitting,
  payWithWallet,
  queriesNeeded,
  hasPaid,
  totalQueries,
  isSubmitInteracted,
  setIsSubmitInteracted,
}: QueryFormProps) {
  const { setQueryMode } = useQueryStore();
  const allowedAmountQueries = 20;

  return (
    <div>
      <div className="mb-8">
        <textarea
          className={`w-full p-4 border rounded-xl h-32 focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-700 dark:text-gray-300 placeholder-gray-500 dark:placeholder-gray-400 text-lg ${
            isSubmitInteracted && !question.trim() ? "border-red-400" : "border-gray-200"
          }`}
          placeholder={placeholderText}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="text-white bg-zinc-700 hover:bg-zinc-600 min-w-[100px] cursor-pointer">
                {queryMode === "predict"
                  ? "Predict"
                  : queryMode === "create"
                    ? "Create"
                    : queryMode === "shop"
                      ? "Shop"
                      : "Fact Check"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-black border-gray-300">
              <DropdownMenuItem
                className="text-gray-200 hover:bg-gray-800 focus:bg-gray-800 cursor-pointer"
                onSelect={() => setQueryMode("shop")}
              >
                Shop
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-gray-200 hover:bg-gray-800 focus:bg-gray-800 cursor-pointer"
                onSelect={() => setQueryMode("predict")}
              >
                Predict
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-gray-200 hover:bg-gray-800 focus:bg-gray-800 cursor-pointer"
                onSelect={() => setQueryMode("create")}
              >
                Create
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-gray-200 hover:bg-gray-800 focus:bg-gray-800 cursor-pointer"
                onSelect={() => setQueryMode("factCheck")}
              >
                Fact Check
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 rounded-md px-2 py-1">
            <div className="border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 px-2 py-1 rounded-md min-w-[20px] text-center">
              {userAiQueryAmountRequested}
              <span className="text-gray-500 dark:text-gray-200 ml-1">AIs queries</span>
            </div>
            <Slider
              value={[userAiQueryAmountRequested]}
              onValueChange={(value) => handleQueryAmountChange(value[0])}
              min={1}
              max={allowedAmountQueries}
              step={1}
              // className="w-20 [&_[role=slider]]:h-5 [&_[role=slider]]:w-5 [&_[role=slider]]:bg-white [&_[role=slider]]:dark:bg-zinc-200 [&_[role=slider]]:border [&_[role=slider]]:border-teal-400 [&_[role=slider]]:dark:border-teal-500 [&_[role=slider]]:focus:ring-2 [&_[role=slider]]:focus:ring-teal-400 [&>*]:h-1 [&>*]:bg-gray-100 [&>*]:dark:bg-zinc-700 [&>*]:rounded-full [&_.SliderRange]:bg-teal-400 [&_.SliderRange]:dark:bg-teal-500"
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
              [&>*]:rounded-full
              "

            />
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
          </div>
        </div>
        <Button
          className={`bg-gradient-to-r from-teal-400 to-blue-500 hover:from-teal-500 hover:to-blue-600 text-white rounded-full px-8 py-2 cursor-pointer ${
            isSubmitInteracted && totalQueries < 1 ? "ring-2 ring-red-400" : ""
          }`}
          onClick={handleSubmit}
          disabled={
            isSubmitting ||
            (payWithWallet && queriesNeeded > 0 && !hasPaid && totalQueries < 1)
          }
          onMouseEnter={() => totalQueries < 1 && setIsSubmitInteracted(true)}
          onMouseLeave={() => setIsSubmitInteracted(false)}
          onMouseDown={() => totalQueries < 1 && setIsSubmitInteracted(true)}
          onMouseUp={() => setIsSubmitInteracted(false)}
        >
          {isSubmitting ? "Submitting..." : "Submit"}
        </Button>
      </div>
    </div>
  );
}