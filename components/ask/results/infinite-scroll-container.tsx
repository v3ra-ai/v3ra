"use client";

import { useEffect, useRef, useCallback } from "react";
import { PRELOAD_THRESHOLD } from "@/lib/constants";

interface InfiniteScrollContainerProps {
  children: React.ReactNode;
  loadMore: () => Promise<void>;
  hasMore: boolean;
  isLoadingMore: boolean;
  threshold?: number;
}

/**
 * Apple-inspired infinite scroll container using Intersection Observer.
 * Provides smooth, seamless loading with no visible pagination controls.
 */
export function InfiniteScrollContainer({
  children,
  loadMore,
  hasMore,
  isLoadingMore,
  threshold = PRELOAD_THRESHOLD,
}: InfiniteScrollContainerProps) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  const handleIntersection = useCallback(
    async (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      
      if (entry.isIntersecting && hasMore && !loadingRef.current && !isLoadingMore) {
        console.log("[InfiniteScroll] Sentinel visible, loading more...");
        loadingRef.current = true;
        await loadMore();
        loadingRef.current = false;
      }
    },
    [hasMore, isLoadingMore, loadMore]
  );

  useEffect(() => {
    // Create intersection observer
    const options = {
      root: null,
      rootMargin: `${threshold}px`,
      threshold: 0.1,
    };

    observerRef.current = new IntersectionObserver(handleIntersection, options);

    // Start observing the sentinel element
    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    // Cleanup
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleIntersection, threshold]);

  return (
    <div className="relative transition-all duration-300 ease-out">
      {children}
      
      {/* Sentinel element for intersection observer */}
      {hasMore && (
        <div 
          ref={sentinelRef} 
          className="h-1 w-full"
          aria-hidden="true"
        />
      )}
      
      {/* Loading indicator with Apple-style smooth animation */}
      {isLoadingMore && (
        <div className="flex justify-center py-8 animate-in fade-in duration-300">
          <div className="relative">
            <div className="h-8 w-8 rounded-full border-2 border-zinc-300 dark:border-zinc-600 animate-spin [animation-duration:1s]">
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-zinc-900 dark:border-t-zinc-100" />
            </div>
            <div className="absolute inset-0 rounded-full bg-zinc-900/10 dark:bg-zinc-100/10 blur-xl animate-pulse" />
          </div>
        </div>
      )}
      
      {/* End of results message */}
      {!hasMore && !isLoadingMore && (
        <div className="text-center py-8 text-sm text-zinc-500 dark:text-zinc-400 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="inline-flex items-center gap-3">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-zinc-300 dark:to-zinc-600" />
            <span className="font-light tracking-wide">You&apos;ve reached the end</span>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-zinc-300 dark:to-zinc-600" />
          </div>
        </div>
      )}
    </div>
  );
}