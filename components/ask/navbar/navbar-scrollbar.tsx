"use client";

import { ViewMode } from "@/lib/types";

interface NavbarScrollbarProps {
  mounted: boolean;
  showSearch: boolean;
  viewMode?: ViewMode;
}

export function NavbarScrollbar({ mounted: _mounted, showSearch: _showSearch, viewMode: _viewMode }: NavbarScrollbarProps) {
  // Scrollbar disabled for simplified UI
  return null;
}