"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Sun, Moon, CircleUser, User, Menu, Twitter, Send } from "lucide-react";
import { supabase } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavbarSettingsProps {
  mounted: boolean;
  isCreditsPage: boolean;
  handleToggleTheme: () => void;
  onToggleMenu?: () => void;
}

export function NavbarSettings({
  mounted,
  isCreditsPage,
  handleToggleTheme,
  onToggleMenu,
}: NavbarSettingsProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        return;
      }
      setIsLoggedIn(!!data.session);
    };

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setIsLoggedIn(!!session);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push("/");
    } catch {
      // Handle sign out error silently
    }
  };

  return (
    <div className="flex items-center gap-3">
      {/* Social Links */}
      <div className="hidden md:flex items-center gap-2">
        <div className="relative group">
          <Link
            href="https://x.com/v3ra_ai"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center p-2 text-foreground/70 hover:text-foreground dark:hover:text-cyan-400 dark:hover:drop-shadow-[0_0_8px_rgba(0,255,255,0.6)] transition-all duration-300 font-medium hover:-translate-y-0.5"
            aria-label="Follow us on X"
          >
            <Twitter className="h-5 w-5" />
          </Link>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-1 glass-morphism rounded-lg text-sm whitespace-nowrap pointer-events-none z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-xl dark:border dark:border-cyan-500/30 dark:shadow-[0_0_20px_rgba(0,255,255,0.3)]">
            <p className="text-foreground/90 dark:text-cyan-50">Follow us on X</p>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-white/10 dark:border-b-cyan-500/20"></div>
          </div>
        </div>
        <div className="relative group">
          <Link
            href="https://t.me/v3ra_ai"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center p-2 text-foreground/70 hover:text-foreground dark:hover:text-cyan-400 dark:hover:drop-shadow-[0_0_8px_rgba(0,255,255,0.6)] transition-all duration-300 font-medium hover:-translate-y-0.5"
            aria-label="Join our TG Community"
          >
            <Send className="h-5 w-5" />
          </Link>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-1 glass-morphism rounded-lg text-sm whitespace-nowrap pointer-events-none z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-xl dark:border dark:border-cyan-500/30 dark:shadow-[0_0_20px_rgba(0,255,255,0.3)]">
            <p className="text-foreground/90 dark:text-cyan-50">Join our TG Community</p>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-white/10 dark:border-b-cyan-500/20"></div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="hidden md:block h-5 w-px bg-zinc-300 dark:bg-zinc-700" />

      {/* Theme Toggle */}
      {mounted && (
        <button
          onClick={handleToggleTheme}
          disabled={isCreditsPage}
          className="flex items-center justify-center p-2 text-foreground/70 hover:text-foreground dark:hover:text-cyan-400 dark:hover:drop-shadow-[0_0_8px_rgba(0,255,255,0.6)] transition-all duration-300 font-medium hover:-translate-y-0.5 disabled:opacity-50"
          aria-label="Toggle theme"
        >
          <Sun className="h-5 w-5 dark:hidden" />
          <Moon className="h-5 w-5 hidden dark:block" />
        </button>
      )}

      {/* User Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="flex items-center justify-center p-2 text-foreground/70 hover:text-foreground dark:hover:text-cyan-400 dark:hover:drop-shadow-[0_0_8px_rgba(0,255,255,0.6)] transition-all duration-300 font-medium hover:-translate-y-0.5"
            aria-label={isLoggedIn ? "User menu" : "Login/Signup menu"}
          >
            {isLoggedIn ? (
              <User className="h-5 w-5" />
            ) : (
              <CircleUser className="h-5 w-5" />
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-48 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md shadow-sm"
          align="end"
        >
          {isLoggedIn ? (
            <>
              <DropdownMenuItem asChild>
                <Link
                  href="/profile"
                  className="w-full text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer"
                >
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleSignOut}
                className="text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer"
              >
                Sign Out
              </DropdownMenuItem>
            </>
          ) : (
            <>
              <DropdownMenuItem asChild>
                <Link
                  href="/login"
                  className="w-full text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer"
                >
                  Login
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href="/signup"
                  className="w-full text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer"
                >
                  Sign Up
                </Link>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Mobile Menu Toggle */}
      <button
        onClick={onToggleMenu}
        className="md:hidden flex items-center justify-center p-2 text-foreground/70 hover:text-foreground dark:hover:text-cyan-400 dark:hover:drop-shadow-[0_0_8px_rgba(0,255,255,0.6)] transition-all duration-300 font-medium hover:-translate-y-0.5"
        aria-label="Toggle navigation menu"
      >
        <Menu className="h-5 w-5" />
      </button>
    </div>
  );
}