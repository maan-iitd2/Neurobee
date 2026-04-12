"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ScreenError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[NeuroBee/error] Screen Error Boundary caught:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center space-y-6">
      <div className="w-20 h-20 rounded-full bg-error/10 flex items-center justify-center">
        <span className="material-symbols-outlined text-error text-4xl">videocam_off</span>
      </div>
      
      <div className="space-y-2 max-w-sm">
        <h1 className="text-h1">Camera or Model Error</h1>
        <p className="text-body text-on-surface-variant">
          We encountered an issue starting the vision screening. This can happen if camera access is denied, or if your browser ran out of memory.
        </p>
      </div>

      <div className="bg-surface-container-low p-4 rounded-xl text-body-sm text-on-surface-variant text-left max-w-sm w-full font-mono overflow-auto border border-outline-variant/20">
        {error.message || "Unknown error occurred"}
      </div>

      <div className="flex flex-col w-full max-w-xs gap-3">
        <button
          onClick={() => reset()}
          className="w-full py-4 rounded-full bg-primary text-on-primary text-label transition-all hover:opacity-90 active:scale-95"
        >
          Retry Screening
        </button>
        <Link
          href="/"
          className="w-full py-4 rounded-full border border-outline-variant text-on-surface text-label transition-all hover:bg-surface-container"
        >
          Nevermind, Go Home
        </Link>
      </div>
    </div>
  );
}
