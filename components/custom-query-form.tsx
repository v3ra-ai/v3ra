"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ToggleHeader } from "./explorer/toggle-header";
import { QueryInput } from "./explorer/query-input";
import { PaymentControls } from "./explorer/payment-controls";
import { SubmitButton } from "./explorer/submit-button";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    if (isWalletEnabled && !hasPaid) {
      alert("Please make a payment of 0.01 SOL first");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(query);
      setQuery("");
      if (isWalletEnabled) setHasPaid(false);
    } catch (error) {
      console.error("Error submitting query:", error);
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
          <form onSubmit={handleSubmit}>
            <QueryInput
              query={query}
              setQuery={setQuery}
              isWalletEnabled={isWalletEnabled}
              setIsWalletEnabled={setIsWalletEnabled} // Pass setter to QueryInput
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