"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { X, Twitter, Send } from "lucide-react";
import { supabase } from "@/lib/supabase-client";
import { useQueryStore } from "@/store/query-store";
import { NavbarSitelinks } from "@/components/ask/navbar/navbar-sitelinks";
import { NavbarScrollbar } from "@/components/ask/navbar/navbar-scrollbar";
import { NavbarSettings } from "@/components/ask/navbar/navbar-settings";
import { V3raLogo } from "@/components/v3ra-logo";

// Debounce utility with proper typing
const debounce = <T extends unknown[]>(
  func: (...args: T) => void,
  wait: number
): ((...args: T) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: T) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export default function Navbar() {
  const { theme, setTheme } = useTheme();
  const { viewMode } = useQueryStore();
  const [mounted, setMounted] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [, setIsLoggedIn] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check login state
  useEffect(() => {
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error checking session:", error.message);
        return;
      }
      setIsLoggedIn(!!data.session);
    };

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Handle scroll for search bar with debouncing
  useEffect(() => {
    const handleScroll = debounce(() => {
      setShowSearch(window.scrollY > 50);
    }, 100); // 100ms debounce

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Add padding to body to prevent content overlap with fixed navbar
  useEffect(() => {
    document.body.style.paddingTop = "72px"; // Adjust based on navbar height
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
  const isCreditsPage = false; // Placeholder until pathname is used

  // Toggle hamburger menu
  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  // Close menu on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="fixed top-0 w-full glass-morphism z-50 h-16 sm:h-[72px] border-b border-border/50 dark:border-border/20">
      <div className="container mx-auto px-4 sm:px-6 flex items-center justify-between h-full">
        {/* Logo */}
        <div className="flex items-center">
          <Link href="/ask" className="flex items-center cursor-pointer">
            <V3raLogo size="md" />
          </Link>
          <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-full">
            BETA
          </span>
        </div>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center space-x-4">
          <NavbarSitelinks />
        </div>

        {/* Right Side - Credits, Theme Toggle, Login, Connect Wallet, Menu */}
        <div className="flex items-center space-x-4">
          <NavbarSettings
            mounted={mounted}
            isCreditsPage={isCreditsPage}
            handleToggleTheme={handleToggleTheme}
            onToggleMenu={toggleMenu}
          />
        </div>
      </div>

      <NavbarScrollbar mounted={mounted} showSearch={showSearch} viewMode={viewMode} />

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black bg-opacity-50 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={toggleMenu}
            />
            {/* Drawer */}
            <motion.div
              className="fixed top-0 right-0 h-full w-[85vw] max-w-xs bg-background z-50 shadow-lg p-4 sm:p-6"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              role="dialog"
              aria-label="Mobile navigation menu"
            >
              <button
                onClick={toggleMenu}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
                aria-label="Close menu"
              >
                <X className="h-6 w-6" />
              </button>
              <div className="mt-12 [&>div]:flex [&>div]:flex-col [&>div]:space-y-4 [&>div]:text-base [&>div_a]:p-3 [&>div_a]:min-h-[48px] [&>div_a]:flex [&>div_a]:items-center [&>div_a]:rounded-lg">
                <NavbarSitelinks />
                
                {/* Social Links for Mobile */}
                <div className="mt-8 pt-8 border-t border-zinc-200 dark:border-zinc-700">
                  <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-4 px-3">
                    Follow Us
                  </h3>
                  <div className="flex space-x-4 px-3">
                    <Link
                      href="https://x.com/v3ra_ai"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors p-2"
                      aria-label="Follow us on X (Twitter)"
                    >
                      <Twitter className="h-5 w-5" />
                    </Link>
                    <Link
                      href="https://t.me/v3ra_ai"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors p-2"
                      aria-label="Join us on Telegram"
                    >
                      <Send className="h-5 w-5" />
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}