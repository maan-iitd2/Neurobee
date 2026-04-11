"use client";

import { useState } from "react";
import Link from "next/link";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { useApp } from "@/context/AppContext";
import { useProfile } from "@/context/ProfileContext";
import { SessionTimeline } from "@/components/SessionTimeline";

export default function ProfilePage() {
  const { state, insights, dayCount, sessionCount } = useApp();
  const { profile, resetProfile } = useProfile();
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const childName = profile?.childName ?? "—";
  const childAge = profile?.childAge ?? 0;
  const parentName = profile?.parentName ?? "—";

  return (
    <>
      <TopBar />
      <main className="max-w-xl mx-auto px-6 pt-8 space-y-10 page-bottom-padding">
        {/* Hero */}
        <section className="space-y-1">
          <p className="font-label text-primary font-medium tracking-[0.05em] uppercase text-[0.75rem]">
            Settings
          </p>
          <h1 className="font-headline font-extrabold text-3xl tracking-tight text-on-background">
            Your Workspace
          </h1>
          <p className="text-sm text-tertiary leading-relaxed max-w-sm">
            Manage {childName}&apos;s journey and your app preferences.
          </p>
        </section>

        {/* Child Profile */}
        <section className="space-y-5">
          <h2 className="font-headline font-bold text-xl tracking-tight flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">child_care</span>
            Child Profile
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-1 md:col-span-2 bg-surface-container-lowest botanical-shadow p-5 rounded-2xl flex items-center justify-between border border-outline-variant/10">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary-gradient flex items-center justify-center ring-4 ring-secondary-container/30 shrink-0">
                  <span className="font-headline font-extrabold text-on-primary text-xl">
                    {childName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="font-headline font-bold text-lg">{childName}</h3>
                  <p className="text-sm text-tertiary">
                    {childAge} year{childAge !== 1 ? "s" : ""} old
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-surface-container-low p-5 rounded-2xl space-y-2">
              <span
                className="material-symbols-outlined text-primary"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                auto_awesome
              </span>
              <h4 className="font-headline font-bold text-sm">Active Journey</h4>
              <p className="text-xs text-tertiary leading-relaxed">
                Day {dayCount} of your journey.{" "}
                {sessionCount > 0
                  ? `${sessionCount} observation${sessionCount !== 1 ? "s" : ""} completed.`
                  : "Start your first observation today."}
              </p>
            </div>

            <div className="bg-surface-container-low p-5 rounded-2xl space-y-2">
              <span className="material-symbols-outlined text-primary">shield_with_heart</span>
              <h4 className="font-headline font-bold text-sm">Data Privacy</h4>
              <p className="text-xs text-tertiary leading-relaxed">
                All data stays on your device. Nothing is sent to external servers.
              </p>
            </div>
          </div>
        </section>

        {/* Session Timeline */}
        <section className="space-y-4">
          <h2 className="font-headline font-bold text-xl tracking-tight">Assessment History</h2>
          <SessionTimeline />
        </section>

        {/* Latest Observation Summary */}
        {insights.answeredCount > 0 && (
          <section className="space-y-4">
            <h2 className="font-headline font-bold text-xl tracking-tight">Latest Screening</h2>
            <div className="bg-surface-container-lowest rounded-2xl overflow-hidden border border-outline-variant/10 botanical-shadow">
              <div className="p-5 flex items-center justify-between border-b border-surface-container-high/20">
                <div>
                  <p className="text-xs text-tertiary font-label uppercase tracking-widest">
                    Screening result
                  </p>
                  <p
                    className={`font-headline font-bold capitalize text-sm ${
                      insights.riskScore.level === "low"
                        ? "text-primary"
                        : insights.riskScore.level === "medium"
                        ? "text-secondary"
                        : "text-tertiary"
                    }`}
                  >
                    {insights.riskScore.level === "low"
                      ? "Developing Beautifully"
                      : insights.riskScore.level === "medium"
                      ? "Developing with Care"
                      : "Seek Professional Support"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-tertiary font-label uppercase tracking-widest">
                    Responses
                  </p>
                  <p className="font-headline font-semibold text-on-surface">
                    {insights.answeredCount} / 20
                  </p>
                </div>
              </div>
              {insights.primaryStrengths.length > 0 && (
                <div className="p-5 border-b border-surface-container-high/20">
                  <p className="text-xs text-tertiary font-label uppercase tracking-widest mb-1">
                    Strengths
                  </p>
                  <p className="text-sm font-semibold text-primary">
                    {insights.primaryStrengths.map((d) => d.label).join(", ")}
                  </p>
                </div>
              )}
              {insights.primaryDeveloping.length > 0 && (
                <div className="p-5">
                  <p className="text-xs text-tertiary font-label uppercase tracking-widest mb-1">
                    Areas to Nurture
                  </p>
                  <p className="text-sm font-semibold text-on-surface">
                    {insights.primaryDeveloping.map((d) => d.label).join(", ")}
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* System */}
        <section className="space-y-4">
          <h2 className="font-headline font-bold text-xl tracking-tight">System</h2>
          <div className="bg-surface-container-lowest botanical-shadow rounded-2xl overflow-hidden border border-outline-variant/10">
            <div className="px-5 py-4 flex items-center justify-between border-b border-surface-container-high/20">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-secondary-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-secondary-container text-[18px]">person</span>
                </div>
                <div>
                  <p className="font-headline font-semibold text-sm">{parentName}</p>
                  <p className="text-xs text-tertiary">Parent / Caregiver</p>
                </div>
              </div>
            </div>

            <Link href="/referrals" className="px-5 py-4 flex items-center justify-between hover:bg-surface-container-low transition-colors duration-200 border-b border-surface-container-high/20">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-secondary-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-secondary-container text-[18px]">location_on</span>
                </div>
                <div>
                  <p className="font-headline font-semibold text-sm">Find Support</p>
                  <p className="text-xs text-tertiary">Referral resources near you</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-outline-variant">chevron_right</span>
            </Link>
          </div>
        </section>

        {/* Reports */}
        <section className="space-y-4">
          <h2 className="font-headline font-bold text-xl tracking-tight">Reports &amp; Export</h2>
          <div className="bg-primary-gradient p-6 rounded-2xl text-white botanical-shadow relative overflow-hidden group">
            <div className="relative z-10 space-y-4">
              <div className="w-11 h-11 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
                <span className="material-symbols-outlined text-white">description</span>
              </div>
              <div className="space-y-1">
                <h3 className="font-headline font-extrabold text-xl">Developmental Report</h3>
                <p className="text-sm opacity-90 leading-relaxed">
                  Generate a screening summary aligned with M-CHAT-R and RBSK guidelines for your
                  paediatrician or developmental specialist.
                </p>
              </div>
              <button
                onClick={async () => {
                  const { generatePdfReport } = await import("@/lib/pdf");
                  await generatePdfReport(
                    profile ? { parentName: profile.parentName, childName: profile.childName, childDob: profile.childDob } : null,
                    state,
                    insights
                  );
                }}
                className="bg-white text-primary px-6 py-3 rounded-full font-headline font-bold text-sm w-full hover:bg-surface-container-lowest transition-all duration-200 flex items-center justify-center gap-2 active:scale-95"
              >
                Export Report
                <span className="material-symbols-outlined text-sm">download</span>
              </button>
            </div>
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-secondary-container/10 rounded-full blur-3xl pointer-events-none" />
          </div>
        </section>

        {/* Reset App */}
        <section className="py-4 flex flex-col items-center gap-3">
          {showResetConfirm ? (
            <div className="w-full bg-error-container/20 border border-error/20 rounded-2xl p-5 space-y-3">
              <p className="font-headline font-bold text-sm text-on-error-container text-center">
                Are you sure?
              </p>
              <p className="text-xs text-on-error-container/70 text-center leading-relaxed">
                This will erase all assessment data, sessions, and your profile from this device. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 py-2.5 rounded-full border border-outline-variant text-on-surface font-headline font-bold text-sm hover:bg-surface-container transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={resetProfile}
                  className="flex-1 py-2.5 rounded-full bg-error text-on-error font-headline font-bold text-sm hover:opacity-90 active:scale-95 transition-all"
                >
                  Reset Everything
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="text-error font-headline font-bold text-sm tracking-tight flex items-center gap-2 px-6 py-2.5 rounded-full hover:bg-error-container/20 transition-colors border border-error/10"
            >
              <span className="material-symbols-outlined text-sm">restart_alt</span>
              Reset App
            </button>
          )}
          <p className="text-[10px] text-tertiary/50 uppercase tracking-widest font-label">
            NeuroBee · All data stored locally on your device
          </p>
        </section>
      </main>
      <BottomNav />
    </>
  );
}
