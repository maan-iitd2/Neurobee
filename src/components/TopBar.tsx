"use client";

import { useProfile } from "@/context/ProfileContext";
import Image from "next/image";

export function TopBar() {
  const { profile } = useProfile();

  return (
    <header className="w-full top-0 sticky bg-surface-container-low/80 backdrop-blur-xl z-[60]" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <div className="flex justify-between items-center px-6 py-4 w-full max-w-5xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 relative shrink-0 rounded-full overflow-hidden bg-white/50 border border-primary/10">
            <Image 
              src="/Logo.png" 
              alt="NeuroBee Logo" 
              fill 
              className="object-contain p-1"
              sizes="40px"
              priority
            />
          </div>
          <div className="leading-tight">
            <span className="text-h3 text-primary block">
              NeuroBee
            </span>
            {profile && (
              <span className="text-caption-caps text-tertiary">
                {profile.parentName}
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
