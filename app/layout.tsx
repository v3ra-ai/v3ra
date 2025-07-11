import "./globals.css";
import type { Metadata } from "next";
import { Inter, Orbitron, Rajdhani } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import type { ReactNode } from "react";
import { SolanaProvider } from "@/components/solana-provider";
import { Toaster } from "sonner";
import { HotjarProvider } from "@/components/hotjar-provider";
import { FeedbackWidget } from "@/components/feedback/feedback-widget";
import { AuthProvider } from "@/contexts/auth-context";
import { WelcomeModal } from "@/components/onboarding/welcome-modal";
import { ClientScripts } from "@/components/client-scripts";
import GlobalErrorBoundary from "./error-boundary";

export const dynamic = 'force-dynamic';

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  preload: true,
});
const orbitron = Orbitron({ 
  subsets: ["latin"],
  variable: "--font-orbitron",
  display: 'swap',
});
const rajdhani = Rajdhani({ 
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-rajdhani",
  display: 'swap',
});

export const metadata: Metadata = {
  title: "v3ra AI Consensus Network",
  description: "v3ra - Distributed AI validation and consensus network",
  keywords: "AI, consensus, prediction markets, truth verification, blockchain",
  authors: [{ name: "v3ra Team" }],
  creator: "v3ra",
  publisher: "v3ra",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://v3ra.vercel.app'),
  openGraph: {
    title: "v3ra AI Consensus Network",
    description: "Multi-AI consensus network for truth verification and prediction markets",
    siteName: "v3ra",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "v3ra AI Consensus Network",
    description: "Multi-AI consensus network for truth verification and prediction markets",
  },
  manifest: "/site.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "v3ra",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        
        {/* Preload critical resources */}
        <link rel="preload" href="/logos/v3ralogo.png" as="image" type="image/png" />
        <link rel="preload" href="/icons/chatgpt.png" as="image" type="image/png" />
        <link rel="preload" href="/icons/claude.png" as="image" type="image/png" />
        <link rel="preload" href="/icons/gemini.png" as="image" type="image/png" />
        
        {/* DNS prefetch for external resources */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
        <link rel="dns-prefetch" href="//www.google-analytics.com" />
        
        {/* Google tag (gtag.js) - Server-safe */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-RFVVNY8TD0"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-RFVVNY8TD0', {
                page_title: document.title,
                page_location: window.location.href
              });
            `,
          }}
        />
      </head>
      <body className={`${inter.className} ${orbitron.variable} ${rajdhani.variable}`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <SolanaProvider>
              <HotjarProvider />
              <GlobalErrorBoundary />
              <main className="w-full max-w-none mx-auto">{children}</main>
              <WelcomeModal />
              <FeedbackWidget />
              <Toaster
                richColors
                position="bottom-center"
                closeButton
                visibleToasts={1}
                duration={4000}
              />
              <ClientScripts />
            </SolanaProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}