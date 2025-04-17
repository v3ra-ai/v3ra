"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export default function Navbar() {
  const { theme, setTheme } = useTheme(); // Ensure setTheme is destructured
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Toggle between light and dark themes
  const toggleTheme = () => {
    console.log("Toggling theme from", theme); // Debug log
    setTheme(theme === "light" ? "dark" : "light");
  };

  // Disable toggle on /credits due to forced light theme
  const isCreditsPage = pathname === "/credits";

  // Select logo based on theme
  const logoSrc = mounted
    ? theme === "dark"
      ? "/verafy_logo_white.svg"
      : "/verafy_logo_black.svg"
    : "/verafy_logo_black.svg"; // Default to black logo before mounting

  return (
    <div className="w-full dark:bg-zinc-900">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <Link href="/ask" className="flex items-center cursor-pointer">
            <img
              src={logoSrc}
              alt="Verafy Logo"
              className="h-8 w-auto"
            />
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

          <WalletMultiButton
            style={{
              backgroundColor: "#2dd4bf",
              color: "#fff",
              padding: "10px 12px",
              borderRadius: "0.375rem",
              fontSize: "0.95rem",
              fontWeight: "normal",
              height: "2rem",
              margin: "0 0rem",
              border: "1px solid #d1d5db",
            }}
          />

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