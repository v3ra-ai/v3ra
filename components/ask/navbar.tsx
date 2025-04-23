"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Sun, Moon, CircleUser, User } from "lucide-react";
import { useTheme } from "next-themes";
// import { usePathname } from "next/navigation";
import { useQueryStore } from "@/store/query-store";
import { NavbarScrollbar } from "@/components/ask/navbar-scrollbar";
import { NavbarSitelinks } from "@/components/ask/navbar-sitelinks";

// Dynamically import WalletMultiButton with SSR disabled
const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

export default function Navbar() {

  const { theme, setTheme } = useTheme();

  // const pathname = usePathname();
  const { viewMode } = useQueryStore();
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
  const handleToggleTheme = () => {
    console.log("Toggling theme from", theme);
    setTheme(theme === "light" ? "dark" : "light");
  };

  // Disable toggle on /credits due to forced light theme
  // const isCreditsPage = pathname === "/credits";

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
        <NavbarSitelinks />

        {/* Right Side - Theme Toggle, Login, Connect Wallet */}
        <div className="flex items-center space-x-4">
          {mounted && (
            <button
              onClick={handleToggleTheme}
              // disabled={isCreditsPage}
              className="rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800
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

      <NavbarScrollbar mounted={mounted} showSearch={showSearch} viewMode={viewMode} />
    </div>
  );
}