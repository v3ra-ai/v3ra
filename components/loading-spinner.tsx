"use client";

import React from "react";

interface LoadingSpinnerProps {
  message?: string;
  className?: string;
}

export function LoadingSpinner({
  message = "Loading V3RA Testnet Explorer...",
  className = "flex items-center justify-center min-h-screen",
}: LoadingSpinnerProps) {
  return (
    <div className={className}>
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
        <p className="mt-4 text-lg">{message}</p>
      </div>
    </div>
  );
}
