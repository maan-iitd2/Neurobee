export function getStoredItem<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function setStoredItem(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage might be full or unavailable — fail silently
  }
}

export function removeStoredItem(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(key);
  } catch {
    // fail silently
  }
}

/**
 * Migrates old AppState shape (sessionCount, no sessions[]) to new shape.
 * Safe to call on already-migrated data — detects shape and passes through.
 */
export function migrateAppState(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;

  // Already new shape
  if (Array.isArray(r.sessions)) return r;

  // Old shape: has sessionCount but no sessions array
  // Wrap the existing answers into a synthetic first session
  const oldAnswers = (r.answers as Record<string, string>) ?? {};

  // Import inline to avoid circular deps — we only need the types here
  const hasAnswers = Object.keys(oldAnswers).length > 0;

  return {
    journeyStartDate: (r.journeyStartDate as string) ?? new Date().toISOString().split("T")[0],
    sessions: hasAnswers
      ? [
          {
            id: "migrated_session_0",
            date: (r.journeyStartDate as string) ?? new Date().toISOString().split("T")[0],
            answers: oldAnswers,
            riskScore: { total: 0, criticalFailures: 0, level: "low", percentage: 0 },
            domainScores: [],
          },
        ]
      : [],
    answers: oldAnswers,
    observationAnswers: undefined,
    hasCompletedQuestionnaire: !!(r.hasCompletedQuestionnaire),
    lastMicroInsight: (r.lastMicroInsight as string) ?? "",
    selectedState: undefined,
  };
}
