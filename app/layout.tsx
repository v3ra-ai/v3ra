import "./globals.css";
import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { ValidatorInitializer } from "@/components/validator-initializer";
import { ThemeInitializer } from "@/components/theme-initializer";
import type { ReactNode } from "react";
import { SolanaMobileProvider } from "@/components/solana-mobile-provider";
import { Toaster } from "sonner";
import { PWARegister } from "@/components/pwa-register";

// Use Inter for body text (clean, modern, excellent readability)
const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Use Outfit for headings (modern, geometric, premium feel)
const outfit = Outfit({ 
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "V3RA - Truth Refinement",
  description: "Ask AI models questions. Refine truth through consensus. Earn tokens.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "V3RA",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
      </head>
      <body className={`${inter.variable} ${outfit.variable} font-sans antialiased`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <ThemeInitializer />
          <ValidatorInitializer />
          <PWARegister />
          <SolanaMobileProvider>
            <main className="w-full max-w-none mx-auto debug-layout">{children}</main>
            <Toaster
              richColors
              position="bottom-center"
              closeButton
              visibleToasts={1}
            />
          </SolanaMobileProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}