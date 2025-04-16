"use client";

import React from "react";

interface ExplorerHeaderProps {
  title?: string;
  autoRefresh: boolean;
  setAutoRefresh: (value: boolean) => void;
  onManageValidators: () => void;
  className?: string;
}

export function ExplorerHeader({
  title = "Verafy Explorer",
  autoRefresh,
  setAutoRefresh,
  onManageValidators,
  className = "bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800",
}: ExplorerHeaderProps) {
  return (
    <header className={className}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-purple-600 text-white rounded-lg p-2 w-10 h-10 flex items-center justify-center text-xl font-bold">
              V
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {title}
            </h1>
          </div>
          <div className="flex items-center space-x-6">
            <button
              onClick={onManageValidators}
              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
            >
              Manage Validators
            </button>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="auto-refresh"
                checked={autoRefresh}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setAutoRefresh(e.target.checked)
                }
                className="mr-2 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label
                htmlFor="auto-refresh"
                className="text-sm text-gray-700 dark:text-gray-300"
              >
                Auto-refresh (5s)
              </label>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}