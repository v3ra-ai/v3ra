"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Dispatch, ReactNode, SetStateAction, useEffect, useState, useRef } from "react";
import { QueryFormModeSelector } from "./query-form-mode-selector";
import { QueryFormAISlider } from "./query-form-ai-slider";
import { QueryMode, Validator } from "@/lib/types";
import { useCreditsStore } from "@/store/credit-store";
import { toast } from "sonner";
import { useButtonTextTimer } from "@/utils/button-text-timer";
import { formatQueryMode } from "@/utils/text-utils";
import ManageLLMsClient from "@/components/llm-management/manage-llms-client";
import { X } from "lucide-react";
import { fetchValidators } from "@/app/llms/manage/page";
import { cn } from "@/lib/utils";

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
        "fixed left-1/2 top-1/2 z-100 grid gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg w-full max-w-[calc(100%-2rem)] transform -translate-x-1/2 -translate-y-[calc(50%-50px)]",
        className,
      )}
      {...props}
    >
      {children}
      <ManageLLMsDialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
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
  payWithWallet: boolean;
  queriesUnpaid: number;
  queriesCostTotal: number;
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
  const { displayUnpaid, totalCredits } = useCreditsStore();
  const [buttonText, setButtonText] = useState<ReactNode>(formatQueryMode(queryMode));
  const { startTimer, cancelTimer } = useButtonTextTimer(setButtonText);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [validators, setValidators] = useState<Validator[]>([]);
  const dialogContentRef = useRef<HTMLDivElement>(null);

  const handleOpenModal = async () => {
    console.log("[QueryFormInput] Choose... button clicked, setting isModalOpen to true");
    try {
      const fetchedValidators = await fetchValidators();
      console.log("[QueryFormInput] Fetched validators:", fetchedValidators.length, fetchedValidators);
      setValidators(fetchedValidators);
      setIsModalOpen(true);
    } catch {
      console.error("[QueryFormInput] Failed to fetch validators for modal");
      setValidators([]);
      setIsModalOpen(true);
    }
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
        parentTag: parent?.tagName,
        parentClass: parent?.className,
        parentPosition: parentStyle?.position,
        parentTransform: parentStyle?.transform,
      });
    }
    setIsModalOpen(open);
  };

  const onSubmit = () => {
    console.log("[QueryFormInput] onSubmit called:", {
      queryText,
      displayUnpaid,
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

  const creditsLeft = Math.max(0, totalCredits - queriesRequested);
  const isSubmitDisabled = isSubmitting || creditsLeft < queriesCostTotal;

  const displayedQueryCost = Math.max(0, queriesRequested - userFreeCredits);

  console.log("[QueryFormInput] render:", {
    isSubmitting,
    displayUnpaid,
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
    disableReason: isSubmitDisabled
      ? {
          isSubmitting,
          insufficientCreditsLeft: creditsLeft < queriesCostTotal,
        }
      : "none",
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
          <div className="flex items-center gap-2 w-full">
            <QueryFormModeSelector queryMode={queryMode} />
            <QueryFormAISlider
              queriesRequested={queriesRequested}
              handleQueryAmountChange={handleQueryAmountChange}
              allowedAmountQueries={allowedAmountQueries}
            />
            <Button
              className="bg-teal-500 hover:bg-teal-600 cursor-pointer text-white rounded-md px-4 py-2 z-10"
              onClick={handleOpenModal}
            >
              Choose...
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-end w-full sm:w-1/2">
          <Button
            className={`bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white rounded-full px-8 py-2 w-full sm:w-auto ${
              isSubmitInteracted && displayUnpaid > 0 ? "ring-2 ring-teal-500" : ""
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
          <ManageLLMsDialogHeader className="px-6 py-4">
            <ManageLLMsDialogTitle className="text-2xl font-semibold">
              Manage LLMs
            </ManageLLMsDialogTitle>
            <ManageLLMsDialogClose className="absolute right-4 top-4 rounded-full p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800">
              <X className="size-5 text-zinc-700 dark:text-zinc-300" />
            </ManageLLMsDialogClose>
          </ManageLLMsDialogHeader>
          <div className="flex flex-col h-full overflow-hidden">
            <ManageLLMsClient initial={validators} />
          </div>
        </ManageLLMsDialogContent>
      </ManageLLMsDialog>
    </>
  );
}