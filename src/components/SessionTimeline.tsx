"use client";

import { useApp } from "@/context/AppContext";
import { useProfile } from "@/context/ProfileContext";
import { Session, getTrend } from "@/lib/sessions";
import { DOMAIN_LABELS, DOMAIN_LABELS_HI } from "@/lib/questions";
import { useTranslation } from "@/lib/i18n";

const RISK_COLORS = {
  low: { bg: "bg-success/15", text: "text-success" },
  medium: { bg: "bg-warning/15", text: "text-warning" },
  high: { bg: "bg-error/15", text: "text-error" },
};

function formatDate(dateStr: string, lang: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function SessionCard({ session, isLatest }: { session: Session; isLatest: boolean }) {
  const { profile } = useProfile();
  const t = useTranslation();
  const isHindi = profile?.language === "hi";
  const domainLabels = isHindi ? DOMAIN_LABELS_HI : DOMAIN_LABELS;

  const level = session.fusedScore?.level ?? session.riskScore.level;
  const colors = RISK_COLORS[level];
  const score = session.fusedScore?.fusedPercentage ?? session.riskScore.percentage;

  return (
    <div className={`rounded-3xl p-4 space-y-3 ${isLatest ? "bg-surface-container ring-1 ring-primary/20" : "bg-surface-container"}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            {isLatest && (
              <span className="text-caption-caps text-primary bg-primary-fixed px-2 py-0.5 rounded-full">
                {t("timeline.latest")}
              </span>
            )}
            <span className={`text-caption-caps px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
              {t(`timeline.concern.${level}`)} {t("timeline.concern.suffix")}
            </span>
            {session.fusedScore && (
              <span className="text-caption-caps text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-full">
                {t("timeline.fused")}
              </span>
            )}
          </div>
          <p className="text-body-sm text-on-surface-variant">
            {formatDate(session.date, profile?.language ?? "en")}
          </p>
        </div>
        <div className="text-right">
          <p className={`font-display text-2xl font-bold ${colors.text}`}>{score}%</p>
          <p className="text-caption-caps normal-case text-on-surface-variant">{t("timeline.risk_score")}</p>
        </div>
      </div>

      {/* Domain sparkline */}
      {session.domainScores.length > 0 && (
        <div className="grid grid-cols-3 gap-1.5">
          {session.domainScores.map((d) => (
            <div key={d.domain} className="space-y-1">
              <div className="w-full h-1 rounded-full bg-surface-container-high">
                <div
                  className={`h-1 rounded-full transition-all ${
                    d.level === "strong" ? "bg-success" : d.level === "developing" ? "bg-warning" : "bg-error"
                  }`}
                  style={{ width: `${Math.round((d.score / 2) * 100)}%` }}
                />
              </div>
              <p className="text-caption-caps normal-case text-on-surface-variant truncate">
                {domainLabels[d.domain].split(" ")[0]}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function SessionTimeline() {
  const { state, nextCheckInDate } = useApp();
  const { profile } = useProfile();
  const t = useTranslation();
  const sessions = [...state.sessions].reverse();
  const trend = getTrend(state.sessions);

  const TREND_META = {
    improving: { icon: "trending_up", key: "timeline.trend.improving", color: "text-success" },
    stable: { icon: "trending_flat", key: "timeline.trend.stable", color: "text-on-surface-variant" },
    worsening: { icon: "trending_down", key: "timeline.trend.worsening", color: "text-error" },
  };

  if (sessions.length === 0) {
    return (
      <div className="rounded-3xl bg-surface-container p-5 text-center space-y-2">
        <span className="material-symbols-outlined text-on-surface-variant text-3xl">history</span>
        <p className="text-body text-on-surface-variant">
          {t("timeline.no_sessions")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Trend summary */}
      {trend && (
        <div className="flex items-center justify-between px-1">
          <p className="text-caption-caps text-on-surface-variant">
            {sessions.length} {t("timeline.sessions_suffix")}
          </p>
          <div className={`flex items-center gap-1 ${TREND_META[trend].color}`}>
            <span className="material-symbols-outlined text-base">{TREND_META[trend].icon}</span>
            <p className="text-caption-caps font-semibold">{t(TREND_META[trend].key)}</p>
          </div>
        </div>
      )}

      {/* Next check-in */}
      {nextCheckInDate && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-2xl bg-primary-fixed/30">
          <span className="material-symbols-outlined text-primary text-base">event</span>
          <p className="text-body-sm text-on-surface">
            {t("timeline.next_checkin")}{" "}
            <span className="font-semibold">
              {nextCheckInDate.toLocaleDateString(
                profile?.language === "hi" ? "hi-IN" : "en-IN",
                { day: "numeric", month: "long", year: "numeric" }
              )}
            </span>
          </p>
        </div>
      )}

      {/* Session cards */}
      {sessions.map((session, i) => (
        <SessionCard key={session.id} session={session} isLatest={i === 0} />
      ))}
    </div>
  );
}
