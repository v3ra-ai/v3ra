import { Button } from "@/components/ui/button";
import { Dispatch, ReactNode, SetStateAction, useEffect } from "react";
import { QueryFormModeSelector } from "./query-form-mode-selector";
import { QueryFormAISlider } from "./query-form-ai-slider";
import { QueryMode } from "@/lib/types";
import { useCreditsStore } from "@/store/credit-store";
import { toast } from "sonner";
import { useButtonTextTimer } from "@/utils/button-text-timer";
import { useState } from "react";

interface QueryFormInputProps {
  queryText: string;
  setQueryText: Dispatch<SetStateAction<string>>;
  placeholderText: string;
  handleSubmit: () => void;
  isSubmitting: boolean;
  payWithWallet: boolean;
  queriesUnpaid: number;
  queriesCostTotal: number;
  userCreditsTotal: number;
  userFreeCredits: number;
  userPaidCredits: number;
  isSubmitInteracted: boolean;
  setIsSubmitInteracted: Dispatch<SetStateAction<boolean>>;
  queryMode: QueryMode;
  queriesRequested: number;
  handleQueryAmountChange: (newAmount: number) => void;
  allowedAmountQueries: number;
}

export function QueryFormInput({
  queryText,
  setQueryText,
  placeholderText,
  handleSubmit,
  isSubmitting,
  queriesUnpaid,
  queriesCostTotal,
  isSubmitInteracted,
  setIsSubmitInteracted,
  queryMode,
  queriesRequested,
  handleQueryAmountChange,
  allowedAmountQueries,
}: QueryFormInputProps) {
  const { displayUnpaid, hasPaid: storeHasPaid, totalCredits } = useCreditsStore();
  const [buttonText, setButtonText] = useState<ReactNode>("Submit");
  const { startTimer, cancelTimer } = useButtonTextTimer(setButtonText);

  const onSubmit = () => {
    console.log("[QueryFormInput] onSubmit called:", {
      queryText,
      displayUnpaid,
      storeHasPaid,
      isSubmitting,
      queriesUnpaid,
      queriesCostTotal,
      totalCredits,
      queriesRequested,
    });
    if (displayUnpaid > 0 && !storeHasPaid && totalCredits < queriesRequested) {
      console.log("[QueryFormInput] Blocked: Unpaid queries and insufficient credits");
      toast.error("Please make a payment first", {
        style: { background: "#fee2e2", color: "#dc2626" },
      });
      return;
    }
    try {
      startTimer();
      handleSubmit();
      console.log("[QueryFormInput] handleSubmit executed successfully");
    } catch (error: unknown) {
      console.error("[QueryFormInput] Query submission failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to submit query, please try again";
      toast.error(errorMessage, {
        style: { background: "#fee2e2", color: "#dc2626" },
      });
    }
  };

  // Reset button text and cancel timer when isSubmitting changes
  useEffect(() => {
    if (!isSubmitting) {
      cancelTimer();
      setButtonText("Submit");
      console.log("[QueryFormInput] Reset button text to Submit");
    }
  }, [isSubmitting, cancelTimer]);

  const isSubmitDisabled = isSubmitting || (displayUnpaid > 0 && !storeHasPaid && totalCredits < queriesRequested);

  console.log("[QueryFormInput] render:", {
    isSubmitting,
    displayUnpaid,
    storeHasPaid,
    totalCredits,
    queriesRequested,
    isSubmitDisabled,
  });

  return (
    <>
      <div className="flex flex-col mb-2">
        <textarea
          className={`w-full p-4 border rounded-lg h-24 focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-700 dark:text-gray-300 placeholder-gray-500 dark:placeholder-gray-400 text-lg ${
            isSubmitInteracted && !queryText.trim()
              ? "border-red-400"
              : "border-gray-200"
          }`}
          placeholder={placeholderText}
          value={queryText}
          onChange={(e) => setQueryText(e.target.value)}
        />
      </div>
      <div className="flex w-full">
        <div className="flex items-center justify-start w-1/2">
          <div className="flex items-center gap-0">
            <QueryFormModeSelector queryMode={queryMode} />
            <QueryFormAISlider
              queriesRequested={queriesRequested}
              handleQueryAmountChange={handleQueryAmountChange}
              allowedAmountQueries={allowedAmountQueries}
            />
          </div>
        </div>
        <div className="flex items-center justify-end w-1/2">
          <Button
            className={`bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white rounded-full px-8 py-2 cursor-pointer ${
              isSubmitInteracted && displayUnpaid > 0
                ? "ring-2 ring-red-400"
                : ""
            }`}
            onClick={onSubmit}
            disabled={isSubmitDisabled}
            onMouseEnter={() =>
              displayUnpaid > 0 && setIsSubmitInteracted(true)
            }
            onMouseLeave={() => setIsSubmitInteracted(false)}
            onMouseDown={() => displayUnpaid > 0 && setIsSubmitInteracted(true)}
            onMouseUp={() => setIsSubmitInteracted(false)}
          >
            {buttonText}
          </Button>
        </div>
      </div>
    </>
  );
}