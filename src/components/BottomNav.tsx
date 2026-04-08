"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function BottomNav() {
  const pathname = usePathname();

  // Helper to determine if a link is active
  const isActive = (path: string) => pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-8 pb-8 pt-4 backdrop-blur-2xl bg-surface/80 rounded-t-[32px] botanical-shadow">
      {/* Home */}
      <Link
        href="/"
        className={`flex flex-col items-center justify-center transition-all duration-300 ${
          isActive("/")
            ? "bg-primary-gradient text-on-primary rounded-full px-6 py-2 scale-95"
            : "text-tertiary opacity-70 hover:scale-105"
        }`}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontVariationSettings: isActive("/") ? "'FILL' 1" : "'FILL' 0" }}
        >
          home
        </span>
        <span className="font-label text-[10px] uppercase tracking-widest font-medium mt-1">
          Home
        </span>
      </Link>

      {/* Progress / Milestones */}
      <Link
        href="/milestones"
        className={`flex flex-col items-center justify-center transition-all duration-300 ${
          isActive("/milestones") || isActive("/insights") || isActive("/reflection")
            ? "bg-primary-gradient text-on-primary rounded-full px-6 py-2 scale-95"
            : "text-tertiary opacity-70 hover:scale-105"
        }`}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontVariationSettings: isActive("/milestones") || isActive("/insights") || isActive("/reflection") ? "'FILL' 1" : "'FILL' 0" }}
        >
          insights
        </span>
        <span className="font-label text-[10px] uppercase tracking-widest font-medium mt-1">
          Progress
        </span>
      </Link>

      {/* Settings / Profile */}
      <Link
        href="/profile"
        className={`flex flex-col items-center justify-center transition-all duration-300 ${
          isActive("/profile")
            ? "bg-primary-gradient text-on-primary rounded-full px-6 py-2 scale-95"
            : "text-tertiary opacity-70 hover:scale-105"
        }`}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontVariationSettings: isActive("/profile") ? "'FILL' 1" : "'FILL' 0" }}
        >
          settings
        </span>
        <span className="font-label text-[10px] uppercase tracking-widest font-medium mt-1">
          Settings
        </span>
      </Link>
    </nav>
  );
}
