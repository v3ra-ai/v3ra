"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ToggleHeader } from "@/components/explorer/toggle-header";
import { QueryInput } from "@/components/explorer/query-input";
import { PaymentControls } from "@/components/explorer/payment-controls";
import { SubmitButton } from "@/components/explorer/submit-button";

interface CustomQueryFormProps {
  onSubmit: (query: string) => Promise<void>;
  isOpen: boolean;
  onToggle: () => void;
}

export function CustomQueryForm({
  onSubmit,
  isOpen,
  onToggle,
}: CustomQueryFormProps) {
  const [query, setQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isWalletEnabled, setIsWalletEnabled] = useState(false);
  const [hasPaid, setHasPaid] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Extra safeguard against event bubbling
    if (!query.trim()) {
      setError("Query cannot be empty");
      return;
    }

    if (isWalletEnabled && !hasPaid) {
      setError("Please make a payment of 0.01 SOL first");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit(query);
      setQuery("");
      if (isWalletEnabled) setHasPaid(false);
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
              isWalletEnabled={isWalletEnabled}
              setIsWalletEnabled={setIsWalletEnabled}
              hasPaid={hasPaid}
            />
            <div className="flex justify-end space-x-2">
              {isWalletEnabled && (
                <PaymentControls hasPaid={hasPaid} setHasPaid={setHasPaid} />
              )}
              <SubmitButton
                isSubmitting={isSubmitting}
                query={query}
                isWalletEnabled={isWalletEnabled}
                hasPaid={hasPaid}
              />
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
