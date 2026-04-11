"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { useProfile } from "@/context/ProfileContext";
import { useApp } from "@/context/AppContext";
import { computeChildAgeMonths } from "@/lib/profile";
import { DOMAIN_LABELS, type Domain } from "@/lib/questions";

interface DailyTip {
  title: string;
  description: string;
  icon: string;
  domain: string;
}

export default function HomePage() {
  const { profile } = useProfile();
  const { state, latestSession, insights, nextCheckInDate } = useApp();
  const childName = profile?.childName ?? "your child";

  const hasAssessment = state.hasCompletedQuestionnaire && state.sessions.length > 0;

  // Gemma-powered daily tip
  const [dailyTip, setDailyTip] = useState<DailyTip | null>(null);
  const [tipLoading, setTipLoading] = useState(false);
  const [tipError, setTipError] = useState(false);

  const fetchDailyTip = useCallback(async () => {
    if (!profile) return;
    setTipLoading(true);
    setTipError(false);

    const strengths: string[] = [];
    const developing: string[] = [];
    if (latestSession) {
      for (const d of latestSession.domainScores) {
        if (d.level === "strong") strengths.push(d.label);
        else if (d.level === "emerging") developing.push(d.label);
      }
    }

    try {
      const res = await fetch("/api/daily-tip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childName: profile.childName,
          childAgeMonths: computeChildAgeMonths(profile.childDob),
          riskLevel: latestSession?.riskScore.level,
          strengths,
          developing,
        }),
      });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      setDailyTip(data);
    } catch {
      setTipError(true);
    } finally {
      setTipLoading(false);
    }
  }, [profile, latestSession]);

  useEffect(() => {
    fetchDailyTip();
  }, [fetchDailyTip]);

  // Compute journey day
  const journeyDay = state.journeyStartDate
    ? Math.max(1, Math.ceil((Date.now() - new Date(state.journeyStartDate).getTime()) / 86400000))
    : 1;

  // Time-based greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <>
      <TopBar />
      <main className="max-w-5xl mx-auto px-4 md:px-6 space-y-5 pt-4 page-bottom-padding">
        {/* Greeting */}
        <section className="space-y-1">
          <h1 className="font-headline text-2xl md:text-3xl font-extrabold tracking-tight text-on-surface">
            {greeting}, {profile?.parentName?.split(" ")[0]} 🌿
          </h1>
          <p className="font-body text-sm text-on-surface-variant">
            Day {journeyDay} of {childName}&apos;s journey with NeuroBee
          </p>
        </section>

        {/* ── Gemma Daily Tip ─────────────────────────────────────────── */}
        <section className="rounded-3xl bg-primary-fixed/30 border border-primary/10 p-5 space-y-3">
          {tipLoading ? (
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-xl animate-spin">progress_activity</span>
              <p className="font-body text-sm text-on-surface-variant">Generating today&apos;s activity tip with Gemma…</p>
            </div>
          ) : dailyTip ? (
            <>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {dailyTip.icon}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-label font-semibold uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      Today&apos;s Activity
                    </span>
                    <span className="text-[10px] font-label text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-full">
                      {dailyTip.domain}
                    </span>
                  </div>
                  <h3 className="font-headline font-bold text-lg text-on-surface mt-1.5">
                    {dailyTip.title}
                  </h3>
                </div>
              </div>
              <p className="font-body text-sm text-on-surface-variant leading-relaxed pl-[52px]">
                {dailyTip.description}
              </p>
            </>
          ) : tipError ? (
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-tertiary text-xl">lightbulb</span>
              <div className="flex-1">
                <p className="font-body text-sm text-on-surface-variant">
                  Couldn&apos;t reach Gemma right now. Make sure LM Studio is running.
                </p>
                <button
                  onClick={fetchDailyTip}
                  className="mt-2 text-xs font-label font-semibold text-primary hover:underline"
                >
                  Try again
                </button>
              </div>
            </div>
          ) : null}
        </section>

        {/* ── State-Aware Content ──────────────────────────────────── */}
        {!hasAssessment ? (
          /* ── Empty State: No Assessment Done ── */
          <section className="space-y-5">
            {/* Hero CTA */}
            <div className="rounded-3xl bg-surface-container botanical-shadow p-6 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_objects</span>
                <span className="text-[10px] font-label font-semibold uppercase tracking-widest text-primary">Get Started</span>
              </div>
              <h2 className="font-headline text-2xl font-bold tracking-tight text-on-surface leading-snug">
                Start {childName}&apos;s first milestone check-in
              </h2>
              <p className="font-body text-sm text-on-surface-variant leading-relaxed">
                Answer 20 simple observation questions about {childName}&apos;s daily behaviour — aligned with
                M-CHAT-R and Indian paediatric guidelines. Takes about 5–10 minutes.
              </p>
              <Link
                href="/milestones"
                className="inline-flex items-center justify-center gap-2 w-full py-4 bg-primary-gradient text-on-primary font-headline font-bold rounded-full shadow-lg shadow-primary/20 hover:opacity-95 active:scale-[0.98] transition-all duration-200"
              >
                Begin Assessment
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </Link>
            </div>

            {/* Camera screening option */}
            <Link
              href="/screen"
              className="flex items-center gap-4 rounded-3xl bg-surface-container botanical-shadow p-5 hover:scale-[1.01] active:scale-[0.99] transition-all"
            >
              <div className="w-12 h-12 rounded-2xl bg-secondary-container/40 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-secondary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  videocam
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-label font-semibold uppercase tracking-widest text-secondary">
                    Vision Screening
                  </span>
                </div>
                <h3 className="font-headline font-bold text-base text-on-surface mt-0.5">
                  Camera-Based Screen
                </h3>
                <p className="font-body text-xs text-on-surface-variant mt-0.5">
                  Auto-detect eye contact, name response &amp; gaze following
                </p>
              </div>
              <span className="material-symbols-outlined text-tertiary">arrow_forward</span>
            </Link>
          </section>
        ) : (
          /* ── Data State: Assessment Completed ── */
          <section className="space-y-5">
            {/* Risk Summary Card */}
            <div className="rounded-3xl bg-surface-container botanical-shadow p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className={`text-[10px] font-label font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full ${
                    insights.riskScore.level === "low"
                      ? "bg-success/15 text-success"
                      : insights.riskScore.level === "medium"
                      ? "bg-warning/15 text-warning"
                      : "bg-error/15 text-error"
                  }`}>
                    {insights.riskScore.level} concern
                  </span>
                  {latestSession?.fusedScore && (
                    <span className="ml-2 text-[10px] font-label text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-full">
                      Fused
                    </span>
                  )}
                </div>
                <p className={`font-display text-3xl font-bold ${
                  insights.riskScore.level === "low"
                    ? "text-success"
                    : insights.riskScore.level === "medium"
                    ? "text-warning"
                    : "text-error"
                }`}>
                  {latestSession?.fusedScore?.fusedPercentage ?? insights.riskScore.percentage}%
                </p>
              </div>

              {/* Domain highlights */}
              {insights.domainScores.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {insights.domainScores.map((d) => (
                    <div key={d.domain} className="rounded-2xl bg-surface-container-low p-3 space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${
                          d.level === "strong" ? "bg-success" : d.level === "developing" ? "bg-warning" : "bg-error"
                        }`} />
                        <span className="font-label text-[10px] font-semibold uppercase tracking-wide text-on-surface-variant truncate">
                          {(DOMAIN_LABELS[d.domain as Domain] ?? d.domain).split(" ")[0]}
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-surface-container-high">
                        <div
                          className={`h-1.5 rounded-full transition-all ${
                            d.level === "strong" ? "bg-success" : d.level === "developing" ? "bg-warning" : "bg-error"
                          }`}
                          style={{ width: `${Math.round((d.score / 2) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Link
                href="/insights"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-full bg-primary/10 text-primary font-label font-semibold text-sm hover:bg-primary/15 active:scale-[0.98] transition-all"
              >
                View Full Insights
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/milestones"
                className="rounded-2xl bg-surface-container p-4 text-center space-y-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  checklist
                </span>
                <p className="font-label text-xs font-semibold text-on-surface">New Assessment</p>
              </Link>
              <Link
                href="/screen"
                className="rounded-2xl bg-surface-container p-4 text-center space-y-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <span className="material-symbols-outlined text-secondary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  videocam
                </span>
                <p className="font-label text-xs font-semibold text-on-surface">Camera Screen</p>
              </Link>
              <Link
                href="/referrals"
                className="rounded-2xl bg-surface-container p-4 text-center space-y-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <span className="material-symbols-outlined text-tertiary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  local_hospital
                </span>
                <p className="font-label text-xs font-semibold text-on-surface">Find Support</p>
              </Link>
              <Link
                href="/profile"
                className="rounded-2xl bg-surface-container p-4 text-center space-y-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <span className="material-symbols-outlined text-tertiary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  description
                </span>
                <p className="font-label text-xs font-semibold text-on-surface">Export Report</p>
              </Link>
            </div>

            {/* Next check-in */}
            {nextCheckInDate && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-primary-fixed/30">
                <span className="material-symbols-outlined text-primary text-lg">event</span>
                <p className="font-body text-sm text-on-surface">
                  Next check-in:{" "}
                  <span className="font-semibold">
                    {nextCheckInDate.toLocaleDateString("en-IN", { day: "numeric", month: "long" })}
                  </span>
                </p>
              </div>
            )}

            {/* Camera screening */}
            <Link
              href="/screen"
              className="flex items-center gap-4 rounded-3xl bg-surface-container botanical-shadow p-5 hover:scale-[1.01] active:scale-[0.99] transition-all"
            >
              <div className="w-12 h-12 rounded-2xl bg-secondary-container/40 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-secondary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  videocam
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-label font-semibold uppercase tracking-widest text-secondary">
                  Vision Screening
                </span>
                <h3 className="font-headline font-bold text-base text-on-surface mt-0.5">
                  Camera-Based Screen
                </h3>
                <p className="font-body text-xs text-on-surface-variant mt-0.5">
                  Auto-detect eye contact, name response &amp; gaze following
                </p>
              </div>
              <span className="material-symbols-outlined text-tertiary">arrow_forward</span>
            </Link>
          </section>
        )}
      </main>
      <BottomNav />
    </>
  );
}
