// app/ask/top-nav.tsx
"use client";

import React from 'react';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useQueryStore } from './query-store';

export function TopNav() {
  const { totalQueries } = useQueryStore();
  const isLoggedIn = false;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Image
            src="/verafy-logo.png"
            alt="Verafy Logo"
            width={100}
            height={40}
            className="object-contain"
          />
          <span className="text-white text-sm font-medium">
            Queries: {totalQueries} (stake to get more)
          </span>
        </div>

        <div className="flex items-center space-x-4">
          {isLoggedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="cursor-pointer h-9 w-9">
                  <AvatarImage src="https://github.com/shadcn.png" alt="User Avatar" />
                  <AvatarFallback>VA</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white text-black dark:bg-gray-800 dark:text-white">
                <DropdownMenuItem className="cursor-pointer">
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  Help/Feedback
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  Plan
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <button className="text-white text-sm font-medium hover:text-gray-300 transition-colors">
                Sign in
              </button>
              <button className="px-4 py-1.5 border border-white rounded-md text-white text-sm font-medium hover:bg-white hover:text-black transition-colors">
                Sign up
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}