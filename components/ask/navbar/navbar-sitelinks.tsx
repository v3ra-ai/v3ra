"use client";

import Link from "next/link";
import * as HoverCard from "@radix-ui/react-hover-card";

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
          className="text-foreground/70 hover:text-foreground dark:hover:text-cyan-400 dark:hover:drop-shadow-[0_0_8px_rgba(0,255,255,0.6)] transition-all duration-300 font-medium text-base hover:-translate-y-0.5"
        >
          {label}
        </Link>
      </HoverCard.Trigger>
      <HoverCard.Portal>
        <HoverCard.Content
          className="z-50 glass-morphism rounded-lg px-4 py-3 max-w-xs shadow-xl animate-in fade-in-0 zoom-in-95 dark:border dark:border-cyan-500/30 dark:shadow-[0_0_20px_rgba(0,255,255,0.3)]"
          sideOffset={8}
        >
          <p className="text-sm text-foreground/90 dark:text-cyan-50">{description}</p>
          <HoverCard.Arrow className="fill-white/10 dark:fill-cyan-500/20" />
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
  return (
    <div className="hidden md:flex items-center space-x-8">
      <NavLink
        href="/ask"
        label="Ask"
        description="Ask AI models questions and explore consensus"
      />
      <NavLink
        href="/ai-hub"
        label="AI Hub"
        description="Configure your AI consensus panel"
      />
    </div>
  );
}