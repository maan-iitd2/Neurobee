"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  {
    href: "/",
    label: "Home",
    icon: "home",
    matchPaths: ["/"],
  },
  {
    href: "/milestones",
    label: "Progress",
    icon: "insights",
    matchPaths: ["/milestones", "/insights", "/reflection"],
  },
  {
    href: "/profile",
    label: "Settings",
    icon: "settings",
    matchPaths: ["/profile"],
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    // pb-safe handles env(safe-area-inset-bottom) so the nav sits above the home indicator on iOS
    // and above the gesture navigation bar on Android.
    <nav className="fixed bottom-0 left-0 w-full z-50 backdrop-blur-2xl bg-surface/85 rounded-t-[28px] botanical-shadow pb-safe">
      <div className="flex justify-around items-center px-4 pt-3 pb-2 max-w-lg mx-auto">
        {NAV_ITEMS.map(({ href, label, icon, matchPaths }) => {
          const active = matchPaths.includes(pathname);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-0.5 px-5 py-2 rounded-full transition-all duration-300 ${
                active
                  ? "bg-primary-gradient text-on-primary scale-95"
                  : "text-tertiary opacity-70 hover:opacity-100 hover:scale-105"
              }`}
            >
              <span
                className="material-symbols-outlined text-[22px]"
                style={{
                  fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0",
                }}
              >
                {icon}
              </span>
              <span className="font-label text-[9px] uppercase tracking-widest font-semibold">
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
