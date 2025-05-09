"use client";

import Link from "next/link";
import NavbarCredits from "./navbar-credits";

/**
 * Renders navigation links for the site, hidden on mobile and displayed horizontally on desktop.
 * Includes links to Home, Explorer, Start a validator, Stake, and Shop.
 */
export function NavbarSitelinks() {
  return (
    <div className="hidden md:flex items-center space-x-8">
      {/* <Link
        href="/"
        className="text-gray-700 hover:text-teal-500 dark:text-gray-300 dark:hover:text-teal-400"
      >
        Home
      </Link> */}
      <Link
        href="/ask/?q=factCheck"
        className="text-gray-700 hover:text-teal-500 dark:text-gray-300 dark:hover:text-teal-400"
      >
        Ask
      </Link>
      {/* <Link
        href="/explorer"
        className="text-gray-700 hover:text-teal-500 dark:text-gray-300 dark:hover:text-teal-400"
      >
        Explorer
      </Link> */}
      <Link
        href="/validators/"
        className="text-gray-700 hover:text-teal-500 dark:text-gray-300 dark:hover:text-teal-400"
      >
        Validators
      </Link>
      <Link
        href="/credits"
        className="text-gray-700 hover:text-teal-500 dark:text-gray-300 dark:hover:text-teal-400"
      >
        Stake
      </Link>
      <Link
        href="/ask/?q=predict"
        className="text-gray-700 hover:text-teal-500 dark:text-gray-300 dark:hover:text-teal-400"
      >
        Predict
      </Link>
      <Link
        href="/ask/?q=shop"
        className="text-gray-700 hover:text-teal-500 dark:text-gray-300 dark:hover:text-teal-400"
      >
        Shop
      </Link>
      <NavbarCredits />

    </div>
  );
}
