"use client"

import { useEffect, useState } from "react"
import { cn } from "@/utils/css-utils"

interface ShimmerLoadingProps {
  text?: string
  className?: string
  mode?: "light" | "dark" | "auto"
}

export function ShimmerLoading({
  text = "Loading...",
  className,
  mode = "auto"
}: ShimmerLoadingProps) {
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    // Check for dark mode preference if mode is auto
    if (mode === "auto") {
      // Check if document is available (client-side)
      if (typeof window !== "undefined") {
        // Initial check
        setIsDarkMode(
          window.matchMedia("(prefers-color-scheme: dark)").matches ||
          document.documentElement.classList.contains("dark")
        )

        // Listen for changes in color scheme preference
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
        const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches)
        mediaQuery.addEventListener("change", handleChange)

        // Listen for changes in the HTML class (for custom theme toggles)
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (
              mutation.attributeName === "class" &&
              mutation.target === document.documentElement
            ) {
              setIsDarkMode(document.documentElement.classList.contains("dark"))
            }
          })
        })

        observer.observe(document.documentElement, { attributes: true })

        return () => {
          mediaQuery.removeEventListener("change", handleChange)
          observer.disconnect()
        }
      }
    } else {
      // Directly set based on prop
      setIsDarkMode(mode === "dark")
    }
  }, [mode])

  return (
    <div className={cn("relative inline-block overflow-hidden", className)}>
      <span className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
        {text}
      </span>
      <div className="absolute inset-0 w-full">
        <div className={`shimmer-effect ${isDarkMode ? "shimmer-dark" : "shimmer-light"}`} />
      </div>
      <style jsx>{`
        .shimmer-effect {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }

        .shimmer-light {
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.4) 50%,
            rgba(255, 255, 255, 0) 100%
          );
        }

        .shimmer-dark {
          background: linear-gradient(
            90deg,
            rgba(161, 161, 170, 0) 0%,
            rgba(161, 161, 170, 0.3) 50%,
            rgba(161, 161, 170, 0) 100%
          );
        }

        @keyframes shimmer {
          0% {
            background-position: 100% 0;
          }
          100% {
            background-position: -100% 0;
          }
        }
      `}</style>
    </div>
  )
}
