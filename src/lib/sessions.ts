/**
 * Session model for NeuroBee.
 * Stores multi-session history so parents can track developmental trends over time.
 * All functions are pure — no storage calls here.
 */

import { Domain, DOMAIN_LABELS, QUESTIONS, computeRiskScore, RiskScore } from "./questions";
import type { NeuroFeatures } from "./screening-features";
import type { NeuroRisk } from "./screening-classifier";

// ── Types ────────────────────────────────────────────────────────────────────

export interface SessionDomainScore {
  domain: Domain;
  label: string;
  score: number;   // 0–2 averaged (2=Often/strong, 0=Rarely/emerging)
  level: "strong" | "developing" | "emerging";
}

export interface FusedScore {
  mchatPercentage: number;    // 0–100 risk from M-CHAT-R
  observationScore: number;   // 0–100 positive observation score
  fusedPercentage: number;    // 0–100 fused risk (60% MCHAT + 40% inverted obs)
  level: "low" | "medium" | "high";
}

export interface VideoScreeningResults {
  eyeContactScore: number;    // 0–100
  nameResponseScore: number;  // 0–100
  gazeFollowScore: number;    // 0–100
  compositeScore: number;     // 0–100 weighted average
  completedAt: string;        // ISO timestamp
  features?: NeuroFeatures;   // 7 extracted gaze/attention features
  neuroRisk?: NeuroRisk;      // research-calibrated domain risk levels
  keyFrames?: string[];       // base64 JPEG key frames (one per task) for multimodal AI
}

export interface Session {
  id: string;
  date: string;                           // YYYY-MM-DD
  answers: Record<string, string>;        // q1 → "Often" | "Sometimes" | "Rarely"
  observationAnswers?: Record<string, boolean>; // scenarioId_itemId → boolean
  riskScore: RiskScore;
  fusedScore?: FusedScore;
  domainScores: SessionDomainScore[];
  aiInsights?: {
    reassurance: string;
    observation: string;
    normalization: string;
    guidance: string[];
  };
  videoScreeningResults?: VideoScreeningResults;
}

// New AppState shape — mirror fields keep existing page call sites unbroken
export interface AppState {
  journeyStartDate: string;
  sessions: Session[];
  // Mirror of latest session's answers — existing pages read these directly
  answers: Record<string, string>;
  observationAnswers?: Record<string, boolean>;
  hasCompletedQuestionnaire: boolean;
  lastMicroInsight: string;
  selectedState?: string; // for referrals page persistence
}

// ── Pure helper functions ────────────────────────────────────────────────────

function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without randomUUID
  return Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join("");
}

export function computeDomainScores(answers: Record<string, string>): SessionDomainScore[] {
  const totals: Partial<Record<Domain, { sum: number; count: number }>> = {};

  for (const q of QUESTIONS) {
    const ans = answers[q.id];
    if (!totals[q.domain]) totals[q.domain] = { sum: 0, count: 0 };
    if (ans) {
      const score = ans === "Often" ? 2 : ans === "Sometimes" ? 1 : 0;
      totals[q.domain]!.sum += score;
      totals[q.domain]!.count += 1;
    }
  }

  return (Object.entries(totals) as [Domain, { sum: number; count: number }][])
    .filter(([, v]) => v.count > 0)
    .map(([domain, { sum, count }]) => {
      const score = sum / count;
      return {
        domain,
        label: DOMAIN_LABELS[domain],
        score,
        level: score >= 1.5 ? "strong" : score >= 0.8 ? "developing" : "emerging",
      };
    });
}

export function buildSession(
  answers: Record<string, string>,
  observationAnswers?: Record<string, boolean>,
  fusedScore?: FusedScore
): Session {
  return {
    id: generateId(),
    date: new Date().toISOString().split("T")[0],
    answers,
    observationAnswers,
    riskScore: computeRiskScore(answers),
    fusedScore,
    domainScores: computeDomainScores(answers),
  };
}

export function getLatestSession(sessions: Session[]): Session | null {
  return sessions.length > 0 ? sessions[sessions.length - 1] : null;
}

export type Trend = "improving" | "stable" | "worsening";

export function getTrend(sessions: Session[]): Trend | null {
  if (sessions.length < 2) return null;
  const latest = sessions[sessions.length - 1];
  const prev = sessions[sessions.length - 2];

  const latestPct = latest.fusedScore?.fusedPercentage ?? latest.riskScore.percentage;
  const prevPct = prev.fusedScore?.fusedPercentage ?? prev.riskScore.percentage;

  const delta = latestPct - prevPct;
  if (delta <= -5) return "improving";   // risk went down ≥5pts
  if (delta >= 5) return "worsening";    // risk went up ≥5pts
  return "stable";
}

export function getNextCheckInDate(session: Session): Date {
  const base = new Date(session.date);
  const level = session.fusedScore?.level ?? session.riskScore.level;
  const daysToAdd = level === "high" ? 30 : level === "medium" ? 90 : 180;
  base.setDate(base.getDate() + daysToAdd);
  return base;
}
