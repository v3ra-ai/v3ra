"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaginatedResultsContainerProps {
  children: React.ReactNode[];
  itemsPerPage?: number;
  className?: string;
}

/**
 * Clean, minimalist pagination component with tabs
 * Shows 20 results per page with simple navigation
 */
export function PaginatedResultsContainer({
  children,
  itemsPerPage = 20,
  className = "",
}: PaginatedResultsContainerProps) {
  const [currentPage, setCurrentPage] = useState(1);
  
  const totalPages = Math.ceil(children.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = children.slice(startIndex, endIndex);

  // Generate page numbers to show (max 5 visible)
  const visiblePages = useMemo(() => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const start = Math.max(1, currentPage - 2);
      const end = Math.min(totalPages, start + maxVisible - 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  }, [currentPage, totalPages]);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      // Smooth scroll to top of results
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (totalPages <= 1) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Results */}
      <div className={className}>{currentItems}</div>
      
      {/* Pagination Controls */}
      <div className="flex items-center justify-center gap-2 py-6 border-t border-zinc-800/30">
        {/* Previous Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="text-zinc-400 hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Previous page</span>
        </Button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1">
          {visiblePages.map((page) => (
            <Button
              key={page}
              variant={page === currentPage ? "default" : "ghost"}
              size="sm"
              onClick={() => goToPage(page)}
              className={`w-10 h-10 text-sm transition-all duration-200 ${
                page === currentPage
                  ? "bg-cyan-600 text-black hover:bg-cyan-500 dark:neon-glow-cyan"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
              }`}
            >
              {page}
            </Button>
          ))}
        </div>

        {/* Next Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="text-zinc-400 hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Next page</span>
        </Button>
      </div>
      
      {/* Results Info */}
      <div className="text-center text-sm text-zinc-500">
        Showing {startIndex + 1}-{Math.min(endIndex, children.length)} of {children.length} results
      </div>
    </div>
  );
}