"use client";

import { useMemo, useCallback } from "react";
import { FixedSizeGrid as Grid } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import { LLM, useLLMStore } from "@/store/llm-store";
import LLMTile from "./llm-tile";

interface GridOnItemsRenderedProps {
  visibleRowStartIndex: number;
  visibleRowStopIndex: number;
  visibleColumnStartIndex: number;
  visibleColumnStopIndex: number;
}

const TILE_WIDTH = 140;
const TILE_HEIGHT = 160;
const GAP = 16;

export default function LLMGrid() {
  const { llms, activeProvider, search, sort, showPinned, activeCategory, categories } = useLLMStore();

  const filtered = useMemo(() => {
    let list = [...llms];

    if (activeCategory) {
      const category = categories.find((c) => c.name === activeCategory);
      if (category) {
        console.log(`[LLMGrid] Filtering by category ${activeCategory}:`, category.models);
        list = list.filter((l) =>
          category.models.some(
            (m) =>
              m.validatorId === l.id ||
              m.name.trim().toLowerCase() === l.name.trim().toLowerCase(),
          ),
        );
        console.log(
          "[LLMGrid] Category filter matches:",
          list.map((l) => ({ id: l.id, name: l.name })),
        );
      }
    } else {
      if (showPinned) {
        list = list.filter((l) => l.pinned);
        console.log("[LLMGrid] Pinned filter matches:", list.map((l) => ({ id: l.id, name: l.name })));
      }
      if (activeProvider !== "All") {
        if (activeProvider === "Free Models") {
          // Define free models - typically HuggingFace and some OpenRouter models
          const freeModelNames = [
            "Llama", "Mistral", "Qwen", "DeepSeek", "Phi", "Gemma", "Yi", 
            "Zephyr", "Neural", "Vicuna", "WizardLM", "OpenChat"
          ];
          list = list.filter((l) => 
            l.provider === "HuggingFace" || 
            freeModelNames.some(name => l.name.toLowerCase().includes(name.toLowerCase()))
          );
          console.log("[LLMGrid] Free models filter matches:", list.map((l) => ({ id: l.id, name: l.name })));
        } else if (activeProvider === "Popular") {
          // Top 5 popular models for testing
          const popularModels = [
            "GPT-4o", 
            "Claude 3.5 Sonnet", 
            "Gemini 1.5 Pro", 
            "Llama 3.1 70B", 
            "Mistral Large"
          ];
          list = list.filter((l) => 
            popularModels.some(model => l.name.toLowerCase().includes(model.toLowerCase()))
          );
          // Sort by the order in popularModels array
          list.sort((a, b) => {
            const aIndex = popularModels.findIndex(m => a.name.toLowerCase().includes(m.toLowerCase()));
            const bIndex = popularModels.findIndex(m => b.name.toLowerCase().includes(m.toLowerCase()));
            return aIndex - bIndex;
          });
          console.log("[LLMGrid] Popular models filter matches:", list.map((l) => ({ id: l.id, name: l.name })));
        } else {
          list = list.filter((l) => l.provider === activeProvider);
          console.log(
            "[LLMGrid] Provider filter matches (activeProvider: " + activeProvider + "):",
            list.map((l) => ({ id: l.id, name: l.name })),
          );
        }
      }
    }

    if (search) {
      list = list.filter((l) => l.name.toLowerCase().includes(search.toLowerCase()));
      console.log(
        "[LLMGrid] Search filter matches (search: " + search + "):",
        list.map((l) => ({ id: l.id, name: l.name })),
      );
    }

    if (sort === "name") {
      list = list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === "provider") {
      list = list.sort((a, b) => a.provider.localeCompare(b.provider));
    }
    console.log("[LLMGrid] After sort (" + sort + "):", list.map((l) => ({ id: l.id, name: l.name })));

    console.log("[LLMGrid] Filtered LLMs:", list.map((l) => ({ id: l.id, name: l.name })));
    return list;
  }, [llms, activeProvider, search, sort, showPinned, activeCategory, categories]);

  const fetchMore = useLLMStore((s) => s.fetchBatch as (() => void));
  const hasMore = useLLMStore((s) => s.hasMore as boolean);

  const onItemsRendered = useCallback(
    ({ visibleRowStopIndex }: GridOnItemsRenderedProps) => {
      if (hasMore && visibleRowStopIndex > Math.floor(filtered.length / 3) - 4) {
        fetchMore?.();
      }
    },
    [filtered.length, fetchMore, hasMore],
  );

  if (filtered.length === 0) {
    return <p className="text-center mt-12 text-zinc-500">No models found.</p>;
  }

  return (
    <div className="flex-1 w-full h-full">
      <AutoSizer>
        {({ width, height }) => {
          console.log("[LLMGrid] size", width, height);
          const columnCount = Math.max(1, Math.floor((width + GAP) / (TILE_WIDTH + GAP)));
          const rowCount = Math.ceil(filtered.length / columnCount);

          return (
            <Grid
              columnCount={columnCount}
              columnWidth={TILE_WIDTH + GAP}
              height={height}
              rowCount={rowCount}
              rowHeight={TILE_HEIGHT + GAP}
              width={width}
              onItemsRendered={onItemsRendered}
              itemData={{ filtered, columnCount }}
            >
              {Cell}
            </Grid>
          );
        }}
      </AutoSizer>
    </div>
  );
}

interface CellProps {
  columnIndex: number;
  rowIndex: number;
  style: React.CSSProperties;
  data: {
    filtered: LLM[];
    columnCount: number;
  };
}

const Cell = ({ columnIndex, rowIndex, style, data }: CellProps) => {
  const index = rowIndex * data.columnCount + columnIndex;
  const llm = data.filtered[index];
  if (!llm) return null;

  const safeLeft = typeof style.left === "number" ? style.left + GAP : style.left;
  const safeTop = typeof style.top === "number" ? style.top + GAP : style.top;

  return (
    <div style={{ ...style, left: safeLeft, top: safeTop }}>
      <LLMTile llm={llm} />
    </div>
  );
};