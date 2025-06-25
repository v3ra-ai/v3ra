import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "V3RA Arena - Proof of Human Work",
  description: "Evaluate AI responses. Discover truth through human consensus.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}