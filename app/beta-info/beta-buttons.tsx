"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

interface BetaButtonsProps {
  isLoggedIn: boolean;
}

export default function BetaButtons({ isLoggedIn }: BetaButtonsProps) {
  const betaSignupUrl =
    "https://docs.google.com/forms/d/e/1FAIpQLSdIf4VDxZkQYJChBia-_kS7f0kxm-slwLozUVp0AzmFbT1JOg/viewform?usp=header";

  return (
    <div className="flex flex-col space-y-4">
      <Button
        asChild
        className="w-full bg-teal-600 hover:bg-teal-700 dark:bg-teal-400 dark:hover:bg-teal-500 cursor-pointer"
      >
        <Link href={betaSignupUrl} target="_blank">
          <span className="text-lg">Join Beta Waitlist</span>
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
      <div className="w-full justify-center">
        <p className="text-xs text-center">* Requires approval to access the site</p>
      </div>
      {!isLoggedIn && (
        <>
          <Button
            asChild
            variant="outline"
            className="w-full border-zinc-300 dark:border-zinc-600 text-zinc-800 dark:text-zinc-200 cursor-pointer"
          >
            <Link href="/login">Site Log In</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="w-full border-zinc-300 dark:border-zinc-600 text-zinc-800 dark:text-zinc-200 cursor-pointer"
          >
            <Link href="/signup">Site Sign Up</Link>
          </Button>
        </>
      )}
    </div>
  );
}
