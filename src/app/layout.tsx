import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs'
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-headline",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

import type { Viewport } from "next";

export const metadata: Metadata = {
  title: "NeuroBee",
  description: "A gentle space for supportive growth and daily insights.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#0f6b50",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isMockEnv = !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === "pk_test_placeholder";

  const content = (
    <html lang="en" className="light">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body
        className={`${inter.variable} ${plusJakartaSans.variable} bg-surface font-body text-on-surface selection:bg-primary-fixed selection:text-on-primary-fixed-variant`}
      >
        {children}
      </body>
    </html>
  );

  if (isMockEnv) {
    return content;
  }

  return <ClerkProvider>{content}</ClerkProvider>;
}
