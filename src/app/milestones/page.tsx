"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { QUESTIONS, SECTIONS } from "@/lib/questions";

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

export default function MilestonesPage() {
  const router = useRouter();
  const { saveAnswers } = useApp();
  const { user } = useAuth();
  const childName = user?.childName ?? "your child";

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isTransitioning, setIsTransitioning] = useState(false);

  const question = QUESTIONS[currentIndex];
  const isLast = currentIndex === QUESTIONS.length - 1;
  const selectedAnswer = answers[question.id] as Answer | undefined;
  const progress = Math.round((currentIndex / QUESTIONS.length) * 100);
  const questionText = question.text.replace(/{name}/g, childName);
  const whyText = question.whyItMatters.replace(/{name}/g, childName);

  // Section change detection for a section header between questions
  const prevSection = currentIndex > 0 ? QUESTIONS[currentIndex - 1].section : null;
  const showSectionHeader = currentIndex === 0 || question.section !== prevSection;

  function handleSelect(option: Answer) {
    if (isTransitioning) return;
    setAnswers((prev) => ({ ...prev, [question.id]: option }));
  }

  function advance() {
    if (isLast) {
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

  function handleSkip() {
    if (isTransitioning) return;
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
  const sectionIndex = SECTIONS.indexOf(question.section);
  const accentColors = [
    "bg-primary",
    "bg-secondary",
    "bg-primary-container",
    "bg-tertiary-container",
    "bg-secondary-container",
    "bg-surface-container-highest",
  ];
  const sectionAccent = accentColors[sectionIndex % accentColors.length];

  return (
    <>
      <TopBar />
      <main className="max-w-4xl mx-auto px-6 pt-8 page-bottom-padding">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex justify-between items-end mb-3">
            <div className="space-y-0.5">
              <span className="font-label text-xs uppercase tracking-widest text-tertiary font-medium block">
                Question {currentIndex + 1} of {QUESTIONS.length}
              </span>
              <h1 className="text-2xl font-extrabold text-on-background tracking-tight font-headline">
                Milestone Observation
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
            <span className="text-[11px] font-label uppercase tracking-widest text-tertiary">
              {question.section}
            </span>
            {question.isCritical && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-bold uppercase tracking-widest">
                <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                Key indicator
              </span>
            )}
          </div>
        </div>

        {/* Section change banner */}
        {showSectionHeader && currentIndex > 0 && (
          <div className="mb-6 flex items-center gap-3 p-3 bg-surface-container rounded-xl border border-outline-variant/20">
            <span className="material-symbols-outlined text-primary">next_plan</span>
            <p className="text-sm font-semibold text-on-surface">
              Moving to: <span className="text-primary">{question.section}</span>
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
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-surface-container text-tertiary text-[10px] font-bold uppercase tracking-widest">
                  {question.category}
                </span>

                <h2 className="text-xl lg:text-2xl font-bold text-on-surface leading-snug font-headline">
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
                            className={`text-base font-semibold transition-colors ${
                              isSelected ? meta.color : "text-on-surface-variant group-hover:text-on-surface"
                            }`}
                          >
                            {option}
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
              <p className="text-xs text-on-tertiary-fixed-variant leading-relaxed">
                Aligned with{" "}
                <span className="font-semibold">M-CHAT-R (IAP)</span> and{" "}
                <span className="font-semibold">RBSK (National Health Mission)</span> guidelines. This
                is a parent observation tool — not a medical diagnosis.
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
                <h3 className="text-xs font-bold uppercase tracking-widest">Why this matters</h3>
              </div>
              <p className="text-sm text-on-surface-variant leading-relaxed">{whyText}</p>
            </div>

            {/* Navigation */}
            <div className="flex flex-col gap-3">
              <button
                onClick={handleContinue}
                disabled={!selectedAnswer || isTransitioning}
                className={`w-full py-4 px-6 rounded-full font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                  selectedAnswer && !isTransitioning
                    ? "bg-primary text-on-primary shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95"
                    : "bg-surface-container-high text-on-surface-variant cursor-not-allowed"
                }`}
              >
                {isLast ? "See My Insights" : "Continue"}
                <span className="material-symbols-outlined text-[18px]">
                  {isLast ? "insights" : "arrow_forward"}
                </span>
              </button>

              <div className="flex gap-2">
                {currentIndex > 0 && (
                  <button
                    onClick={handleBack}
                    className="flex-1 py-3 text-tertiary font-semibold text-sm hover:bg-surface-container-high rounded-full transition-all flex items-center justify-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                    Back
                  </button>
                )}
                <button
                  onClick={handleSkip}
                  className="flex-1 py-3 text-primary/70 font-semibold text-sm hover:bg-surface-container-high rounded-full transition-all"
                >
                  Skip
                </button>
              </div>
            </div>

            {/* Dot progress */}
            <div className="flex flex-wrap gap-1.5 justify-center pt-1">
              {QUESTIONS.map((q, i) => (
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
              <p className="text-[9px] font-label uppercase tracking-widest text-tertiary/60">Screening aligned with</p>
              <p className="text-[10px] text-tertiary/80 leading-relaxed">
                M-CHAT-R (IAP) · RBSK/NHM · NIMHANS Guidelines
              </p>
            </div>
          </div>
        </div>
      </main>
      <BottomNav />
    </>
  );
}
