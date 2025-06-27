"use client";

import Link from "next/link";
import { Twitter, Send } from "lucide-react";

export default function AskFooter() {

  return (
    <>
      <div className="">
        <footer className="bg-black glass-morphism border-t border-border/50 dark:border-border/20 text-zinc-600 dark:text-zinc-400 mt-auto">
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="flex flex-col items-center space-y-6">
              {/* Social Media Icons */}
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4 text-center">
                  Follow Us
                </h3>
                <div className="flex items-center space-x-6">
                  <div className="relative group">
                    <Link
                      href="https://x.com/v3ra_ai"
                      className="hover:text-cyan-500 dark:hover:text-cyan-400 transition-all duration-200 hover:drop-shadow-[0_0_8px_rgba(0,255,255,0.5)] inline-block"
                      aria-label="Follow us on X"
                    >
                      <Twitter size={24} />
                    </Link>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-zinc-800 text-white text-sm rounded-md whitespace-nowrap pointer-events-none z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      Follow us on X
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-zinc-800"></div>
                    </div>
                  </div>
                  <div className="relative group">
                    <Link
                      href="https://t.me/v3ra_ai"
                      className="hover:text-cyan-500 dark:hover:text-cyan-400 transition-all duration-200 hover:drop-shadow-[0_0_8px_rgba(0,255,255,0.5)] inline-block"
                      aria-label="Join our TG Community"
                    >
                      <Send size={24} />
                    </Link>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-zinc-800 text-white text-sm rounded-md whitespace-nowrap pointer-events-none z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      Join our TG Community
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-zinc-800"></div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Copyright with MIT License */}
              <div className="text-center text-sm">
                <p>© {new Date().getFullYear()} v3ra. Licensed under MIT License.</p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
