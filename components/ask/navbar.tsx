"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import { supabase } from "@/lib/supabase-client";
import { useQueryStore } from "@/store/query-store";
import { NavbarSitelinks } from "@/components/ask/navbar-sitelinks";
import { NavbarScrollbar } from "@/components/ask/navbar-scrollbar";
import { NavbarSettings } from "@/components/ask/navbar-settings";
import NavbarCredits from "@/components/ask/navbar-credits";

export default function Navbar() {
  const { theme, setTheme } = useTheme();
  const { viewMode } = useQueryStore();
  const [mounted, setMounted] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [, setIsLoggedIn] = useState(false);

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
  const isCreditsPage = false; // Placeholder until pathname is used

  // Select logo based on theme
  const logoSrc = mounted
    ? theme === "dark"
      ? "/verafy_logo_white.svg"
      : "/verafy_logo_black.svg"
    : "/verafy_logo_black.svg"; // Default to black logo before mounting

  return (
    <div className="fixed top-0 w-full bg-white dark:bg-zinc-900 z-50 height-[16px]">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <Link href="/ask" className="flex items-center cursor-pointer">
            <Image src={logoSrc} alt="Logo" width={130} height={40} />
          </Link>
        </div>

        {/* Navigation Links */}
        <div className="flex items-center space-x-4">
        <NavbarSitelinks />

        </div>

        {/* Right Side - Credits, Theme Toggle, Login, Connect Wallet */}
        <div className="flex items-center space-x-4">

          <NavbarSettings
            mounted={mounted}
            isCreditsPage={isCreditsPage}
            handleToggleTheme={handleToggleTheme}
          />
        </div>
      </div>

      <NavbarScrollbar mounted={mounted} showSearch={showSearch} viewMode={viewMode} />
    </div>
  );
}