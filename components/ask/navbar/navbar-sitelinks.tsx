"use client";

import Link from "next/link";
import * as HoverCard from "@radix-ui/react-hover-card";
import { useTokenStore } from "@/store/token-store";
import { LoadingSpinner } from "@/components/loading-spinner-new";
import { useEffect } from "react";

interface NavLinkProps {
  href: string;
  label: string;
  description: string;
}

function NavLink({ href, label, description }: NavLinkProps) {
  return (
    <HoverCard.Root openDelay={200} closeDelay={100}>
      <HoverCard.Trigger asChild>
        <Link
          href={href}
          className="text-foreground/80 hover:text-foreground transition-all duration-200 font-medium text-[15px] tracking-tight hover:opacity-100"
        >
          {label}
        </Link>
      </HoverCard.Trigger>
      <HoverCard.Portal>
        <HoverCard.Content
          className="z-50 glass-morphism rounded-xl px-4 py-3 max-w-xs shadow-lg animate-in fade-in-0 zoom-in-95"
          sideOffset={8}
        >
          <p className="text-sm text-foreground/80 font-normal">{description}</p>
          <HoverCard.Arrow className="fill-white/5" />
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
  );
}

/**
 * Renders navigation links for the site, hidden on mobile and displayed horizontally on desktop.
 * Includes links with hover tooltips for better UX.
 */
export function NavbarSitelinks() {
  const { tokens, initializeTokens, isLoading } = useTokenStore();

  useEffect(() => {
    initializeTokens();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="hidden md:flex items-center space-x-8">
      <NavLink
        href="/ask"
        label="Ask"
        description="Spend tokens to get multi-AI answers"
      />
      <NavLink
        href="/refine"
        label="Refine"
        description="Earn tokens by selecting the best answers"
      />
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-foreground/5 hover:bg-foreground/10 transition-colors duration-200">
        <span className="text-lg">⚡</span>
        <span className="font-medium text-[15px] tracking-tight text-foreground/90">
          {isLoading ? (
            <LoadingSpinner noWrapper type="pulse" color="currentColor" size={4} message="" />
          ) : (
            tokens
          )}
        </span>
        <span className="text-foreground/60 text-sm font-normal">tokens</span>
      </div>
    </div>
  );
}