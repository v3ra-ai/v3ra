"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { QueryMode } from "@/lib/types";
import { useQueryStore } from "@/store/query-store";
import { useNavStore } from "@/store/nav-store";

interface QueryFormModeSelectorProps {
  queryMode: QueryMode;
}

export function QueryFormModeSelector({ queryMode }: QueryFormModeSelectorProps) {
  const { setQueryMode } = useQueryStore();
  const navQueryMode = useNavStore((state) => state.queryMode);

  // Log current queryMode on render
  console.log("[QueryFormModeSelector] Current queryMode:", queryMode, "navQueryMode:", navQueryMode);

  // Sync queryMode with navStore on mount
  useEffect(() => {
    const validModes: QueryMode[] = ["fact-check", "predict", "create", "shop"];
    if (navQueryMode && validModes.includes(navQueryMode)) {
      console.log("[QueryFormModeSelector] Syncing queryMode from navStore:", navQueryMode);
      setQueryMode(navQueryMode);
    }
  }, [navQueryMode, setQueryMode]);

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
          onSelect={() => handleSelectMode("fact-check")}
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