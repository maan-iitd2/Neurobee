"use client";

import { UserButton, useUser } from "@clerk/nextjs";

export function TopBar() {
  const isMockEnv = !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === "pk_test_placeholder";

  return (
    <header className="w-full top-0 sticky bg-surface-container-low/80 backdrop-blur-xl z-[60]">
      <div className="flex justify-between items-center px-6 py-4 w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-container-highest ring-1 ring-primary/10 flex items-center justify-center">
             {isMockEnv ? (
               <div className="w-full h-full bg-primary" />
             ) : (
               <UserButton />
             )}
          </div>
          <span className="text-primary font-headline font-bold tracking-tighter text-lg">
            NeuroBee
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-tertiary hover:opacity-80 transition-opacity duration-300">
            <span className="material-symbols-outlined">notifications</span>
          </button>
        </div>
      </div>
    </header>
  );
}