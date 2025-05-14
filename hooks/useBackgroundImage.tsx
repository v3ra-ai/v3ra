import { useTheme } from "next-themes";

export function useBackgroundImage(serverTheme?: "light" | "dark") {
  const { theme } = useTheme();
  // Use serverTheme for SSR, fallback to client theme, default to dark
  const effectiveTheme = theme || serverTheme || "dark";
  return effectiveTheme === "dark" ? "url(/bg_home_black.jpg)" : "url(/bg_home_white.jpg)";
}