/**
 * Multi-modal score fusion for NeuroBee.
 *
 * Combines M-CHAT-R questionnaire risk score with parent observation score
 * into a single fused risk assessment.
 *
 * Weighting rationale (Wall Lab multi-modular AI research, Scientific Reports 2020):
 *   Combined questionnaire + observation outperforms either alone by AUC +0.35.
 *   M-CHAT-R is the validated clinical instrument → higher weight.
 *   Observation adds behavioural context not captured by parent recall alone.
 *
 * Weights: M-CHAT-R 60%, Observation 40%
 * Thresholds are set more conservatively than M-CHAT-R alone to reduce
 * false negatives when a parent may under-report concerns on questionnaire.
 */

import { computeRiskScore } from "./questions";
import { computeObservationScore } from "./observations";
import { FusedScore } from "./sessions";

const MCHAT_WEIGHT = 0.60;
const OBS_WEIGHT   = 0.40;

// More conservative than M-CHAT-R standalone thresholds
const LOW_THRESHOLD  = 30; // fusedPct ≤ 30 = low risk
const HIGH_THRESHOLD = 55; // fusedPct ≥ 55 = high risk

export function computeFusedRisk(
  mchatAnswers: Record<string, string>,
  observationAnswers: Record<string, boolean>
): FusedScore {
  const mchat = computeRiskScore(mchatAnswers);
  const obsResult = computeObservationScore(observationAnswers);

  // M-CHAT-R percentage = risk (higher = more concern)
  const mchatPct = mchat.percentage;

  // Observation score = positive behaviours (higher = healthier)
  // Invert so that lower observation score = higher fused risk
  const obsRiskPct = 100 - obsResult.score;

  const fusedPct = Math.round(mchatPct * MCHAT_WEIGHT + obsRiskPct * OBS_WEIGHT);

  let level: FusedScore["level"];
  if (fusedPct <= LOW_THRESHOLD) level = "low";
  else if (fusedPct >= HIGH_THRESHOLD) level = "high";
  else level = "medium";

  return {
    mchatPercentage: mchatPct,
    observationScore: obsResult.score,
    fusedPercentage: fusedPct,
    level,
  };
}
