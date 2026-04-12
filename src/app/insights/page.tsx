"use client";

import { useEffect, useState, useCallback } from "react";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { useApp } from "@/context/AppContext";
import { useProfile } from "@/context/ProfileContext";
import { DOMAIN_ICONS, DOMAIN_LABELS, DOMAIN_LABELS_HI } from "@/lib/questions";
import Link from "next/link";
import { ObservationPromptBanner } from "@/components/ObservationPromptBanner";
import { useTranslation } from "@/lib/i18n";

interface AiInsight {
  reassurance: string;
  observation: string;
  normalization: string;
  guidance: string[];
  source: "lmstudio-gemma4";
  visualObservation?: string;
  hasVisualAnalysis?: boolean;
}

export default function InsightsPage() {
  const { state, insights, sessionCount, latestSession } = useApp();
  const { profile } = useProfile();
  const t = useTranslation();

  const isHindi = profile?.language === "hi";
  const domainLabels = isHindi ? DOMAIN_LABELS_HI : DOMAIN_LABELS;

  const fusedScore = latestSession?.fusedScore;
  const { confidence, answeredCount, domainScores, primaryDeveloping, riskScore } = insights;

  const childName = profile?.childName ?? "your child";
  const childAge = profile?.childAge ?? 0;
  const hasData = answeredCount > 0;

  const RISK_META = {
    low: {
      label: t("insights.risk.low.label"),
      icon: "favorite",
      color: "text-primary",
      bg: "bg-primary/10",
      border: "border-primary/20",
      description: (name: string) => `${name}${t("insights.risk.low.desc_suffix")}`,
    },
    medium: {
      label: t("insights.risk.medium.label"),
      icon: "monitoring",
      color: "text-secondary",
      bg: "bg-secondary-container/40",
      border: "border-secondary/20",
      description: (name: string) => `${name}${t("insights.risk.medium.desc_suffix")}`,
    },
    high: {
      label: t("insights.risk.high.label"),
      icon: "medical_services",
      color: "text-tertiary",
      bg: "bg-surface-container",
      border: "border-outline-variant",
      description: (name: string) => `${t("insights.risk.high.desc_prefix")}${name}${t("insights.risk.high.desc_suffix")}`,
    },
  };

  const riskMeta = RISK_META[riskScore.level];

  const [aiInsight, setAiInsight] = useState<AiInsight | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(false);
  const [lmStudioRunning, setLmStudioRunning] = useState<boolean | null>(null);

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
        language: profile?.language ?? "en",
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
  }, [hasData, childName, childAge, state.answers, latestSession, profile?.language]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
              <span className={`text-caption-caps text-xs ${riskMeta.color}`}>
                {hasData ? riskMeta.label : t("insights.hero.engaging_early")}
              </span>
            </div>
            <h2 className="text-h1 text-[2.5rem] leading-[1.1]">
              {t("insights.hero.pattern").split("…")[0]}
              <span className="text-primary">{t("insights.hero.pattern").includes("…") ? "…" : ""}</span>
            </h2>
            <p className="text-body-lg max-w-lg">
              {t("insights.hero.desc_p1")}{" "}
              <span className="font-bold text-primary">{t("insights.hero.doing_right")}</span>{" "}
              {t("insights.hero.desc_p2")} {childName}. {t("insights.hero.desc_p3")} {childName}{t("insights.hero.desc_p4")}
            </p>
          </div>
          <div className="relative hidden md:block">
            <div className="absolute -inset-4 bg-primary-container/10 rounded-xl -rotate-3 pointer-events-none" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
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
            <h3 className="text-h2">{t("insights.no_data.title")}</h3>
            <p className="text-body max-w-sm mx-auto">
              {t("insights.no_data.desc_prefix")} {childName}{t("insights.no_data.desc_suffix")}
            </p>
            <Link
              href="/milestones"
              className="inline-flex items-center gap-2 mt-4 bg-primary text-on-primary px-6 py-3 rounded-full font-bold hover:opacity-90 transition-all"
            >
              {t("insights.no_data.cta")}
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
          </section>
        )}

        {/* Risk Summary Card */}
        {hasData && (
          <section className={`rounded-2xl p-7 border ${riskMeta.bg} ${riskMeta.border} space-y-4`}>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="space-y-1">
                <p className="text-caption-caps text-tertiary">
                  {t("insights.overall_result")}
                </p>
                <h3 className={`text-h1 ${riskMeta.color}`}>
                  {riskMeta.label}
                </h3>
              </div>
              <div className="text-right shrink-0">
                <p className="text-caption-caps text-tertiary">
                  {t("insights.based_on")}
                </p>
                <p className="text-h3">
                  {answeredCount} {t("insights.responses_of")}
                </p>
                {sessionCount > 1 && (
                  <p className="text-xs text-tertiary">{sessionCount} {t("insights.sessions_label")}</p>
                )}
              </div>
            </div>
            <p className="text-body">
              {riskMeta.description(childName)}
            </p>
            {riskScore.criticalFailures > 0 && (
              <div className="flex items-start gap-2 bg-surface-container-lowest/60 rounded-xl p-4 border border-outline-variant/20">
                <span className="material-symbols-outlined text-tertiary text-lg shrink-0 mt-0.5">warning</span>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  <span className="font-semibold text-on-surface">{riskScore.criticalFailures}</span>{" "}
                  {riskScore.criticalFailures > 1
                    ? t("insights.critical_failures_suffix_plural")
                    : t("insights.critical_failures_suffix")}
                </p>
              </div>
            )}
            <p className="text-caption-caps text-tertiary/70">
              {t("insights.frameworks")}
            </p>
          </section>
        )}

        {/* Observation prompt banner */}
        {hasData && <ObservationPromptBanner />}

        {/* Fused score card */}
        {hasData && fusedScore && (
          <section className={`rounded-2xl p-6 border space-y-4 ${
            fusedScore.level === "low"
              ? "bg-success/10 border-success/20"
              : fusedScore.level === "medium"
              ? "bg-secondary-container/40 border-secondary/20"
              : "bg-surface-container border-outline-variant"
          }`}>
            <p className="text-caption-caps text-tertiary">
              {t("insights.fused.tag")}
            </p>
            <div className="flex items-end justify-between gap-4 flex-wrap">
              <div>
                <h3 className={`text-h1 ${
                  fusedScore.level === "low" ? "text-success"
                  : fusedScore.level === "medium" ? "text-secondary"
                  : "text-tertiary"
                }`}>
                  {fusedScore.level === "low" ? t("insights.fused.low")
                    : fusedScore.level === "medium" ? t("insights.fused.medium")
                    : t("insights.fused.high")}
                </h3>
                <p className="text-body-sm mt-1">
                  {t("insights.fused.methodology")}
                </p>
              </div>
              <div className="text-right">
                <p className="text-h1">{fusedScore.fusedPercentage}%</p>
                <p className="text-caption-caps text-tertiary">{t("insights.fused.combined")}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-surface-container-lowest/60 rounded-xl p-3">
                <p className="text-caption-caps text-tertiary">{t("insights.fused.mchat")}</p>
                <p className="font-bold text-on-surface">{fusedScore.mchatPercentage}%</p>
              </div>
              <div className="bg-surface-container-lowest/60 rounded-xl p-3">
                <p className="text-caption-caps text-tertiary">{t("insights.fused.observation")}</p>
                <p className="font-bold text-on-surface">{fusedScore.observationScore}%</p>
              </div>
            </div>
            <p className="text-caption-caps text-tertiary/70">
              {t("insights.fused.citations")}
            </p>
          </section>
        )}

        {/* AI Insights Section */}
        {hasData && (
          <section className="space-y-5">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                {aiLoading ? (
                  <span className="inline-flex items-center gap-2 text-caption-caps text-tertiary">
                    <span className="w-3 h-3 rounded-full border-2 border-primary/40 border-t-primary animate-spin block" />
                    {t("insights.ai.generating")}
                  </span>
                ) : aiInsight ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-caption-caps">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary block" />
                    <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
                    {t("insights.ai.gemma_local")}
                  </span>
                ) : aiError ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-700 text-caption-caps">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 block" />
                    {t("insights.ai.offline")}
                  </span>
                ) : null}
              </div>

              {lmStudioRunning !== null && (
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center gap-1.5 text-caption-caps ${lmStudioRunning ? "text-primary" : "text-tertiary"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full block ${lmStudioRunning ? "bg-primary" : "bg-amber-500"}`} />
                    {lmStudioRunning ? t("insights.ai.lmstudio_running") : t("insights.ai.lmstudio_offline")}
                  </span>
                  {(aiError || !aiInsight) && !aiLoading && (
                    <button
                      onClick={fetchInsights}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-outline-variant/30 text-caption-caps text-tertiary hover:text-on-surface hover:border-outline-variant transition-all"
                    >
                      <span className="material-symbols-outlined text-[12px]">refresh</span>
                      {t("insights.ai.retry")}
                    </button>
                  )}
                </div>
              )}
            </div>

            {aiError && !aiLoading && (
              <div className="flex items-start gap-3 bg-amber-500/8 border border-amber-500/20 rounded-xl px-5 py-4">
                <span className="material-symbols-outlined text-amber-600 shrink-0 mt-0.5">wifi_off</span>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-on-surface">{t("insights.ai.offline_title")}</p>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    {t("insights.ai.offline_desc")}
                  </p>
                  <p className="text-xs text-tertiary mt-1">{t("insights.ai.offline_hint")}</p>
                </div>
              </div>
            )}

            {aiInsight && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-surface-container-low p-8 rounded-2xl space-y-5 relative">
                    <div className="absolute top-5 right-6 text-caption-caps text-primary/60">
                      {answeredCount} {t("insights.confidence_prefix")} {confidence}
                    </div>
                    <div className="w-11 h-11 bg-surface-container-lowest rounded-full flex items-center justify-center botanical-shadow">
                      <span className="material-symbols-outlined text-primary">visibility</span>
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-h2">{t("insights.noticed.title")}</h3>
                      <p className="text-body-lg">{aiInsight.observation}</p>
                    </div>
                  </div>

                  <div className="bg-surface-container-lowest p-8 rounded-2xl space-y-5 border border-outline-variant/15 botanical-shadow">
                    <div className="w-11 h-11 bg-secondary-container rounded-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-on-secondary-container">favorite</span>
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-h2">
                        {t("insights.note_for_you.title")}
                      </h3>
                      <p className="text-body-lg">{aiInsight.reassurance}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-tertiary-fixed/20 border border-outline-variant/15 rounded-xl px-6 py-4 flex items-start gap-3">
                  <span className="material-symbols-outlined text-tertiary shrink-0 mt-0.5 text-lg">info</span>
                  <p className="text-body">{aiInsight.normalization}</p>
                </div>

                {aiInsight.hasVisualAnalysis && aiInsight.visualObservation && (
                  <div className="bg-surface-container-low border border-primary/15 rounded-xl px-6 py-4 flex items-start gap-3">
                    <span
                      className="material-symbols-outlined text-primary shrink-0 mt-0.5 text-lg"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      videocam
                    </span>
                    <div className="space-y-1">
                      <p className="text-caption-caps text-primary">
                        {t("insights.visual_obs")}
                      </p>
                      <p className="text-body">{aiInsight.visualObservation}</p>
                    </div>
                  </div>
                )}
              </>
            )}

            {!aiInsight && !aiLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-surface-container-low p-8 rounded-2xl space-y-5 relative opacity-60">
                  <div className="w-11 h-11 bg-surface-container-lowest rounded-full flex items-center justify-center botanical-shadow">
                    <span className="material-symbols-outlined text-primary">visibility</span>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-h2">{t("insights.early_obs")}</h3>
                    <p className="text-body-lg">
                      {primaryDeveloping.length > 0
                        ? `${childName} ${t("insights.fallback_obs_prefix")} ${primaryDeveloping.map((d) => domainLabels[d.domain as keyof typeof domainLabels]?.toLowerCase() ?? d.label.toLowerCase()).join(isHindi ? " और " : " and ")}. ${t("insights.fallback_obs_suffix")}`
                        : `${childName} ${t("insights.fallback_obs_positive")}`}
                    </p>
                  </div>
                </div>
                <div className="bg-surface-container-lowest p-8 rounded-2xl space-y-5 border border-outline-variant/15 opacity-60">
                  <div className="w-11 h-11 bg-secondary-container rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-on-secondary-container">child_care</span>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-h2">{t("insights.normalization_card")}</h3>
                    <p className="text-body-lg">
                      {t("insights.normalization_fallback")}
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
              <span className="text-caption-caps text-xs text-tertiary">
                {t("insights.dev_areas")}
              </span>
              <h2 className="text-h1 mt-1">
                {childName}{t("insights.profile_title")}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {domainScores.map((ds) => {
                const pct = Math.round((ds.score / 2) * 100);
                const domainLabel = domainLabels[ds.domain as keyof typeof domainLabels] ?? ds.label;
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
                        <p className="text-caption-caps text-xs text-tertiary">
                          {domainLabel}
                        </p>
                        <p className="text-label">
                          {ds.level === "strong"
                            ? t("insights.score.strong")
                            : ds.level === "developing"
                            ? t("insights.score.developing")
                            : t("insights.score.emerging")}
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

        {/* Learn More */}
        <section className="bg-surface-container p-7 rounded-2xl">
          <details className="group cursor-pointer">
            <summary className="flex items-center justify-between list-none">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-tertiary">menu_book</span>
                <h4 className="text-h3">{t("insights.about_screening")}</h4>
              </div>
              <span className="material-symbols-outlined group-open:rotate-180 transition-transform duration-300">
                expand_more
              </span>
            </summary>
            <div className="pt-5 space-y-3 text-on-surface-variant leading-relaxed text-sm">
              <p>
                <strong>M-CHAT-R (Modified Checklist for Autism in Toddlers, Revised)</strong>{" "}
                {t("insights.about_mchat_desc")}
              </p>
              <p>
                <strong>RBSK (Rashtriya Bal Swasthya Karyakram)</strong>{" "}
                {t("insights.about_rbsk_desc")}
              </p>
              <p>
                <strong>NIMHANS</strong> (National Institute of Mental Health &amp; Neurosciences, Bangalore){" "}
                {t("insights.about_nimhans_desc")}
              </p>
              <p className="text-[11px] italic text-tertiary/70 border-t border-outline-variant/20 pt-3">
                {t("insights.footer_disclaimer")}
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
              {t("insights.cta.find_support")}
            </Link>
          )}
          <Link
            href="/profile"
            className="inline-flex items-center justify-center gap-2 bg-on-surface text-surface px-8 py-4 rounded-full font-headline font-bold hover:opacity-90 transition-all botanical-shadow"
          >
            <span className="material-symbols-outlined">file_download</span>
            {t("insights.cta.export_report")}
          </Link>
        </div>

        <footer className="pt-4 border-t border-outline-variant/15 text-center">
          <p className="text-xs text-tertiary font-medium italic">
            {t("insights.footer_disclaimer")}
          </p>
        </footer>
      </main>
      <BottomNav />
    </>
  );
}
