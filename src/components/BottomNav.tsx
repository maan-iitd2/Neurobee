"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/lib/i18n";

const NAV_ITEMS = [
  { href: "/", labelKey: "nav.home", icon: "home", matchPaths: ["/"] },
  { href: "/milestones", labelKey: "nav.assess", icon: "insights", matchPaths: ["/milestones", "/insights", "/observe", "/screen"] },
  { href: "/profile", labelKey: "nav.settings", icon: "settings", matchPaths: ["/profile", "/referrals"] },
];

export function BottomNav() {
  const pathname = usePathname();
  const t = useTranslation();

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 md:bottom-8 md:left-1/2 md:w-max md:-translate-x-1/2 md:rounded-full md:border md:border-outline-variant/30 backdrop-blur-2xl bg-surface/90 rounded-t-[28px] botanical-shadow pb-[max(2rem,env(safe-area-inset-bottom))] md:pb-0">
      <div className="flex justify-around items-center px-4 pt-3 pb-2 md:py-2 md:px-6 md:gap-8 max-w-lg mx-auto">
        {NAV_ITEMS.map(({ href, labelKey, icon, matchPaths }) => {
          const active = matchPaths.includes(pathname);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-0.5 px-5 py-2 md:px-4 md:py-1.5 md:flex-row md:gap-2 rounded-full transition-all duration-300 ${
                active
                  ? "bg-primary-gradient text-on-primary shadow-lg shadow-primary/20 md:scale-100 scale-95"
                  : "text-tertiary opacity-70 hover:opacity-100 hover:scale-105"
              }`}
            >
              <span
                className="material-symbols-outlined text-[22px] md:text-[20px]"
                style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
              >
                {icon}
              </span>
              <span className={`font-label text-[10px] md:text-xs uppercase tracking-widest font-semibold ${active ? "" : "md:hidden"}`}>
                {t(labelKey)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
