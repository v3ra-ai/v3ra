"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Dispatch, ReactNode, SetStateAction } from "react";
import { QueryFormModeSelector } from "./query-form-mode-selector";
import { QueryMode, Validator } from "@/lib/types";
import { useCreditsStore } from "@/store/credit-store";
import { useLLMStore } from "@/store/llm-store";
import { useQueryStore } from "@/store/query-store";
import { toast } from "sonner";
import { useButtonTextTimer } from "@/utils/button-text-timer";
import { formatQueryMode } from "@/utils/text-utils";
import ManageLLMsClient from "@/components/llm-management/manage-llms-client";
import { fetchValidators } from "@/lib/validators/fetch-validators";
import { cn } from "@/lib/utils";
import { BeatLoader } from "react-spinners";
import { X } from "lucide-react";

// Custom ManageLLMsDialog components
const ManageLLMsDialog = DialogPrimitive.Root;
const ManageLLMsDialogPortal = DialogPrimitive.Portal;
const ManageLLMsDialogClose = DialogPrimitive.Close;

const ManageLLMsDialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
  />
));
ManageLLMsDialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const ManageLLMsDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <ManageLLMsDialogPortal>
    <ManageLLMsDialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-1/2 top-1/2 z-100 grid gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 w-full max-w-[calc(100%-2rem)] sm:w-3/4 sm:max-w-7xl sm:rounded-lg transform -translate-x-1/2 -translate-y-[calc(50%-50px)]",
        className,
      )}
      {...props}
    >
      {children}
      <ManageLLMsDialogClose className="absolute right-4 top-4 rounded-full p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800">
        <X />
      </ManageLLMsDialogClose>
    </DialogPrimitive.Content>
  </ManageLLMsDialogPortal>
));
ManageLLMsDialogContent.displayName = DialogPrimitive.Content.displayName;

const ManageLLMsDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className,
    )}
    {...props}
  />
);
ManageLLMsDialogHeader.displayName = "DialogHeader";

const ManageLLMsDialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className,
    )}
    {...props}
  />
));
ManageLLMsDialogTitle.displayName = DialogPrimitive.Title.displayName;

interface QueryFormInputProps {
  queryText: string;
  setQueryText: Dispatch<SetStateAction<string>>;
  placeholderText: string;
  handleSubmit: () => void;
  isSubmitting: boolean;
  queriesUnpaid: number;
  queriesCostTotal: number;
  userFreeCredits: number;
  userPaidCredits: number;
  userCreditsTotal: number;
  isSubmitInteracted: boolean;
  setIsSubmitInteracted: Dispatch<SetStateAction<boolean>>;
  queryMode: QueryMode;
  queriesRequested: number;
}

const QueryFormInputComponent = function QueryFormInput({
  queryText,
  setQueryText,
  placeholderText,
  handleSubmit,
  isSubmitting,
  queriesUnpaid: _queriesUnpaid,
  queriesCostTotal,
  userFreeCredits: _userFreeCredits,
  userPaidCredits: _userPaidCredits,
  userCreditsTotal: _userCreditsTotal,
  isSubmitInteracted,
  setIsSubmitInteracted,
  queryMode,
  queriesRequested,
}: QueryFormInputProps) {
  const { displayUnpaid, totalCredits } = useCreditsStore();
  const { llms } = useLLMStore();
  const { setQueriesRequested } = useQueryStore();
  const [buttonText, setButtonText] = useState<ReactNode>(formatQueryMode(queryMode));
  const { startTimer, cancelTimer } = useButtonTextTimer(setButtonText);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [validators, setValidators] = useState<Validator[]>([]);
  const [loading, setLoading] = useState(false);
  const dialogContentRef = useRef<HTMLDivElement>(null);

  const selectedLLMCount = llms.filter((llm) => llm.enabled).length;
  const hasSelectedLLMs = selectedLLMCount > 0;
  const chooseButtonText = hasSelectedLLMs ? `${selectedLLMCount} AIs` : "Choose AIs";

  // Sync queriesRequested with selectedLLMCount on mount
  useEffect(() => {
    if (hasSelectedLLMs && queriesRequested !== selectedLLMCount) {
      // console.log("[QueryFormInput] Syncing queriesRequested with selectedLLMCount on mount:", {
      //   selectedLLMCount,
      //   queriesRequested,
      // });
      setQueriesRequested(selectedLLMCount, totalCredits);
    }
  }, [hasSelectedLLMs, selectedLLMCount, queriesRequested, setQueriesRequested, totalCredits]);

  const handleOpenModal = async () => {
    console.log("[QueryFormInput] Choose... button clicked, setting isModalOpen to true");
    setIsModalOpen(true);
    setLoading(true);
    setTimeout(async () => {
      try {
        const fetchedValidators = await fetchValidators();
        console.log("[QueryFormInput] Fetched validators:", fetchedValidators.length, fetchedValidators);
        setValidators(fetchedValidators);
      } catch {
        console.error("[QueryFormInput] Failed to fetch validators for modal");
        setValidators([]);
      } finally {
        setLoading(false);
      }
    }, 200);
  };

  const handleModalOpenChange = (open: boolean) => {
    console.log("[QueryFormInput] Modal open state changed to:", open);
    if (open && dialogContentRef.current) {
      const rect = dialogContentRef.current.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(dialogContentRef.current);
      const parent = dialogContentRef.current.parentElement;
      const parentStyle = parent ? window.getComputedStyle(parent) : null;
      console.log("[QueryFormInput] Modal opened, dimensions and styles:", {
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        modalWidth: rect.width,
        modalHeight: rect.height,
        modalLeft: rect.left,
        modalTop: rect.top,
        expectedWidth: window.innerWidth >= 640 ? `75% (~${Math.floor(window.innerWidth * 0.75)}px)` : "100%",
        expectedLeft: `~${Math.floor((window.innerWidth - rect.width) / 2)}px`,
        expectedTop: `~${Math.floor((window.innerHeight - rect.height) / 2 + 50)}px`,
        computedWidth: computedStyle.width,
        computedMaxWidth: computedStyle.maxWidth,
        computedTransform: computedStyle.transform,
        computedAnimation: computedStyle.animation,
        parentTag: parent?.tagName,
        parentClass: parent?.className,
        parentPosition: parentStyle?.position,
        parentTransform: parentStyle?.transform,
        loadingState: loading,
      });
    }
    setIsModalOpen(open);
  };

  const handleModalClose = () => {
    console.log("[QueryFormInput] Closing modal");
    setIsModalOpen(false);
  };

  const onSubmit = () => {
    // console.log("[QueryFormInput] onSubmit called:", {
    //   queryText,
    //   displayUnpaid,
    //   isSubmitting,
    //   queriesUnpaid,
    //   queriesCostTotal,
    //   totalCredits,
    //   userPaidCredits,
    //   userFreeCredits,
    //   queriesRequested,
    //   queryMode,
    //   creditsLeft: Math.max(0, totalCredits - queriesRequested),
    //   selectedLLMCount,
    // });

    const creditsLeft = Math.max(0, totalCredits - queriesRequested);
    if (creditsLeft < queriesCostTotal) {
      console.log("[QueryFormInput] Blocked: Insufficient credits", {
        creditsLeft,
        queriesCostTotal,
      });
      toast.error("Insufficient credits to cover the query cost. Please purchase more credits.", {
        style: { background: "#fee2e2", color: "#dc2626" },
      });
      return;
    }

    if (hasSelectedLLMs && queriesRequested > selectedLLMCount) {
      console.log("[QueryFormInput] Blocked: Queries requested exceeds selected LLMs", {
        queriesRequested,
        selectedLLMCount,
      });
      toast.error(`Cannot query ${queriesRequested} AIs when only ${selectedLLMCount} are selected.`, {
        style: { background: "#fee2e2", color: "#dc2626" },
      });
      return;
    }

    try {
      startTimer();
      handleSubmit();
      console.log("[QueryFormInput] handleSubmit executed successfully");
    } catch {
      console.error("[QueryFormInput] Query submission failed");
      toast.error("Failed to submit query, please try again", {
        style: { background: "#fee2e2", color: "#dc2626" },
      });
    }
  };

  useEffect(() => {
    if (!isSubmitting) {
      cancelTimer();
      setButtonText(formatQueryMode(queryMode));
      console.log("[QueryFormInput] Set button text to:", formatQueryMode(queryMode));
    }
  }, [isSubmitting, queryMode, cancelTimer]);

  // Ensure button text updates when queryMode changes
  useEffect(() => {
    setButtonText(formatQueryMode(queryMode));
    console.log("[QueryFormInput] Query mode changed, updating button text to:", formatQueryMode(queryMode));
  }, [queryMode]);

  const creditsLeft = useMemo(
    () => Math.max(0, totalCredits - queriesRequested),
    [totalCredits, queriesRequested]
  );
  
  const isSubmitDisabled = useMemo(
    () => isSubmitting || !queryText.trim() || creditsLeft < queriesCostTotal || (hasSelectedLLMs && queriesRequested > selectedLLMCount),
    [isSubmitting, queryText, creditsLeft, queriesCostTotal, hasSelectedLLMs, queriesRequested, selectedLLMCount]
  );

  // Note: displayedQueryCost was previously calculated but not used
  // Removed to fix unused variable warning

  // Commenting out render logging for performance
  // console.log("[QueryFormInput] render:", {
  //   isSubmitting,
  //   displayUnpaid,
  //   totalCredits,
  //   queriesCostTotal,
  //   displayedQueryCost,
  //   queriesRequested,
  //   creditsLeft,
  //   isSubmitDisabled,
  //   userPaidCredits,
  //   userFreeCredits,
  //   queryMode,
  //   buttonText,
  //   selectedLLMCount,
  //   disableReason: isSubmitDisabled
  //     ? {
  //         isSubmitting,
  //         insufficientCreditsLeft: creditsLeft < queriesCostTotal,
  //         queriesExceedSelected: hasSelectedLLMs && queriesRequested > selectedLLMCount,
  //       }
  //     : "none",
  // });

  return (
    <div>
      <div className="flex flex-col mb-2">
        <textarea
          className={`w-full p-4 rounded-lg h-24 focus:outline-none text-foreground placeholder-muted-foreground text-lg
            bg-card dark:bg-card/50 border transition-all duration-200
            ${
              isSubmitInteracted && !queryText.trim()
                ? "border-primary ring-2 ring-primary/50 dark:border-neon-cyan dark:ring-cyan-500/30"
                : "border-border hover:border-primary/50 focus:border-primary dark:hover:border-cyan-500/30 dark:focus:border-cyan-500/50"
            }
          `}
          placeholder={placeholderText}
          value={queryText}
          onChange={(e) => setQueryText(e.target.value)}
        />
      </div>
      <div className="flex flex-col sm:flex-row w-full gap-4">
        <div className="flex items-center justify-start w-full sm:w-1/2">
          <div className="flex items-center gap-3 w-full">
            <QueryFormModeSelector queryMode={queryMode} />
            <Button
              className="bg-primary text-primary-foreground dark:bg-cyan-600 dark:hover:bg-cyan-500 dark:text-black rounded-lg px-6 py-2 z-10 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 dark:neon-glow-cyan font-medium"
              onClick={handleOpenModal}
            >
              {chooseButtonText}
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-end w-full sm:w-1/2">
          <Button
            className={`bg-primary text-primary-foreground dark:bg-gradient-to-r dark:from-cyan-500 dark:to-pink-500 dark:hover:from-cyan-400 dark:hover:to-pink-400 rounded-full px-8 py-2 w-full sm:w-auto transition-all duration-300 hover:-translate-y-0.5 dark:animate-pulse-neon ${
              isSubmitInteracted && displayUnpaid > 0 ? "ring-2 ring-primary dark:ring-cyan-500/50" : ""
            }`}
            onClick={onSubmit}
            disabled={isSubmitDisabled}
            onMouseEnter={() => displayUnpaid > 0 && setIsSubmitInteracted(true)}
            onMouseLeave={() => setIsSubmitInteracted(false)}
            onMouseDown={() => displayUnpaid > 0 && setIsSubmitInteracted(true)}
            onMouseUp={() => setIsSubmitInteracted(false)}
          >
            {buttonText}
          </Button>
        </div>
      </div>
      <ManageLLMsDialog open={isModalOpen} onOpenChange={handleModalOpenChange}>
        <ManageLLMsDialogContent
          className="w-full max-w-[calc(100%-2rem)] sm:w-3/4 sm:max-w-7xl"
          ref={dialogContentRef}
        >
          <ManageLLMsDialogHeader className="px-6 py-0">
            <ManageLLMsDialogTitle className="text-2xl font-semibold">
              Select AI Validators
            </ManageLLMsDialogTitle>
            <ManageLLMsDialogClose className="absolute right-4 top-4 rounded-full p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800">
              <X />
            </ManageLLMsDialogClose>
          </ManageLLMsDialogHeader>
          <div className="flex flex-col h-full overflow-hidden">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <BeatLoader color="#2DD4BF" size={15} />
                <span className="text-lg text-gray-700 dark:text-gray-300">Loading</span>
              </div>
            ) : (
              <ManageLLMsClient initial={validators} onClose={handleModalClose} />
            )}
          </div>
        </ManageLLMsDialogContent>
      </ManageLLMsDialog>
    </div>
  );
};

export { QueryFormInputComponent as QueryFormInput };