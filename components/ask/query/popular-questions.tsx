"use client";

import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface PopularQuestionsProps {
  onSelectQuestion: (question: string) => void;
}

const POPULAR_QUESTIONS = [
  "Is artificial intelligence conscious?",
  "Should social media platforms be regulated?",
  "Is nuclear energy the best solution for climate change?",
  "Will cryptocurrency replace traditional banking?",
  "Should genetic engineering be used to enhance humans?",
  "Is universal basic income economically viable?",
];

export function PopularQuestions({ onSelectQuestion }: PopularQuestionsProps) {
  return (
    <div className="mb-6 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-amber-500" />
        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Popular Questions
        </h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {POPULAR_QUESTIONS.map((question, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            onClick={() => onSelectQuestion(question)}
            className="text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
          >
            {question}
          </Button>
        ))}
      </div>
    </div>
  );
}