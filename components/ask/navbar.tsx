
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";

export default function Navbar() {

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
    <div className="w-full dark:bg-zinc-900">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
              VERAFY
            </span>
            <span className="text-xl font-normal text-teal-500 ml-2">
              SWARM EXPLORER
            </span>
          </Link>
        </div>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center space-x-8">
          <Link
            href="/"
            className="text-gray-700 hover:text-teal-500 dark:text-gray-300 dark:hover:text-teal-400"
          >
            Home
          </Link>
          <Link
            href="/how-it-works"
            className="text-gray-700 hover:text-teal-500 dark:text-gray-300 dark:hover:text-teal-400"
          >
            How it works
          </Link>
          <Link
            href="/become-validator"
            className="text-gray-700 hover:text-teal-500 dark:text-gray-300 dark:hover:text-teal-400"
          >
            Become a validator
          </Link>
          <Link
            href="/stake"
            className="text-gray-700 hover:text-teal-500 dark:text-gray-300 dark:hover:text-teal-400"
          >
            Stake
          </Link>
        </div>

        {/* Right Side - Theme Toggle, Login, Connect Wallet */}
        <div className="flex items-center space-x-4">


          <Link
            href="/login"
            className="text-gray-800 font-medium dark:text-gray-200"
          >
            Login
          </Link>

          <Button className="bg-teal-500 hover:bg-teal-600 text-white rounded-full px-4 py-2 dark:bg-teal-600 dark:hover:bg-teal-700">
            Connect to Wallet
          </Button>

          {mounted && (
            <button
              onClick={toggleTheme}
              disabled={isCreditsPage}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700
              focus:outline-none focus:ring-2 focus:ring-teal-200 dark:focus:ring-teal-900 disabled:opacity-50 transition-colors cursor-pointer"
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
  );
}