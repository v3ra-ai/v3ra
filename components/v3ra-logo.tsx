"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";

interface V3raLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function V3raLogo({ className, size = "md" }: V3raLogoProps) {
  const sizeClasses = {
    sm: { width: 80, height: 40 },
    md: { width: 120, height: 60 },
    lg: { width: 160, height: 80 }
  };

  const dimensions = sizeClasses[size];

  return (
    <div 
      className={cn("relative flex items-center justify-center", className)}
      style={{
        width: dimensions.width,
        height: dimensions.height,
      }}
    >
      <Image
        src="/logos/v3ralogo.png"
        alt="V3RA Logo"
        width={dimensions.width}
        height={dimensions.height}
        className="object-contain"
        style={{ 
          transform: 'translateY(2px)',
          marginLeft: '-10px' 
        }}
        priority
      />
    </div>
  );
}