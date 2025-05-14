"use client";

import { useTheme } from "next-themes";

export function useBackgroundImage(serverTheme?: "light" | "dark"): string {
  const { theme } = useTheme();
  // Use serverTheme for SSR, fallback to client theme, default to dark
  const effectiveTheme = theme || serverTheme || "dark";
  if (!theme) {
    console.log("[useBackgroundImage] Theme not yet mounted, using:", effectiveTheme);
  }
  return effectiveTheme === "dark" ? "url(/bg_home_black.jpg)" : "url(/bg_home_white.jpg)";
}