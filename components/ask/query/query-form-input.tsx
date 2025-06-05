import { Button } from "@/components/ui/button";
import { Dispatch, ReactNode, SetStateAction, useEffect } from "react";
import { QueryFormModeSelector } from "./query-form-mode-selector";
import { QueryFormAISlider } from "./query-form-ai-slider";
import { QueryMode } from "@/lib/types";
import { useCreditsStore } from "@/store/credit-store";
import { toast } from "sonner";
import { useButtonTextTimer } from "@/utils/button-text-timer";
import { useState } from "react";
import { formatQueryMode } from "@/utils/text-utils";

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
  userFreeCredits,
  userPaidCredits,
  isSubmitInteracted,
  setIsSubmitInteracted,
  queryMode,
  queriesRequested,
  handleQueryAmountChange,
  allowedAmountQueries,
}: QueryFormInputProps) {
  const { displayUnpaid, hasPaid: storeHasPaid, totalCredits } = useCreditsStore();
  const [buttonText, setButtonText] = useState<ReactNode>(formatQueryMode(queryMode));
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
      userPaidCredits,
      userFreeCredits,
      queriesRequested,
      queryMode,
      creditsLeft: Math.max(0, totalCredits - queriesRequested),
    });

    // Check if user has enough credits to cover the query cost
    const creditsLeft = Math.max(0, totalCredits - queriesRequested);
    if (creditsLeft < queriesCostTotal) {
      console.log("[QueryFormInput] Blocked: Insufficient credits left to cover query cost", {
        creditsLeft,
        queriesCostTotal,
      });
      toast.error("Insufficient credits to cover the query cost. Please purchase more credits.", {
        style: { background: "#fee2e2", color: "#dc2626" },
      });
      return;
    }

    try {
      startTimer();
      handleSubmit();
      console.log("[QueryFormInput] handleSubmit executed successfully");
    } catch (error) {
      console.error("[QueryFormInput] Query submission failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to submit query, please try again";
      toast.error(errorMessage, {
        style: { background: "#fee2e2", color: "#dc2626" },
      });
    }
  };

  // Update button text when isSubmitting or queryMode changes
  useEffect(() => {
    if (!isSubmitting) {
      cancelTimer();
      setButtonText(formatQueryMode(queryMode));
      console.log("[QueryFormInput] Set button text to:", formatQueryMode(queryMode));
    }
  }, [isSubmitting, queryMode, cancelTimer]);

  // Enable button if credits left can cover query cost
  const creditsLeft = Math.max(0, totalCredits - queriesRequested);
  const isSubmitDisabled = isSubmitting || creditsLeft < queriesCostTotal;

  const displayedQueryCost = Math.max(0, queriesRequested - userFreeCredits);

  console.log("[QueryFormInput] render:", {
    isSubmitting,
    displayUnpaid,
    storeHasPaid,
    totalCredits,
    queriesCostTotal,
    displayedQueryCost,
    queriesRequested,
    creditsLeft,
    isSubmitDisabled,
    userPaidCredits,
    userFreeCredits,
    queryMode,
    buttonText,
    disableReason: isSubmitDisabled ? {
      isSubmitting,
      insufficientCreditsLeft: creditsLeft < queriesCostTotal,
    } : "none",
  });

  return (
    <>
      <div className="flex flex-col mb-2">
        <textarea
          className={`w-full p-4 border rounded-lg h-24 focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-700 dark:text-gray-300 placeholder-gray-500 dark:placeholder-gray-400 text-lg ${
            isSubmitInteracted && !queryText.trim()
              ? "border-teal-400 ring-2 ring-teal-500"
              : "border-gray-200"
          }`}
          placeholder={placeholderText}
          value={queryText}
          onChange={(e) => setQueryText(e.target.value)}
        />
      </div>
      <div className="flex flex-col sm:flex-row w-full gap-4">
        <div className="flex items-center justify-start w-full sm:w-1/2">
          <div className="flex items-center gap-0 w-full">
            <QueryFormModeSelector queryMode={queryMode} />
            <QueryFormAISlider
              queriesRequested={queriesRequested}
              handleQueryAmountChange={handleQueryAmountChange}
              allowedAmountQueries={allowedAmountQueries}
            />
          </div>
        </div>
        <div className="flex items-center justify-end w-full sm:w-1/2">
          <Button
            className={`bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white rounded-full px-8 py-2 cursor-pointer w-full sm:w-auto ${
              isSubmitInteracted && displayUnpaid > 0
                ? "ring-2 ring-teal-500"
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