"use client";

import { cn } from "@/lib/utils";

interface V3raLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function V3raLogo({ className, size = "md" }: V3raLogoProps) {
  const sizeClasses = {
    sm: "text-2xl",
    md: "text-4xl",
    lg: "text-6xl"
  };

  return (
    <div className={cn("relative group", className)}>
      {/* Cyberpunk glow effect */}
      <div className="absolute inset-0 blur-lg bg-gradient-to-r from-cyan-500 to-purple-500 opacity-0 group-hover:opacity-50 transition-opacity duration-300" />
      
      {/* Main logo text */}
      <h1 
        className={cn(
          sizeClasses[size],
          "font-bold tracking-wider relative z-10",
          "bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent",
          "drop-shadow-[0_0_20px_rgba(6,182,212,0.5)]",
          "transition-all duration-300",
          "group-hover:drop-shadow-[0_0_30px_rgba(168,85,247,0.8)]",
          "select-none"
        )}
        style={{
          fontFamily: "'Orbitron', 'Rajdhani', 'Audiowide', monospace",
          textShadow: `
            0 0 10px rgba(6, 182, 212, 0.5),
            0 0 20px rgba(168, 85, 247, 0.3),
            0 0 30px rgba(236, 72, 153, 0.2)
          `
        }}
      >
        V3RA
      </h1>
      
      {/* Glitch effect on hover */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <h1 
          className={cn(
            sizeClasses[size],
            "font-bold tracking-wider",
            "text-cyan-400",
            "animate-pulse"
          )}
          style={{
            fontFamily: "'Orbitron', 'Rajdhani', 'Audiowide', monospace",
            clipPath: "polygon(0 45%, 100% 45%, 100% 55%, 0 55%)"
          }}
        >
          V3RA
        </h1>
      </div>
      
      {/* Scanline effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded">
        <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-300"
          style={{
            background: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(6, 182, 212, 0.3) 2px,
              rgba(6, 182, 212, 0.3) 4px
            )`
          }}
        />
      </div>
    </div>
  );
}