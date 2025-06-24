"use client";

import { cn } from "@/lib/utils";

interface V3raLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function V3raLogo({ className, size = "md" }: V3raLogoProps) {
  const sizeClasses = {
    sm: "text-2xl",
    md: "text-3xl",
    lg: "text-5xl"
  };

  return (
    <div className={cn("relative", className)}>
      {/* Main logo text - minimal and premium */}
      <h1 
        className={cn(
          sizeClasses[size],
          "font-bold tracking-tight relative z-10",
          "text-foreground",
          "transition-all duration-200",
          "hover:opacity-80",
          "select-none font-display"
        )}
      >
        V3RA
      </h1>
    </div>
  );
}