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
        <Button className="text-zinc-900 dark:text-white bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-600 min-w-[100px] cursor-pointer text-sm px-4 py-2">
          {queryMode === "predict"
            ? "Predict"
            : queryMode === "create"
            ? "Create"
            : queryMode === "shop"
            ? "Shop"
            : "Fact Check"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 w-[160px]">
        <DropdownMenuItem asChild>
          <Link
            href="/ask/fact-check"
            className="w-full text-zinc-900 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 focus:bg-zinc-100 dark:focus:bg-zinc-800 cursor-pointer px-4 py-2 text-sm"
          >
            Fact Check
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            href="/ask/predict"
            className="w-full text-zinc-900 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 focus:bg-zinc-100 dark:focus:bg-zinc-800 cursor-pointer px-4 py-2 text-sm"
          >
            Predict
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            href="/ask/shop"
            className="w-full text-zinc-900 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 focus:bg-zinc-100 dark:focus:bg-zinc-800 cursor-pointer px-4 py-2 text-sm"
          >
            Shop
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            href="/ask/create"
            className="w-full text-zinc-900 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 focus:bg-zinc-100 dark:focus:bg-zinc-800 cursor-pointer px-4 py-2 text-sm"
          >
            Create
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}