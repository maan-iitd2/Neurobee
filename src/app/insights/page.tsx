"use client";

import { useEffect, useState, useCallback } from "react";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { DOMAIN_ICONS } from "@/lib/questions";
import Link from "next/link";
import { ObservationPromptBanner } from "@/components/ObservationPromptBanner";

interface AiInsight {
  reassurance: string;
  observation: string;
  normalization: string;
  guidance: string[];
  source: "lmstudio-gemma4";
  visualObservation?: string;
  hasVisualAnalysis?: boolean;
}

const RISK_META = {
  low: {
    label: "Developing Beautifully",
    icon: "favorite",
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/20",
    description: (name: string) =>
      `${name} is showing healthy, age-appropriate responses across most areas. Keep observing, engaging, and playing together.`,
  },
  medium: {
    label: "Developing with Care",
    icon: "monitoring",
    color: "text-secondary",
    bg: "bg-secondary-container/40",
    border: "border-secondary/20",
    description: (name: string) =>
      `${name} shows strengths in some areas and may benefit from a little more focused attention in others. Continue engaging and consider sharing these observations with your paediatrician.`,
  },
  high: {
    label: "Seek Professional Support",
    icon: "medical_services",
    color: "text-tertiary",
    bg: "bg-surface-container",
    border: "border-outline-variant",
    description: (name: string) =>
      `Some responses suggest ${name} could benefit from a professional developmental assessment. Please share this summary with a qualified paediatrician or developmental specialist. Early support leads to the best outcomes.`,
  },
};

const GUIDANCE_CARDS = [
  {
    title: "Playful Focus",
    description:
      "Encourage eye contact during play by holding toys at eye level before handing them over. Wait for a moment of connection before continuing.",
    icon: "play_circle",
  },
  {
    title: "Name Awareness",
    description:
      "Call your child's name warmly and pause after — give time for recognition and response. Celebrate every small reaction.",
    icon: "record_voice_over",
  },
  {
    title: "Joint Attention",
    description:
      "Point to objects of interest and narrate what you see. Encourage your child to follow your gaze and share the moment with you.",
    icon: "lightbulb",
  },
];

export default function InsightsPage() {
  const { state, insights, sessionCount, latestSession } = useApp();
  const { user } = useAuth();
  const fusedScore = latestSession?.fusedScore;
  const { confidence, answeredCount, domainScores, primaryDeveloping, riskScore } = insights;

  const childName = user?.childName ?? "your child";
  const childAge = user?.childAge ?? 0;
  const hasData = answeredCount > 0;
  const riskMeta = RISK_META[riskScore.level];

  const [aiInsight, setAiInsight] = useState<AiInsight | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(false);
  const [lmStudioRunning, setLmStudioRunning] = useState<boolean | null>(null);

  // Check LM Studio status once on mount
  useEffect(() => {
    fetch("/api/lmstudio-status")
      .then((r) => r.json())
      .then((d) => setLmStudioRunning(d.running === true))
      .catch(() => setLmStudioRunning(false));
  }, []);

  const fetchInsights = useCallback(() => {
    if (!hasData || !state.answers || Object.keys(state.answers).length === 0) return;

    setAiLoading(true);
    setAiError(false);

    fetch("/api/insights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        child: { name: childName, age: childAge },
        answers: state.answers,
        neuroRisk: latestSession?.videoScreeningResults?.neuroRisk,
        keyFrames: latestSession?.videoScreeningResults?.keyFrames,
      }),
    })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (data?.reassurance) {
          setAiInsight(data as AiInsight);
          setAiError(false);
        } else {
          setAiError(true);
        }
      })
      .catch(() => setAiError(true))
      .finally(() => setAiLoading(false));
  }, [hasData, childName, childAge, state.answers, latestSession]);

  // Fetch on mount
  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  return (
    <>
      <TopBar />
      <main className="max-w-5xl mx-auto px-6 pt-10 page-bottom-padding space-y-12">
        {/* Hero */}
        <section className="grid grid-cols-1 md:grid-cols-[1.2fr_0.8fr] gap-8 items-center">
          <div className="space-y-5">
            <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border ${riskMeta.bg} ${riskMeta.border}`}>
              <span
                className={`material-symbols-outlined text-sm ${riskMeta.color}`}
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {riskMeta.icon}
              </span>
              <span className={`font-label text-xs uppercase tracking-widest font-semibold ${riskMeta.color}`}>
                {hasData ? riskMeta.label : "Engaging Early"}
              </span>
            </div>
            <h2 className="font-headline text-[2.5rem] leading-[1.1] font-extrabold tracking-tight text-on-surface">
              We&apos;re beginning to{" "}
              <span className="text-primary">notice a pattern…</span>
            </h2>
            <p className="text-base leading-relaxed text-on-surface-variant max-w-lg">
              You&apos;re doing the{" "}
              <span className="font-bold text-primary">right thing</span> for {childName}. By
              observing and engaging early, you provide the best possible environment for growth.
              Your attention is {childName}&apos;s greatest asset.
            </p>
          </div>
          <div className="relative hidden md:block">
            <div className="absolute -inset-4 bg-primary-container/10 rounded-xl -rotate-3 pointer-events-none" />
            <img
              className="relative w-full aspect-square object-cover rounded-2xl botanical-shadow"
              alt="Parent and child playing together"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAA8Ns8JeA4RVHO-J6-eCa2QBI7QjY5RLUonJhzRvrwDnuvSmoDeUyKhWlqrBZZ25pEs3KlpaMPuLaUXEygLhKlcwfJWE-G4h7G44UufWIzq5YUDjuTnY23M0X2FmTODbzUsyoL43-II-5_X3WaAFkIt-gWMJtlNVsCvl7C9mf1jTuKG96pQD5yUERzeYGp9zOS8h8bWkCzpnp6gKauxDzp5FLWMUvzcZdcd6XwspTT506msZ9Lkq51J9MrtF6H4kPVmfxnWxub_34"
            />
          </div>
        </section>

        {/* No Data State */}
        {!hasData && (
          <section className="bg-surface-container-low rounded-2xl p-10 text-center space-y-4 border border-outline-variant/20">
            <span
              className="material-symbols-outlined text-primary text-4xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              psychology
            </span>
            <h3 className="font-headline text-xl font-bold text-on-surface">No observations yet</h3>
            <p className="text-on-surface-variant leading-relaxed max-w-sm mx-auto text-sm">
              Complete the 20-question milestone check-in to see personalized insights about{" "}
              {childName}&apos;s developmental journey.
            </p>
            <Link
              href="/milestones"
              className="inline-flex items-center gap-2 mt-4 bg-primary text-on-primary px-6 py-3 rounded-full font-bold hover:opacity-90 transition-all"
            >
              Start Observation
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
          </section>
        )}

        {/* Risk Summary Card */}
        {hasData && (
          <section className={`rounded-2xl p-7 border ${riskMeta.bg} ${riskMeta.border} space-y-4`}>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="space-y-1">
                <p className="text-[10px] font-label uppercase tracking-widest text-tertiary">
                  Overall screening result
                </p>
                <h3 className={`font-headline text-2xl font-extrabold ${riskMeta.color}`}>
                  {riskMeta.label}
                </h3>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] font-label uppercase tracking-widest text-tertiary">
                  Based on
                </p>
                <p className="font-headline font-bold text-on-surface">
                  {answeredCount} / {20} responses
                </p>
                {sessionCount > 1 && (
                  <p className="text-xs text-tertiary">{sessionCount} sessions</p>
                )}
              </div>
            </div>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              {riskMeta.description(childName)}
            </p>
            {riskScore.criticalFailures > 0 && (
              <div className="flex items-start gap-2 bg-surface-container-lowest/60 rounded-xl p-4 border border-outline-variant/20">
                <span className="material-symbols-outlined text-tertiary text-lg shrink-0 mt-0.5">
                  warning
                </span>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  <span className="font-semibold text-on-surface">{riskScore.criticalFailures} key indicator{riskScore.criticalFailures > 1 ? "s" : ""}</span>{" "}
                  (M-CHAT-R critical items) showed limited response. We recommend discussing these observations with a paediatrician.
                </p>
              </div>
            )}
            <p className="text-[10px] font-label text-tertiary/70 uppercase tracking-widest">
              Aligned with M-CHAT-R (IAP) · RBSK (NHM, Govt. of India) · NIMHANS
            </p>
          </section>
        )}

        {/* Observation prompt banner */}
        {hasData && <ObservationPromptBanner />}

        {/* Fused score card — shown when observation is complete */}
        {hasData && fusedScore && (
          <section className={`rounded-2xl p-6 border space-y-4 ${
            fusedScore.level === "low"
              ? "bg-success/10 border-success/20"
              : fusedScore.level === "medium"
              ? "bg-secondary-container/40 border-secondary/20"
              : "bg-surface-container border-outline-variant"
          }`}>
            <p className="text-[10px] font-label uppercase tracking-widest text-tertiary">
              Multi-modal fused assessment
            </p>
            <div className="flex items-end justify-between gap-4 flex-wrap">
              <div>
                <h3 className={`font-headline text-2xl font-extrabold ${
                  fusedScore.level === "low" ? "text-success"
                  : fusedScore.level === "medium" ? "text-secondary"
                  : "text-tertiary"
                }`}>
                  {fusedScore.level === "low" ? "Low Concern"
                    : fusedScore.level === "medium" ? "Medium Concern"
                    : "High Concern"}
                </h3>
                <p className="text-xs text-on-surface-variant mt-1">
                  M-CHAT-R 60% · Observation 40% · Based on Canvas Dx multi-modal methodology
                </p>
              </div>
              <div className="text-right">
                <p className="font-headline text-3xl font-bold text-on-surface">{fusedScore.fusedPercentage}%</p>
                <p className="text-[10px] font-label text-tertiary uppercase tracking-widest">combined risk</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-surface-container-lowest/60 rounded-xl p-3">
                <p className="text-[10px] font-label text-tertiary uppercase tracking-widest">M-CHAT-R</p>
                <p className="font-bold text-on-surface">{fusedScore.mchatPercentage}% risk</p>
              </div>
              <div className="bg-surface-container-lowest/60 rounded-xl p-3">
                <p className="text-[10px] font-label text-tertiary uppercase tracking-widest">Observation</p>
                <p className="font-bold text-on-surface">{fusedScore.observationScore}% positive</p>
              </div>
            </div>
            <p className="text-[10px] font-label text-tertiary/70 uppercase tracking-widest">
              Methodology: Wall et al. 2012 · Haber et al. 2018 · npj Digital Medicine 2022
            </p>
          </section>
        )}

        {/* AI Insights Section */}
        {hasData && (
          <section className="space-y-5">
            {/* Ollama status + AI source header */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                {aiLoading ? (
                  <span className="inline-flex items-center gap-2 text-[10px] font-label uppercase tracking-widest text-tertiary">
                    <span className="w-3 h-3 rounded-full border-2 border-primary/40 border-t-primary animate-spin block" />
                    Generating personalised insights…
                  </span>
                ) : aiInsight ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-label uppercase tracking-widest font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary block" />
                    <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
                    Gemma 4 · Local
                  </span>
                ) : aiError ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-700 text-[10px] font-label uppercase tracking-widest font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 block" />
                    AI system not online right now
                  </span>
                ) : null}
              </div>

              {/* LM Studio status indicator */}
              {lmStudioRunning !== null && (
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center gap-1.5 text-[10px] font-label uppercase tracking-widest ${lmStudioRunning ? "text-primary" : "text-tertiary"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full block ${lmStudioRunning ? "bg-primary" : "bg-amber-500"}`} />
                    {lmStudioRunning ? "LM Studio running" : "LM Studio offline"}
                  </span>
                  {(aiError || !aiInsight) && !aiLoading && (
                    <button
                      onClick={fetchInsights}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-outline-variant/30 text-[10px] font-label uppercase tracking-widest text-tertiary hover:text-on-surface hover:border-outline-variant transition-all"
                    >
                      <span className="material-symbols-outlined text-[12px]">refresh</span>
                      Retry
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* AI offline error banner */}
            {aiError && !aiLoading && (
              <div className="flex items-start gap-3 bg-amber-500/8 border border-amber-500/20 rounded-xl px-5 py-4">
                <span className="material-symbols-outlined text-amber-600 shrink-0 mt-0.5">wifi_off</span>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-on-surface">AI system not online right now</p>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Gemma 4 runs locally via LM Studio. Open LM Studio, load the <strong>gemma-4-e4b</strong> model, and start the local server on port 1234.
                  </p>
                  <p className="text-xs text-tertiary mt-1">Then click Retry above.</p>
                </div>
              </div>
            )}

            {/* Insight cards — only shown when AI is available */}
            {aiInsight && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* What We Noticed */}
                  <div className="bg-surface-container-low p-8 rounded-2xl space-y-5 relative">
                    <div className="absolute top-5 right-6 text-[10px] font-label uppercase tracking-widest text-primary/60 font-semibold">
                      {answeredCount} responses · confidence: {confidence}
                    </div>
                    <div className="w-11 h-11 bg-surface-container-lowest rounded-full flex items-center justify-center botanical-shadow">
                      <span className="material-symbols-outlined text-primary">visibility</span>
                    </div>
                    <div className="space-y-3">
                      <h3 className="font-headline text-xl font-bold tracking-tight">What We Noticed</h3>
                      <p className="text-base leading-relaxed text-on-surface-variant">
                        {aiInsight.observation}
                      </p>
                    </div>
                  </div>

                  {/* A Note for You */}
                  <div className="bg-surface-container-lowest p-8 rounded-2xl space-y-5 border border-outline-variant/15 botanical-shadow">
                    <div className="w-11 h-11 bg-secondary-container rounded-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-on-secondary-container">favorite</span>
                    </div>
                    <div className="space-y-3">
                      <h3 className="font-headline text-xl font-bold tracking-tight text-on-surface">
                        A Note for You
                      </h3>
                      <p className="text-base leading-relaxed text-on-surface-variant">
                        {aiInsight.reassurance}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Normalization */}
                <div className="bg-tertiary-fixed/20 border border-outline-variant/15 rounded-xl px-6 py-4 flex items-start gap-3">
                  <span className="material-symbols-outlined text-tertiary shrink-0 mt-0.5 text-lg">info</span>
                  <p className="text-sm text-on-surface-variant leading-relaxed">{aiInsight.normalization}</p>
                </div>

                {/* Visual observation — only when Gemma analysed frames */}
                {aiInsight.hasVisualAnalysis && aiInsight.visualObservation && (
                  <div className="bg-surface-container-low border border-primary/15 rounded-xl px-6 py-4 flex items-start gap-3">
                    <span
                      className="material-symbols-outlined text-primary shrink-0 mt-0.5 text-lg"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      videocam
                    </span>
                    <div className="space-y-1">
                      <p className="text-[10px] font-label uppercase tracking-widest text-primary font-semibold">
                        Visual observation · Gemma 4
                      </p>
                      <p className="text-sm text-on-surface-variant leading-relaxed">{aiInsight.visualObservation}</p>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Placeholder cards when AI is loading or offline — static observation */}
            {!aiInsight && !aiLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-surface-container-low p-8 rounded-2xl space-y-5 relative opacity-60">
                  <div className="w-11 h-11 bg-surface-container-lowest rounded-full flex items-center justify-center botanical-shadow">
                    <span className="material-symbols-outlined text-primary">visibility</span>
                  </div>
                  <div className="space-y-3">
                    <h3 className="font-headline text-xl font-bold tracking-tight">Early Observation</h3>
                    <p className="text-base leading-relaxed text-on-surface-variant">
                      {primaryDeveloping.length > 0
                        ? `${childName} may benefit from additional nurturing in ${primaryDeveloping
                            .map((d) => d.label.toLowerCase())
                            .join(" and ")}. Every child grows at their own pace.`
                        : `${childName} is showing encouraging responses across all areas. Keep up the wonderful engagement!`}
                    </p>
                  </div>
                </div>
                <div className="bg-surface-container-lowest p-8 rounded-2xl space-y-5 border border-outline-variant/15 opacity-60">
                  <div className="w-11 h-11 bg-secondary-container rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-on-secondary-container">child_care</span>
                  </div>
                  <div className="space-y-3">
                    <h3 className="font-headline text-xl font-bold tracking-tight text-on-surface">Normalization</h3>
                    <p className="text-base leading-relaxed text-on-surface-variant">
                      Many children show similar patterns during development. Every brain grows on its own timeline, and variations in social responsiveness are common and expected in early childhood.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Domain Scores */}
        {hasData && domainScores.length > 0 && (
          <section className="space-y-5">
            <div>
              <span className="font-label text-xs uppercase tracking-widest font-medium text-tertiary">
                Development Areas
              </span>
              <h2 className="font-headline text-2xl font-bold tracking-tight mt-1">
                {childName}&apos;s Profile
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {domainScores.map((ds) => {
                const pct = Math.round((ds.score / 2) * 100);
                return (
                  <div
                    key={ds.domain}
                    className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/15 space-y-3 botanical-shadow"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="material-symbols-outlined text-primary text-xl"
                        style={{ fontVariationSettings: ds.level === "strong" ? "'FILL' 1" : "'FILL' 0" }}
                      >
                        {DOMAIN_ICONS[ds.domain]}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold uppercase tracking-widest text-tertiary">
                          {ds.label}
                        </p>
                        <p className="text-sm font-semibold text-on-surface">
                          {ds.level === "strong"
                            ? "Showing strength"
                            : ds.level === "developing"
                            ? "Developing nicely"
                            : "Beginning to emerge"}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          ds.level === "strong"
                            ? "bg-primary/10 text-primary"
                            : ds.level === "developing"
                            ? "bg-secondary-container text-on-secondary-container"
                            : "bg-surface-container text-tertiary"
                        }`}
                      >
                        {pct}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary-gradient transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Guidance Cards */}
        <section className="space-y-7">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
            <div className="space-y-1">
              <span className="font-label text-xs uppercase tracking-widest font-medium text-tertiary">
                Action Plan
              </span>
              <h2 className="font-headline text-2xl font-bold tracking-tight">
                Guidance for {childName}
              </h2>
            </div>
            <p className="text-on-surface-variant text-sm max-w-xs">
              Evidence-based activities to weave into your daily routine.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {(aiInsight?.guidance ?? GUIDANCE_CARDS.map((c) => c.description)).map((tip, i) => {
              const accentClasses = ["bg-primary", "bg-primary-container", "bg-secondary"];
              const icons = ["lightbulb", "child_care", "favorite"];
              return (
                <div
                  key={i}
                  className="group bg-surface-container-lowest p-7 rounded-2xl botanical-shadow hover:scale-[1.02] transition-transform duration-300 space-y-4"
                >
                  <div className={`h-1 w-10 ${accentClasses[i % accentClasses.length]} rounded-full group-hover:w-full transition-all duration-500`} />
                  <h4 className="font-headline text-lg font-bold">
                    {aiInsight ? `Tip ${i + 1}` : GUIDANCE_CARDS[i]?.title ?? `Tip ${i + 1}`}
                  </h4>
                  <p className="text-on-surface-variant text-sm leading-relaxed">{tip}</p>
                  <Link
                    href="/reflection"
                    className="flex items-center gap-2 text-primary font-semibold text-sm hover:underline"
                  >
                    <span className="material-symbols-outlined text-base">{icons[i % icons.length]}</span>
                    Try this activity
                  </Link>
                </div>
              );
            })}
          </div>
        </section>

        {/* Learn More */}
        <section className="bg-surface-container p-7 rounded-2xl">
          <details className="group cursor-pointer">
            <summary className="flex items-center justify-between list-none">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-tertiary">menu_book</span>
                <h4 className="font-headline text-base font-bold">About This Screening</h4>
              </div>
              <span className="material-symbols-outlined group-open:rotate-180 transition-transform duration-300">
                expand_more
              </span>
            </summary>
            <div className="pt-5 space-y-3 text-on-surface-variant leading-relaxed text-sm">
              <p>
                <strong>M-CHAT-R (Modified Checklist for Autism in Toddlers, Revised)</strong> is
                the gold-standard early autism screening tool, endorsed by the{" "}
                <em>Indian Academy of Pediatrics (IAP)</em> and used globally.
              </p>
              <p>
                <strong>RBSK (Rashtriya Bal Swasthya Karyakram)</strong> is India&apos;s national
                child health screening programme under the{" "}
                <em>National Health Mission (NHM), Ministry of Health &amp; Family Welfare,
                Government of India</em>, covering developmental delays and neurological disorders.
              </p>
              <p>
                <strong>NIMHANS</strong> (National Institute of Mental Health &amp; Neurosciences,
                Bangalore) is a premier government institute whose neurodevelopmental guidelines
                inform clinical practice across India.
              </p>
              <p className="text-[11px] italic text-tertiary/70 border-t border-outline-variant/20 pt-3">
                This tool is for parent observation only. It does not replace a clinical evaluation
                by a qualified professional.
              </p>
            </div>
          </details>
        </section>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          {hasData && (
            <Link
              href="/referrals"
              className="inline-flex items-center justify-center gap-2 bg-primary text-on-primary px-8 py-4 rounded-full font-headline font-bold hover:opacity-90 transition-all botanical-shadow"
            >
              <span className="material-symbols-outlined">location_on</span>
              Find Support Near You
            </Link>
          )}
          <Link
            href="/profile"
            className="inline-flex items-center justify-center gap-2 bg-on-surface text-surface px-8 py-4 rounded-full font-headline font-bold hover:opacity-90 transition-all botanical-shadow"
          >
            <span className="material-symbols-outlined">file_download</span>
            Export Full Report
          </Link>
        </div>

        <footer className="pt-4 border-t border-outline-variant/15 text-center">
          <p className="text-xs text-tertiary font-medium italic">
            This tool supports early understanding and is not a medical diagnosis. Always consult a
            qualified paediatrician or developmental specialist.
          </p>
        </footer>
      </main>
      <BottomNav />
    </>
  );
}
