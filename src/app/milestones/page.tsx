"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { useApp } from "@/context/AppContext";
import { useProfile } from "@/context/ProfileContext";
import { QUESTIONS, QUESTIONS_HI } from "@/lib/questions";
import { computeChildAgeMonths } from "@/lib/profile";
import { useTranslation } from "@/lib/i18n";

const DRAFT_KEY = "neurobee_mchat_draft";
const MCHAT_MIN_MONTHS = 16;
const MCHAT_MAX_MONTHS = 30;

// Internal answer values — these are stored as-is and sent to the API.
// Display labels are translated via t() but storage stays in English.
type Answer = "Often" | "Sometimes" | "Rarely";
const OPTIONS: Answer[] = ["Often", "Sometimes", "Rarely"];

const OPTION_META: Record<Answer, { icon: string; color: string; bg: string; borderActive: string }> = {
  Often: {
    icon: "sentiment_very_satisfied",
    color: "text-primary",
    bg: "bg-primary-fixed",
    borderActive: "border-primary/40",
  },
  Sometimes: {
    icon: "sentiment_neutral",
    color: "text-secondary",
    bg: "bg-secondary-container/40",
    borderActive: "border-secondary/30",
  },
  Rarely: {
    icon: "sentiment_dissatisfied",
    color: "text-tertiary",
    bg: "bg-surface-container",
    borderActive: "border-outline-variant",
  },
};

const OPTION_KEY: Record<Answer, string> = {
  Often: "milestones.option.often",
  Sometimes: "milestones.option.sometimes",
  Rarely: "milestones.option.rarely",
};

export default function MilestonesPage() {
  const router = useRouter();
  const { saveAnswers } = useApp();
  const { profile } = useProfile();
  const t = useTranslation();

  const childName = profile?.childName ?? "your child";
  const isHindi = profile?.language === "hi";
  const questions = isHindi ? QUESTIONS_HI : QUESTIONS;

  // Derive unique ordered sections from the active question list
  const sections = Array.from(new Set(questions.map((q) => q.section)));

  // ── Age gate ───────────────────────────────────────────────────────────────
  const ageMonths = profile?.childDob ? computeChildAgeMonths(profile.childDob) : null;
  const ageOutOfRange =
    ageMonths !== null && (ageMonths < MCHAT_MIN_MONTHS || ageMonths > MCHAT_MAX_MONTHS);
  const [ageAcknowledged, setAgeAcknowledged] = useState(false);

  // ── Questionnaire state ────────────────────────────────────────────────────
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);

  // Restore draft from localStorage on mount — localStorage is client-only,
  // so setState must be called inside useEffect here (SSR-safe pattern).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const draft = JSON.parse(raw) as Record<string, string>;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setAnswers(draft);
        // Resume at the first unanswered question
        const firstUnanswered = QUESTIONS.findIndex((q) => !draft[q.id]);
        setCurrentIndex(firstUnanswered === -1 ? QUESTIONS.length - 1 : firstUnanswered);
      }
    } catch {
      // corrupt draft — start fresh
    }
    setDraftRestored(true);
  }, []);

  // Persist answers to localStorage on every change (after hydration)
  useEffect(() => {
    if (!draftRestored) return;
    if (Object.keys(answers).length > 0) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(answers));
    }
  }, [answers, draftRestored]);

  // ── Derived values ─────────────────────────────────────────────────────────
  const question = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;
  const selectedAnswer = answers[question.id] as Answer | undefined;
  const progress = Math.max(5, Math.round(((currentIndex + (selectedAnswer ? 1 : 0)) / questions.length) * 100));
  const questionText = question.text.replace(/{name}/g, childName);
  const whyText = question.whyItMatters.replace(/{name}/g, childName);
  const prevSection = currentIndex > 0 ? questions[currentIndex - 1].section : null;
  const showSectionHeader = currentIndex === 0 || question.section !== prevSection;

  // ── Handlers ───────────────────────────────────────────────────────────────
  function handleSelect(option: Answer) {
    if (isTransitioning) return;
    setAnswers((prev) => ({ ...prev, [question.id]: option }));
  }

  function advance() {
    if (isLast) {
      localStorage.removeItem(DRAFT_KEY);
      saveAnswers(answers);
      router.push("/observe?from=milestones");
      return;
    }
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((i) => i + 1);
      setIsTransitioning(false);
    }, 220);
  }

  function handleContinue() {
    if (!selectedAnswer || isTransitioning) return;
    advance();
  }

  function handleBack() {
    if (currentIndex === 0 || isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((i) => i - 1);
      setIsTransitioning(false);
    }, 180);
  }

  // Section index for colour accent
  const sectionIndex = sections.indexOf(question.section);
  const accentColors = [
    "bg-primary",
    "bg-secondary",
    "bg-primary-container",
    "bg-tertiary-container",
    "bg-secondary-container",
    "bg-surface-container-highest",
  ];
  const sectionAccent = accentColors[sectionIndex % accentColors.length];

  // ── Age gate screen ────────────────────────────────────────────────────────
  if (ageOutOfRange && !ageAcknowledged) {
    const tooYoung = ageMonths! < MCHAT_MIN_MONTHS;
    return (
      <>
        <TopBar />
        <main className="max-w-lg mx-auto px-6 pt-16 page-bottom-padding flex flex-col items-center text-center gap-8">
          <div className="w-16 h-16 rounded-full bg-warning/15 flex items-center justify-center">
            <span className="material-symbols-outlined text-warning text-3xl">warning</span>
          </div>

          <div className="space-y-3">
            <h1 className="text-h1">
              {t("milestones.age_gate.title")}
            </h1>
            <p className="text-body">
              {childName} {t("milestones.age_gate.age_desc_prefix")} <strong>{ageMonths} {isHindi ? "महीने" : "months"}</strong>. {t("milestones.age_gate.age_desc_suffix").replace("months old. The", "The")}
            </p>
            <p className="text-body">
              {childName} {tooYoung ? t("milestones.age_gate.too_young_suffix") : t("milestones.age_gate.too_old_suffix")}
            </p>
          </div>

          <div className="w-full space-y-3">
            <button
              onClick={() => setAgeAcknowledged(true)}
              className="w-full py-4 rounded-full bg-primary text-on-primary font-headline font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all"
            >
              {t("milestones.age_gate.proceed")}
            </button>
            <button
              onClick={() => router.back()}
              className="w-full py-3 rounded-full text-tertiary font-semibold text-sm hover:bg-surface-container transition-all"
            >
              {t("milestones.age_gate.go_back")}
            </button>
          </div>

          <p className="text-[11px] text-tertiary/60 leading-relaxed">
            {t("milestones.age_gate.disclaimer")}
          </p>
        </main>
        <BottomNav />
      </>
    );
  }

  // ── Questionnaire ──────────────────────────────────────────────────────────
  return (
    <>
      <TopBar />
      <main className="max-w-4xl mx-auto px-6 pt-8 page-bottom-padding">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex justify-between items-end mb-3">
            <div className="space-y-0.5">
              <span className="text-caption-caps text-xs text-tertiary block">
                {t("milestones.question_prefix")} {currentIndex + 1} {t("milestones.question_of")} {questions.length}
              </span>
              <h1 className="text-h1">
                {t("milestones.title")}
              </h1>
            </div>
            <span className="text-primary font-bold text-lg tabular-nums">{progress}%</span>
          </div>
          <div className="h-2.5 w-full bg-surface-container-high rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-gradient rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          {/* Section pill */}
          <div className="mt-3 flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${sectionAccent}`} />
            <span className="text-caption-caps text-tertiary">
              {question.section}
            </span>
            {question.isCritical && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-caption-caps">
                <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                {t("milestones.key_indicator")}
              </span>
            )}
          </div>
        </div>

        {/* Section change banner */}
        {showSectionHeader && currentIndex > 0 && (
          <div className="mb-6 flex items-center gap-3 p-3 bg-surface-container rounded-xl border border-outline-variant/20">
            <span className="material-symbols-outlined text-primary">next_plan</span>
            <p className="text-label">
              {t("milestones.moving_to")} <span className="text-primary">{question.section}</span>
            </p>
          </div>
        )}

        {/* Main layout */}
        <div
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start transition-opacity duration-200"
          style={{ opacity: isTransitioning ? 0 : 1 }}
        >
          {/* Question Card */}
          <div className="lg:col-span-8 space-y-5">
            <section className="bg-surface-container-lowest p-7 lg:p-10 rounded-2xl botanical-shadow relative overflow-hidden">
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-secondary-container/20 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 space-y-6">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-surface-container text-tertiary text-caption-caps">
                  {question.category}
                </span>

                <h2 className="text-h2 lg:text-2xl leading-snug">
                  {questionText}
                </h2>

                <div className="space-y-3 pt-1">
                  {OPTIONS.map((option) => {
                    const isSelected = selectedAnswer === option;
                    const meta = OPTION_META[option];
                    return (
                      <button
                        key={option}
                        onClick={() => handleSelect(option)}
                        className={`w-full flex items-center justify-between p-5 rounded-xl border-2 transition-all duration-200 group cursor-pointer ${
                          isSelected
                            ? `${meta.bg} ${meta.borderActive} shadow-sm`
                            : "bg-surface-container-low border-transparent hover:border-outline-variant/50 hover:bg-surface-container"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`material-symbols-outlined text-xl transition-colors ${
                              isSelected ? meta.color : "text-tertiary/50 group-hover:text-tertiary"
                            }`}
                            style={{ fontVariationSettings: isSelected ? "'FILL' 1" : "'FILL' 0" }}
                          >
                            {meta.icon}
                          </span>
                          <span
                            className={`text-label text-base transition-colors ${
                              isSelected ? meta.color : "text-on-surface-variant group-hover:text-on-surface"
                            }`}
                          >
                            {t(OPTION_KEY[option])}
                          </span>
                        </div>
                        <span
                          className={`material-symbols-outlined text-primary transition-all duration-200 ${
                            isSelected ? "opacity-100 scale-100" : "opacity-0 scale-75"
                          }`}
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          check_circle
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* Disclaimer */}
            <div className="flex gap-3 p-4 bg-tertiary-fixed/30 rounded-xl items-start border border-outline-variant/10">
              <span className="material-symbols-outlined text-tertiary text-lg shrink-0 mt-0.5">info</span>
              <p className="text-body-sm text-on-tertiary-fixed-variant">
                {t("milestones.disclaimer")}
              </p>
            </div>
          </div>

          {/* Side Panel */}
          <div className="lg:col-span-4 space-y-4">
            {/* Why it matters */}
            <div className="bg-surface-container-low rounded-2xl p-5 space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <span
                  className="material-symbols-outlined text-base"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  lightbulb
                </span>
                <h3 className="text-caption-caps text-xs">{t("milestones.why_matters")}</h3>
              </div>
              <p className="text-body">{whyText}</p>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex flex-col gap-3">
              <button
                onClick={handleContinue}
                disabled={!selectedAnswer || isTransitioning}
                className={`w-full py-4 px-6 rounded-full font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                  selectedAnswer && !isTransitioning
                    ? "bg-primary text-on-primary shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95"
                    : "bg-surface-container-high text-on-surface-variant cursor-not-allowed"
                }`}
              >
                {isLast ? t("milestones.see_insights") : t("milestones.continue")}
                <span className="material-symbols-outlined text-[18px]">
                  {isLast ? "insights" : "arrow_forward"}
                </span>
              </button>

              {currentIndex > 0 && (
                <button
                  onClick={handleBack}
                  className="w-full py-3 text-tertiary font-semibold text-sm hover:bg-surface-container-high rounded-full transition-all flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                  {t("milestones.back")}
                </button>
              )}
            </div>

            {/* Dot progress */}
            <div className="flex flex-wrap gap-1.5 justify-center pt-1">
              {questions.map((q, i) => (
                <div
                  key={q.id}
                  className={`rounded-full transition-all duration-300 ${
                    i === currentIndex
                      ? "w-5 h-2 bg-primary"
                      : answers[q.id]
                      ? "w-2 h-2 bg-primary/50"
                      : "w-2 h-2 bg-surface-container-high"
                  }`}
                />
              ))}
            </div>

            {/* Framework attribution */}
            <div className="pt-2 border-t border-outline-variant/15 space-y-1">
              <p className="text-caption-caps text-[9px] text-tertiary/60">{t("milestones.screening_aligned")}</p>
              <p className="text-body-sm text-[10px] text-tertiary/80">
                {t("milestones.frameworks")}
              </p>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="lg:hidden fixed bottom-0 left-0 w-full z-40 px-4 pb-4 pt-3 bg-surface/95 backdrop-blur-sm border-t border-outline-variant/20 flex flex-col gap-3">
          <div className="flex gap-2">
            {currentIndex > 0 && (
              <button
                onClick={handleBack}
                className="w-14 shrink-0 py-3 text-tertiary font-semibold hover:bg-surface-container-high rounded-2xl border border-outline-variant/30 transition-all flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              </button>
            )}
            <button
              onClick={handleContinue}
              disabled={!selectedAnswer || isTransitioning}
              className={`flex-1 py-3.5 rounded-2xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                selectedAnswer && !isTransitioning
                  ? "bg-primary text-on-primary shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95"
                  : "bg-surface-container-high text-on-surface-variant cursor-not-allowed border border-outline-variant/30"
              }`}
            >
              {isLast ? t("milestones.see_insights") : t("milestones.continue")}
              <span className="material-symbols-outlined text-[18px]">
                {isLast ? "insights" : "arrow_forward"}
              </span>
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
