import "./globals.css";
import type { Metadata } from "next";
import { Inter, Orbitron, Rajdhani } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { ValidatorInitializer } from "@/components/validator-initializer";
import { ThemeInitializer } from "@/components/theme-initializer";
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
  title: "V3RA - Truth Refinement",
  description: "Ask AI models questions. Refine truth through consensus. Earn tokens.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
      </head>
      <body className={`${inter.className} ${orbitron.variable} ${rajdhani.variable}`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <ThemeInitializer />
          <ValidatorInitializer />
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