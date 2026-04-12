"use client";

import { useState } from "react";
import Link from "next/link";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { useApp } from "@/context/AppContext";
import { useProfile } from "@/context/ProfileContext";
import { useTranslation } from "@/lib/i18n";
import type { Language } from "@/lib/i18n";
import { SessionTimeline } from "@/components/SessionTimeline";

export default function ProfilePage() {
  const { state, insights, dayCount, sessionCount } = useApp();
  const { profile, resetProfile, saveProfile } = useProfile();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Edit state
  const [editParentName, setEditParentName] = useState("");
  const [editChildName, setEditChildName] = useState("");
  const [editDobMonth, setEditDobMonth] = useState("");
  const [editDobYear, setEditDobYear] = useState("");

  const MONTHS_INTERNAL = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const MONTH_KEYS = [
    "month.january", "month.february", "month.march", "month.april",
    "month.may", "month.june", "month.july", "month.august",
    "month.september", "month.october", "month.november", "month.december",
  ] as const;
  const currentYear = new Date().getFullYear();
  const YEARS = Array.from({ length: 10 }, (_, i) => currentYear - i);

  function startEditing() {
    setEditParentName(profile?.parentName ?? "");
    setEditChildName(profile?.childName ?? "");
    if (profile?.childDob) {
      const [y, m] = profile.childDob.split("-");
      setEditDobYear(y);
      setEditDobMonth(MONTHS_INTERNAL[parseInt(m, 10) - 1]);
    }
    setIsEditing(true);
  }

  function handleSaveProfile() {
    const m = String(MONTHS_INTERNAL.indexOf(editDobMonth) + 1).padStart(2, "0");
    saveProfile({
      parentName: editParentName.trim() || (profile?.parentName ?? "Parent"),
      childName: editChildName.trim() || (profile?.childName ?? "Child"),
      childDob: `${editDobYear}-${m}`,
      language: profile?.language ?? "en",
    });
    setIsEditing(false);
  }

  function handleLanguageChange(newLang: Language) {
    if (!profile) return;
    saveProfile({
      parentName: profile.parentName,
      childName: profile.childName,
      childDob: profile.childDob,
      language: newLang,
    });
  }

  const t = useTranslation();

  const childName = profile?.childName ?? "—";
  const childAge = profile?.childAge ?? 0;
  const parentName = profile?.parentName ?? "—";

  return (
    <>
      <TopBar />
      <main className="max-w-xl mx-auto px-6 pt-8 space-y-10 page-bottom-padding">
        {/* Hero */}
        <section className="space-y-1">
          <p className="text-caption-caps text-primary">
            {t("profile.settings_label")}
          </p>
          <h1 className="text-h1">
            {t("profile.workspace")}
          </h1>
          <p className="text-body text-tertiary max-w-sm">
            {t("profile.workspace_desc_prefix")} {childName}{t("profile.workspace_desc_suffix")}
          </p>
        </section>

        {/* Child Profile */}
        <section className="space-y-5">
          <h2 className="text-h2 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">child_care</span>
            {t("profile.child_profile")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-1 md:col-span-2 bg-surface-container-lowest botanical-shadow p-5 rounded-2xl flex items-center justify-between border border-outline-variant/10">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary-gradient flex items-center justify-center ring-4 ring-secondary-container/30 shrink-0">
                  <span className="text-h2 text-on-primary">
                    {childName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="text-h3 text-lg">{childName}</h3>
                  <p className="text-body text-tertiary">
                    {childAge} {t("profile.years_old_suffix")}
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
              <h4 className="text-label">{t("profile.active_journey")}</h4>
              <p className="text-body-sm text-tertiary">
                {t("profile.active_journey_day_prefix")} {dayCount} {t("profile.active_journey_day_suffix")}{" "}
                {sessionCount > 0
                  ? `${sessionCount} ${t("profile.active_journey_sessions_suffix")}`
                  : t("profile.active_journey_no_sessions")}
              </p>
            </div>

            <div className="bg-surface-container-low p-5 rounded-2xl space-y-2">
              <span className="material-symbols-outlined text-primary">shield_with_heart</span>
              <h4 className="text-label">{t("profile.data_privacy")}</h4>
              <p className="text-body-sm text-tertiary">
                {t("profile.data_privacy_desc")}
              </p>
            </div>
          </div>
        </section>

        {/* Session Timeline */}
        <section className="space-y-4">
          <h2 className="text-h2">{t("profile.assessment_history")}</h2>
          <SessionTimeline />
        </section>

        {/* Latest Observation Summary */}
        {insights.answeredCount > 0 && (
          <section className="space-y-4">
            <h2 className="text-h2">{t("profile.latest_screening")}</h2>
            <div className="bg-surface-container-lowest rounded-2xl overflow-hidden border border-outline-variant/10 botanical-shadow">
              <div className="p-5 flex items-center justify-between border-b border-surface-container-high/20">
                <div>
                  <p className="text-caption-caps text-tertiary">
                    {t("profile.screening_result")}
                  </p>
                  <p
                    className={`text-label capitalize ${
                      insights.riskScore.level === "low"
                        ? "text-primary"
                        : insights.riskScore.level === "medium"
                        ? "text-secondary"
                        : "text-tertiary"
                    }`}
                  >
                    {t(`profile.risk.${insights.riskScore.level}`)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-caption-caps text-tertiary">
                    {t("profile.responses_label")}
                  </p>
                  <p className="text-h3">
                    {insights.answeredCount} / 20
                  </p>
                </div>
              </div>
              {insights.primaryStrengths.length > 0 && (
                <div className="p-5 border-b border-surface-container-high/20">
                  <p className="text-caption-caps text-tertiary mb-1">
                    {t("profile.strengths")}
                  </p>
                  <p className="text-label text-primary">
                    {insights.primaryStrengths.map((d) => d.label).join(", ")}
                  </p>
                </div>
              )}
              {insights.primaryDeveloping.length > 0 && (
                <div className="p-5">
                  <p className="text-caption-caps text-tertiary mb-1">
                    {t("profile.areas_to_nurture")}
                  </p>
                  <p className="text-label">
                    {insights.primaryDeveloping.map((d) => d.label).join(", ")}
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* System */}
        <section className="space-y-4">
          <h2 className="text-h2">{t("profile.system")}</h2>
          <div className="bg-surface-container-lowest botanical-shadow rounded-2xl overflow-hidden border border-outline-variant/10">
              {isEditing ? (
                <div className="px-5 py-4 border-b border-surface-container-high/20 space-y-4">
                  <div>
                    <label className="block text-caption-caps text-tertiary mb-1">{t("profile.caregiver_name")}</label>
                    <input type="text" value={editParentName} onChange={(e) => setEditParentName(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-container border border-outline-variant/30 text-sm focus:outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-caption-caps text-tertiary mb-1">{t("profile.child_name_label")}</label>
                    <input type="text" value={editChildName} onChange={(e) => setEditChildName(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-container border border-outline-variant/30 text-sm focus:outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-caption-caps text-tertiary mb-1">{t("profile.birth_month_year")}</label>
                    <div className="flex gap-2">
                      <select value={editDobMonth} onChange={(e) => setEditDobMonth(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-container border border-outline-variant/30 text-sm focus:outline-none focus:border-primary">
                        {MONTHS_INTERNAL.map((m, i) => <option key={m} value={m}>{t(MONTH_KEYS[i])}</option>)}
                      </select>
                      <select value={editDobYear} onChange={(e) => setEditDobYear(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-container border border-outline-variant/30 text-sm focus:outline-none focus:border-primary">
                        {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button onClick={() => setIsEditing(false)} className="px-4 py-2 rounded-lg text-sm font-semibold text-tertiary hover:bg-surface-container">{t("profile.cancel")}</button>
                    <button onClick={handleSaveProfile} className="px-4 py-2 rounded-lg bg-primary text-on-primary text-sm font-semibold hover:opacity-90">{t("profile.save")}</button>
                  </div>
                </div>
              ) : (
                <div className="px-5 py-4 flex items-center justify-between border-b border-surface-container-high/20">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-secondary-container flex items-center justify-center">
                      <span className="material-symbols-outlined text-on-secondary-container text-[18px]">person</span>
                    </div>
                    <div>
                      <p className="text-label">{parentName}</p>
                      <p className="text-body-sm text-tertiary">{t("profile.parent_caregiver")}</p>
                    </div>
                  </div>
                  <button onClick={startEditing} className="text-primary text-sm font-semibold px-3 py-1.5 rounded-lg hover:bg-primary/5 transition-colors">
                    {t("profile.edit")}
                  </button>
                </div>
              )}

            {/* Language toggle */}
            <div className="px-5 py-4 border-b border-surface-container-high/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-secondary-container flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-on-secondary-container text-[18px]">translate</span>
                </div>
                <div>
                  <p className="text-label">{t("profile.language_label")}</p>
                </div>
              </div>
              <div className="flex gap-2 pl-12">
                {(["en", "hi"] as Language[]).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => handleLanguageChange(lang)}
                    className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all duration-200 ${
                      (profile?.language ?? "en") === lang
                        ? "bg-primary text-on-primary border-primary"
                        : "bg-surface-container border-outline-variant/40 text-on-surface hover:border-primary/40"
                    }`}
                  >
                    {t(lang === "en" ? "onboarding.lang.english" : "onboarding.lang.hindi")}
                  </button>
                ))}
              </div>
            </div>

            <Link href="/referrals" className="px-5 py-4 flex items-center justify-between hover:bg-surface-container-low transition-colors duration-200 border-b border-surface-container-high/20">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-secondary-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-secondary-container text-[18px]">location_on</span>
                </div>
                <div>
                  <p className="text-label">{t("profile.find_support")}</p>
                  <p className="text-body-sm text-tertiary">{t("profile.referral_resources")}</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-outline-variant">chevron_right</span>
            </Link>
          </div>
        </section>

        {/* Reports */}
        <section className="space-y-4">
          <h2 className="text-h2">{t("profile.reports")}</h2>
          <div className="bg-primary-gradient p-6 rounded-2xl text-white botanical-shadow relative overflow-hidden group">
            <div className="relative z-10 space-y-4">
              <div className="w-11 h-11 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
                <span className="material-symbols-outlined text-white">description</span>
              </div>
              <div className="space-y-1">
                <h3 className="text-h2">{t("profile.dev_report")}</h3>
                <p className="text-body text-white/90">
                  {t("profile.dev_report_desc")}
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
                {t("profile.export_report")}
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
              <p className="text-label text-on-error-container text-center">
                {t("profile.reset_confirm_title")}
              </p>
              <p className="text-body-sm text-on-error-container/70 text-center">
                {t("profile.reset_confirm_desc")}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 py-2.5 rounded-full border border-outline-variant text-on-surface font-headline font-bold text-sm hover:bg-surface-container transition-colors"
                >
                  {t("profile.cancel")}
                </button>
                <button
                  onClick={resetProfile}
                  className="flex-1 py-2.5 rounded-full bg-error text-on-error font-headline font-bold text-sm hover:opacity-90 active:scale-95 transition-all"
                >
                  {t("profile.reset_everything")}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="text-error font-headline font-bold text-sm tracking-tight flex items-center gap-2 px-6 py-2.5 rounded-full hover:bg-error-container/20 transition-colors border border-error/10"
            >
              <span className="material-symbols-outlined text-sm">restart_alt</span>
              {t("profile.reset")}
            </button>
          )}
          <p className="text-caption-caps text-tertiary/50">
            {t("profile.data_stored_locally")}
          </p>
        </section>
      </main>
      <BottomNav />
    </>
  );
}
