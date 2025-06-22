"use client";

import { useMemo, useState } from "react";
import { useLLMStore } from "@/store/llm-store";
import { Search, Grid3X3, List } from "lucide-react";
import clsx from "clsx";
import AIModelCard from "./ai-model-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ViewMode = "grid" | "list";

export default function AIModelsList() {
  const { llms, activeProvider, search, setSearch, setProvider } = useLLMStore();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<"name" | "provider" | "activity">("name");

  const providers = useMemo(() => {
    const uniqueProviders = new Set(llms.map((llm) => llm.provider));
    return ["All", ...Array.from(uniqueProviders)];
  }, [llms]);

  const filteredAndSorted = useMemo(() => {
    let filtered = [...llms];

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (llm) =>
          llm.name.toLowerCase().includes(searchLower) ||
          llm.id.toLowerCase().includes(searchLower) ||
          llm.provider.toLowerCase().includes(searchLower)
      );
    }

    // Filter by provider
    if (activeProvider !== "All") {
      filtered = filtered.filter((llm) => llm.provider === activeProvider);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "provider":
          return a.provider.localeCompare(b.provider) || a.name.localeCompare(b.name);
        case "activity":
          // Sort by usage/activity if available, otherwise by name
          return (b.usage || 0) - (a.usage || 0) || a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return filtered;
  }, [llms, search, activeProvider, sortBy]);

  return (
    <div className="flex flex-col h-full">
      {/* Header with search and filters */}
      <div className="p-6 border-b border-zinc-800">
        <div className="flex flex-col gap-4">
          {/* Title and view toggle */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-zinc-100">AI Models Hub</h2>
              <p className="text-sm text-zinc-400 mt-1">
                Explore AI models and their specializations
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode("grid")}
                className={clsx(
                  "transition-colors",
                  viewMode === "grid" 
                    ? "bg-zinc-800 text-zinc-100" 
                    : "text-zinc-400 hover:text-zinc-100"
                )}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode("list")}
                className={clsx(
                  "transition-colors",
                  viewMode === "list" 
                    ? "bg-zinc-800 text-zinc-100" 
                    : "text-zinc-400 hover:text-zinc-100"
                )}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Search and filters */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                type="text"
                placeholder="Search models..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
              />
            </div>
            
            <Select value={activeProvider} onValueChange={setProvider}>
              <SelectTrigger className="w-[180px] bg-zinc-900 border-zinc-700 text-zinc-100">
                <SelectValue placeholder="All Providers" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700">
                {providers.map((provider) => (
                  <SelectItem key={provider} value={provider} className="text-zinc-100">
                    {provider}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
              <SelectTrigger className="w-[140px] bg-zinc-900 border-zinc-700 text-zinc-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700">
                <SelectItem value="name" className="text-zinc-100">Name</SelectItem>
                <SelectItem value="provider" className="text-zinc-100">Provider</SelectItem>
                <SelectItem value="activity" className="text-zinc-100">Activity</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Models list/grid */}
      <div className="flex-1 overflow-auto p-6">
        {filteredAndSorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-zinc-400">
            <p className="text-lg">No models found</p>
            <p className="text-sm mt-2">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div
            className={clsx(
              "gap-4",
              viewMode === "grid" 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
                : "flex flex-col"
            )}
          >
            {filteredAndSorted.map((llm) => (
              <AIModelCard key={llm.id} model={llm} viewMode={viewMode} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
