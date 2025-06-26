import "./globals.css";
import type { Metadata } from "next";
import { Inter, Orbitron, Rajdhani } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import type { ReactNode } from "react";
import { SolanaProvider } from "@/components/solana-provider";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });
const orbitron = Orbitron({ 
  subsets: ["latin"],
  variable: "--font-orbitron"
});
const rajdhani = Rajdhani({ 
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-rajdhani"
});

export const metadata: Metadata = {
  title: "v3ra AI Consensus Network",
  description: "v3ra - Distributed AI validation and consensus network",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body className={`${inter.className} ${orbitron.variable} ${rajdhani.variable}`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <SolanaProvider>
            <main className="w-full max-w-none mx-auto">{children}</main>
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