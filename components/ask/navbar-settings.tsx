"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Sun, Moon, CircleUser, User } from "lucide-react";

// Dynamically import WalletMultiButton with SSR disabled
const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

// Define props interface
interface NavbarSettingsProps {
  mounted: boolean;
  isCreditsPage: boolean;
  isLoggedIn: boolean;
  handleToggleTheme: () => void;
}

/**
 * Renders the right-side settings section of the navbar, including theme toggle,
 * login/profile link, and wallet connect button. Designed for mobile-first layout.
 */
export function NavbarSettings({
  mounted,
  isCreditsPage,
  isLoggedIn,
  handleToggleTheme,
}: NavbarSettingsProps) {
  return (
    <div className="flex items-center space-x-4">
      {mounted && (
        <button
          onClick={handleToggleTheme}
          disabled={isCreditsPage}
          className="rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800
            focus:outline-none focus:ring-1 focus:ring-zinc-200 dark:focus:ring-zinc-800
            disabled:opacity-50 transition-colors cursor-pointer"
          aria-label="Toggle theme"
        >
          <Sun className="h-5 w-5 text-zinc-500 dark:hidden" />
          <Moon className="h-5 w-5 text-zinc-500 hidden dark:block" />
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
  );
}