"use client";

import React, { useCallback, useMemo } from "react";
import { Dispatch, SetStateAction } from "react";

interface OptimizedTextareaProps {
  queryText: string;
  setQueryText: Dispatch<SetStateAction<string>>;
  placeholderText: string;
  isSubmitInteracted: boolean;
}

// Separate textarea component to isolate re-renders
const OptimizedTextarea = React.memo(function OptimizedTextarea({
  queryText,
  setQueryText,
  placeholderText,
  isSubmitInteracted,
}: OptimizedTextareaProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setQueryText(e.target.value);
    },
    [setQueryText]
  );

  const textareaClassName = useMemo(
    () =>
      `w-full p-4 border rounded-lg h-24 focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-700 dark:text-gray-300 placeholder-gray-500 dark:placeholder-gray-400 text-lg ${
        isSubmitInteracted && !queryText.trim()
          ? "border-teal-400 ring-2 ring-teal-500"
          : "border-gray-200"
      }`,
    [isSubmitInteracted, queryText]
  );

  return (
    <textarea
      className={textareaClassName}
      placeholder={placeholderText}
      value={queryText}
      onChange={handleChange}
    />
  );
});

export default OptimizedTextarea;