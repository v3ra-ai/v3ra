"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import { Sun, Moon } from "lucide-react";
import Link from "next/link";

interface ExplorerHeaderProps {
  title?: string;
  autoRefresh: boolean;
  setAutoRefresh: (value: boolean) => void;
  onManageValidators: () => void;
  className?: string;
}

export function ExplorerHeader({
  title = "Verafy Explorer",
  // autoRefresh,
  // setAutoRefresh,
  // onManageValidators,
  className = "bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800",
}: ExplorerHeaderProps) {
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Toggle between light and dark themes
  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  // Disable toggle on /credits due to forced light theme
  const isCreditsPage = pathname === "/credits";

  return (
    <header className={className}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-purple-600 text-white rounded-lg p-2 w-10 h-10 flex items-center justify-center text-xl font-bold">
              V
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {title}
            </h1>
          </div>
          <div className="flex items-center space-x-6">
          <Link
            href="/ask/"
            className="text-gray-700 hover:text-teal-500 dark:text-gray-300 dark:hover:text-teal-400"
          >
            Ask
          </Link>
          <Link
            href="/ask/?q=shop"
            className="text-gray-700 hover:text-teal-500 dark:text-gray-300 dark:hover:text-teal-400"
          >
            Shop
          </Link>
            {/* <button
              onClick={onManageValidators}
              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
            >
              Manage Validators
            </button> */}
            {/* <div className="flex items-center">
              <input
                type="checkbox"
                id="auto-refresh"
                checked={autoRefresh}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setAutoRefresh(e.target.checked)
                }
                className="mr-2 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded"
              />
              <label
                htmlFor="auto-refresh"
                className="text-sm text-gray-700 dark:text-gray-300"
              >
                Auto-refresh (5s)
              </label>
            </div> */}
            {mounted && (
              <button
                onClick={toggleTheme}
                disabled={isCreditsPage}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 disabled:opacity-50 transition-colors"
                aria-label="Toggle theme"
              >
                {theme === "light" ? (
                  <Sun className="h-5 w-5 text-gray-500" />
                ) : (
                  <Moon className="h-5 w-5 text-blue-500" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}