"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";

interface V3raLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function V3raLogo({ className, size = "md" }: V3raLogoProps) {
  const sizeClasses = {
    sm: { width: 100, height: 50 },
    md: { width: 150, height: 75 },
    lg: { width: 200, height: 100 }
  };

  const dimensions = sizeClasses[size];

  return (
    <div 
      className={cn("relative overflow-hidden rounded-lg", className)}
      style={{
        width: dimensions.width,
        height: dimensions.height,
      }}
    >
      {/* Use CSS to hide black pixels */}
      <div 
        className="absolute inset-0"
        style={{
          background: `url(/logos/v3ralogo.png) no-repeat center`,
          backgroundSize: 'contain',
          filter: 'brightness(1.3) contrast(1.2) saturate(1.3)',
          mixBlendMode: 'lighten', // This makes black pixels transparent
          transition: 'transform 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
      />
    </div>
  );
}