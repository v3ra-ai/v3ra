"use client";

import { useMemo, useCallback } from "react";
import { FixedSizeGrid as Grid } from "react-window";

// Define proper interface for Grid render props
interface GridOnItemsRenderedProps {
  visibleRowStartIndex: number;
  visibleRowStopIndex: number;
  visibleColumnStartIndex: number;
  visibleColumnStopIndex: number;
}
import AutoSizer from "react-virtualized-auto-sizer";
import { LLM, useLLMStore } from "@/store/llm-store";
import LLMTile from "./llm-tile";

const TILE_WIDTH = 140;
const TILE_HEIGHT = 160;
const GAP = 16;

export default function LLMGrid() {
  const { llms, activeProvider, search, sort } = useLLMStore();

  const filtered = useMemo(() => {
    let list = [...llms];
    if (activeProvider !== "All") list = list.filter((l) => l.provider === activeProvider);
    if (search) list = list.filter((l) => l.name.toLowerCase().includes(search.toLowerCase()));
    if (sort === "name") list = list.sort((a,b)=>a.name.localeCompare(b.name));
    if (sort === "provider") list = list.sort((a,b)=>a.provider.localeCompare(b.provider));
    return list;
  }, [llms, activeProvider, search, sort]);

  // Infinite scroll: assume fetchBatch stub for now
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

  // Safely handle style properties which might be strings or numbers
  const safeLeft = typeof style.left === 'number' ? style.left + GAP : style.left;
  const safeTop = typeof style.top === 'number' ? style.top + GAP : style.top;
  
  return (
    <div style={{ ...style, left: safeLeft, top: safeTop }}>
      <LLMTile llm={llm} />
    </div>
  );
};
