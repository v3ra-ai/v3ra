"use client";

import React from "react";

interface ErrorDisplayProps {
  message?: string;
  onRetry: () => void;
  className?: string;
}

export function ErrorDisplay({
  message = "Failed to load network state",
  onRetry,
  className = "flex items-center justify-center min-h-screen",
}: ErrorDisplayProps) {
  return (
    <div className={className}>
      <div className="text-center">
        <p className="text-lg text-red-500">{message}</p>
        <button
          onClick={onRetry}
          className="mt-4 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
