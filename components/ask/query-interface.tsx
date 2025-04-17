"use client";

import { useState, useEffect } from "react";
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
import Link from "next/link";
import { PaymentControls } from "@/components/ask/payment-controls"; // Adjust path as needed

// Define QueryMode type
type QueryMode = "factCheck" | "predict" | "create" | "shop";

export default function QueryInterface() {
  const [payWithWallet, setPayWithWallet] = useState(false);
  const [userAiQueryAmountRequested, setUserAiQueryAmountRequested] = useState<number>(4);
  const { totalQueries, decrementQueries, incrementQueries } = useQueryStore();
  const [queryMode, setQueryMode] = useState<QueryMode>("factCheck");
  const [question, setQuestion] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState<"standard" | "expert">("standard");
  const [hasPaid, setHasPaid] = useState(false); // New state for payment status
  const [placeholderText, setPlaceholderText] = useState<string>("Ask the validator network a yes/no question");

  // Constants
  const queryCost = 0.002; // Cost per query in SOL
  const initialAvailableQueries = 10;
  const initialAiQueryAmountRequested = 4;
  const allowedAmountQueries = 20;

  // Calculate costs
  const availableQueries = Math.max(0, initialAvailableQueries - userAiQueryAmountRequested); // Queries left
  const queriesNeeded = Math.max(0, userAiQueryAmountRequested - initialAvailableQueries); // Queries to pay for
  const costToQuery = (queriesNeeded * queryCost).toFixed(3); // Cost for additional queries

  // Initialize totalQueries to 10
  useEffect(() => {
    const initialTotalQueries = initialAvailableQueries - initialAiQueryAmountRequested;
    incrementQueries(initialTotalQueries - totalQueries);
  }, [incrementQueries, totalQueries]);

  // Set queryMode based on URL query string
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const q = params.get("q");
      if (q === "shop") {
        setQueryMode("shop");
      }
    }
  }, []);

  // Update placeholder text based on queryMode
  useEffect(() => {
    switch (queryMode) {
      case "factCheck":
        setPlaceholderText("Ask the validator network a yes/no question");
        break;
      case "shop":
        setPlaceholderText("Find me the best deals on sneakers");
        break;
      case "predict":
        setPlaceholderText("What will the weather be like tomorrow?");
        break;
      case "create":
        setPlaceholderText("Generate a short story about a robot");
        break;
      default:
        setPlaceholderText("Ask the validator network a yes/no question");
    }
  }, [queryMode]);

  const handleQueryAmountChange = (newAmount: number) => {
    const clampedAmount = Math.max(1, Math.min(allowedAmountQueries, newAmount));
    setUserAiQueryAmountRequested(clampedAmount);
  };

  const handleSubmit = async () => {
    if (!question.trim()) return;
    if (userAiQueryAmountRequested > totalQueries && payWithWallet && !hasPaid) return; // Prevent submission if payment is required but not made
    if (totalQueries > 0 && totalQueries < userAiQueryAmountRequested) return; // Prevent submission if not enough queries

    setIsSubmitting(true);
    try {
      // Implement your submit logic here
      if (payWithWallet && userAiQueryAmountRequested > totalQueries) {
        // Payment was required and made
      }
      decrementQueries(userAiQueryAmountRequested);
      setUserAiQueryAmountRequested(initialAiQueryAmountRequested);
      setQuestion("");
      setHasPaid(false); // Reset payment status after submission
    } catch (error) {
      console.error("Submission failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-4">
      {/* Mode Toggle */}
      <div className="container mx-auto px-4 flex justify-center mt-1 mb-2">
        <div className="inline-flex items-center bg-gray-100 rounded-full p-1 dark:bg-gray-700">
          <button
            onClick={() => setMode("standard")}
            className={`px-4 py-1 rounded-full text-sm cursor-pointer ${
              mode === "standard"
                ? "bg-white shadow-sm text-gray-500 dark:bg-gray-600 dark:text-gray-200"
                : "text-gray-500 dark:text-gray-300"
            }`}
          >
            Standard
          </button>
          <button
            onClick={() => setMode("expert")}
            className={`px-4 py-1 rounded-full text-sm cursor-pointer ${
              mode === "expert"
                ? "bg-white shadow-sm text-gray-500 dark:bg-gray-600 dark:text-gray-200"
                : "text-gray-500 dark:text-gray-300"
            }`}
          >
            Expert
          </button>
        </div>
      </div>
      <h1 className="text-zinc-900 dark:text-zinc-200 text-3xl font-bold text-center mb-8 mt-2">
        How can we help you?
      </h1>

      <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-lg/20 p-6 max-w-4xl mx-auto">
        {/* Pay with Wallet Toggle */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Switch
              checked={payWithWallet}
              onCheckedChange={setPayWithWallet}
              className="switch data-[state=checked]:bg-[#46BBA6]"
            />
            <span className="font-medium text-gray-500 dark:text-gray-400">
              Pay with Wallet ({costToQuery} SOL)
            </span>
            {payWithWallet && (
              <PaymentControls
                hasPaid={hasPaid}
                setHasPaid={setHasPaid}
                solCost={parseFloat(costToQuery)} // Pass costToQuery as a number
                totalQueries={totalQueries} // Pass totalQueries
                userAiQueryAmountRequested={userAiQueryAmountRequested} // Pass userAiQueryAmountRequested
              />
            )}
          </div>

          <Button variant="ghost" className="text-gray-500">
            <RefreshCw size={20} />
          </Button>
        </div>

        {/* Question Input */}
        <div className="mb-8">
          <textarea
            className="w-full p-4 border border-gray-200 rounded-xl h-32 focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-700 dark:text-gray-300 placeholder-gray-600 dark:placeholder-gray-500 text-lg"
            placeholder={placeholderText}
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

            <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 rounded-md">
              <Button
                className="border-zinc-300 dark:border-zinc-700 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 h-8 w-8 p-0 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-xl cursor-pointer"
                onClick={() => handleQueryAmountChange(userAiQueryAmountRequested - 1)}
                disabled={userAiQueryAmountRequested <= 1}
              >
                -
              </Button>
              <div className="border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 px-4 py-1 rounded-md min-w-[60px] text-center ">
                {userAiQueryAmountRequested}
              </div>
              <Button
                className="border-zinc-300 dark:border-zinc-800 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 h-8 w-8 p-0 hover:bg-zinc-200 text-xl cursor-pointer"
                onClick={() => handleQueryAmountChange(userAiQueryAmountRequested + 1)}
                disabled={userAiQueryAmountRequested >= allowedAmountQueries}
              >
                +
              </Button>
            </div>

            <span className="text-gray-500 dark:text-gray-400">AIs queried</span>
          </div>

          <div className="flex items-center gap-3">
            <Button
              className="bg-gradient-to-r from-teal-400 to-blue-500 hover:from-teal-500 hover:to-blue-600 text-white rounded-full px-8 py-2 cursor-pointer"
              onClick={handleSubmit}
              disabled={
                isSubmitting ||
                !question.trim() ||
                (totalQueries > 0 && totalQueries < userAiQueryAmountRequested && (!payWithWallet || !hasPaid))
              }
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mt-8">
          <div className="flex items-center gap-2">
            <span className="text-gray-700 dark:text-zinc-400">Queries left</span>
            <span className="bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full text-zinc-700 dark:text-zinc-300">
              {availableQueries}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-700 dark:text-zinc-400">Cost to query: ({queriesNeeded})</span>
            <span className="bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full text-zinc-700 dark:text-zinc-300">
              {costToQuery} SOL
            </span>
          </div>
          <Link href="/credits">
            <Button
              className="rounded-md bg-zinc-100 dark:bg-zinc-800  border border-gray-300 dark:border-gray-700 pl-2 py-1 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-900 cursor-pointer"
            >
              Stake to get more
            </Button>
          </Link>
          <Link href="/credits">
            <Button
              className="rounded-md bg-zinc-100 dark:bg-zinc-600 border border-gray-300 dark:border-gray-700 pl-2 py-1 text-gray-700 dark:text-gray-300  hover:bg-gray-50 dark:hover:bg-zinc-900 cursor-pointer"
            >
              Buy Credits
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer Text */}
      <p className="text-center text-gray-700 dark:text-zinc-200 mt-6 max-w-4xl mx-auto">
        Submit Questions to the network intelligence,{" "}
        <span className="font-medium">(187)</span> will compete to respond.
      </p>
      <p className="text-center text-gray-700 dark:text-zinc-200 max-w-4xl mx-auto">
        Stake to unlock more queries and earn{" "}
        <span className="font-medium">11%</span> yield
      </p>
    </div>
  );
}