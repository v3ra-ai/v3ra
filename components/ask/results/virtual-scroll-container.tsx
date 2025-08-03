"use client";

import { logger } from "@/lib/utils/client-logger";

import { useEffect, useRef, useCallback, useMemo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { PRELOAD_THRESHOLD } from "@/lib/constants";

interface VirtualScrollContainerProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  loadMore: () => Promise<void>;
  hasMore: boolean;
  isLoadingMore: boolean;
  threshold?: number;
  estimateSize?: number;
  overscan?: number;
  className?: string;
}

/**
 * Apple-inspired virtual scroll container using @tanstack/react-virtual.
 * Provides smooth, performant scrolling for large datasets with seamless loading.
 */
export function VirtualScrollContainer<T>({
  items,
  renderItem,
  loadMore,
  hasMore,
  isLoadingMore,
  threshold: _threshold = PRELOAD_THRESHOLD,
  estimateSize = 400,
  overscan = 5,
  className = "",
}: VirtualScrollContainerProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);
  const scrollingRef = useRef<NodeJS.Timeout | null>(null);
  const loadingRef = useRef(false);

  // Setup virtual scrolling
  const virtualizer = useVirtualizer({
    count: items.length + (hasMore ? 1 : 0), // Add 1 for loading indicator
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => estimateSize, [estimateSize]),
    overscan,
    measureElement: typeof window !== "undefined" && window.ResizeObserver 
      ? (element) => element?.getBoundingClientRect().height || estimateSize
      : undefined,
  });

  const virtualItems = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();

  // Handle infinite scroll loading
  const lastItem = virtualItems[virtualItems.length - 1];
  
  useEffect(() => {
    if (!lastItem || !hasMore || loadingRef.current || isLoadingMore) return;

    // Check if we're near the bottom
    const isNearBottom = lastItem.index >= items.length - 5;
    
    if (isNearBottom) {
      logger.debug("Near bottom, loading more", { context: "virtual-scroll" });
      loadingRef.current = true;
      loadMore().finally(() => {
        loadingRef.current = false;
      });
    }
  }, [lastItem?.index, items.length, hasMore, isLoadingMore, loadMore, lastItem]);

  // Smooth scroll behavior with momentum
  const handleScroll = useCallback(() => {
    if (scrollingRef.current) {
      clearTimeout(scrollingRef.current);
    }
    
    // Add subtle scroll momentum effect
    scrollingRef.current = setTimeout(() => {
      if (parentRef.current) {
        parentRef.current.style.scrollBehavior = "smooth";
      }
    }, 150);
  }, []);

  // Memoize the item renderers for performance
  const renderedItems = useMemo(() => 
    virtualItems.map((virtualRow) => {
      const isLoader = virtualRow.index >= items.length;
      
      if (isLoader) {
        return (
          <div
            key="loader"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: virtualRow.size,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            {/* Apple-style loading indicator */}
            <div className="flex justify-center py-8">
              <div className="relative">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 dark:border-zinc-600">
                  <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-zinc-900 dark:border-t-zinc-100" />
                </div>
              </div>
            </div>
          </div>
        );
      }

      const item = items[virtualRow.index];
      
      return (
        <div
          key={virtualRow.key}
          data-index={virtualRow.index}
          ref={virtualizer.measureElement}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            transform: `translateY(${virtualRow.start}px)`,
          }}
        >
          {renderItem(item, virtualRow.index)}
        </div>
      );
    }), [virtualItems, items, virtualizer.measureElement, renderItem]
  );

  return (
    <div 
      ref={parentRef}
      onScroll={handleScroll}
      className={`relative h-full w-full overflow-auto custom-scrollbar momentum-scroll ${className}`}
      style={{
        // Enable momentum scrolling on iOS
        WebkitOverflowScrolling: "touch",
        // Hide scrollbar for cleaner look (optional)
        scrollbarWidth: "thin",
      }}
    >
      {/* Virtual scroll container */}
      <div
        style={{
          height: totalSize,
          width: "100%",
          position: "relative",
        }}
      >
        {renderedItems}
      </div>
      
      {/* End of results message */}
      {!hasMore && !isLoadingMore && items.length > 0 && (
        <div className="text-center py-8 text-sm text-zinc-500 dark:text-zinc-400">
          <div className="inline-flex items-center gap-2">
            <div className="h-px w-12 bg-zinc-300 dark:bg-zinc-600" />
            <span>You&apos;ve reached the end</span>
            <div className="h-px w-12 bg-zinc-300 dark:bg-zinc-600" />
          </div>
        </div>
      )}
    </div>
  );
}