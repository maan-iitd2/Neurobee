import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { ProfileProvider } from "@/context/ProfileContext";
import { AppProvider } from "@/context/AppContext";
import { LanguageSync } from "@/components/LanguageSync";
import { PwaRegister } from "@/components/PwaRegister";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-headline",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "NeuroBee",
  description: "A gentle space for supportive growth and daily insights.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "NeuroBee",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#0f6b50",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <head>
        {/* Material Symbols is a variable icon font — next/font/google doesn't support it */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${inter.variable} ${plusJakartaSans.variable} bg-surface font-body text-on-surface selection:bg-primary-fixed selection:text-on-primary-fixed-variant`}
        suppressHydrationWarning
      >
        <PwaRegister />
        <ProfileProvider>
          <AppProvider>
            <LanguageSync />
            {children}
          </AppProvider>
        </ProfileProvider>
      </body>
    </html>
  );
}
