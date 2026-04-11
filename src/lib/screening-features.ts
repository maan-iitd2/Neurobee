/**
 * screening-features.ts
 *
 * Extracts 7 clinically-validated gaze/attention features from raw GazeFrame
 * sequences collected during the 3 vision-screening tasks.
 *
 * Scientific references:
 *  - gazeEntropy:          Wang et al., J. Autism Dev. Disord. 2015
 *  - socialGazePct:        Jones & Klin, Nature 2013
 *  - saccadesPerMin:       Itti & Koch attentional saliency models; ASD fragmented attention literature
 *  - meanFixationFrames:   Kemner et al., 2007
 *  - blinkRate:            Camacho et al., Front. Psychiatry 2021
 *  - nameResponseLatency:  Swanson & Siller, Autism 2013
 *  - gazeFollowPct:        Klin et al., Nature 2002; Leekam et al., 2010
 */

import type { GazeFrame } from "./gaze";

// ── Output type ───────────────────────────────────────────────────────────────

export interface NeuroFeatures {
  /** Shannon entropy of gaze over 5×5 spatial grid (0–3.22 bits). Higher = more scattered. */
  gazeEntropy: number;
  /** Percentage of frames where child is looking toward camera / social target (0–100). */
  socialGazePct: number;
  /** Rapid gaze shifts (|Δgaze| > 0.3) per minute. Higher = more fragmented attention. */
  saccadesPerMin: number;
  /** Average length of stable-gaze runs in frames (movement < 0.05/frame). Lower = shorter fixations. */
  meanFixationFrames: number;
  /** Blinks per minute from EAR < 0.2. Abnormal if < 4 or > 40. */
  blinkRate: number;
  /** Mean absolute head yaw per frame (0–1). Captures excessive movement. */
  headMovementAmplitude: number;
  /**
   * Average time in ms from name call to first camera-gaze.
   * -1 = no response detected across all calls.
   */
  nameResponseLatencyMs: number;
  /** % of gaze-follow frames where gaze direction matches dot direction (0–100). */
  gazeFollowPct: number;
  /** Total frames analysed across all tasks (used for confidence estimation). */
  totalFramesAnalysed: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const GRID_SIZE = 5;            // 5×5 gaze grid for entropy
const SACCADE_THRESHOLD = 0.3;  // normalised gaze jump to count as saccade
const FIXATION_THRESHOLD = 0.05; // max frame-to-frame gaze movement to stay in fixation
const BLINK_EAR_THRESHOLD = 0.2; // EAR below this = blink frame
const BLINK_MIN_FRAMES = 2;      // min consecutive blink frames to count (avoids noise)

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Map normalised gaze (−1..1) to a 5×5 grid cell index (0..24). */
function gazeToCell(x: number, y: number): number {
  const col = Math.min(GRID_SIZE - 1, Math.floor(((x + 1) / 2) * GRID_SIZE));
  const row = Math.min(GRID_SIZE - 1, Math.floor(((y + 1) / 2) * GRID_SIZE));
  return row * GRID_SIZE + col;
}

/** Shannon entropy in bits: H = −Σ pᵢ log₂(pᵢ). */
function shannonEntropy(counts: number[]): number {
  const total = counts.reduce((s, c) => s + c, 0);
  if (total === 0) return 0;
  return counts.reduce((h, c) => {
    if (c === 0) return h;
    const p = c / total;
    return h - p * Math.log2(p);
  }, 0);
}

// ── Feature: Gaze Entropy ─────────────────────────────────────────────────────

function computeGazeEntropy(frames: GazeFrame[]): number {
  const cells = new Array<number>(GRID_SIZE * GRID_SIZE).fill(0);
  for (const f of frames) {
    if (f.faceDetected) {
      cells[gazeToCell(f.gaze.x, f.gaze.y)]++;
    }
  }
  return shannonEntropy(cells);
}

// ── Feature: Social Gaze % ────────────────────────────────────────────────────

function computeSocialGazePct(frames: GazeFrame[]): number {
  const detected = frames.filter((f) => f.faceDetected);
  if (detected.length === 0) return 0;
  const looking = detected.filter((f) => f.lookingAtCamera).length;
  return Math.round((looking / detected.length) * 100);
}

// ── Feature: Saccades Per Minute ─────────────────────────────────────────────

function computeSaccadesPerMin(frames: GazeFrame[], fps: number): number {
  if (frames.length < 2) return 0;
  let saccades = 0;
  for (let i = 1; i < frames.length; i++) {
    if (!frames[i].faceDetected || !frames[i - 1].faceDetected) continue;
    const dx = frames[i].gaze.x - frames[i - 1].gaze.x;
    const dy = frames[i].gaze.y - frames[i - 1].gaze.y;
    if (Math.sqrt(dx * dx + dy * dy) > SACCADE_THRESHOLD) saccades++;
  }
  const minutes = frames.length / fps / 60;
  return minutes > 0 ? Math.round(saccades / minutes) : 0;
}

// ── Feature: Mean Fixation Duration ──────────────────────────────────────────

function computeMeanFixationFrames(frames: GazeFrame[]): number {
  const runLengths: number[] = [];
  let currentRun = 0;

  for (let i = 1; i < frames.length; i++) {
    if (!frames[i].faceDetected || !frames[i - 1].faceDetected) {
      if (currentRun > 0) runLengths.push(currentRun);
      currentRun = 0;
      continue;
    }
    const dx = frames[i].gaze.x - frames[i - 1].gaze.x;
    const dy = frames[i].gaze.y - frames[i - 1].gaze.y;
    if (Math.sqrt(dx * dx + dy * dy) < FIXATION_THRESHOLD) {
      currentRun++;
    } else {
      if (currentRun > 0) runLengths.push(currentRun);
      currentRun = 0;
    }
  }
  if (currentRun > 0) runLengths.push(currentRun);

  if (runLengths.length === 0) return 0;
  return runLengths.reduce((s, r) => s + r, 0) / runLengths.length;
}

// ── Feature: Blink Rate ───────────────────────────────────────────────────────

function computeBlinkRate(frames: GazeFrame[], fps: number): number {
  if (fps === 0) return 0;
  let blinks = 0;
  let blinkFrames = 0;

  for (const f of frames) {
    const ear = f.leftEAR >= 0 && f.rightEAR >= 0
      ? (f.leftEAR + f.rightEAR) / 2
      : f.leftEAR >= 0 ? f.leftEAR : f.rightEAR;
    if (ear < 0) {
      // EAR unavailable — treat as end of blink
      if (blinkFrames >= BLINK_MIN_FRAMES) blinks++;
      blinkFrames = 0;
      continue;
    }
    if (ear < BLINK_EAR_THRESHOLD) {
      blinkFrames++;
    } else {
      if (blinkFrames >= BLINK_MIN_FRAMES) blinks++;
      blinkFrames = 0;
    }
  }
  if (blinkFrames >= BLINK_MIN_FRAMES) blinks++;

  const minutes = frames.length / fps / 60;
  return minutes > 0 ? Math.round(blinks / minutes) : 0;
}

// ── Feature: Head Movement Amplitude ─────────────────────────────────────────

function computeHeadMovementAmplitude(frames: GazeFrame[]): number {
  const detected = frames.filter((f) => f.faceDetected);
  if (detected.length === 0) return 0;
  const sumAbs = detected.reduce((s, f) => s + Math.abs(f.headTurn), 0);
  return parseFloat((sumAbs / detected.length).toFixed(3));
}

// ── Feature: Name Response Latency ───────────────────────────────────────────

function computeNameResponseLatency(
  frames: GazeFrame[],
  nameCallTimestampsMs: number[],
  fps: number
): number {
  if (nameCallTimestampsMs.length === 0 || fps === 0) return -1;

  const latencies: number[] = [];
  const responseWindowMs = 4000; // 4-second window after each name call

  for (const callMs of nameCallTimestampsMs) {
    const callFrame = Math.floor((callMs / 1000) * fps);
    const windowEnd = Math.floor(((callMs + responseWindowMs) / 1000) * fps);

    for (let i = callFrame; i < Math.min(windowEnd, frames.length); i++) {
      if (frames[i]?.lookingAtCamera) {
        const latencyMs = Math.round(((i - callFrame) / fps) * 1000);
        latencies.push(latencyMs);
        break;
      }
    }
    // If no response detected within window, this call counts as a miss (not added to latencies)
  }

  if (latencies.length === 0) return -1;
  return Math.round(latencies.reduce((s, l) => s + l, 0) / latencies.length);
}

// ── Feature: Gaze Follow % ───────────────────────────────────────────────────

function computeGazeFollowPct(
  frames: GazeFrame[],
  dotXSequence: number[]  // dot x% (0–100) at each frame
): number {
  const len = Math.min(frames.length, dotXSequence.length);
  if (len === 0) return 0;

  let hits = 0;
  let total = 0;

  for (let i = 0; i < len; i++) {
    if (!frames[i].faceDetected) continue;
    total++;
    const dotNorm = (dotXSequence[i] - 50) / 50; // −1..+1
    // Camera is mirrored → invert gaze.x: child looking right = gaze.x negative in mirrored view
    if (dotNorm * -frames[i].gaze.x > 0.1) hits++;
  }

  return total > 0 ? Math.round((hits / total) * 100) : 0;
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Extract all neuro features from the raw frame sequences of the 3 tasks.
 *
 * @param eyeContactFrames     Frames from Task 1 (Eye Contact)
 * @param nameResponseFrames   Frames from Task 2 (Name Response)
 * @param nameCallTimestampsMs Elapsed-ms timestamps when name was spoken during Task 2
 * @param gazeFollowFrames     Frames from Task 3 (Gaze Following)
 * @param dotXSequence         dot x% value at each gaze-follow frame
 * @param fps                  Estimated frames-per-second of the camera feed
 */
export function extractFeatures(
  eyeContactFrames: GazeFrame[],
  nameResponseFrames: GazeFrame[],
  nameCallTimestampsMs: number[],
  gazeFollowFrames: GazeFrame[],
  dotXSequence: number[],
  fps: number
): NeuroFeatures {
  // Use all frames for entropy and general stats (broader sample)
  const allFrames = [...eyeContactFrames, ...nameResponseFrames, ...gazeFollowFrames];

  return {
    gazeEntropy:           computeGazeEntropy(allFrames),
    socialGazePct:         computeSocialGazePct(eyeContactFrames),
    saccadesPerMin:        computeSaccadesPerMin(allFrames, fps),
    meanFixationFrames:    computeMeanFixationFrames(allFrames),
    blinkRate:             computeBlinkRate(allFrames, fps),
    headMovementAmplitude: computeHeadMovementAmplitude(allFrames),
    nameResponseLatencyMs: computeNameResponseLatency(nameResponseFrames, nameCallTimestampsMs, fps),
    gazeFollowPct:         computeGazeFollowPct(gazeFollowFrames, dotXSequence),
    totalFramesAnalysed:   allFrames.filter((f) => f.faceDetected).length,
  };
}
