"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[NeuroBee/error] Global Error Boundary caught:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center space-y-6">
      <div className="w-20 h-20 rounded-full bg-error/10 flex items-center justify-center">
        <span className="material-symbols-outlined text-error text-4xl">warning</span>
      </div>
      
      <div className="space-y-2 max-w-sm">
        <h1 className="font-headline text-2xl font-bold text-on-surface">Something went wrong</h1>
        <p className="text-sm text-on-surface-variant leading-relaxed">
          The app encountered an unexpected error. Please try again or return home.
        </p>
      </div>

      <div className="flex flex-col w-full max-w-xs gap-3">
        <button
          onClick={() => reset()}
          className="w-full py-4 rounded-full bg-primary text-on-primary font-bold text-base transition-all hover:opacity-90 active:scale-95"
        >
          Try Again
        </button>
        <Link
          href="/"
          className="w-full py-4 rounded-full border border-outline-variant text-on-surface font-semibold text-sm transition-all hover:bg-surface-container"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
