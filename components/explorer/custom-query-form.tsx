"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ToggleHeader } from "@/components/explorer/toggle-header";
import { QueryInput } from "@/components/explorer/query-input";
import { SubmitButton } from "@/components/explorer/submit-button";

interface CustomQueryFormProps {
  onSubmit: (query: string, options?: { csrfToken?: string }) => Promise<void>;
  isOpen: boolean;
  onToggle: () => void;
  csrfToken: string;
}

export function CustomQueryForm({
  onSubmit,
  isOpen,
  onToggle,
  csrfToken,
}: CustomQueryFormProps) {
  const [query, setQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!query.trim()) {
      setError("Query cannot be empty");
      return;
    }


    if (!csrfToken) {
      setError("CSRF token not initialized");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit(query, { csrfToken });
      setQuery("");
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to submit query";
      console.error("Error submitting query:", errorMessage);
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mb-6">
      <ToggleHeader isOpen={isOpen} onToggle={onToggle} />
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-800">
          <form onSubmit={handleSubmit} noValidate>
            {error && (
              <p className="text-red-500 text-sm mb-2" role="alert">
                {error}
              </p>
            )}
            <QueryInput
              query={query}
              setQuery={setQuery}
            />
            <div className="flex justify-end space-x-2">
              <SubmitButton
                isSubmitting={isSubmitting}
                query={query}
              />
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}