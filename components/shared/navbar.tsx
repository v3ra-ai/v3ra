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
          <div className="flex items-center gap-3">
            {/* Points Display */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="relative"
              data-points-display
            >
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-[1px] rounded-full">
                <div className="bg-black/80 backdrop-blur rounded-full px-4 py-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                  <span className="font-bold text-white">{userPoints.toLocaleString()}</span>
                </div>
              </div>
            </motion.div>

            {/* Mobile Menu */}
            <div className="md:hidden flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "p-2 rounded-lg transition-all duration-200",
                      isActive
                        ? "bg-purple-600/20 text-purple-400"
                        : "text-white/60 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
