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

export function TopNav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black text-white shadow-md">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        {/* Logo on the far left */}
        <div className="flex items-center">
          <Image
            src="/verafy-logo.png"
            alt="Verafy Logo"
            width={120}
            height={80}
            className="object-contain"
          />
        </div>

        {/* Avatar with Dropdown on the far right */}
        <div className="flex items-center">
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
        </div>
      </div>
    </nav>
  );
}