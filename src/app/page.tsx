"use client";

import Link from "next/link";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { useProfile } from "@/context/ProfileContext";
import { useApp } from "@/context/AppContext";
import { DOMAIN_LABELS, DOMAIN_LABELS_HI, type Domain } from "@/lib/questions";
import { useTranslation } from "@/lib/i18n";

export default function HomePage() {
  const { profile } = useProfile();
  const { state, latestSession, insights, nextCheckInDate } = useApp();
  const t = useTranslation();

  const isHindi = profile?.language === "hi";
  const domainLabels = isHindi ? DOMAIN_LABELS_HI : DOMAIN_LABELS;
  const childName = profile?.childName ?? "your child";
  const hasAssessment = state.hasCompletedQuestionnaire && state.sessions.length > 0;



  const hour = new Date().getHours();
  const greetingKey = hour < 12 ? "home.greeting.morning" : hour < 17 ? "home.greeting.afternoon" : "home.greeting.evening";

  const riskLevel = insights.riskScore.level;

  return (
    <>
      <TopBar />
      <main className="max-w-5xl mx-auto px-4 md:px-6 space-y-5 pt-4 page-bottom-padding">
        {/* Greeting */}
        <section className="space-y-1">
          <h1 className="text-h1">
            {t(greetingKey)}, {profile?.parentName?.split(" ")[0]}
          </h1>
        </section>



        {!hasAssessment ? (
          <section className="space-y-5">
            {/* Hero CTA */}
            <div className="rounded-3xl bg-surface-container botanical-shadow p-6 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_objects</span>
                <span className="text-caption-caps text-primary">{t("home.cta.tag")}</span>
              </div>
              <h2 className="text-h2">
                {t("home.cta.title_prefix")} {childName}{t("home.cta.title_suffix")}
              </h2>
              <p className="text-body">
                {t("home.cta.desc_prefix")} {childName}{t("home.cta.desc_suffix")}
              </p>
              <Link
                href="/milestones"
                className="inline-flex items-center justify-center gap-2 w-full py-4 bg-primary-gradient text-on-primary font-headline font-bold rounded-full shadow-lg shadow-primary/20 hover:opacity-95 active:scale-[0.98] transition-all duration-200"
              >
                {t("home.cta.begin")}
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </Link>
            </div>

            {/* Camera screening option */}
            <Link
              href="/screen"
              className="flex items-center gap-4 rounded-3xl bg-surface-container botanical-shadow p-5 hover:scale-[1.01] active:scale-[0.99] transition-all"
            >
              <div className="w-12 h-12 rounded-2xl bg-secondary-container/40 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-secondary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>videocam</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-caption-caps text-secondary">{t("home.camera.tag")}</span>
                </div>
                <h3 className="text-h3 mt-0.5">{t("home.camera.title")}</h3>
                <p className="text-body-sm mt-0.5">{t("home.camera.desc")}</p>
              </div>
              <span className="material-symbols-outlined text-tertiary">arrow_forward</span>
            </Link>
          </section>
        ) : (
          <section className="space-y-5">
            {/* Risk Summary Card */}
            <div className="rounded-3xl bg-surface-container botanical-shadow p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className={`text-caption-caps px-2.5 py-1 rounded-full ${
                    riskLevel === "low" ? "bg-success/15 text-success"
                    : riskLevel === "medium" ? "bg-warning/15 text-warning"
                    : "bg-error/15 text-error"
                  }`}>
                    {t(`home.risk.${riskLevel}`)}
                  </span>
                  {latestSession?.fusedScore && (
                    <span className="text-caption-caps ml-2 bg-surface-container-high px-2 py-0.5 rounded-full">
                      {t("home.risk.fused")}
                    </span>
                  )}
                </div>
                <p className={`font-display text-3xl font-bold ${
                  riskLevel === "low" ? "text-success" : riskLevel === "medium" ? "text-warning" : "text-error"
                }`}>
                  {latestSession?.fusedScore?.fusedPercentage ?? insights.riskScore.percentage}%
                </p>
              </div>

              {insights.domainScores.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {insights.domainScores.map((d) => (
                    <div key={d.domain} className="rounded-2xl bg-surface-container-low p-3 space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${
                          d.level === "strong" ? "bg-success" : d.level === "developing" ? "bg-warning" : "bg-error"
                        }`} />
                        <span className="text-caption-caps text-on-surface-variant truncate">
                          {(domainLabels[d.domain as Domain] ?? d.domain).split(" ")[0]}
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
                className="flex items-center justify-center gap-2 w-full py-3 rounded-full bg-primary/10 text-primary text-label text-sm hover:bg-primary/15 active:scale-[0.98] transition-all"
              >
                {t("home.view_insights")}
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { href: "/milestones", icon: "checklist", key: "home.actions.new_assessment", color: "text-primary" },
                { href: "/screen", icon: "videocam", key: "home.actions.camera_screen", color: "text-secondary" },
                { href: "/referrals", icon: "local_hospital", key: "home.actions.find_support", color: "text-tertiary" },
                { href: "/profile", icon: "description", key: "home.actions.export_report", color: "text-tertiary" },
              ].map(({ href, icon, key, color }) => (
                <Link
                  key={href}
                  href={href}
                  className="rounded-2xl bg-surface-container p-4 text-center space-y-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <span className={`material-symbols-outlined text-2xl ${color}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                    {icon}
                  </span>
                  <p className="text-label text-xs text-on-surface">{t(key)}</p>
                </Link>
              ))}
            </div>

            {nextCheckInDate && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-primary-fixed/30">
                <span className="material-symbols-outlined text-primary text-lg">event</span>
                <p className="text-body text-on-surface">
                  {t("home.next_checkin")}{" "}
                  <span className="font-semibold">
                    {nextCheckInDate.toLocaleDateString(isHindi ? "hi-IN" : "en-IN", { day: "numeric", month: "long" })}
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
                <span className="material-symbols-outlined text-secondary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>videocam</span>
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-caption-caps text-secondary">{t("home.camera.tag")}</span>
                <h3 className="text-h3 mt-0.5">{t("home.camera.title")}</h3>
                <p className="text-body-sm mt-0.5">{t("home.camera.desc")}</p>
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
