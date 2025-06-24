"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useLLMStore } from "@/store/llm-store";
import { Sparkles, Zap, Settings } from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import ManageLLMsClient from "@/components/llm-management/manage-llms-client";
import { fetchValidators } from "@/lib/validators/fetch-validators";
import { Validator } from "@/lib/types";
import { BeatLoader } from "react-spinners";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import React from "react";

// Define our preset configurations
const PRESET_3_FREE_MODELS = [
  "d14b8edf-3efe-4341-ae94-f892ee83b065", // Mistral Small 3.2 24B (Free)
  "867c5680-19e2-43da-9930-9d46efbb6f34", // GPT-3.5 Turbo
  "f2707d40-0ce9-4a95-be21-b39426ab5f73", // GPT-4o Mini
];

const PRESET_5_FREE_MODELS = [
  ...PRESET_3_FREE_MODELS,
  "a6e32995-bea2-4f17-97a1-d88535b2a5ab", // Llama 3 70B
  "31411f81-75d8-43c3-925c-22ac45d711dc", // Mixtral 8x7B
];

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

export function QueryModelSelector() {
  const llms = useLLMStore((s) => s.llms);
  const toggleLLM = useLLMStore((s) => s.toggleLLM);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [validators, setValidators] = useState<Validator[]>([]);
  const [loading, setLoading] = useState(false);

  const applyPreset = (modelIds: string[]) => {
    // First, disable all currently enabled models
    const enabledLLMs = llms.filter((llm) => llm.enabled);
    enabledLLMs.forEach((llm) => {
      toggleLLM(llm.id);
    });

    // Then enable only the preset models
    modelIds.forEach((modelId) => {
      const llm = llms.find((l) => l.id === modelId);
      if (llm && !llm.enabled) {
        toggleLLM(modelId);
      }
    });
  };

  const handleOpenModal = async () => {
    setIsModalOpen(true);
    setLoading(true);
    setTimeout(async () => {
      try {
        const fetchedValidators = await fetchValidators();
        setValidators(fetchedValidators);
      } catch {
        setValidators([]);
      } finally {
        setLoading(false);
      }
    }, 200);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const getActiveCount = () => {
    return llms.filter((llm) => llm.enabled).length;
  };

  const activeCount = getActiveCount();

  // Determine which preset is active
  const is3ModelsActive = activeCount === 3 && 
    PRESET_3_FREE_MODELS.every(id => llms.find(l => l.id === id && l.enabled));
  
  const is5ModelsActive = activeCount === 5 && 
    PRESET_5_FREE_MODELS.every(id => llms.find(l => l.id === id && l.enabled));
  
  const isCustomActive = activeCount > 0 && !is3ModelsActive && !is5ModelsActive;

  return (
    <>
      <div className="inline-flex flex-col items-center gap-2 mt-4 mb-4 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500/10 to-pink-500/10 border border-cyan-500/20 dark:border-cyan-500/30 mx-auto">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
          <p className="text-sm font-medium text-foreground">
            Select AI Models for Your Query
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={is3ModelsActive ? "default" : "outline"}
            size="sm"
            onClick={() => applyPreset(PRESET_3_FREE_MODELS)}
            className={`group transition-all duration-200 ${is3ModelsActive ? 'shadow-lg shadow-cyan-500/25' : 'hover:shadow-md'}`}
          >
            <Zap className="w-4 h-4 mr-2 group-hover:text-yellow-500 transition-colors" />
            3 Fast Models
          </Button>
          <Button
            variant={is5ModelsActive ? "default" : "outline"}
            size="sm"
            onClick={() => applyPreset(PRESET_5_FREE_MODELS)}
            className={`group transition-all duration-200 ${is5ModelsActive ? 'shadow-lg shadow-cyan-500/25' : 'hover:shadow-md'}`}
          >
            <Sparkles className="w-4 h-4 mr-2 group-hover:text-purple-500 transition-colors" />
            5 Diverse Models
          </Button>
          <Button
            variant={isCustomActive ? "default" : "outline"}
            size="sm"
            onClick={handleOpenModal}
            className={`group transition-all duration-200 ${isCustomActive ? 'shadow-lg shadow-pink-500/25' : 'hover:shadow-md'}`}
          >
            <Settings className="w-4 h-4 mr-2 group-hover:animate-spin transition-all" />
            Custom {activeCount > 0 && !is3ModelsActive && !is5ModelsActive ? `(${activeCount})` : ""}
          </Button>
        </div>
      </div>

      <ManageLLMsDialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <ManageLLMsDialogContent className="w-full max-w-[calc(100%-2rem)] sm:w-3/4 sm:max-w-7xl">
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
    </>
  );
}