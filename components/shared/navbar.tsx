"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { V3raLogo } from "@/components/v3ra-logo";
import { 
  Coins, 
  Newspaper, 
  MessageSquare, 
  TrendingUp, 
  Trophy,
  User,
  Sparkles,
  LineChart,
  MessageCircle
} from "lucide-react";
import { motion } from "framer-motion";

interface NavbarProps {
  userPoints?: number;
  onClaimBonus?: () => void;
  canClaimBonus?: boolean;
  claiming?: boolean;
}

export function Navbar({ 
  userPoints = 0, 
  onClaimBonus, 
  canClaimBonus = false,
  claiming = false 
}: NavbarProps) {
  const pathname = usePathname();
  
  const navItems = [
    {
      href: "/headlines",
      label: "Headlines",
      icon: Newspaper,
      isNew: true,
    },
    {
      href: "/ask/truth-market-simple", 
      label: "Truth Market",
      icon: LineChart,
    },
    {
      href: "/ask",
      label: "Q&A",
      icon: MessageCircle,
    },
    {
      href: "/predictions",
      label: "Predictions", 
      icon: TrendingUp,
    },
    {
      href: "/leaderboard",
      label: "Leaderboard",
      icon: Trophy,
    }
  ];

  const isActive = (href: string) => {
    if (href === "/ask/truth-market-simple" && pathname === "/ask/truth-market-simple") return true;
    if (href === "/ask" && pathname === "/ask") return true;
    if (href === "/leaderboard" && pathname.startsWith("/leaderboard")) return true;
    return pathname === href;
  };

  return (
    <div className="border-b border-zinc-800/50 bg-zinc-900/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1.5 group">
            <div className="relative">
              <V3raLogo size="sm" className="group-hover:scale-110 transition-transform" />
              <div className="absolute inset-0 bg-cyan-500/20 blur-xl group-hover:bg-cyan-500/30 transition-colors" />
            </div>
            <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-xs px-1.5 py-0.5">
              BETA
            </Badge>
          </Link>

          {/* Center Navigation */}
          <nav className="hidden md:flex items-center gap-1 bg-zinc-800/50 rounded-full p-1">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative"
                >
                  <motion.div
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2",
                      active
                        ? "text-cyan-400"
                        : "text-zinc-400 hover:text-zinc-200"
                    )}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                    {item.isNew && (
                      <span className="text-xs bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded-full">
                        NEW
                      </span>
                    )}
                  </motion.div>
                  {active && (
                    <motion.div
                      layoutId="navbar-indicator"
                      className="absolute inset-0 bg-cyan-500/10 rounded-full border border-cyan-500/30"
                      transition={{ type: "spring", duration: 0.5 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* Points Badge */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="relative"
            >
              <Badge className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-400 border-yellow-500/30 px-3 py-1.5 flex items-center gap-2 shadow-lg shadow-yellow-500/10">
                <Coins className="w-4 h-4" />
                <span className="font-semibold">{userPoints.toLocaleString()}</span>
                <span className="text-xs opacity-70">V3RA</span>
              </Badge>
              {canClaimBonus && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full animate-pulse"
                />
              )}
            </motion.div>

            {/* Claim Bonus Button */}
            {canClaimBonus && (
              <Button
                size="sm"
                onClick={onClaimBonus}
                disabled={claiming}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-600/20 hover:shadow-purple-500/30 transition-all duration-200 text-xs sm:text-sm"
              >
                <Sparkles className="w-4 h-4 mr-1.5" />
                {claiming ? "Claiming..." : "Daily Bonus"}
              </Button>
            )}

            {/* Profile Button */}
            <Link href="/profile">
              <Button
                size="sm"
                variant="ghost"
                className="rounded-full p-2 hover:bg-zinc-800"
              >
                <User className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden flex items-center gap-2 pb-3 overflow-x-auto scrollbar-hide">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 flex items-center gap-1.5",
                  active
                    ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
                    : "text-zinc-400 hover:text-zinc-200"
                )}
              >
                <item.icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {item.isNew && (
                  <span className="text-xs bg-purple-500/20 text-purple-400 px-1 py-0.5 rounded-full">
                    NEW
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}