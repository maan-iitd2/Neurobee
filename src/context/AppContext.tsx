"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { getStoredItem, setStoredItem } from "@/lib/storage";
import { QUESTIONS, Domain, DOMAIN_LABELS, computeRiskScore, RiskScore } from "@/lib/questions";
import { loadAuthStorage } from "@/lib/auth";

export interface DomainScore {
  domain: Domain;
  label: string;
  score: number; // 0–2 average (2 = "Often", 0 = "Rarely")
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

export interface AppState {
  journeyStartDate: string;
  sessionCount: number;
  answers: Record<string, string>;
  hasCompletedQuestionnaire: boolean;
  lastMicroInsight: string;
}

const DEFAULT_STATE: AppState = {
  journeyStartDate: new Date().toISOString().split("T")[0],
  sessionCount: 0,
  answers: {},
  hasCompletedQuestionnaire: false,
  lastMicroInsight: "",
};

function getUserStorageKey(): string {
  const auth = loadAuthStorage();
  const uid = auth.currentUserId ?? "guest";
  return `neurobee_state_${uid}`;
}

function computeInsights(answers: Record<string, string>): InsightSummary {
  const answeredCount = Object.keys(answers).length;
  const confidence: InsightSummary["confidence"] =
    answeredCount === 0 ? "low" : answeredCount < 8 ? "low" : answeredCount < 15 ? "emerging" : "moderate";

  const domainTotals: Partial<Record<Domain, { sum: number; count: number }>> = {};

  for (const q of QUESTIONS) {
    const ans = answers[q.id];
    if (!domainTotals[q.domain]) domainTotals[q.domain] = { sum: 0, count: 0 };
    if (ans) {
      // Score: Often=2 (positive), Sometimes=1, Rarely=0 (concern)
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

interface AppContextValue {
  state: AppState;
  insights: InsightSummary;
  saveAnswers: (answers: Record<string, string>) => void;
  setMicroInsight: (text: string) => void;
  dayCount: number;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const key = getUserStorageKey();
    const stored = getStoredItem<AppState>(key);
    setState(stored ? { ...DEFAULT_STATE, ...stored } : DEFAULT_STATE);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      setStoredItem(getUserStorageKey(), state);
    }
  }, [state, hydrated]);

  const saveAnswers = useCallback((answers: Record<string, string>) => {
    setState((prev) => ({
      ...prev,
      answers,
      hasCompletedQuestionnaire: true,
      sessionCount: prev.sessionCount + 1,
    }));
  }, []);

  const setMicroInsight = useCallback((text: string) => {
    setState((prev) => ({ ...prev, lastMicroInsight: text }));
  }, []);

  const dayCount = Math.max(
    1,
    Math.floor(
      (Date.now() - new Date(state.journeyStartDate).getTime()) / (1000 * 60 * 60 * 24)
    ) + 1
  );

  const insights = computeInsights(state.answers);

  return (
    <AppContext.Provider value={{ state, insights, saveAnswers, setMicroInsight, dayCount }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
