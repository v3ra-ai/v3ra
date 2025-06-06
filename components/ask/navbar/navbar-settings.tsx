"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Sun, Moon, CircleUser, User, Menu, CircleHelp } from "lucide-react";
import { supabase } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const WalletMultiButton = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then(
      (mod) => mod.WalletMultiButton
    ),
  { ssr: false }
);

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
    <div className="flex items-center space-x-3">
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

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="text-gray-800 dark:text-gray-200 focus:outline-none cursor-pointer"
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
                  href={userId ? `/users/profile/${userId}` : "/login"}
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

      <button
        onClick={onToggleMenu}
        className="md:hidden p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-200 dark:focus:ring-zinc-800 transition-colors cursor-pointer"
        aria-label="Toggle navigation menu"
      >
        <Menu className="h-5 w-5 text-zinc-500 cursor-pointer" />
      </button>
      <div className="">
        <Link href="/docs/faq/" className=" cursor-pointer">
          <CircleHelp strokeWidth={1.5} />
        </Link>
      </div>
    </div>
  );
}
