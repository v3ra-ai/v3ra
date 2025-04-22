"use client";

import { useQueryStore } from "@/store/query-store";
import { ViewMode } from "@/store/query-store";
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
    <div className="container mx-auto px-4 flex justify-center mt-1 mb-2">
      <div className="flex rounded-full bg-zinc-200 dark:bg-zinc-700 p-1">
        <button
          onClick={() => setViewMode("viewStandard")}
          className={`px-4 py-2 rounded-full text-sm font-medium cursor-pointer ${
            viewMode === "viewStandard"
              ? "bg-teal-500 text-white"
              : "bg-transparent text-zinc-500 dark:text-zinc-400"
          }`}
          aria-label="Standard mode"
        >
          Standard
        </button>
        <button
          onClick={() => setViewMode("viewExpert")}
          className={`px-4 py-2 rounded-full text-sm font-medium cursor-pointer ${
            viewMode === "viewExpert"
              ? "bg-teal-500 text-white"
              : "bg-transparent text-zinc-500 dark:text-zinc-400"
          }`}
          aria-label="Expert mode"
        >
          Expert
        </button>
      </div>
    </div>
  );
}