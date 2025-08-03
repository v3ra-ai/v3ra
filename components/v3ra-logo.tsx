"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface V3raLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "minimal" | "icon" | "abstract" | "checkmark" | "neon";
}

export function V3raLogo({ className, size = "md", variant = "minimal" }: V3raLogoProps) {
  switch (variant) {
    case "minimal":
      return <V3raLogoMinimal className={className} size={size} />;
    case "icon":
      return <V3raLogoIcon className={className} size={size} />;
    case "abstract":
      return <V3raLogoAbstract className={className} size={size} />;
    case "checkmark":
      return <V3raLogoCheckmark className={className} size={size} />;
    case "neon":
      return <V3raLogoNeon className={className} size={size} />;
    default:
      return <V3raLogoDefault className={className} size={size} />;
  }
}

// Default logo with geometric design
function V3raLogoDefault({ className, size = "md" }: Omit<V3raLogoProps, "variant">) {
  const sizeConfig = {
    sm: { height: 32, fontSize: "1.25rem" },
    md: { height: 40, fontSize: "1.5rem" },
    lg: { height: 56, fontSize: "2rem" },
    xl: { height: 72, fontSize: "2.5rem" }
  };

  const { height, fontSize } = sizeConfig[size];

  return (
    <div className={cn("relative flex items-center gap-2", className)}>
      {/* Geometric V icon */}
      <div className="relative" style={{ height }}>
        <svg
          height={height}
          width={height}
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a855f7">
                <animate attributeName="stop-color" values="#a855f7;#ec4899;#a855f7" dur="3s" repeatCount="indefinite" />
              </stop>
              <stop offset="100%" stopColor="#ec4899">
                <animate attributeName="stop-color" values="#ec4899;#a855f7;#ec4899" dur="3s" repeatCount="indefinite" />
              </stop>
            </linearGradient>
          </defs>
          
          {/* Modern V shape */}
          <path
            d="M8 8 L20 32 L32 8 L26 8 L20 20 L14 8 Z"
            fill="url(#logo-gradient)"
          />
          
          {/* Accent dot */}
          <circle cx="20" cy="8" r="3" fill="url(#logo-gradient)" opacity="0.8" />
        </svg>
      </div>

      {/* Text */}
      <div className="font-bold tracking-tight" style={{ fontSize }}>
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
          3RA
        </span>
      </div>
    </div>
  );
}

// Minimal text-only version - RECOMMENDED
function V3raLogoMinimal({ className, size = "md" }: Omit<V3raLogoProps, "variant">) {
  const sizeConfig = {
    sm: { fontSize: "1.5rem", letterSpacing: "-0.02em", checkSize: 24 },
    md: { fontSize: "2rem", letterSpacing: "-0.02em", checkSize: 32 },
    lg: { fontSize: "3rem", letterSpacing: "-0.05em", checkSize: 48 },
    xl: { fontSize: "4rem", letterSpacing: "-0.05em", checkSize: 64 }
  };

  const { fontSize, letterSpacing, checkSize } = sizeConfig[size];

  return (
    <motion.div 
      className={cn("font-black relative inline-flex items-center", className)}
      style={{ fontSize, letterSpacing }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400 }}
    >
      <span className="relative inline-flex items-center">
        {/* MORE PRONOUNCED Checkmark-style V */}
        <svg 
          width={checkSize} 
          height={checkSize} 
          viewBox="0 0 40 40" 
          className="inline-block"
          style={{ marginBottom: checkSize * -0.1, marginRight: -checkSize * 0.1 }}
        >
          <defs>
            <linearGradient id={`check-gradient-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>
          {/* More dramatic checkmark with shorter left stroke and steeper angle */}
          <path
            d="M10 22 L16 30 L30 10"
            stroke={`url(#check-gradient-${size})`}
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Add a subtle circle background for more checkmark feel */}
          <circle cx="20" cy="20" r="18" stroke={`url(#check-gradient-${size})`} strokeWidth="1" fill="none" opacity="0.2" />
        </svg>
        {/* 3 with special styling - moved closer */}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400 relative" style={{ fontSize: '0.85em', verticalAlign: 'super', marginLeft: '-0.1em' }}>
          3
        </span>
        {/* RA */}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
          RA
        </span>
      </span>
    </motion.div>
  );
}

// ULTRA CHECKMARK version - Bold with circle background
function V3raLogoCheckmark({ className, size = "md" }: Omit<V3raLogoProps, "variant">) {
  const sizeConfig = {
    sm: { fontSize: "1.5rem", checkSize: 32 },
    md: { fontSize: "2rem", checkSize: 42 },
    lg: { fontSize: "3rem", checkSize: 56 },
    xl: { fontSize: "4rem", checkSize: 72 }
  };

  const { fontSize, checkSize } = sizeConfig[size];

  return (
    <motion.div 
      className={cn("font-black relative inline-flex items-center", className)}
      style={{ fontSize }}
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 400 }}
    >
      <span className="relative inline-flex items-center">
        {/* ULTRA PRONOUNCED Checkmark replacing V entirely */}
        <motion.svg 
          width={checkSize} 
          height={checkSize} 
          viewBox="0 0 50 50" 
          className="inline-block"
          style={{ marginRight: -checkSize * 0.2 }}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <defs>
            <linearGradient id={`ultra-check-gradient-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="50%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#f472b6" />
            </linearGradient>
            <filter id={`glow-${size}`}>
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Background circle with gradient */}
          <circle 
            cx="25" 
            cy="25" 
            r="22" 
            fill={`url(#ultra-check-gradient-${size})`} 
            opacity="0.1" 
          />
          
          {/* ULTRA dramatic checkmark */}
          <motion.path
            d="M12 25 L20 35 L38 15"
            stroke={`url(#ultra-check-gradient-${size})`}
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            filter={`url(#glow-${size})`}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </motion.svg>
        
        {/* 3RA text with special alignment */}
        <span className="inline-flex items-baseline" style={{ marginLeft: '-0.2em' }}>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400" style={{ fontSize: '0.9em' }}>
            3
          </span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            RA
          </span>
        </span>
      </span>
    </motion.div>
  );
}

// Icon-only version
function V3raLogoIcon({ className, size = "md" }: Omit<V3raLogoProps, "variant">) {
  const sizeConfig = {
    sm: { size: 24 },
    md: { size: 32 },
    lg: { size: 48 },
    xl: { size: 64 }
  };

  const { size: iconSize } = sizeConfig[size];

  return (
    <motion.div
      className={cn("relative", className)}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="icon-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="50%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
        
        {/* Checkmark in a circle */}
        <circle cx="16" cy="16" r="14" stroke="url(#icon-gradient)" strokeWidth="2" fill="none" />
        <path
          d="M9 15 L13 20 L23 10"
          stroke="url(#icon-gradient)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </motion.div>
  );
}

// Abstract modern version
function V3raLogoAbstract({ className, size = "md" }: Omit<V3raLogoProps, "variant">) {
  const sizeConfig = {
    sm: { size: 32 },
    md: { size: 48 },
    lg: { size: 64 },
    xl: { size: 80 }
  };

  const { size: logoSize } = sizeConfig[size];

  return (
    <motion.div
      className={cn("relative", className)}
      style={{ width: logoSize, height: logoSize }}
    >
      {/* Animated gradient background */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl blur-xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      {/* Main shape */}
      <svg
        width={logoSize}
        height={logoSize}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10"
      >
        <defs>
          <linearGradient id="abstract-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c084fc" />
            <stop offset="50%" stopColor="#f472b6" />
            <stop offset="100%" stopColor="#c084fc" />
          </linearGradient>
        </defs>
        
        {/* Abstract V shape with rounded corners */}
        <path
          d="M12 12 Q12 8 16 8 L24 8 Q28 8 26 12 L32 28 L38 12 Q36 8 40 8 L48 8 Q52 8 52 12 L52 16 Q52 20 50 22 L34 48 Q32 52 30 52 Q28 52 26 48 L14 22 Q12 20 12 16 Z"
          fill="url(#abstract-gradient)"
        />
        
        {/* Floating dots */}
        <motion.circle
          cx="32"
          cy="12"
          r="3"
          fill="white"
          opacity="0.8"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </svg>
    </motion.div>
  );
}

// NEON Checkmark version - Clean and modern like the reference
function V3raLogoNeon({ className, size = "md" }: Omit<V3raLogoProps, "variant">) {
  const sizeConfig = {
    sm: { fontSize: "1.5rem", checkSize: 36 },
    md: { fontSize: "2rem", checkSize: 48 },
    lg: { fontSize: "3rem", checkSize: 64 },
    xl: { fontSize: "4rem", checkSize: 80 }
  };

  const { fontSize, checkSize } = sizeConfig[size];

  return (
    <motion.div 
      className={cn("font-black relative inline-flex items-center", className)}
      style={{ fontSize }}
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 400 }}
    >
      <span className="relative inline-flex items-center">
        {/* Clean NEON checkmark */}
        <svg 
          width={checkSize} 
          height={checkSize} 
          viewBox="0 0 60 60" 
          className="inline-block"
          style={{ marginRight: -checkSize * 0.15 }}
        >
          <defs>
            <linearGradient id={`neon-gradient-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="50%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
            
            {/* Multiple blur filters for intense neon glow */}
            <filter id={`neon-glow-${size}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feGaussianBlur stdDeviation="2" result="coloredBlur2"/>
              <feGaussianBlur stdDeviation="1" result="coloredBlur3"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="coloredBlur2"/>
                <feMergeNode in="coloredBlur3"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Clean geometric checkmark path - similar to reference */}
          <motion.path
            d="M15 30 L24 42 L45 18"
            stroke={`url(#neon-gradient-${size})`}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            filter={`url(#neon-glow-${size})`}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
          
          {/* Additional glow layer for extra neon effect */}
          <motion.path
            d="M15 30 L24 42 L45 18"
            stroke={`url(#neon-gradient-${size})`}
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity="0.4"
            filter={`url(#neon-glow-${size})`}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.4 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
          />
        </svg>
        
        {/* 3RA text with neon glow effect */}
        <span className="inline-flex items-baseline" style={{ marginLeft: '-0.15em', filter: 'drop-shadow(0 0 8px rgba(236, 72, 153, 0.5))' }}>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400" style={{ fontSize: '0.9em' }}>
            3
          </span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            RA
          </span>
        </span>
      </span>
    </motion.div>
  );
}
