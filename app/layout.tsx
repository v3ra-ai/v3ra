import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { ValidatorInitializer } from "@/components/validator-initializer";
import { ValidatorHealthCheck } from "@/components/validator-health-check";
import type { ReactNode } from "react";
import { SolanaProvider } from "@/components/solana-provider";
import { Toaster } from "sonner"; // Added for toast notifications

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Verafy v0 Testnet",
  description: "A simulated blockchain testnet with Solana-like leader rotation",
  generator: "v0.dev",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ValidatorInitializer />
          <div className="fixed bottom-4 right-4 z-50 w-72">
            <ValidatorHealthCheck />
          </div>
          <SolanaProvider>
            {children}
            <Toaster richColors position="top-right" /> {/* Added Toaster */}
          </SolanaProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}