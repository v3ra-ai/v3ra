"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Sun, Moon, CircleUser, User, Menu, Twitter, Send, Github } from "lucide-react";
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
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      console.log("NavbarSettings session check:", { data, error });
      if (error) {
        console.error("Error checking session:", error.message);
        return;
      }
      setIsLoggedIn(!!data.session);
      setUserId(data.session?.user?.id || null);
    };

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state change:", { event, session });
        setIsLoggedIn(!!session);
        setUserId(session?.user?.id || null);
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
    } catch (err: unknown) {
      const error = err as Error;
      console.error("Sign out error:", error.message);
    }
  };

  return (
    <div className="flex items-center space-x-4">
      {/* Social Links */}
      <div className="hidden md:flex items-center space-x-3">
        <Link
          href="https://x.com/v3ra_ai"
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
          aria-label="Follow us on X (Twitter)"
        >
          <Twitter className="h-5 w-5" />
        </Link>
        <Link
          href="https://t.me/v3ra_ai"
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
          aria-label="Join us on Telegram"
        >
          <Send className="h-5 w-5" />
        </Link>
        <Link
          href="https://github.com/v3ra-ai/v3ra"
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
          aria-label="View on GitHub"
        >
          <Github className="h-5 w-5" />
        </Link>
      </div>

      {/* Divider */}
      <div className="hidden md:block h-5 w-px bg-zinc-300 dark:bg-zinc-700" />

      {/* Theme Toggle */}
      {mounted && (
        <button
          onClick={handleToggleTheme}
          disabled={isCreditsPage}
          className="rounded-full p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800
            focus:outline-none focus:ring-1 focus:ring-zinc-200 dark:focus:ring-zinc-800
            disabled:opacity-50 transition-colors cursor-pointer"
          aria-label="Toggle theme"
        >
          <Sun className="h-5 w-5 text-zinc-600 dark:hidden" />
          <Moon className="h-5 w-5 text-zinc-400 hidden dark:block" />
        </button>
      )}

      {/* User Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="p-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors focus:outline-none cursor-pointer"
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
        className="md:hidden p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-200 dark:focus:ring-zinc-800 transition-colors cursor-pointer"
        aria-label="Toggle navigation menu"
      >
        <Menu className="h-5 w-5 text-zinc-600 dark:text-zinc-400 cursor-pointer" />
      </button>
    </div>
  );
}