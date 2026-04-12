"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { useApp } from "@/context/AppContext";
import { useProfile } from "@/context/ProfileContext";
import { OBSERVATION_SCENARIOS, OBSERVATION_SCENARIOS_HI } from "@/lib/observations";
import { useTranslation } from "@/lib/i18n";

type Screen = "intro" | "scenario" | "results";

function ObservePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromMilestones = searchParams.get("from") === "milestones";
  const { saveObservationAnswers, latestSession } = useApp();
  const { profile } = useProfile();
  const t = useTranslation();

  const isHindi = profile?.language === "hi";
  const scenarios = isHindi ? OBSERVATION_SCENARIOS_HI : OBSERVATION_SCENARIOS;

  const [screen, setScreen] = useState<Screen>(fromMilestones ? "scenario" : "intro");
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState(false);

  const scenario = scenarios[scenarioIndex];
  const isLastScenario = scenarioIndex === scenarios.length - 1;

  // Count positive observations for results screen (always use EN scenarios for scoring)
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
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function handlePrevScenario() {
    if (scenarioIndex > 0) setScenarioIndex((i) => i - 1);
    else if (screen === "scenario") setScreen("intro");
  }

  const introTips = [
    { icon: "schedule", key: "observe.intro.tip1" },
    { icon: "home", key: "observe.intro.tip2" },
    { icon: "checklist", key: "observe.intro.tip3" },
    { icon: "local_hospital", key: "observe.intro.tip4" },
  ];

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
            <h1 className="text-h1">
              {t("observe.title")}
            </h1>
            <p className="text-body">
              {t("observe.intro.desc")}
            </p>
          </div>

          <div className="w-full space-y-3">
            {introTips.map(({ icon, key }) => (
              <div key={icon} className="flex items-start gap-3 p-3 rounded-2xl bg-surface-container">
                <span className="material-symbols-outlined text-primary text-xl mt-0.5">{icon}</span>
                <p className="text-body">{t(key)}</p>
              </div>
            ))}
          </div>

          <button
            onClick={() => setScreen("scenario")}
            className="w-full py-4 rounded-2xl bg-primary text-on-primary font-label font-semibold text-base"
          >
            {t("observe.begin")}
          </button>
          <button
            onClick={() => router.back()}
            className="text-sm text-on-surface-variant underline"
          >
            {t("observe.skip_intro")}
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
            <h1 className="text-h1">{t("observe.results.title")}</h1>
            <p className="text-body">
              {t("observe.results.positive_prefix")}{positiveCount} / {totalNonReversed} {t("observe.results.positive_suffix")}
            </p>
          </div>

          {/* Observation score */}
          <div className="rounded-3xl bg-surface-container p-5 space-y-3">
            <p className="text-caption-caps">{t("observe.results.title")}</p>
            <div className="flex items-end gap-2">
              <span className="font-display text-4xl font-bold text-primary">{obsScore}</span>
              <span className="text-body mb-1">/100</span>
            </div>
            <div className="w-full h-2 rounded-full bg-surface-container-high">
              <div
                className="h-2 rounded-full bg-primary transition-all duration-700"
                style={{ width: `${obsScore}%` }}
              />
            </div>
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
              <p className="text-caption-caps">
                {t("insights.fused.tag")}
              </p>
              <div className="flex items-center gap-3">
                <span className={`font-display text-3xl font-bold ${
                  fusedScore.level === "low" ? "text-success"
                  : fusedScore.level === "medium" ? "text-warning"
                  : "text-error"
                }`}>
                  {fusedScore.level === "low"
                    ? t("insights.fused.low")
                    : fusedScore.level === "medium"
                    ? t("insights.fused.medium")
                    : t("insights.fused.high")}
                </span>
              </div>
              <p className="text-body-sm">
                {t("insights.fused.combined")}: {fusedScore.fusedPercentage}% · {t("insights.fused.mchat")}: {fusedScore.mchatPercentage}%
              </p>
            </div>
          )}

          {/* Domain breakdown using the active language scenarios */}
          <div className="rounded-3xl bg-surface-container p-5 space-y-4">
            <p className="text-caption-caps">{t("insights.dev_areas")}</p>
            {scenarios.map((s) => {
              const positiveItems = s.items.filter((i) => !i.reversed && answers[i.id]);
              const totalItems = s.items.filter((i) => !i.reversed).length;
              const pct = Math.round((positiveItems.length / totalItems) * 100);
              return (
                <div key={s.id} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <p className="text-body text-on-surface">{s.title}</p>
                    <p className="text-caption-caps text-on-surface-variant">{positiveItems.length}/{totalItems}</p>
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
              {t("observe.results.view_insights")}
            </button>
            <button
              onClick={() => router.push("/referrals")}
              className="w-full py-4 rounded-2xl border border-outline-variant text-on-surface font-label font-semibold text-base"
            >
              {t("insights.cta.find_support")}
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
            <p className="text-caption-caps text-on-surface-variant">
              {t("observe.scenario_prefix")} {scenarioIndex + 1} {t("observe.scenario_of")} {scenarios.length}
            </p>
            <p className="text-caption-caps text-primary">{scenario.title}</p>
          </div>
          <div className="flex gap-1">
            {scenarios.map((_, i) => (
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
            <p className="text-label text-primary uppercase tracking-wide">{t("observe.title")}</p>
          </div>
          <p className="text-body text-on-surface">{scenario.instruction}</p>
          <div className="flex items-start gap-2 pt-1 border-t border-primary/10">
            <span className="material-symbols-outlined text-on-surface-variant text-base mt-0.5">info</span>
            <p className="text-body-sm">
              <span className="font-semibold">{t("observe.setup_note")}</span> {scenario.setupNote}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-on-surface-variant text-base">schedule</span>
            <p className="text-body-sm">
              <span className="font-semibold">{t("observe.duration")}</span> {scenario.duration}
            </p>
          </div>
        </div>

        {/* Observation checklist */}
        <div className="space-y-2">
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
                  <p className="text-body text-on-surface leading-snug">{item.text}</p>
                  {item.isCritical && !isReversed && (
                    <p className="text-caption-caps text-primary mt-1">★ {t("milestones.key_indicator")}</p>
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
            {t("observe.back")}
          </button>
        )}
        <button
          onClick={handleNextScenario}
          className="flex-1 py-3.5 rounded-2xl bg-primary text-on-primary font-label font-semibold text-base"
        >
          {isLastScenario ? t("observe.finish") : t("observe.next")}
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
