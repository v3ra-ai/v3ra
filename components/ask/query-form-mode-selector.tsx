"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { QueryMode } from "@/lib/types";
import { useQueryStore } from "@/store/query-store";

interface QueryFormModeSelectorProps {
  queryMode: "factCheck" | "predict" | "create" | "shop";
}

export function QueryFormModeSelector({
  queryMode,
}: QueryFormModeSelectorProps) {
  const { setQueryMode } = useQueryStore();
  const searchParams = useSearchParams();

  // Log current queryMode on render
  console.log("[QueryFormModeSelector] Current queryMode:", queryMode);

  // Sync queryMode with q query parameter on mount and param change
  useEffect(() => {
    const q = searchParams.get("q");
    const validModes: QueryMode[] = ["factCheck", "predict", "create", "shop"];
    if (q && validModes.includes(q as QueryMode)) {
      console.log(
        "[QueryFormModeSelector] Syncing queryMode from URL param q:",
        q
      );
      setQueryMode(q as QueryMode);
    } else if (q) {
      console.warn("[QueryFormModeSelector] Invalid q param:", q);
    }
  }, [searchParams, setQueryMode]);

  const handleSelectMode = (mode: QueryMode) => {
    console.log("[QueryFormModeSelector] Selecting mode:", mode);
    setQueryMode(mode);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="text-zinc-900 dark:text-white bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-600 min-w-[100px] cursor-pointer">
          {queryMode === "predict"
            ? "Predict"
            : queryMode === "create"
              ? "Create"
              : queryMode === "shop"
                ? "Shop"
                : "Fact Check"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-black border-gray-300">
        <DropdownMenuItem
          className="text-gray-200 hover:bg-gray-800 focus:bg-gray-800 cursor-pointer"
          onSelect={() => handleSelectMode("factCheck")}
        >
          Fact Check
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-gray-200 hover:bg-gray-800 focus:bg-gray-800 cursor-pointer"
          onSelect={() => handleSelectMode("predict")}
        >
          Predict
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-gray-200 hover:bg-gray-800 focus:bg-gray-800 cursor-pointer"
          onSelect={() => handleSelectMode("shop")}
        >
          Shop
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-gray-200 hover:bg-gray-800 focus:bg-gray-800 cursor-pointer"
          onSelect={() => handleSelectMode("create")}
        >
          Create
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
