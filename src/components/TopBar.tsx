"use client";

import { useProfile } from "@/context/ProfileContext";

export function TopBar() {
  const { profile } = useProfile();
  const initial = profile ? profile.childName.charAt(0).toUpperCase() : "?";

  return (
    <header className="w-full top-0 sticky bg-surface-container-low/80 backdrop-blur-xl z-[60]" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <div className="flex justify-between items-center px-6 py-4 w-full max-w-5xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-gradient flex items-center justify-center ring-2 ring-primary/10 shrink-0">
            <span className="font-headline font-bold text-on-primary text-sm select-none">
              {initial}
            </span>
          </div>
          <div className="leading-tight">
            <span className="text-primary font-headline font-bold tracking-tighter text-base block">
              NeuroBee
            </span>
            {profile && (
              <span className="text-tertiary text-[10px] font-label uppercase tracking-widest">
                {profile.parentName}
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
