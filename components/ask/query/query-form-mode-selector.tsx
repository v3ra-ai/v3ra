"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { QueryMode } from "@/lib/types";

interface QueryFormModeSelectorProps {
  queryMode: QueryMode;
}

export function QueryFormModeSelector({ queryMode }: QueryFormModeSelectorProps) {
  console.log("[QueryFormModeSelector] Current queryMode:", queryMode);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="bg-card dark:bg-white/5 border border-border dark:border-white/10 hover:border-primary/50 dark:hover:border-cyan-500/30 min-w-[100px] cursor-pointer text-sm px-4 py-2 text-foreground transition-all duration-200">
          {queryMode === "predict"
            ? "Predict"
            // : queryMode === "create"
            // ? "Create"
            : queryMode === "shop"
            ? "Shop"
            : "Yes/No"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="glass-morphism border border-border dark:border-white/10 w-[160px] rounded-lg p-1">
        <DropdownMenuItem asChild>
          <Link
            href="/ask/fact-check"
            className="w-full text-foreground hover:bg-accent dark:hover:bg-white/10 focus:bg-accent dark:focus:bg-white/10 cursor-pointer px-3 py-2 text-sm rounded-md transition-colors duration-200"
          >
            Yes/No Questions
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            href="/ask/predict"
            className="w-full text-foreground hover:bg-accent dark:hover:bg-white/10 focus:bg-accent dark:focus:bg-white/10 cursor-pointer px-3 py-2 text-sm rounded-md transition-colors duration-200"
          >
            Predictions
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            href="/ask/shop"
            className="w-full text-foreground hover:bg-accent dark:hover:bg-white/10 focus:bg-accent dark:focus:bg-white/10 cursor-pointer px-3 py-2 text-sm rounded-md transition-colors duration-200"
          >
            Shopping
          </Link>
        </DropdownMenuItem>
        {/* <DropdownMenuItem asChild>
          <Link
            href="/ask/create"
            className="w-full text-zinc-900 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 focus:bg-zinc-100 dark:focus:bg-zinc-800 cursor-pointer px-4 py-2 text-sm"
          >
            Create
          </Link>
        </DropdownMenuItem> */}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}