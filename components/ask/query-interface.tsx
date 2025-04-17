"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQueryStore } from "@/store/query-store";

// Define QueryMode type
type QueryMode = "factCheck" | "predict" | "create";

export default function QueryInterface() {
  const [payWithWallet, setPayWithWallet] = useState(false);
  const [queryAmount, setQueryAmount] = useState<number>(4);
  const { totalQueries, decrementQueries, incrementQueries } = useQueryStore();
  const [queryMode, setQueryMode] = useState<QueryMode>("factCheck");
  const [question, setQuestion] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate costs
  const queryCost = (queryAmount * 0.025).toFixed(2);
  const solCost = (queryAmount * 0.02).toFixed(2);

  const handleQueryAmountChange = (newAmount: number) => {
    const clampedAmount = Math.max(1, Math.min(10, newAmount));
    const difference = clampedAmount - queryAmount;

    if (difference > 0 && totalQueries >= difference) {
      // Incrementing queryAmount, decrement totalQueries
      decrementQueries(difference);
      setQueryAmount(clampedAmount);
    } else if (difference < 0) {
      // Decrementing queryAmount, increment totalQueries
      incrementQueries(-difference);
      setQueryAmount(clampedAmount);
    }
  };

  const handleSubmit = async () => {
    if (!question.trim() || totalQueries < queryAmount) return;

    setIsSubmitting(true);
    try {
      // Implement your submit logic here
      // For example: await submitQuery({ question, queryMode, queryAmount, payWithWallet });
      if (payWithWallet) {
        // Handle wallet payment
      }
      decrementQueries(queryAmount);
      setQuestion(""); // Clear question after submission
    } catch (error) {
      console.error("Submission failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-zinc-900 text-4xl font-bold text-center mb-8">
        How can we help you?
      </h1>

      <div className="bg-white rounded-3xl shadow-lg p-6 max-w-4xl mx-auto">
        {/* Pay with Wallet Toggle */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Switch
              checked={payWithWallet}
              onCheckedChange={setPayWithWallet}
              className="switch data-[state=checked]:bg-[#46BBA6]"
            />
            <span className="font-medium text-gray-500">
              Pay with Wallet ({solCost} SOL)
            </span>
          </div>
          <Button variant="ghost" className="text-gray-500">
            <RefreshCw size={20} />
          </Button>
        </div>

        {/* Question Input */}
        <div className="mb-8">
          <textarea
            className="w-full p-4 border border-gray-200 rounded-xl h-32 focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-700 placeholder-gray-400"
            placeholder="Ask the validator network a yes/no question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  className="text-white bg-zinc-700 hover:bg-zinc-600 min-w-[100px] cursor-pointer"
                >
                  {queryMode === "predict"
                    ? "Predict"
                    : queryMode === "create"
                    ? "Create"
                    : "Fact Check"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-black border-gray-300">
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

            <div className="flex items-center gap-2 bg-white rounded-md">
              <Button
                className="border-gray-300 bg-gray-200 text-gray-700 h-8 w-8 p-0 hover:bg-gray-200 cursor-pointer"
                onClick={() => handleQueryAmountChange(queryAmount - 1)}
                disabled={queryAmount <= 1}
              >
                -
              </Button>
              <div className="border border-gray-300 text-gray-700 px-4 py-1 rounded-md min-w-[60px] text-center bg-white">
                {queryAmount}
              </div>
              <Button
                className="border-gray-300 bg-gray-200 text-gray-700 h-8 w-8 p-0 hover:bg-gray-200 cursor-pointer"
                onClick={() => handleQueryAmountChange(queryAmount + 1)}
                disabled={queryAmount >= 10 || totalQueries === 0}
              >
                +
              </Button>
            </div>

            <span className="text-gray-500">AI will be queried</span>
          </div>

          <Button
            className="bg-gradient-to-r from-teal-400 to-blue-500 hover:from-teal-500 hover:to-blue-600 text-white rounded-full px-8 py-2"
            onClick={handleSubmit}
            disabled={isSubmitting || !question.trim() || totalQueries < queryAmount}
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </Button>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mt-8">
          <div className="flex items-center gap-2">
            <span className="text-gray-700">Queries left</span>
            <span className="bg-gray-100 px-3 py-1 rounded-full text-gray-700">
              {totalQueries}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-700">Cost to query: ({queryAmount})</span>
            <span className="bg-gray-100 px-3 py-1 rounded-full text-gray-700">
              ${queryCost}
            </span>
          </div>

          <Button
            className="rounded-md bg-gray-100 border border-gray-300 px-4 py-1 text-gray-700 hover:bg-gray-50"
          >
            Stake to get more
          </Button>
        </div>
      </div>

      {/* Footer Text */}
      <p className="text-center text-gray-700 mt-6 max-w-4xl mx-auto">
        Submit Questions to the network intelligence,{" "}
        <span className="font-medium">(187)</span> will compete to respond.
      </p>
      <p className="text-center text-gray-700 max-w-4xl mx-auto">
        Stake to unlock more queries and earn{" "}
        <span className="font-medium">11%</span> yield
      </p>
    </div>
  );
}