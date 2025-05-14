import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { ValidatorInitializer } from "@/components/validator-initializer";
import { ValidatorHealthCheck } from "@/components/validator-health-check";
import type { ReactNode } from "react";
import { SolanaProvider } from "@/components/solana-provider";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Verafy v0 Testnet",
  description: "Verafy Testnet interface and explorer",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preload" as="style" href="/globals.css" />
        <link rel="preload" as="image" href="/bg_home_black.jpg" />
        <style>{`
          html.dark body {
            background-color: oklch(0.145 0 0);
          }
        `}</style>
      </head>
      <body className={inter.className}>
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
            {children}
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