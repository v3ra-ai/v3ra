import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { ValidatorInitializer } from "@/components/validator-initializer";
import { ValidatorHealthCheck } from "@/components/validator-health-check";
import type { ReactNode } from "react";
import { SolanaProvider } from "@/components/solana-provider";
import { Toaster } from "sonner";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "v3ra AI Consensus Network",
  description: "v3ra - Distributed AI validation and consensus network",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  if (typeof window === 'undefined') return;
                  const theme = localStorage.getItem('theme') || 'dark';
                  if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                  document.documentElement.setAttribute('data-theme', theme);
                  
                  // Preload the appropriate background image based on theme
                  const bgImage = (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) 
                    ? '/bg_home_black.jpg' 
                    : '/bg_home_white.jpg';
                  const link = document.createElement('link');
                  link.rel = 'preload';
                  link.as = 'image';
                  link.href = bgImage;
                  document.head.appendChild(link);
                } catch (e) {
                  console.error('Theme script error:', e);
                }
              })();
            `,
          }}
        />
        <Script
          src="/newrelic.js"
          strategy="afterInteractive"
          type="text/javascript"
        />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <ValidatorInitializer />
          <div className="fixed bottom-4 right-4 z-50 w-72">
            <ValidatorHealthCheck />
          </div>
          <SolanaProvider>
            <main className="w-full max-w-none mx-auto debug-layout">{children}</main>
            <Toaster
              richColors
              position="bottom-center"
              closeButton
              visibleToasts={1}
            />
          </SolanaProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}