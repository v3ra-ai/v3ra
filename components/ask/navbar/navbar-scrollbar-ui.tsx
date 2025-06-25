
"use client";

import { useState, useEffect, useRef } from "react";
import { ViewMode, QueryMode, Validator } from "@/lib/types";
import { QueryFormAISlider } from "@/components/ask/query/query-form-ai-slider";
import { getPlaceholderText } from "@/lib/query-utils";
import { ALLOWED_AMOUNT_QUERIES } from "@/lib/constants";
import { useButtonTextTimer } from "@/utils/button-text-timer";
import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useLLMStore } from "@/store/llm-store";
import { useQueryStore } from "@/store/query-store";
import { fetchValidators } from "@/lib/validators/fetch-validators";
import ManageLLMsClient from "@/components/llm-management/manage-llms-client";
import { cn } from "@/lib/utils";
import { BeatLoader } from "react-spinners";
import { X } from "lucide-react";
import React from "react";

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

interface NavbarScrollbarUIProps {
  queryText: string;
  setQueryText: (text: string) => void;
  isSubmitting: boolean;
  payWithWallet: boolean;
  setPayWithWallet: (value: boolean) => void;
  hasAttemptedSubmit: boolean;
  queriesRequested: number;
  queryMode: QueryMode;
  viewMode: ViewMode;
  updateQueryAmountRequested: (newAmount: number) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export function NavbarScrollbarUI({
  queryText,
  setQueryText,
  isSubmitting,
  payWithWallet,
  setPayWithWallet,
  hasAttemptedSubmit,
  queriesRequested,
  queryMode,
  updateQueryAmountRequested,
  handleKeyDown,
}: NavbarScrollbarUIProps) {
  const [placeholderContent, setPlaceholderContent] = useState<ReactNode>(getPlaceholderText(queryMode));
  const { startTimer, cancelTimer } = useButtonTextTimer(setPlaceholderContent);
  const { llms } = useLLMStore();
  const { setQueriesRequested } = useQueryStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [validators, setValidators] = useState<Validator[]>([]);
  const [loading, setLoading] = useState(false);
  const dialogContentRef = useRef<HTMLDivElement>(null);

  const selectedLLMCount = llms.filter((llm) => llm.enabled).length;
  const hasSelectedLLMs = selectedLLMCount > 0;
  const chooseButtonText = hasSelectedLLMs ? `Selected (${selectedLLMCount})` : "Choose...";

  // Sync queriesRequested with selectedLLMCount on mount
  useEffect(() => {
    if (hasSelectedLLMs && queriesRequested !== selectedLLMCount) {
      console.log("[NavbarScrollbarUI] Syncing queriesRequested with selectedLLMCount on mount:", {
        selectedLLMCount,
        queriesRequested,
      });
      setQueriesRequested(selectedLLMCount, 100);
    }
  }, [hasSelectedLLMs, selectedLLMCount, queriesRequested, setQueriesRequested]);

  // Start timer when submitting, reset placeholder when not submitting
  useEffect(() => {
    if (isSubmitting) {
      startTimer();
      console.log("[NavbarScrollbarUI] Started timer for placeholder content");
    } else {
      cancelTimer();
      setPlaceholderContent(getPlaceholderText(queryMode));
      console.log("[NavbarScrollbarUI] Reset placeholder to:", getPlaceholderText(queryMode));
    }
  }, [isSubmitting, queryMode, startTimer, cancelTimer]);

  const handleOpenModal = async () => {
    console.log("[NavbarScrollbarUI] Choose... button clicked, setting isModalOpen to true");
    setIsModalOpen(true);
    setLoading(true);
    setTimeout(async () => {
      try {
        const fetchedValidators = await fetchValidators();
        console.log("[NavbarScrollbarUI] Fetched validators:", fetchedValidators.length, fetchedValidators);
        setValidators(fetchedValidators);
      } catch {
        console.error("[NavbarScrollbarUI] Failed to fetch validators for modal");
        setValidators([]);
      } finally {
        setLoading(false);
      }
    }, 200);
  };

  const handleModalOpenChange = (open: boolean) => {
    console.log("[NavbarScrollbarUI] Modal open state changed to:", open);
    if (open && dialogContentRef.current) {
      const rect = dialogContentRef.current.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(dialogContentRef.current);
      const parent = dialogContentRef.current.parentElement;
      const parentStyle = parent ? window.getComputedStyle(parent) : null;
      console.log("[NavbarScrollbarUI] Modal opened, dimensions and styles:", {
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
    console.log("[NavbarScrollbarUI] Closing modal");
    setIsModalOpen(false);
  };

  const displayNumber = hasSelectedLLMs ? selectedLLMCount : queriesRequested;

  return (
    <div className="container mx-auto px-4 py-2 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
      <div className="flex flex-col md:flex-row md:items-center md:space-x-2">
        <div className="w-full md:w-1/3">
          <div className="flex items-center space-x-2 flex-wrap">
            <input
              type="text"
              className={`flex-1 p-2 border rounded-md bg-white dark:bg-zinc-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-teal-500 min-w-[150px] ${
                hasAttemptedSubmit && !queryText.trim()
                  ? "border-red-400"
                  : "border-zinc-300 dark:border-zinc-600"
              }`}
              placeholder={placeholderContent as string}
              value={isSubmitting ? "" : queryText}
              onChange={(e) => setQueryText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSubmitting}
              aria-label={`Enter query to submit, current mode: ${queryMode}`}
              aria-busy={isSubmitting}
            />
          </div>
        </div>
        <div
          className="flex flex-row md:w-2/3 items-center h-full md:text-left flex-wrap gap-2 py-2 md:py-0"
        >
          {hasSelectedLLMs ? (
            <Button
              className="bg-teal-500 hover:bg-teal-600 text-white rounded-md px-4 py-2 z-10 cursor-pointer"
              onClick={handleOpenModal}
            >
              {chooseButtonText}
            </Button>
          ) : (
            <QueryFormAISlider
              queriesRequested={queriesRequested}
              handleQueryAmountChange={updateQueryAmountRequested}
              allowedAmountQueries={ALLOWED_AMOUNT_QUERIES}
              context="scrollbar"
            />
          )}
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
}