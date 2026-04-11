"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { useApp } from "@/context/AppContext";
import { OBSERVATION_SCENARIOS, ObservationScenario } from "@/lib/observations";

type Screen = "intro" | "scenario" | "results";

function ObservePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromMilestones = searchParams.get("from") === "milestones";
  const { saveObservationAnswers, latestSession } = useApp();

  const [screen, setScreen] = useState<Screen>(fromMilestones ? "scenario" : "intro");
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState(false);

  const scenario = OBSERVATION_SCENARIOS[scenarioIndex];
  const isLastScenario = scenarioIndex === OBSERVATION_SCENARIOS.length - 1;

  // Count positive observations for results screen
  const positiveCount = Object.values(answers).filter(Boolean).length;
  const totalNonReversed = OBSERVATION_SCENARIOS.flatMap((s) =>
    s.items.filter((i) => !i.reversed)
  ).length;

  function toggleItem(itemId: string) {
    setAnswers((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  }

  function handleNextScenario() {
    if (isLastScenario) {
      if (!saved) {
        saveObservationAnswers(answers);
        setSaved(true);
      }
      setScreen("results");
    } else {
      setScenarioIndex((i) => i + 1);
      // scroll to top of scenario
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function handlePrevScenario() {
    if (scenarioIndex > 0) setScenarioIndex((i) => i - 1);
    else if (screen === "scenario") setScreen("intro");
  }

  // ── Intro screen ────────────────────────────────────────────────────────
  if (screen === "intro") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <TopBar />
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 gap-6 max-w-lg mx-auto w-full">
          <div className="w-16 h-16 rounded-full bg-primary-fixed flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-4xl">visibility</span>
          </div>
          <div className="text-center space-y-3">
            <h1 className="font-display text-2xl font-bold text-on-surface">
              Behavioural Observation
            </h1>
            <p className="font-body text-on-surface-variant text-sm leading-relaxed">
              This 6-scenario guided observation takes 30–45 minutes total and lets you observe
              your child's behaviour in natural play. Your observations are combined with the
              M-CHAT-R questionnaire for a more accurate picture.
            </p>
          </div>

          <div className="w-full space-y-3">
            {[
              { icon: "schedule", text: "Find a time when your child is calm and well-rested" },
              { icon: "home", text: "Use your normal home environment — no special setup needed" },
              { icon: "checklist", text: "Tick what you observe — there are no right or wrong answers" },
              { icon: "local_hospital", text: "This is not a diagnosis — share results with your paediatrician" },
            ].map(({ icon, text }) => (
              <div key={icon} className="flex items-start gap-3 p-3 rounded-2xl bg-surface-container">
                <span className="material-symbols-outlined text-primary text-xl mt-0.5">{icon}</span>
                <p className="font-body text-sm text-on-surface-variant">{text}</p>
              </div>
            ))}
          </div>

          <button
            onClick={() => setScreen("scenario")}
            className="w-full py-4 rounded-2xl bg-primary text-on-primary font-label font-semibold text-base"
          >
            Begin Observation
          </button>
          <button
            onClick={() => router.back()}
            className="text-sm text-on-surface-variant underline"
          >
            Do this later
          </button>
        </main>
        <BottomNav />
      </div>
    );
  }

  // ── Results screen ──────────────────────────────────────────────────────
  if (screen === "results") {
    const obsScore = latestSession?.fusedScore?.observationScore ?? Math.round((positiveCount / totalNonReversed) * 100);
    const fusedScore = latestSession?.fusedScore;

    return (
      <div className="min-h-screen bg-background flex flex-col">
        <TopBar />
        <main className="flex-1 flex flex-col px-4 py-8 gap-6 max-w-lg mx-auto w-full">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-full bg-success/15 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-success text-4xl">task_alt</span>
            </div>
            <h1 className="font-display text-2xl font-bold text-on-surface">Observation Complete</h1>
            <p className="font-body text-sm text-on-surface-variant">
              You observed {positiveCount} of {totalNonReversed} positive behaviours.
            </p>
          </div>

          {/* Observation score */}
          <div className="rounded-3xl bg-surface-container p-5 space-y-3">
            <p className="font-label text-xs uppercase tracking-widest text-on-surface-variant">Observation Score</p>
            <div className="flex items-end gap-2">
              <span className="font-display text-4xl font-bold text-primary">{obsScore}</span>
              <span className="font-body text-on-surface-variant mb-1">/100</span>
            </div>
            <div className="w-full h-2 rounded-full bg-surface-container-high">
              <div
                className="h-2 rounded-full bg-primary transition-all duration-700"
                style={{ width: `${obsScore}%` }}
              />
            </div>
            <p className="font-body text-xs text-on-surface-variant">
              Higher score = more positive behaviours observed across all 6 domains.
            </p>
          </div>

          {/* Fused score (if available) */}
          {fusedScore && (
            <div className={`rounded-3xl p-5 space-y-2 ${
              fusedScore.level === "low"
                ? "bg-success/10"
                : fusedScore.level === "medium"
                ? "bg-warning/10"
                : "bg-error/10"
            }`}>
              <p className="font-label text-xs uppercase tracking-widest text-on-surface-variant">
                Fused Assessment (M-CHAT-R 60% + Observation 40%)
              </p>
              <div className="flex items-center gap-3">
                <span className={`font-display text-3xl font-bold ${
                  fusedScore.level === "low" ? "text-success"
                  : fusedScore.level === "medium" ? "text-warning"
                  : "text-error"
                }`}>
                  {fusedScore.level === "low" ? "Low Concern" : fusedScore.level === "medium" ? "Medium Concern" : "High Concern"}
                </span>
              </div>
              <p className="font-body text-xs text-on-surface-variant">
                Combined risk score: {fusedScore.fusedPercentage}% · M-CHAT-R: {fusedScore.mchatPercentage}%
              </p>
            </div>
          )}

          {/* Domain breakdown */}
          <div className="rounded-3xl bg-surface-container p-5 space-y-4">
            <p className="font-label text-xs uppercase tracking-widest text-on-surface-variant">By Domain</p>
            {OBSERVATION_SCENARIOS.map((s) => {
              const positiveItems = s.items.filter((i) => !i.reversed && answers[i.id]);
              const totalItems = s.items.filter((i) => !i.reversed).length;
              const pct = Math.round((positiveItems.length / totalItems) * 100);
              return (
                <div key={s.id} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <p className="font-body text-sm text-on-surface">{s.title}</p>
                    <p className="font-label text-xs text-on-surface-variant">{positiveItems.length}/{totalItems}</p>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-surface-container-high">
                    <div
                      className="h-1.5 rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col gap-3 pb-24">
            <button
              onClick={() => router.push("/insights")}
              className="w-full py-4 rounded-2xl bg-primary text-on-primary font-label font-semibold text-base"
            >
              View Full Insights
            </button>
            <button
              onClick={() => router.push("/referrals")}
              className="w-full py-4 rounded-2xl border border-outline-variant text-on-surface font-label font-semibold text-base"
            >
              Find Support Near You
            </button>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  // ── Scenario screen ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopBar />
      <main className="flex-1 flex flex-col px-4 py-4 gap-4 max-w-lg mx-auto w-full pb-32">

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <p className="font-label text-xs uppercase tracking-widest text-on-surface-variant">
              Scenario {scenarioIndex + 1} of {OBSERVATION_SCENARIOS.length}
            </p>
            <p className="font-label text-xs text-primary font-semibold">{scenario.title}</p>
          </div>
          <div className="flex gap-1">
            {OBSERVATION_SCENARIOS.map((_, i) => (
              <div
                key={i}
                className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                  i < scenarioIndex ? "bg-primary" : i === scenarioIndex ? "bg-primary/60" : "bg-surface-container-high"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Instruction card */}
        <div className="rounded-3xl bg-primary-fixed/30 border border-primary/20 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">play_circle</span>
            <p className="font-label text-sm font-semibold text-primary uppercase tracking-wide">Instructions</p>
          </div>
          <p className="font-body text-sm text-on-surface leading-relaxed">{scenario.instruction}</p>
          <div className="flex items-start gap-2 pt-1 border-t border-primary/10">
            <span className="material-symbols-outlined text-on-surface-variant text-base mt-0.5">info</span>
            <p className="font-body text-xs text-on-surface-variant">{scenario.setupNote}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-on-surface-variant text-base">schedule</span>
            <p className="font-body text-xs text-on-surface-variant">{scenario.duration}</p>
          </div>
        </div>

        {/* Observation checklist */}
        <div className="space-y-2">
          <p className="font-label text-xs uppercase tracking-widest text-on-surface-variant px-1">
            What did you observe?
          </p>
          {scenario.items.map((item) => {
            const checked = answers[item.id] ?? false;
            const isReversed = item.reversed;
            return (
              <button
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className={`w-full text-left flex items-start gap-3 p-4 rounded-2xl border transition-all duration-200 ${
                  checked
                    ? isReversed
                      ? "bg-error/10 border-error/30"
                      : "bg-primary-fixed/40 border-primary/30"
                    : "bg-surface-container border-transparent"
                }`}
              >
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                  checked
                    ? isReversed
                      ? "bg-error border-error"
                      : "bg-primary border-primary"
                    : "border-outline-variant"
                }`}>
                  {checked && (
                    <span className="material-symbols-outlined text-white text-sm">check</span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-body text-sm text-on-surface leading-snug">{item.text}</p>
                  {item.isCritical && !isReversed && (
                    <p className="font-label text-[10px] text-primary mt-1 uppercase tracking-wide">★ Key indicator</p>
                  )}
                  {isReversed && (
                    <p className="font-label text-[10px] text-on-surface-variant mt-1">Note: checking this indicates a concern</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </main>

      {/* Fixed bottom nav area */}
      <div className="fixed bottom-0 left-0 w-full z-40 px-4 pb-4 pt-3 bg-background/95 backdrop-blur-sm border-t border-outline-variant/20 flex gap-3 max-w-lg mx-auto left-1/2 -translate-x-1/2">
        {scenarioIndex > 0 && (
          <button
            onClick={handlePrevScenario}
            className="px-5 py-3.5 rounded-2xl border border-outline-variant text-on-surface font-label font-semibold text-sm"
          >
            Back
          </button>
        )}
        <button
          onClick={handleNextScenario}
          className="flex-1 py-3.5 rounded-2xl bg-primary text-on-primary font-label font-semibold text-base"
        >
          {isLastScenario ? "See Results" : "Next Scenario"}
        </button>
      </div>
    </div>
  );
}

export default function ObservePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <ObservePageInner />
    </Suspense>
  );
}
