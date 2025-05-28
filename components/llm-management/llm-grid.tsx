"use client";

import { useEffect, useMemo, useRef, useCallback } from "react";
import { FixedSizeGrid as Grid, GridOnItemsRenderedProps } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import { useLLMStore } from "@/store/llm-store";
import LLMTile from "./llm-tile";

const TILE_WIDTH = 140;
const TILE_HEIGHT = 160;
const GAP = 16;

export default function LLMGrid() {
  const { llms, activeProvider } = useLLMStore();

  const filtered = useMemo(() => {
    if (activeProvider === "All") return llms;
    return llms.filter((l) => l.provider === activeProvider);
  }, [llms, activeProvider]);

  // Infinite scroll: assume fetchBatch stub for now
  const fetchMore = useLLMStore((s) => (s as any).fetchBatch);
  const hasMore = useLLMStore((s) => (s as any).hasMore);

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

const Cell = ({ columnIndex, rowIndex, style, data }: any) => {
  const index = rowIndex * data.columnCount + columnIndex;
  const llm = data.filtered[index];
  if (!llm) return null;

  return (
    <div style={{ ...style, left: style.left + GAP, top: style.top + GAP }}>
      <LLMTile llm={llm} />
    </div>
  );
};
