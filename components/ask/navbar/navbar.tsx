"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase-client";
import { NavbarSitelinks } from "@/components/ask/navbar/navbar-sitelinks";
import { NavbarSettings } from "@/components/ask/navbar/navbar-settings";
import { V3raLogo } from "@/components/v3ra-logo";

export default function Navbar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
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
    <div className="fixed top-0 w-full navbar-premium z-50 h-[72px]">
      <div className="container mx-auto px-6 flex items-center justify-between h-full">
        {/* Logo */}
        <div className="flex items-center">
          <Link href="/ask" className="flex items-center cursor-pointer">
            <V3raLogo size="md" className="transition-all duration-200 hover:scale-105" />
          </Link>
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
              className="fixed top-0 right-0 h-full w-64 bg-background z-50 shadow-lg p-6"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              role="dialog"
              aria-label="Mobile navigation menu"
            >
              <div className="[&>div]:flex [&>div]:flex-col [&>div]:space-y-4 [&>div]:text-base [&>div_a]:p-2 [&>div_a]:min-h-[44px] [&>div_a]:flex [&>div_a]:items-center">
                <NavbarSitelinks />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}