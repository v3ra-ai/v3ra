"use client";

import Link from "next/link";

/**
 * Renders navigation links for the site, hidden on mobile and displayed horizontally on desktop.
 * Includes links to Home, Explorer, Start a validator, Stake, and Shop.
 */
export function NavbarSitelinks() {
  return (
    <div className="hidden md:flex items-center space-x-8">
      <Link
        href="/"
        className="text-gray-700 hover:text-teal-500 dark:text-gray-300 dark:hover:text-teal-400"
      >
        Home
      </Link>
      <Link
        href="/explorer"
        className="text-gray-700 hover:text-teal-500 dark:text-gray-300 dark:hover:text-teal-400"
      >
        Explorer
      </Link>
      <Link
        href="/become-validator"
        className="text-gray-700 hover:text-teal-500 dark:text-gray-300 dark:hover:text-teal-400"
      >
        Start a validator
      </Link>
      <Link
        href="/credits"
        className="text-gray-700 hover:text-teal-500 dark:text-gray-300 dark:hover:text-teal-400"
      >
        Stake
      </Link>
      <Link
        href="/ask/?q=shop"
        className="text-gray-700 hover:text-teal-500 dark:text-gray-300 dark:hover:text-teal-400"
      >
        Shop
      </Link>
    </div>
  );
}