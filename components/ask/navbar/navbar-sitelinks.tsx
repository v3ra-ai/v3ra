"use client";

import Link from "next/link";
import * as HoverCard from "@radix-ui/react-hover-card";
import { useAuth } from "@/contexts/auth-context";

interface NavLinkProps {
  href: string;
  label: string;
  description: string;
  isMobile?: boolean;
}

function NavLink({ href, label, description, isMobile = false }: NavLinkProps) {
  if (isMobile) {
    return (
      <Link
        href={href}
        className="mobile-nav-link block px-4 py-3 text-base font-medium text-zinc-700 dark:text-zinc-300 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
      >
        <div>
          <div className="font-semibold">{label}</div>
          <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">{description}</div>
        </div>
      </Link>
    );
  }

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

interface NavbarSitelinksProps {
  isMobile?: boolean;
}

/**
 * Renders navigation links for the site, responsive for both mobile and desktop.
 * Desktop: horizontal layout with hover tooltips
 * Mobile: vertical layout with descriptions visible
 */
export function NavbarSitelinks({ isMobile = false }: NavbarSitelinksProps) {
  const { user } = useAuth();
  
  // Only show navigation links if user is authenticated
  if (!user) {
    return null;
  }
  
  const links = [
    {
      href: "/ask",
      label: "Ask",
      description: "Ask AI models questions and explore consensus"
    },
    {
      href: "/ai-hub",
      label: "AI Hub",
      description: "Configure your AI consensus panel"
    }
  ];

  if (isMobile) {
    return (
      <div className="space-y-2">
        {links.map((link) => (
          <NavLink key={link.href} {...link} isMobile={true} />
        ))}
      </div>
    );
  }

  return (
    <div className="hidden md:flex items-center space-x-8">
      {links.map((link) => (
        <NavLink key={link.href} {...link} isMobile={false} />
      ))}
    </div>
  );
}