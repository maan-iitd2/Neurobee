"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from "react";
import { getStoredItem, setStoredItem, migrateAppState } from "@/lib/storage";
import { QUESTIONS, Domain, DOMAIN_LABELS, computeRiskScore, RiskScore } from "@/lib/questions";

import {
  AppState as AppStateType,
  Session,
  FusedScore,
  VideoScreeningResults,
  buildSession,
  getLatestSession,
  getTrend,
  getNextCheckInDate,
  Trend,
  computeDomainScores,
} from "@/lib/sessions";
import { computeFusedRisk } from "@/lib/fusion";

// ── Re-export types used by other pages ──────────────────────────────────────

export interface DomainScore {
  domain: Domain;
  label: string;
  score: number;
  level: "strong" | "developing" | "emerging";
}

export interface InsightSummary {
  confidence: "low" | "emerging" | "moderate";
  answeredCount: number;
  domainScores: DomainScore[];
  primaryDeveloping: DomainScore[];
  primaryStrengths: DomainScore[];
  riskScore: RiskScore;
}

// Re-export for consumers (e.g. pdf.ts)
export type AppState = AppStateType;

// ── Default state ─────────────────────────────────────────────────────────────

const DEFAULT_STATE: AppState = {
  journeyStartDate: new Date().toISOString().split("T")[0],
  sessions: [],
  answers: {},
  observationAnswers: undefined,
  hasCompletedQuestionnaire: false,
  lastMicroInsight: "",
  selectedState: undefined,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const APP_STATE_KEY = "neurobee_state";

function computeInsights(answers: Record<string, string>): InsightSummary {
  const answeredCount = Object.keys(answers).length;
  const confidence: InsightSummary["confidence"] =
    answeredCount === 0 ? "low" : answeredCount < 8 ? "low" : answeredCount < 15 ? "emerging" : "moderate";

  const domainTotals: Partial<Record<Domain, { sum: number; count: number }>> = {};

  for (const q of QUESTIONS) {
    const ans = answers[q.id];
    if (!domainTotals[q.domain]) domainTotals[q.domain] = { sum: 0, count: 0 };
    if (ans) {
      const score = ans === "Often" ? 2 : ans === "Sometimes" ? 1 : 0;
      domainTotals[q.domain]!.sum += score;
      domainTotals[q.domain]!.count += 1;
    }
  }

  const domainScores: DomainScore[] = (
    Object.entries(domainTotals) as [Domain, { sum: number; count: number }][]
  )
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

  const primaryDeveloping = domainScores
    .filter((d) => d.level !== "strong")
    .sort((a, b) => a.score - b.score)
    .slice(0, 2);

  const primaryStrengths = domainScores
    .filter((d) => d.level === "strong")
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);

  const riskScore = computeRiskScore(answers);

  return { confidence, answeredCount, domainScores, primaryDeveloping, primaryStrengths, riskScore };
}

// ── Context ───────────────────────────────────────────────────────────────────

interface AppContextValue {
  state: AppState;
  insights: InsightSummary;
  // Existing API (unchanged — existing pages keep working)
  saveAnswers: (answers: Record<string, string>) => void;
  setMicroInsight: (text: string) => void;
  dayCount: number;
  sessionCount: number;
  // New API
  saveObservationAnswers: (obsAnswers: Record<string, boolean>) => void;
  saveVideoScreeningResults: (results: VideoScreeningResults) => void;
  latestSession: Session | null;
  trend: Trend | null;
  nextCheckInDate: Date | null;
  selectedState: string | undefined;
  setSelectedState: (state: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage with migration
  useEffect(() => {
    const key = APP_STATE_KEY;
    const raw = getStoredItem<unknown>(key);
    const migrated = raw ? migrateAppState(raw) : null;
    setState(migrated ? { ...DEFAULT_STATE, ...(migrated as Partial<AppState>) } : DEFAULT_STATE);
    setHydrated(true);
  }, []);

  // Persist on every state change after hydration
  useEffect(() => {
    if (hydrated) {
      setStoredItem(APP_STATE_KEY, state);
    }
  }, [state, hydrated]);

  // Save M-CHAT-R answers → creates a new session
  const saveAnswers = useCallback((answers: Record<string, string>) => {
    setState((prev) => {
      const session = buildSession(answers);
      return {
        ...prev,
        answers,
        hasCompletedQuestionnaire: true,
        sessions: [...prev.sessions, session],
        observationAnswers: undefined, // reset obs for new session
      };
    });
  }, []);

  // Attach observation answers to the latest session and compute fused score
  const saveObservationAnswers = useCallback((obsAnswers: Record<string, boolean>) => {
    setState((prev) => {
      if (prev.sessions.length === 0) return prev;

      const sessions = [...prev.sessions];
      const last = { ...sessions[sessions.length - 1] };

      const fusedScore: FusedScore = computeFusedRisk(last.answers, obsAnswers);
      last.observationAnswers = obsAnswers;
      last.fusedScore = fusedScore;
      // Recompute domain scores with obs context (score stays same, fused added)
      last.domainScores = computeDomainScores(last.answers);

      sessions[sessions.length - 1] = last;

      return {
        ...prev,
        sessions,
        observationAnswers: obsAnswers,
      };
    });
  }, []);

  // Attach video screening results to the latest session
  const saveVideoScreeningResults = useCallback((results: VideoScreeningResults) => {
    setState((prev) => {
      if (prev.sessions.length === 0) return prev;
      const sessions = [...prev.sessions];
      sessions[sessions.length - 1] = {
        ...sessions[sessions.length - 1],
        videoScreeningResults: results,
      };
      return { ...prev, sessions };
    });
  }, []);

  const setMicroInsight = useCallback((text: string) => {
    setState((prev) => ({ ...prev, lastMicroInsight: text }));
  }, []);

  const setSelectedState = useCallback((selectedState: string) => {
    setState((prev) => ({ ...prev, selectedState }));
  }, []);

  const contextValue = useMemo(() => {
    const dayCount = Math.max(
      1,
      Math.floor(
        // eslint-disable-next-line react-hooks/purity
        (Date.now() - new Date(state.journeyStartDate).getTime()) / (1000 * 60 * 60 * 24)
      ) + 1
    );
    const insights = computeInsights(state.answers);
    const latestSession = getLatestSession(state.sessions);
    const trend = getTrend(state.sessions);
    const nextCheckInDate = latestSession ? getNextCheckInDate(latestSession) : null;
    const sessionCount = state.sessions.length;

    return {
      state,
      insights,
      saveAnswers,
      setMicroInsight,
      dayCount,
      sessionCount,
      saveObservationAnswers,
      saveVideoScreeningResults,
      latestSession,
      trend,
      nextCheckInDate,
      selectedState: state.selectedState,
      setSelectedState,
    };
  }, [state, saveAnswers, setMicroInsight, saveObservationAnswers, saveVideoScreeningResults, setSelectedState]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
