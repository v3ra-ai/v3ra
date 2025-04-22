"use client";

import ModeToggle from "@/components/ask/mode-toggle";
import { ViewMode } from "@/store/query-store";

// Define props interface
interface NavbarScrollbarProps {
  mounted: boolean;
  showSearch: boolean;
  viewMode: ViewMode;
}

/**
 * Renders a scroll-based search bar that appears when scrolling past 50px.
 * Includes a query input and mode toggle, with responsive mobile-first layout.
 */
export function NavbarScrollbar({ mounted, showSearch, viewMode }: NavbarScrollbarProps) {
  if (!mounted || !showSearch) return null;

  return (
    <div className="container mx-auto px-4 py-2 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-700">
      <div className="flex flex-col md:flex-row md:items-center md:space-x-2">
        <div className="w-full md:w-1/2">
          <div className="flex items-center space-x-2">
            <label className="text-gray-700 dark:text-gray-300 font-medium">
              Ask:
            </label>
            <input
              type="text"
              className="flex-1 p-2 border border-zinc-300 dark:border-zinc-600 rounded-md
                bg-white dark:bg-zinc-800 text-gray-800 dark:text-gray-200
                focus:outline-none focus:ring-1 focus:ring-teal-500"
              placeholder="Enter your query..."
            />
          </div>
        </div>
        <div className="w-full md:w-1/2 md:text-right">
          <ModeToggle variant="icons" viewMode={viewMode} />
        </div>
      </div>
    </div>
  );
}