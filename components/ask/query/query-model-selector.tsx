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

// Simple keyword matching for model selection
const FAST_MODELS = ["gpt-3.5", "turbo", "mini", "fast", "mistral", "mixtral"];
const DIVERSE_MODELS = ["gpt-4", "claude", "opus", "sonnet", "llama", "gemini"];

// Custom dialog components
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
  const setEnabledLLMs = useLLMStore((s) => s.setEnabledLLMs);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [validators, setValidators] = useState<Validator[]>([]);
  const [loading, setLoading] = useState(false);

  const selectFastModels = () => {
    const fastModels = llms
      .filter(llm => 
        FAST_MODELS.some(keyword => 
          llm.name.toLowerCase().includes(keyword)
        )
      )
      .slice(0, 3)
      .map(llm => llm.id);
    
    // If we don't have enough fast models, just take the first 3
    if (fastModels.length < 3) {
      const additionalModels = llms
        .filter(llm => !fastModels.includes(llm.id))
        .slice(0, 3 - fastModels.length)
        .map(llm => llm.id);
      fastModels.push(...additionalModels);
    }
    
    setEnabledLLMs(fastModels);
  };

  const selectDiverseModels = () => {
    const diverseModels: string[] = [];
    const usedProviders = new Set<string>();
    
    // First, try to get one model from each provider
    for (const llm of llms) {
      if (diverseModels.length >= 5) break;
      const provider = llm.provider.toLowerCase();
      
      if (!usedProviders.has(provider)) {
        const matchesDiverse = DIVERSE_MODELS.some(keyword => 
          llm.name.toLowerCase().includes(keyword)
        );
        
        if (matchesDiverse) {
          diverseModels.push(llm.id);
          usedProviders.add(provider);
        }
      }
    }
    
    // Fill remaining slots
    if (diverseModels.length < 5) {
      const additionalModels = llms
        .filter(llm => !diverseModels.includes(llm.id))
        .slice(0, 5 - diverseModels.length)
        .map(llm => llm.id);
      diverseModels.push(...additionalModels);
    }
    
    setEnabledLLMs(diverseModels);
  };

  const handleOpenModal = async () => {
    setIsModalOpen(true);
    setLoading(true);
    
    // Fetch validators after a small delay for smooth animation
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

  const activeCount = llms.filter(llm => llm.enabled).length;
  const is3Active = activeCount === 3;
  const is5Active = activeCount === 5;
  const isCustomActive = activeCount > 0 && activeCount !== 3 && activeCount !== 5;

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
            variant={is3Active ? "default" : "outline"}
            size="sm"
            onClick={selectFastModels}
            className={`group transition-all duration-200 ${is3Active ? 'shadow-lg shadow-cyan-500/25' : 'hover:shadow-md'}`}
          >
            <Zap className="w-4 h-4 mr-2 group-hover:text-yellow-500 transition-colors" />
            3 Fast Models
          </Button>
          <Button
            variant={is5Active ? "default" : "outline"}
            size="sm"
            onClick={selectDiverseModels}
            className={`group transition-all duration-200 ${is5Active ? 'shadow-lg shadow-cyan-500/25' : 'hover:shadow-md'}`}
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
            Custom {isCustomActive ? `(${activeCount})` : ""}
          </Button>
        </div>
      </div>

      <ManageLLMsDialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <ManageLLMsDialogContent className="w-full max-w-[calc(100%-2rem)] sm:w-3/4 sm:max-w-7xl">
          <ManageLLMsDialogHeader className="px-6 py-0">
            <ManageLLMsDialogTitle className="text-2xl font-semibold">
              Select AI Validators
            </ManageLLMsDialogTitle>
          </ManageLLMsDialogHeader>
          <div className="flex flex-col h-full overflow-hidden">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <BeatLoader color="#2DD4BF" size={15} />
                <span className="text-lg text-gray-700 dark:text-gray-300">Loading</span>
              </div>
            ) : (
              <ManageLLMsClient initial={validators} onClose={() => setIsModalOpen(false)} />
            )}
          </div>
        </ManageLLMsDialogContent>
      </ManageLLMsDialog>
    </>
  );
}