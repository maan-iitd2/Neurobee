"use client";

import { useApp } from "@/context/AppContext";
import { Session, getTrend } from "@/lib/sessions";
import { DOMAIN_LABELS } from "@/lib/questions";

const RISK_COLORS = {
  low: { bg: "bg-success/15", text: "text-success", label: "Low" },
  medium: { bg: "bg-warning/15", text: "text-warning", label: "Medium" },
  high: { bg: "bg-error/15", text: "text-error", label: "High" },
};

const TREND_META = {
  improving: { icon: "trending_down", label: "Improving", color: "text-success" },
  stable: { icon: "trending_flat", label: "Stable", color: "text-on-surface-variant" },
  worsening: { icon: "trending_up", label: "Needs attention", color: "text-error" },
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function SessionCard({ session, isLatest }: { session: Session; isLatest: boolean }) {
  const level = session.fusedScore?.level ?? session.riskScore.level;
  const colors = RISK_COLORS[level];
  const score = session.fusedScore?.fusedPercentage ?? session.riskScore.percentage;

  return (
    <div className={`rounded-3xl p-4 space-y-3 ${isLatest ? "bg-surface-container ring-1 ring-primary/20" : "bg-surface-container"}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            {isLatest && (
              <span className="text-[10px] font-label font-semibold uppercase tracking-wide text-primary bg-primary-fixed px-2 py-0.5 rounded-full">
                Latest
              </span>
            )}
            <span className={`text-[10px] font-label font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
              {colors.label} concern
            </span>
            {session.fusedScore && (
              <span className="text-[10px] font-label text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-full">
                Fused
              </span>
            )}
          </div>
          <p className="font-body text-xs text-on-surface-variant">{formatDate(session.date)}</p>
        </div>
        <div className="text-right">
          <p className={`font-display text-2xl font-bold ${colors.text}`}>{score}%</p>
          <p className="font-body text-[10px] text-on-surface-variant">risk score</p>
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
              <p className="font-body text-[9px] text-on-surface-variant truncate">
                {DOMAIN_LABELS[d.domain].split(" ")[0]}
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
  const sessions = [...state.sessions].reverse(); // newest first
  const trend = getTrend(state.sessions);

  if (sessions.length === 0) {
    return (
      <div className="rounded-3xl bg-surface-container p-5 text-center space-y-2">
        <span className="material-symbols-outlined text-on-surface-variant text-3xl">history</span>
        <p className="font-body text-sm text-on-surface-variant">
          Your session history will appear here after your first assessment.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Trend summary */}
      {trend && (
        <div className="flex items-center justify-between px-1">
          <p className="font-label text-xs uppercase tracking-widest text-on-surface-variant">
            {sessions.length} session{sessions.length !== 1 ? "s" : ""}
          </p>
          <div className={`flex items-center gap-1 ${TREND_META[trend].color}`}>
            <span className="material-symbols-outlined text-base">{TREND_META[trend].icon}</span>
            <p className="font-label text-xs font-semibold">{TREND_META[trend].label}</p>
          </div>
        </div>
      )}

      {/* Next check-in */}
      {nextCheckInDate && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-2xl bg-primary-fixed/30">
          <span className="material-symbols-outlined text-primary text-base">event</span>
          <p className="font-body text-xs text-on-surface">
            Next recommended check-in:{" "}
            <span className="font-semibold">
              {nextCheckInDate.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
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
