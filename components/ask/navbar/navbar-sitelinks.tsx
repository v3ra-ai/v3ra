"use client";

import Link from "next/link";
import NavbarCredits from "./navbar-credits";

/**
 * Renders navigation links for the site, hidden on mobile and displayed horizontally on desktop.
 * Includes links to Home, Ask, Predict, Shop, Validators, and Stake.
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
        href="/ask/fact-check"
        className="text-gray-700 hover:text-teal-500 dark:text-gray-300 dark:hover:text-teal-400"
      >
        Facts
      </Link>
      <Link
        href="/ask/predict"
        className="text-gray-700 hover:text-teal-500 dark:text-gray-300 dark:hover:text-teal-400"
      >
        Predict
      </Link>
      <Link
        href="/ask/shop"
        className="text-gray-700 hover:text-teal-500 dark:text-gray-300 dark:hover:text-teal-400"
      >
        Shop
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
      <NavbarCredits />
    </div>
  );
}