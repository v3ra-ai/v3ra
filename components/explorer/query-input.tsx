"use client";

import { Ban, CircleCheckBig } from "lucide-react";

interface QueryInputProps {
  query: string;
  setQuery: (value: string) => void;
  isWalletEnabled: boolean;
  setIsWalletEnabled: (value: boolean) => void; // Add setter prop
  hasPaid: boolean;
}

export function QueryInput({
  query,
  setQuery,
  isWalletEnabled,
  setIsWalletEnabled,
  hasPaid,
}: QueryInputProps) {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <div className="flex">
          <label
            htmlFor="custom-query"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Ask the validator network a yes/no question
          </label>
          {!hasPaid && isWalletEnabled ? (
            <div className="flex ml-2 my-auto">
              <label className="flex px-2 rounded text-xs text-red-700 dark:text-red-300 bg-gray-300 dark:bg-gray-800 my-auto">
                <Ban size="14" className="mr-1" /> Payment required
              </label>
            </div>
          ) : hasPaid && isWalletEnabled ? (
            <div className="flex ml-2 my-auto">
              <label className="flex px-2 rounded text-xs text-green-700 dark:text-green-300 bg-gray-300 dark:bg-gray-800 my-auto">
                <CircleCheckBig size="14" className="mr-1" /> Paid .01 SOL
              </label>
            </div>
          ) : null}
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="wallet-toggle"
            checked={isWalletEnabled}
            onChange={(e) => setIsWalletEnabled(e.target.checked)} // Fix: Use setIsWalletEnabled
            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
          />
          <label
            htmlFor="wallet-toggle"
            className="text-sm text-gray-700 dark:text-gray-300"
          >
            Pay with SOL
          </label>
        </div>
      </div>
      <textarea
        id="custom-query"
        rows={3}
        className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed`}
        placeholder="Is artificial intelligence beneficial for society?"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        disabled={isWalletEnabled && !hasPaid}
      />
    </div>
  );
}