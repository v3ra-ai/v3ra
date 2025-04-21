"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Sun, Moon, CircleUser, User } from "lucide-react";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";

// Dynamically import WalletMultiButton with SSR disabled
const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

export default function Navbar() {
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const isLoggedIn = false; // Placeholder: Replace with useAuth if available

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle scroll for search bar
  useEffect(() => {
    const handleScroll = () => {
      setShowSearch(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Add padding to body to prevent content overlap with fixed navbar
  useEffect(() => {
    document.body.style.paddingTop = "80px"; // Adjust based on navbar height
    return () => {
      document.body.style.paddingTop = "0";
    };
  }, []);

  // Toggle between light and dark themes
  const toggleTheme = () => {
    console.log("Toggling theme from", theme);
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
    <div className="fixed top-0 w-full bg-white dark:bg-zinc-900 z-50">
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
            href="/explorer"
            className="text-gray-700 hover:text-teal-500 dark:text-gray-300 dark:hover:text-teal-400"
          >
            Explorer
          </Link>
          <Link
            href="/become-validator"
            className="text-gray-700 hover:text-teal-500 dark:text-gray-300 dark:hover:text-teal-400"
          >
            Start a validator
          </Link>
          <Link
            href="/credits"
            className="text-gray-700 hover:text-teal-500 dark:text-gray-300 dark:hover:text-teal-400"
          >
            Stake
          </Link>
          <Link
            href="/ask/?q=shop"
            className="text-gray-700 hover:text-teal-500 dark:text-gray-300 dark:hover:text-teal-400"
          >
            Shop
          </Link>
        </div>

        {/* Right Side - Theme Toggle, Login, Connect Wallet */}
        <div className="flex items-center space-x-4">
          {mounted && (
            <button
              onClick={toggleTheme}
              disabled={isCreditsPage}
              className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800
              focus:outline-none focus:ring-1 focus:ring-zinc-200 dark:focus:ring-zinc-800
              disabled:opacity-50 transition-colors cursor-pointer"
              aria-label="Toggle theme"
            >
              {theme === "light" ? (
                <Sun className="h-5 w-5 text-zinc-500" />
              ) : (
                <Moon className="h-5 w-5 text-zinc-500" />
              )}
            </button>
          )}

          <Link
            href={isLoggedIn ? "/profile" : "/login"}
            className="text-gray-800 dark:text-gray-200"
            aria-label={isLoggedIn ? "Profile" : "Login"}
          >
            {isLoggedIn ? (
              <User className="h-5 w-5" />
            ) : (
              <CircleUser className="h-5 w-5" />
            )}
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
        </div>
      </div>

      {/* Scroll-based Search Bar */}
      {mounted && showSearch && (
        <div className="container mx-auto px-4 py-2 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-700">
          <div className="flex flex-col md:flex-row md:items-center md:space-x-2">
            <div className="w-full md:w-1/2">
              <div className="flex items-center space-x-2">
                <label className="text-gray-700 dark:text-gray-300 font-medium">
                  Ask:
                </label>
                <input
                  type="text"
                  className="flex-1 p-2 border border-zinc-300 dark:border-zinc-600 rounded-md
                    bg-white dark:bg-zinc-800 text-gray-800 dark:text-gray-200
                    focus:outline-none focus:ring-1 focus:ring-teal-500"
                  placeholder="Enter your query..."
                />
              </div>
            </div>
            <div className="w-full md:w-1/2 md:text-right">
              <span className="text-gray-700 dark:text-gray-300 font-medium">
                nav features
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}