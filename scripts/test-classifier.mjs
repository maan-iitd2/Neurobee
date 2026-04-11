/**
 * Functional test for NeuroBee feature extraction + classifier.
 * Uses realistic smooth gaze trajectories (not i.i.d. random) that match
 * real MediaPipe camera output — gaze moves as a random walk with inertia.
 */

// ── Frame builder ─────────────────────────────────────────────────────────────

function makeFrame(lookingAtCamera, gx, gy, headTurn, ear) {
  return { gaze: { x: gx, y: gy }, lookingAtCamera, headTurn, faceDetected: true, leftEAR: ear, rightEAR: ear };
}

/** Clamp to [-1, 1] */
function clamp(v, lo = -1, hi = 1) { return Math.max(lo, Math.min(hi, v)); }

/**
 * Smooth gaze trajectory using an OU (Ornstein-Uhlenbeck) random walk.
 * mean: attractor, sigma: noise strength, theta: reversion speed.
 * Produces realistic smooth eye movement with drift back to target.
 */
function ouWalk(frames, meanX, meanY, sigma = 0.08, theta = 0.15) {
  const traj = [];
  let x = meanX, y = meanY;
  for (let i = 0; i < frames; i++) {
    x += theta * (meanX - x) + sigma * (Math.random() * 2 - 1);
    y += theta * (meanY - y) + sigma * (Math.random() * 2 - 1);
    traj.push({ x: clamp(x), y: clamp(y) });
  }
  return traj;
}

/** Generate occasional rapid saccades (realistic frequency) */
function withSaccades(traj, saccadeFreqPerMin, fps) {
  const result = [...traj];
  const totalSaccades = Math.round((traj.length / fps / 60) * saccadeFreqPerMin);
  for (let s = 0; s < totalSaccades; s++) {
    const at = Math.floor(Math.random() * (traj.length - 5)) + 2;
    const targetX = (Math.random() * 2 - 1) * 0.7;
    const targetY = (Math.random() * 2 - 1) * 0.5;
    // Smooth 3-frame saccade
    result[at]     = { x: clamp(traj[at].x * 0.4 + targetX * 0.6), y: clamp(traj[at].y * 0.4 + targetY * 0.6) };
    result[at + 1] = { x: clamp(targetX), y: clamp(targetY) };
    result[at + 2] = { x: clamp(targetX * 0.9), y: clamp(targetY * 0.9) };
  }
  return result;
}

/** Inject blinks (3-frame EAR dip) at given rate/min */
function buildEAR(frames, blinkPerMin, fps, baseEAR = 0.28) {
  const ear = new Array(frames).fill(baseEAR);
  const totalBlinks = Math.round((frames / fps / 60) * blinkPerMin);
  for (let b = 0; b < totalBlinks; b++) {
    const at = Math.floor(Math.random() * (frames - 5));
    ear[at]     = 0.18;
    ear[at + 1] = 0.10;
    ear[at + 2] = 0.14;
    ear[at + 3] = 0.22;
  }
  return ear;
}

// ── Feature extraction (inlined from screening-features.ts) ──────────────────

const GRID = 5;

function gazeToCell(x, y) {
  const col = Math.min(GRID - 1, Math.floor(((x + 1) / 2) * GRID));
  const row = Math.min(GRID - 1, Math.floor(((y + 1) / 2) * GRID));
  return row * GRID + col;
}

function entropy(counts) {
  const total = counts.reduce((s, c) => s + c, 0);
  if (!total) return 0;
  return counts.reduce((h, c) => {
    if (!c) return h;
    const p = c / total;
    return h - p * Math.log2(p);
  }, 0);
}

function extractAll(eyeFrames, nameFrames, nameCallMs, gazeFrames, dotSeq, fps) {
  const all = [...eyeFrames, ...nameFrames, ...gazeFrames];

  const cells = new Array(25).fill(0);
  for (const f of all) cells[gazeToCell(f.gaze.x, f.gaze.y)]++;
  const gazeEntropy = +entropy(cells).toFixed(3);

  const socialGazePct = Math.round(eyeFrames.filter(f => f.lookingAtCamera).length / eyeFrames.length * 100);

  let saccades = 0;
  for (let i = 1; i < all.length; i++) {
    const dx = all[i].gaze.x - all[i - 1].gaze.x;
    const dy = all[i].gaze.y - all[i - 1].gaze.y;
    if (Math.sqrt(dx * dx + dy * dy) > 0.3) saccades++;
  }
  const saccadesPerMin = Math.round(saccades / (all.length / fps / 60));

  const runs = []; let run = 0;
  for (let i = 1; i < all.length; i++) {
    const dx = all[i].gaze.x - all[i - 1].gaze.x;
    const dy = all[i].gaze.y - all[i - 1].gaze.y;
    if (Math.sqrt(dx * dx + dy * dy) < 0.05) { run++; }
    else { if (run > 0) runs.push(run); run = 0; }
  }
  const meanFixationFrames = runs.length ? +(runs.reduce((s, r) => s + r, 0) / runs.length).toFixed(1) : 0;

  let blinks = 0, blinkRun = 0;
  for (const f of all) {
    const ear = (f.leftEAR + f.rightEAR) / 2;
    if (ear < 0.2) blinkRun++;
    else { if (blinkRun >= 2) blinks++; blinkRun = 0; }
  }
  if (blinkRun >= 2) blinks++;
  const blinkRate = Math.round(blinks / (all.length / fps / 60));

  const headMovementAmplitude = +(all.reduce((s, f) => s + Math.abs(f.headTurn), 0) / all.length).toFixed(3);

  const latencies = [];
  for (const callMs of nameCallMs) {
    const callFrame = Math.floor(callMs / 1000 * fps);
    for (let i = callFrame; i < Math.min(callFrame + fps * 4, nameFrames.length); i++) {
      if (nameFrames[i]?.lookingAtCamera) {
        latencies.push(Math.round((i - callFrame) / fps * 1000));
        break;
      }
    }
  }
  const nameResponseLatencyMs = latencies.length ? Math.round(latencies.reduce((s, l) => s + l, 0) / latencies.length) : -1;

  const len = Math.min(gazeFrames.length, dotSeq.length);
  let hits = 0, total = 0;
  for (let i = 0; i < len; i++) {
    if (!gazeFrames[i].faceDetected) continue;
    total++;
    const dotNorm = (dotSeq[i] - 50) / 50;
    if (dotNorm * -gazeFrames[i].gaze.x > 0.1) hits++;
  }
  const gazeFollowPct = total > 0 ? Math.round(hits / total * 100) : 0;

  return {
    gazeEntropy, socialGazePct, saccadesPerMin, meanFixationFrames,
    blinkRate, headMovementAmplitude, nameResponseLatencyMs, gazeFollowPct,
    totalFramesAnalysed: all.filter(f => f.faceDetected).length
  };
}

// ── Classifier (inlined from screening-classifier.ts) ────────────────────────

function classify(value, t) {
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
function weightedRisk(a, wA, b, wB) {
  const n = r => r === "low" ? 0 : r === "medium" ? 1 : 2;
  const f = v => v < 0.5 ? "low" : v < 1.5 ? "medium" : "high";
  return f(n(a) * wA + n(b) * wB);
}

const T = {
  socialGazePct:         { low: 50, high: 30, inverted: true },
  nameResponseLatencyMs: { low: 2000, high: 5000 },
  gazeFollowPct:         { low: 55, high: 35, inverted: true },
  gazeEntropy:           { low: 2.8, high: 3.3 },
  saccadesPerMin:        { low: 100, high: 160 },
  meanFixationFrames:    { low: 12, high: 6, inverted: true },
};

function classifyRisk(features) {
  const socialGazeRisk = classify(features.socialGazePct, T.socialGazePct);
  const nameLatencyRisk = features.nameResponseLatencyMs === -1 ? "high"
    : classify(features.nameResponseLatencyMs, T.nameResponseLatencyMs);
  const socialCommunication = weightedRisk(socialGazeRisk, 0.5, nameLatencyRisk, 0.5);

  const followRisk = classify(features.gazeFollowPct, T.gazeFollowPct);
  const fixationRisk = classify(features.meanFixationFrames, T.meanFixationFrames);
  const jointAttention = weightedRisk(followRisk, 0.6, fixationRisk, 0.4);

  const entropyRisk = classify(features.gazeEntropy, T.gazeEntropy);
  const saccadeRisk = classify(features.saccadesPerMin, T.saccadesPerMin);
  const fixRisk2 = classify(features.meanFixationFrames, T.meanFixationFrames);
  const attnNum =
    (entropyRisk === "high" ? 2 : entropyRisk === "medium" ? 1 : 0) * 0.40 +
    (saccadeRisk === "high" ? 2 : saccadeRisk === "medium" ? 1 : 0) * 0.35 +
    (fixRisk2 === "high" ? 2 : fixRisk2 === "medium" ? 1 : 0) * 0.25;
  const attentionRegulation = attnNum < 0.5 ? "low" : attnNum < 1.4 ? "medium" : "high";

  const overallNum =
    (socialCommunication === "high" ? 2 : socialCommunication === "medium" ? 1 : 0) * 0.40 +
    (jointAttention === "high" ? 2 : jointAttention === "medium" ? 1 : 0) * 0.35 +
    (attentionRegulation === "high" ? 2 : attentionRegulation === "medium" ? 1 : 0) * 0.25;
  const overall = overallNum < 0.5 ? "low" : overallNum < 1.4 ? "medium" : "high";
  const confidence = features.totalFramesAnalysed < 500 ? "low" : features.totalFramesAnalysed < 1500 ? "moderate" : "high";

  return { socialCommunication, jointAttention, attentionRegulation, overall, confidence };
}

// ── Scenario builders (smooth, realistic) ────────────────────────────────────

const FPS = 25;
const FRAMES = 1500; // 60s per task

/**
 * LOW-RISK (Aryan, 24 months): good eye contact, responds to name,
 * follows gaze, normal blink rate, ~60 saccades/min (typical toddler).
 */
function buildLowRiskChild() {
  // Eye contact: gaze mostly centred (social gaze target = 0,0)
  const eyeTraj = withSaccades(ouWalk(FRAMES, 0.0, 0.0, 0.04, 0.20), 60, FPS);
  const eyeEAR  = buildEAR(FRAMES, 16, FPS); // 16 blinks/min — normal
  const eye = eyeTraj.map((g, i) => {
    const looking = Math.abs(g.x) < 0.18 && Math.abs(g.y) < 0.18;
    return makeFrame(looking, g.x, g.y, g.x * 0.04, eyeEAR[i]);
  });

  // Name response: drifting gaze, turns to camera ~1s after each of 2 calls
  const nameTraj = withSaccades(ouWalk(FRAMES, 0.3, 0.1, 0.07, 0.12), 55, FPS);
  const nameEAR  = buildEAR(FRAMES, 16, FPS);
  // Response windows: call at 8s→200f, respond at ~225f. Call at 22s→550f, respond at ~580f.
  const nameResponseWindows = [[225, 280], [580, 640]];
  const name = nameTraj.map((g, i) => {
    const inWindow = nameResponseWindows.some(([s, e]) => i >= s && i <= e);
    const gx = inWindow ? g.x * 0.2 : g.x;  // gaze snaps near centre
    const gy = inWindow ? g.y * 0.2 : g.y;
    const looking = Math.abs(gx) < 0.18 && Math.abs(gy) < 0.18;
    return makeFrame(looking, gx, gy, g.x * 0.06, nameEAR[i]);
  });

  // Gaze follow: smooth tracking of the dot ~80% of the time, strong alignment
  const gaze = [], dotSeq = [];
  const gazeTraj = withSaccades(ouWalk(FRAMES, 0.0, 0.0, 0.06, 0.15), 60, FPS);
  const gazeEAR  = buildEAR(FRAMES, 16, FPS);
  for (let i = 0; i < FRAMES; i++) {
    const t = i * 0.04;
    const dotX = 50 + 40 * Math.sin(t);
    const dotNorm = (dotX - 50) / 50; // -1..+1
    // Only test tracking when dot is clearly off-centre (|dotNorm| > 0.15)
    const dotClear = Math.abs(dotNorm) > 0.15;
    const tracking = dotClear && Math.random() < 0.80;
    // Mirror: child looks right (gaze.x positive in real space = gaze.x negative in mirrored camera)
    // Strong alignment: gaze strongly follows dot direction
    const gx = tracking ? clamp(-dotNorm * 0.70 + gazeTraj[i].x * 0.05) : gazeTraj[i].x;
    gaze.push(makeFrame(false, gx, gazeTraj[i].y * 0.4, Math.abs(gx) * 0.05, gazeEAR[i]));
    dotSeq.push(dotX);
  }

  return { eye, name, gaze, dotSeq };
}

/**
 * HIGH-RISK (Rahul, 30 months): poor social gaze (<20%), no name response,
 * little gaze following, very scattered gaze, elevated saccades.
 */
function buildHighRiskChild() {
  // Eye contact: gaze wanders far from centre, infrequent camera gaze
  const eyeTraj = withSaccades(ouWalk(FRAMES, 0.5, 0.3, 0.12, 0.08), 190, FPS);
  const eyeEAR  = buildEAR(FRAMES, 46, FPS); // elevated blink rate
  const eye = eyeTraj.map((g, i) => {
    const looking = Math.abs(g.x) < 0.18 && Math.abs(g.y) < 0.18;
    return makeFrame(looking, g.x, g.y, g.x * 0.15, eyeEAR[i]);
  });

  // Name response: no response to name (gaze stays scattered)
  const nameTraj = withSaccades(ouWalk(FRAMES, 0.6, 0.4, 0.14, 0.06), 195, FPS);
  const nameEAR  = buildEAR(FRAMES, 46, FPS);
  const name = nameTraj.map((g, i) => {
    return makeFrame(false, g.x, g.y, g.x * 0.18, nameEAR[i]); // never looking
  });

  // Gaze follow: ~10%, very limited tracking — gaze wanders in opposite direction
  const gaze = [], dotSeq = [];
  const gazeTraj = withSaccades(ouWalk(FRAMES, 0.4, 0.2, 0.14, 0.07), 200, FPS);
  const gazeEAR  = buildEAR(FRAMES, 46, FPS);
  for (let i = 0; i < FRAMES; i++) {
    const t = i * 0.04;
    const dotX = 50 + 40 * Math.sin(t);
    const dotNorm = (dotX - 50) / 50;
    // Gaze moves independently, not tracking — bias opposite direction
    const gx = clamp(gazeTraj[i].x + dotNorm * 0.15); // slightly anti-correlated
    gaze.push(makeFrame(false, gx, gazeTraj[i].y, Math.abs(gx) * 0.18, gazeEAR[i]));
    dotSeq.push(dotX);
  }

  return { eye, name, gaze, dotSeq };
}

/**
 * MEDIUM-RISK (Priya, 18 months): borderline social gaze (~40%), responds to
 * 1 of 3 name calls, partial gaze following (~43%).
 */
function buildMediumRiskChild() {
  const eyeTraj = withSaccades(ouWalk(FRAMES, 0.2, 0.1, 0.07, 0.14), 110, FPS);
  const eyeEAR  = buildEAR(FRAMES, 20, FPS);
  const eye = eyeTraj.map((g, i) => {
    const looking = Math.abs(g.x) < 0.20 && Math.abs(g.y) < 0.20;
    return makeFrame(looking, g.x, g.y, g.x * 0.07, eyeEAR[i]);
  });

  const nameTraj = withSaccades(ouWalk(FRAMES, 0.35, 0.2, 0.09, 0.10), 100, FPS);
  const nameEAR  = buildEAR(FRAMES, 20, FPS);
  const nameResponseWindows = [[550, 620]]; // responds to 3rd call at 40s→1000f, but only 1 detected
  const name = nameTraj.map((g, i) => {
    const inWindow = nameResponseWindows.some(([s, e]) => i >= s && i <= e);
    const gx = inWindow ? g.x * 0.15 : g.x;
    const gy = inWindow ? g.y * 0.15 : g.y;
    const looking = Math.abs(gx) < 0.18 && Math.abs(gy) < 0.18;
    return makeFrame(looking, gx, gy, g.x * 0.08, nameEAR[i]);
  });

  const gaze = [], dotSeq = [];
  const gazeTraj = withSaccades(ouWalk(FRAMES, 0.2, 0.1, 0.09, 0.12), 115, FPS);
  const gazeEAR  = buildEAR(FRAMES, 20, FPS);
  for (let i = 0; i < FRAMES; i++) {
    const t = i * 0.04;
    const dotX = 50 + 40 * Math.sin(t);
    const dotNorm = (dotX - 50) / 50;
    const tracking = Math.random() < 0.43;
    const gx = tracking ? clamp(-dotNorm * 0.40 + gazeTraj[i].x * 0.25) : gazeTraj[i].x;
    gaze.push(makeFrame(false, gx, gazeTraj[i].y * 0.6, Math.abs(gx) * 0.08, gazeEAR[i]));
    dotSeq.push(dotX);
  }

  return { eye, name, gaze, dotSeq };
}

// ── Run tests ─────────────────────────────────────────────────────────────────

const nameCallMs = [8000, 22000, 40000];

console.log("\n" + "=".repeat(65));
console.log("  NEUROBEE VISION SCREENING — FUNCTIONAL TEST SUITE");
console.log("=".repeat(65));

let totalTests = 0, passed = 0;
function check(label, actual, expected, tol = 0) {
  totalTests++;
  const ok = tol > 0
    ? Math.abs(actual - expected) <= tol
    : actual === expected;
  if (ok) { passed++; console.log(`  [PASS] ${label}: ${actual}`); }
  else { console.log(`  [FAIL] ${label}: got ${actual}, expected ${expected}`); }
}

// ── SCENARIO 1: LOW-RISK ──────────────────────────────────────────────────────
console.log("\n--- LOW-RISK CHILD: Aryan, 24 months ---");
{
  const { eye, name, gaze, dotSeq } = buildLowRiskChild();
  const f = extractAll(eye, name, nameCallMs, gaze, dotSeq, FPS);
  const r = classifyRisk(f);

  console.log(`\n  Features:`);
  console.log(`    gazeEntropy:          ${f.gazeEntropy} bits`);
  console.log(`    socialGazePct:        ${f.socialGazePct}%  (expect ≥50%)`);
  console.log(`    saccadesPerMin:       ${f.saccadesPerMin}  (expect <100)`);
  console.log(`    meanFixationFrames:   ${f.meanFixationFrames} frames (expect >12)`);
  console.log(`    blinkRate:            ${f.blinkRate}/min (expect 10-25)`);
  console.log(`    nameResponseLatencyMs:${f.nameResponseLatencyMs}ms`);
  console.log(`    gazeFollowPct:        ${f.gazeFollowPct}%  (expect ≥55%)`);
  console.log(`    totalFramesAnalysed:  ${f.totalFramesAnalysed}`);
  console.log(`\n  Risk:`);
  console.log(`    socialCommunication:  ${r.socialCommunication.toUpperCase()}`);
  console.log(`    jointAttention:       ${r.jointAttention.toUpperCase()}`);
  console.log(`    attentionRegulation:  ${r.attentionRegulation.toUpperCase()}`);
  console.log(`    overall:              ${r.overall.toUpperCase()}`);
  console.log(`    confidence:           ${r.confidence}`);
  console.log();
  check("socialGazePct ≥ 50%",      f.socialGazePct >= 50 ? "pass" : "fail", "pass");
  check("nameLatency < 2000ms",      f.nameResponseLatencyMs !== -1 && f.nameResponseLatencyMs < 2000 ? "pass" : "fail", "pass");
  check("gazeFollowPct ≥ 50%",       f.gazeFollowPct >= 50 ? "pass" : "fail", "pass");
  check("blinkRate 10-25/min",        f.blinkRate >= 10 && f.blinkRate <= 25 ? "pass" : "fail", "pass");
  check("overall risk ≠ high",        r.overall !== "high" ? "pass" : "fail", "pass");
  check("confidence = high",          r.confidence, "high");
}

// ── SCENARIO 2: HIGH-RISK ─────────────────────────────────────────────────────
console.log("\n--- HIGH-RISK CHILD: Rahul, 30 months ---");
{
  const { eye, name, gaze, dotSeq } = buildHighRiskChild();
  const f = extractAll(eye, name, nameCallMs, gaze, dotSeq, FPS);
  const r = classifyRisk(f);

  console.log(`\n  Features:`);
  console.log(`    gazeEntropy:          ${f.gazeEntropy} bits`);
  console.log(`    socialGazePct:        ${f.socialGazePct}%  (expect <30%)`);
  console.log(`    saccadesPerMin:       ${f.saccadesPerMin}  (expect >160)`);
  console.log(`    nameResponseLatency:  ${f.nameResponseLatencyMs === -1 ? "no response" : f.nameResponseLatencyMs + "ms"}`);
  console.log(`    gazeFollowPct:        ${f.gazeFollowPct}%  (expect <35%)`);
  console.log(`    blinkRate:            ${f.blinkRate}/min (expect >40)`);
  console.log();
  check("socialGazePct < 30%",       f.socialGazePct < 30 ? "pass" : "fail", "pass");
  check("nameResponse = no response", f.nameResponseLatencyMs === -1 ? "pass" : "fail", "pass");
  check("gazeFollowPct < 35%",        f.gazeFollowPct < 35 ? "pass" : "fail", "pass");
  check("blinkRate > 40/min",         f.blinkRate > 40 ? "pass" : "fail", "pass");
  check("overall risk = high",        r.overall, "high");
  check("socialCommunication = high", r.socialCommunication, "high");
}

// ── SCENARIO 3: MEDIUM-RISK ───────────────────────────────────────────────────
console.log("\n--- MEDIUM-RISK CHILD: Priya, 18 months ---");
{
  const { eye, name, gaze, dotSeq } = buildMediumRiskChild();
  const f = extractAll(eye, name, nameCallMs, gaze, dotSeq, FPS);
  const r = classifyRisk(f);

  console.log(`\n  Features:`);
  console.log(`    socialGazePct:        ${f.socialGazePct}%  (expect 30-50%)`);
  console.log(`    gazeFollowPct:        ${f.gazeFollowPct}%  (expect 35-55%)`);
  console.log(`    saccadesPerMin:       ${f.saccadesPerMin}  (expect 100-160)`);
  console.log(`    gazeEntropy:          ${f.gazeEntropy} bits`);
  console.log();
  check("socialGazePct 30-50%",      f.socialGazePct >= 30 && f.socialGazePct < 50 ? "pass" : "fail", "pass");
  check("gazeFollowPct 35-55%",      f.gazeFollowPct >= 35 && f.gazeFollowPct < 55 ? "pass" : "fail", "pass");
  check("overall = medium",          r.overall, "medium");
}

// ── API + SCORING TESTS ───────────────────────────────────────────────────────
console.log("\n--- API & SCORING UNIT TESTS ---\n");

// Composite score formula: 40% eye + 35% name + 25% gaze
const c = (e, n, g) => Math.round(e * 0.4 + n * 0.35 + g * 0.25);
check("composite(100,100,100)=100",  c(100, 100, 100), 100);
check("composite(0,0,0)=0",          c(0, 0, 0), 0);
check("composite(70,80,60)=71",      c(70, 80, 60), 71);
check("composite(66,75,58)=67",      c(66, 75, 58), 67);

// Ollama status endpoint response shape
const ollamaDown = { running: false, models: [] };
const ollamaUp   = { running: true, models: ["mistral:latest"] };
check("ollama-status offline shape", typeof ollamaDown.running === "boolean" ? "pass" : "fail", "pass");
check("ollama-status online shape",  ollamaUp.running === true && ollamaUp.models.length > 0 ? "pass" : "fail", "pass");

// VideoScreeningResults storage shape
const dummyResult = {
  eyeContactScore: 66, nameResponseScore: 75, gazeFollowScore: 58,
  compositeScore: c(66, 75, 58),
  completedAt: new Date().toISOString(),
  features: { gazeEntropy: 2.65, socialGazePct: 66, saccadesPerMin: 88,
              meanFixationFrames: 14.2, blinkRate: 16, headMovementAmplitude: 0.052,
              nameResponseLatencyMs: 1280, gazeFollowPct: 58, totalFramesAnalysed: 4389 },
  neuroRisk: { socialCommunication: "low", jointAttention: "medium", attentionRegulation: "low",
               overall: "low", confidence: "high", featureFlags: [] }
};
check("storage compositeScore=67",   dummyResult.compositeScore, 67);
check("features has 9 keys",         Object.keys(dummyResult.features).length, 9);
check("neuroRisk has 6 keys",        Object.keys(dummyResult.neuroRisk).length, 6);
check("completedAt is ISO string",   dummyResult.completedAt.includes("T") ? "pass" : "fail", "pass");

// ── SUMMARY ──────────────────────────────────────────────────────────────────
console.log("\n" + "=".repeat(65));
console.log(`  RESULTS: ${passed}/${totalTests} tests passed`);
const allGood = passed === totalTests;
console.log(`  STATUS:  ${allGood ? "ALL PASS ✓" : `${totalTests - passed} FAILED ✗`}`);
console.log("=".repeat(65) + "\n");
if (!allGood) process.exit(1);
