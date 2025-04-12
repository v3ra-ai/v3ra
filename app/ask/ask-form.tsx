// app/ask/ask-form.tsx
"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQueryStore } from "./query-store";

type QueryMode = "factCheck" | "predict" | "create";

export default function AskForm() {
  const { totalQueries, decrementQueries } = useQueryStore();
  const [queryMode, setQueryMode] = useState<QueryMode>("factCheck");
  const [queryAmount, setQueryAmount] = useState<number>(4);
  const [question, setQuestion] = useState<string>("");

  const queryCost = (queryAmount * 0.025).toFixed(2);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (queryAmount > totalQueries) {
      console.error("Not enough queries available");
      return;
    }
    console.log({
      mode: queryMode,
      question,
      queryAmount,
    });
    decrementQueries(queryAmount);
    setQuestion("");
    setQueryAmount(4);
  };

  const handleQueryAmountChange = (newAmount: number) => {
    const clampedAmount = Math.max(1, Math.min(10, newAmount));
    setQueryAmount(clampedAmount);
  };

  return (
    <div className="w-full max-w-3xl">
      <h1 className="text-center text-2xl font-bold text-white mb-6 md:text-3xl">
        Ask up to <span className="text-[#00FF00]">[{totalQueries}]</span> AI&apos;s a question
      </h1>

      <form onSubmit={handleSubmit}>
        <Card className="bg-black border-[#00FF00] border-2 shadow-[0_0_10px_rgba(0,255,0,0.3)] relative">
          <div className="absolute top-0 right-0 w-6 h-6 bg-black">
            <div className="absolute top-0 right-0 w-12 h-12 bg-black transform rotate-45 translate-x-6 -translate-y-6 border-b-2 border-[#00FF00]"></div>
          </div>

          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  className="bg-black border-[#00FF00] text-white h-32 resize-none p-3"
                  placeholder="Enter your question here..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                />

                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className="border-[#00FF00] text-white hover:bg-[#00FF00]/10 min-w-[100px]"
                        >
                          {queryMode === "predict" ? "Predict" : queryMode === "create" ? "Create" : "Fact Check"}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-black border-[#00FF00]">
                        <DropdownMenuItem
                          className="text-white hover:bg-[#00FF00]/20 focus:bg-[#00FF00]/20 cursor-pointer"
                          onClick={() => setQueryMode("predict")}
                        >
                          Predict
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-white hover:bg-[#00FF00]/20 focus:bg-[#00FF00]/20 cursor-pointer"
                          onClick={() => setQueryMode("create")}
                        >
                          Create
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-white hover:bg-[#00FF00]/20 focus:bg-[#00FF00]/20 cursor-pointer"
                          onClick={() => setQueryMode("factCheck")}
                        >
                          Fact Check
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-[#00FF00] text-white h-8 w-8 p-0"
                        onClick={() => handleQueryAmountChange(queryAmount - 1)}
                        disabled={queryAmount <= 1}
                      >
                        -
                      </Button>
                      <div className="border border-[#00FF00] text-white px-4 py-1 rounded-md min-w-[60px] text-center">
                        {queryAmount}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-[#00FF00] text-white h-8 w-8 p-0"
                        onClick={() => handleQueryAmountChange(queryAmount + 1)}
                        disabled={queryAmount >= 10}
                      >
                        +
                      </Button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="bg-black border-[#00FF00] text-white hover:bg-[#00FF00]/20"
                    disabled={queryAmount > totalQueries}
                  >
                    Submit
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="border-t border-[#00FF00]/50 px-6 py-3">
            <div className="w-full flex flex-col sm:flex-row justify-between text-white text-sm font-mono">
              <div>
                Cost to query [{queryAmount}] AI: ${queryCost}
              </div>
              <div>Queries Left: {totalQueries - queryAmount} (stake to get more)</div>
            </div>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}