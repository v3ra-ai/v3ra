"use client";

import React from "react";
import DOMPurify from "dompurify";

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
  // Sanitize error message to prevent XSS
  const sanitizedMessage = DOMPurify.sanitize(message);

  // Handle retry with placeholder for CSRF protection
  const handleRetry = () => {
    // TODO: Ensure the API call triggered by onRetry includes a CSRF token
    // Example: Add 'X-CSRF-Token' header in the parent component's API call
    onRetry();
  };

  return (
    <div className={className}>
      <div className="text-center">
        <p className="text-lg text-red-500">{sanitizedMessage}</p>
        <button
          onClick={handleRetry}
          className="mt-4 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          Retry
        </button>
      </div>
    </div>
  );
}