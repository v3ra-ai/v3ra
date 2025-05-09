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

  const handleSelectMode = (mode: QueryMode, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("[QueryFormModeSelector] Clicked mode:", mode);
    setQueryMode(mode);
  };

  return (
    <DropdownMenu
      onOpenChange={(open) => console.log("[QueryFormModeSelector] Dropdown open state:", open)}
    >
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
      <DropdownMenuContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700">
        <DropdownMenuItem
          className="text-zinc-900 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 focus:bg-zinc-100 dark:focus:bg-zinc-800 cursor-pointer"
          onClick={(e) => handleSelectMode("factCheck", e)}
        >
          Fact Check
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-zinc-900 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 focus:bg-zinc-100 dark:focus:bg-zinc-800 cursor-pointer"
          onClick={(e) => handleSelectMode("predict", e)}
        >
          Predict
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-zinc-900 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 focus:bg-zinc-100 dark:focus:bg-zinc-800 cursor-pointer"
          onClick={(e) => handleSelectMode("shop", e)}
        >
          Shop
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-zinc-900 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 focus:bg-zinc-100 dark:focus:bg-zinc-800 cursor-pointer"
          onClick={(e) => handleSelectMode("create", e)}
        >
          Create
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}