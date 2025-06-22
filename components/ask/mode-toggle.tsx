"use client";

import { useQueryStore } from "@/store/query-store";
import { ViewMode } from "@/lib/types";
import { AppWindowMac, FlaskConical } from "lucide-react";

// Define props interface
interface Props {
  viewMode: ViewMode;
  variant?: "buttons" | "icons";
}

/**
 * Renders a toggle for switching between standard and expert view modes.
 * The 'icons' variant uses a single icon (FlaskConical for standard mode to switch to expert,
 * AppWindowMac for expert mode to switch to standard). The 'buttons' variant uses text buttons.
 */
export default function ModeToggle({ viewMode, variant = "buttons" }: Props) {
  const { setViewMode } = useQueryStore();

  if (variant === "icons") {
    // Determine the target mode and icon
    const isStandardMode = viewMode === "viewStandard";
    const targetMode = isStandardMode ? "viewExpert" : "viewStandard";
    const Icon = isStandardMode ? FlaskConical : AppWindowMac;
    const ariaLabel = isStandardMode ? "Switch to expert mode" : "Switch to standard mode";

    return (
      <button
        onClick={() => setViewMode(targetMode)}
        className="rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800
          focus:outline-none focus:ring-1 focus:ring-zinc-200 dark:focus:ring-zinc-800
          transition-colors cursor-pointer p-2"
        aria-label={ariaLabel}
      >
        <Icon className="h-5 w-5 text-zinc-500" />
      </button>
    );
  }

  return (
    <div className="container mx-auto px-2 flex justify-center mt-1 mb-2">
      <div className="flex rounded-lg bg-card dark:bg-white/5 border border-border dark:border-white/10 p-1">
        <button
          onClick={() => setViewMode("viewStandard")}
          className={`px-4 py-1.5 rounded-md text-sm font-medium cursor-pointer transition-all duration-200 ${
            viewMode === "viewStandard"
              ? "bg-primary text-primary-foreground dark:bg-cyan-500 dark:text-black shadow-sm"
              : "text-muted-foreground hover:text-foreground dark:hover:text-cyan-400"
          }`}
          aria-label="Standard mode"
        >
          Standard
        </button>
        <button
          onClick={() => setViewMode("viewExpert")}
          className={`px-4 py-1.5 rounded-md text-sm font-medium cursor-pointer transition-all duration-200 ${
            viewMode === "viewExpert"
              ? "bg-primary text-primary-foreground dark:bg-cyan-500 dark:text-black shadow-sm"
              : "text-muted-foreground hover:text-foreground dark:hover:text-cyan-400"
          }`}
          aria-label="Expert mode"
        >
          Expert
        </button>
      </div>
    </div>
  );
}