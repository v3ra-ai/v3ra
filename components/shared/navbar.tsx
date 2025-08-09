"use client";

import Link from "next/link";
import { V3raLogo } from "@/components/v3ra-logo";
import { Sparkles, Trophy, User, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavbarProps {
  userPoints?: number;
  onClaimBonus?: () => void;
  canClaimBonus?: boolean;
  claiming?: boolean;
}

export function Navbar({ 
  userPoints = 0
}: NavbarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/ask",
      label: "Play",
      icon: Sparkles,
    },
    {
      href: "/blind-test/gpt-challenge",
      label: "GPT Challenge 🔥",
      icon: Sparkles,
    },
    {
      href: "/explore",
      label: "Explore",
      icon: BarChart3,
    },
    {
      href: "/leaderboard",
      label: "Leaderboard",
      icon: Trophy,
    },
    {
      href: "/profile",
      label: "Profile",
      icon: User,
    }
  ];

  return (
    <>
      <div className="bg-black/50 backdrop-blur-2xl sticky top-0 z-50 border-b border-white/5">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
          {/* Logo - links to home */}
          <Link href="/" className="flex items-center gap-2 group">
            <V3raLogo size="sm" variant="neon" />
          </Link>

          {/* Center Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200",
                    isActive
                      ? "bg-purple-600/20 text-purple-400"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Points Display */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="relative order-2 md:order-1"
              data-points-display
            >
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-[1px] rounded-full">
                <div className="bg-black/80 backdrop-blur rounded-full px-3 md:px-4 py-1.5 md:py-2 flex items-center gap-1.5 md:gap-2">
                  <Sparkles className="w-3.5 md:w-4 h-3.5 md:h-4 text-yellow-400" />
                  <span className="font-bold text-white text-sm md:text-base">{userPoints.toLocaleString()}</span>
                </div>
              </div>
            </motion.div>

          </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-2xl border-t border-white/5 z-50">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 px-4 rounded-lg transition-all duration-200",
                  isActive
                    ? "text-purple-400"
                    : "text-white/60 hover:text-white"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
