"use client";

import Link from "next/link";
import { useApp } from "@/context/AppContext";

export function ObservationPromptBanner() {
  const { latestSession, state } = useApp();

  // Only show if: questionnaire done AND latest session has no observation answers
  if (!state.hasCompletedQuestionnaire) return null;
  if (latestSession?.observationAnswers) return null;

  return (
    <div className="rounded-3xl bg-amber-50 border border-amber-200 p-4 flex items-start gap-3">
      <span className="material-symbols-outlined text-amber-600 text-xl flex-shrink-0 mt-0.5">
        science
      </span>
      <div className="flex-1 space-y-2">
        <p className="font-label text-sm font-semibold text-amber-900">
          Complete your multi-modal assessment
        </p>
        <p className="font-body text-xs text-amber-700 leading-relaxed">
          Add a 30-minute guided behavioural observation to get a fused risk score —
          more accurate than the questionnaire alone, based on Canvas Dx research methodology.
        </p>
        <Link
          href="/observe?from=milestones"
          className="inline-flex items-center gap-1.5 font-label text-sm font-semibold text-amber-800 underline"
        >
          Start observation
          <span className="material-symbols-outlined text-base">arrow_forward</span>
        </Link>
      </div>
    </div>
  );
}
