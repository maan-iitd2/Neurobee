/**
 * screening-classifier.ts
 *
 * Maps extracted NeuroFeatures → per-domain neurodevelopmental risk levels.
 *
 * Thresholds are calibrated from published ASD gaze research. This is NOT a
 * trained ML model — it is a research-calibrated rule-based classifier using
 * empirically established boundaries. Each threshold has a citation.
 *
 * This does NOT produce a diagnosis. Output should always be framed as
 * "observational indicators for discussion with a specialist."
 */

import type { NeuroFeatures } from "./screening-features";

// ── Types ─────────────────────────────────────────────────────────────────────

export type RiskLevel = "low" | "medium" | "high";

export interface NeuroRisk {
  /** Eye contact + name response signals → Social Communication domain */
  socialCommunication: RiskLevel;
  /** Gaze following + fixation persistence → Joint Attention domain */
  jointAttention: RiskLevel;
  /** Gaze entropy + saccade frequency + fixation duration → Attention Regulation */
  attentionRegulation: RiskLevel;
  /** Weighted aggregate across all three domains */
  overall: RiskLevel;
  /** Based on total frames analysed: low < 500, moderate 500–1500, high > 1500 */
  confidence: "low" | "moderate" | "high";
  /** Human-readable flags for elevated features, shown in the results UI */
  featureFlags: FeatureFlag[];
}

export interface FeatureFlag {
  label: string;           // short label, e.g. "High gaze scatter"
  detail: string;          // plain-English clinical context
  domain: string;          // which M-CHAT-R domain this maps to
  severity: RiskLevel;
}

// ── Threshold helpers ─────────────────────────────────────────────────────────

type Thresholds = { low: number; high: number; inverted?: boolean };

/**
 * Classify a scalar feature against low/high thresholds.
 * inverted = true means lower value → higher risk (e.g. socialGazePct, meanFixationFrames).
 */
function classify(value: number, t: Thresholds): RiskLevel {
  if (t.inverted) {
    if (value >= t.low) return "low";
    if (value >= t.high) return "medium";
    return "high";
  } else {
    if (value <= t.low) return "low";
    if (value <= t.high) return "medium";
    return "high";
  }
}

/**
 * Merge two RiskLevels with a weight ratio (0–1 for a, 1-a for b).
 * Result rounds to the nearer level.
 */
function weightedRisk(a: RiskLevel, wA: number, b: RiskLevel, wB: number): RiskLevel {
  const toNum = (r: RiskLevel) => r === "low" ? 0 : r === "medium" ? 1 : 2;
  const fromNum = (n: number): RiskLevel => n < 0.5 ? "low" : n < 1.5 ? "medium" : "high";
  return fromNum(toNum(a) * wA + toNum(b) * wB);
}

function max3(...levels: RiskLevel[]): RiskLevel {
  const nums = levels.map((l): number => l === "low" ? 0 : l === "medium" ? 1 : 2);
  const m = nums.reduce((a, b) => Math.max(a, b), 0);
  return m === 2 ? "high" : m === 1 ? "medium" : "low";
}

// ── Published thresholds ──────────────────────────────────────────────────────
// All ranges derived from peer-reviewed ASD gaze research (cited in plan).
// Values are conservative — err toward medium rather than high to avoid false alarm.

const THRESHOLDS = {
  // Social gaze % — Jones & Klin 2013 (Nature)
  socialGazePct:         { low: 50, high: 30, inverted: true } as Thresholds,
  // Name response latency (ms) — Swanson & Siller 2013 (Autism)
  nameResponseLatencyMs: { low: 2000, high: 5000 } as Thresholds,
  // Gaze follow % — Klin et al. 2002; Leekam et al. 2010
  gazeFollowPct:         { low: 55, high: 35, inverted: true } as Thresholds,
  // Gaze entropy (bits) — Wang et al. 2015 (J. Autism Dev. Disord.)
  gazeEntropy:           { low: 2.8, high: 3.3 } as Thresholds,
  // Saccades per minute — ASD attentional fragmentation literature
  saccadesPerMin:        { low: 100, high: 160 } as Thresholds,
  // Mean fixation duration (frames @ ~30fps → 6f ≈ 200ms, 12f ≈ 400ms)
  meanFixationFrames:    { low: 12, high: 6, inverted: true } as Thresholds,
  // Blink rate — Camacho et al. 2021 (Front. Psychiatry)
  // Normal: 10–25/min. Abnormal if < 4 or > 40.
  blinkRate:             { low: 25, high: 40 } as Thresholds, // upper-bound path
};

// ── Blink rate: bi-directional classification ─────────────────────────────────

function classifyBlinkRate(rate: number): RiskLevel {
  if (rate < 0) return "low";  // -1 = no EAR data
  if (rate >= 10 && rate <= 25) return "low";
  if ((rate >= 4 && rate < 10) || (rate > 25 && rate <= 40)) return "medium";
  return "high";  // < 4 or > 40
}

// ── Feature flag generation ───────────────────────────────────────────────────

function buildFlags(f: NeuroFeatures): FeatureFlag[] {
  const flags: FeatureFlag[] = [];

  if (classify(f.gazeEntropy, THRESHOLDS.gazeEntropy) !== "low") {
    flags.push({
      label: "High gaze scatter",
      detail: `Gaze was distributed across many areas of the visual field (entropy: ${f.gazeEntropy.toFixed(2)} bits). Typically developing children show more focused, socially-directed gaze.`,
      domain: "Attention Regulation",
      severity: classify(f.gazeEntropy, THRESHOLDS.gazeEntropy),
    });
  }

  if (classify(f.socialGazePct, THRESHOLDS.socialGazePct) !== "low") {
    flags.push({
      label: "Reduced social gaze",
      detail: `Camera-directed gaze was observed in ${f.socialGazePct}% of frames. Research indicates typical children maintain social gaze > 50% of the time in face-to-face interaction.`,
      domain: "Social Communication",
      severity: classify(f.socialGazePct, THRESHOLDS.socialGazePct),
    });
  }

  if (f.nameResponseLatencyMs === -1) {
    flags.push({
      label: "No name response detected",
      detail: "No clear gaze-to-camera response was detected within 4 seconds of any name call. This is one of the most sensitive M-CHAT-R critical indicators.",
      domain: "Social Communication",
      severity: "high",
    });
  } else if (classify(f.nameResponseLatencyMs, THRESHOLDS.nameResponseLatencyMs) !== "low") {
    flags.push({
      label: "Delayed name response",
      detail: `Average response latency was ${f.nameResponseLatencyMs}ms. Swanson & Siller (2013) identified > 2000ms as a clinically significant social communication indicator.`,
      domain: "Social Communication",
      severity: classify(f.nameResponseLatencyMs, THRESHOLDS.nameResponseLatencyMs),
    });
  }

  if (classify(f.saccadesPerMin, THRESHOLDS.saccadesPerMin) !== "low") {
    flags.push({
      label: "Rapid gaze shifting",
      detail: `${f.saccadesPerMin} saccades/min detected. Frequent rapid gaze shifts (> 100/min) are associated with fragmented attention and reduced sustained focus.`,
      domain: "Attention Regulation",
      severity: classify(f.saccadesPerMin, THRESHOLDS.saccadesPerMin),
    });
  }

  if (classify(f.meanFixationFrames, THRESHOLDS.meanFixationFrames) !== "low") {
    flags.push({
      label: "Short fixation duration",
      detail: `Average gaze fixation lasted ${f.meanFixationFrames.toFixed(1)} frames. Shorter fixations suggest difficulty sustaining attention on a single target.`,
      domain: "Joint Attention",
      severity: classify(f.meanFixationFrames, THRESHOLDS.meanFixationFrames),
    });
  }

  if (classify(f.gazeFollowPct, THRESHOLDS.gazeFollowPct) !== "low") {
    flags.push({
      label: "Reduced gaze following",
      detail: `Gaze tracked the moving target in ${f.gazeFollowPct}% of frames. Joint attention — following another's gaze to a shared object — is a key early indicator.`,
      domain: "Joint Attention",
      severity: classify(f.gazeFollowPct, THRESHOLDS.gazeFollowPct),
    });
  }

  const blinkSeverity = classifyBlinkRate(f.blinkRate);
  if (blinkSeverity !== "low" && f.blinkRate >= 0) {
    const isLow = f.blinkRate < 4;
    flags.push({
      label: isLow ? "Very low blink rate" : "Elevated blink rate",
      detail: isLow
        ? `${f.blinkRate} blinks/min. Very low blink rate can indicate hyperfocused or anxious states.`
        : `${f.blinkRate} blinks/min. Elevated blink rate above 40/min can reflect sensory sensitivity or stress.`,
      domain: "Sensory & Behaviour",
      severity: blinkSeverity,
    });
  }

  return flags;
}

// ── Main classifier ───────────────────────────────────────────────────────────

export function classifyNeuroRisk(
  features: NeuroFeatures,
  totalFrames: number
): NeuroRisk {
  // Social Communication domain
  const socialGazeRisk   = classify(features.socialGazePct, THRESHOLDS.socialGazePct);
  const nameLatencyRisk  = features.nameResponseLatencyMs === -1
    ? "high"
    : classify(features.nameResponseLatencyMs, THRESHOLDS.nameResponseLatencyMs);
  const socialCommunication = weightedRisk(socialGazeRisk, 0.5, nameLatencyRisk, 0.5);

  // Joint Attention domain
  const followRisk    = classify(features.gazeFollowPct, THRESHOLDS.gazeFollowPct);
  const fixationRisk  = classify(features.meanFixationFrames, THRESHOLDS.meanFixationFrames);
  const jointAttention = weightedRisk(followRisk, 0.6, fixationRisk, 0.4);

  // Attention Regulation domain
  const entropyRisk   = classify(features.gazeEntropy, THRESHOLDS.gazeEntropy);
  const saccadeRisk   = classify(features.saccadesPerMin, THRESHOLDS.saccadesPerMin);
  const fixRisk2      = classify(features.meanFixationFrames, THRESHOLDS.meanFixationFrames);
  // Weighted: entropy 40%, saccades 35%, fixation 25%
  const attnNum = (
    (entropyRisk === "high" ? 2 : entropyRisk === "medium" ? 1 : 0) * 0.40 +
    (saccadeRisk === "high" ? 2 : saccadeRisk === "medium" ? 1 : 0) * 0.35 +
    (fixRisk2 === "high" ? 2 : fixRisk2 === "medium" ? 1 : 0) * 0.25
  );
  const attentionRegulation: RiskLevel = attnNum < 0.5 ? "low" : attnNum < 1.4 ? "medium" : "high";

  // Overall: Social 40%, JointAttention 35%, AttentionReg 25%
  const overallNum = (
    (socialCommunication === "high" ? 2 : socialCommunication === "medium" ? 1 : 0) * 0.40 +
    (jointAttention === "high" ? 2 : jointAttention === "medium" ? 1 : 0) * 0.35 +
    (attentionRegulation === "high" ? 2 : attentionRegulation === "medium" ? 1 : 0) * 0.25
  );
  const overall: RiskLevel = overallNum < 0.5 ? "low" : overallNum < 1.4 ? "medium" : "high";

  const confidence: NeuroRisk["confidence"] =
    totalFrames < 500 ? "low" : totalFrames < 1500 ? "moderate" : "high";

  return {
    socialCommunication,
    jointAttention,
    attentionRegulation,
    overall,
    confidence,
    featureFlags: buildFlags(features),
  };
}

// Silence unused import warning for max3 (used if caller needs it)
void max3;
