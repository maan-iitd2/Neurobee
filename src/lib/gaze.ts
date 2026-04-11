/**
 * gaze.ts — MediaPipe FaceLandmarker v2 wrapper for NeuroBee vision screening.
 *
 * Model: public/mediapipe/face_landmarker.task (3.6 MB — float16 v2 with blendshapes)
 *
 * What's inside the .task archive:
 *   face_detector.tflite              224 KB  — BlazeFace short-range detector
 *   face_landmarks_detector.tflite    2.5 MB  — 478-point mesh predictor (float16)
 *   face_blendshapes.tflite           932 KB  — 52 expression coefficients
 *   geometry_pipeline_metadata.pb      18 KB  — 3-D geometry metadata
 *
 * The v2 float16 model is smaller than the old v1 float32 (~30 MB) while
 * being MORE capable: it adds blendshapes and refined iris tracking.
 * All 478 landmarks are present including iris (indices 468–477).
 *
 * WASM runtime: served from public/mediapipe/wasm/ (postinstall copies it).
 * Model file:   served from public/mediapipe/face_landmarker.task (local, offline).
 *
 * Landmark indices (same as MediaPipe canonical):
 *   0–467   face mesh
 *   468–472 left iris  (centre = 468)
 *   473–477 right iris (centre = 473)
 *
 *   EAR landmarks:
 *     Left:  upper=159, lower=145, outer=33,  inner=133
 *     Right: upper=386, lower=374, outer=263, inner=362
 *
 *   Head-pose references:
 *     Nose tip=1,  Left cheek=234,  Right cheek=454
 */

import {
  FaceLandmarker,
  FilesetResolver,
  type NormalizedLandmark,
} from "@mediapipe/tasks-vision";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface GazeVector {
  /** –1 = looking hard left, 0 = centre (camera), +1 = looking hard right */
  x: number;
  /** –1 = looking up, 0 = centre, +1 = looking down */
  y: number;
}

export interface GazeFrame {
  gaze: GazeVector;
  /** true when iris is centred enough to count as looking at camera */
  lookingAtCamera: boolean;
  /** head yaw proxy: –1 = turned left, 0 = forward, +1 = turned right */
  headTurn: number;
  faceDetected: boolean;
  /** Eye Aspect Ratio — left eye (<0.2 = blink). –1 if unavailable. */
  leftEAR: number;
  /** Eye Aspect Ratio — right eye (<0.2 = blink). –1 if unavailable. */
  rightEAR: number;
}

// ── Singleton ─────────────────────────────────────────────────────────────────

let _landmarker: FaceLandmarker | null = null;
let _initPromise: Promise<void> | null = null;

// ── Init / dispose ────────────────────────────────────────────────────────────

/**
 * Initialise the FaceLandmarker from the locally-served v2 model.
 * WASM runtime is also served locally — no internet required.
 * Safe to call multiple times; subsequent calls are instant no-ops.
 */
export async function initFaceLandmarker(): Promise<void> {
  if (_landmarker) return;
  if (_initPromise) return _initPromise;

  _initPromise = (async () => {
    const vision = await FilesetResolver.forVisionTasks("/mediapipe/wasm");

    const sharedOptions = {
      baseOptions: { modelAssetPath: "/mediapipe/face_landmarker.task" },
      runningMode: "VIDEO" as const,
      numFaces: 1,
      // Enable blendshapes — the v2 model supports them and they add
      // expressivity data (eye-open, mouth, brow raise) at no extra cost.
      outputFaceBlendshapes: true,
      outputFacialTransformationMatrixes: false,
    };

    // Try GPU first (faster on supported devices), fall back to CPU.
    // GPU delegate fails silently on many browsers (no WebGPU, mobile GPUs,
    // Firefox, Safari) — without the fallback the page shows a misleading
    // "Check your connection" error and the camera never starts.
    try {
      _landmarker = await FaceLandmarker.createFromOptions(vision, {
        ...sharedOptions,
        baseOptions: { ...sharedOptions.baseOptions, delegate: "GPU" },
      });
      console.info("[NeuroBee/gaze] FaceLandmarker initialised (GPU delegate)");
    } catch {
      console.warn("[NeuroBee/gaze] GPU delegate failed — retrying with CPU...");
      _landmarker = await FaceLandmarker.createFromOptions(vision, {
        ...sharedOptions,
        baseOptions: { ...sharedOptions.baseOptions, delegate: "CPU" },
      });
      console.info("[NeuroBee/gaze] FaceLandmarker initialised (CPU delegate)");
    }
  })();

  return _initPromise;
}

export function disposeFaceLandmarker(): void {
  _landmarker?.close();
  _landmarker = null;
  _initPromise = null;
}

// ── Landmark helpers ──────────────────────────────────────────────────────────

function avg(lm: NormalizedLandmark[], indices: number[]): { x: number; y: number } {
  let sx = 0, sy = 0;
  for (const i of indices) { sx += lm[i].x; sy += lm[i].y; }
  return { x: sx / indices.length, y: sy / indices.length };
}

/**
 * Compute gaze vector from iris position relative to eye corners.
 * Requires 478+ landmarks (iris set). Returns { x, y } in [–1, +1].
 *
 * Mirror note: MediaPipe normalises landmarks to the IMAGE frame.
 * With a front-facing camera the image is already mirrored, so a child
 * looking left has gaze.x < 0 in image space — which is what we want
 * for the gaze-following dot correlation.
 */
function computeGazeVector(lm: NormalizedLandmark[]): GazeVector {
  if (lm.length < 478) return { x: 0, y: 0 };

  // Average of 5 iris points for robustness against per-frame jitter
  const leftIris  = avg(lm, [468, 469, 470, 471, 472]);
  const rightIris = avg(lm, [473, 474, 475, 476, 477]);

  // Left eye geometry
  const lOuter = lm[33];  const lInner = lm[133];
  const lWidth = Math.abs(lOuter.x - lInner.x) || 0.001;
  const lMidX  = (lOuter.x + lInner.x) / 2;
  const lMidY  = (lm[159].y + lm[145].y) / 2;

  // Right eye geometry
  const rInner = lm[362]; const rOuter = lm[263];
  const rWidth = Math.abs(rOuter.x - rInner.x) || 0.001;
  const rMidX  = (rInner.x + rOuter.x) / 2;
  const rMidY  = (lm[386].y + lm[374].y) / 2;

  // Iris offset relative to eye width → normalised gaze
  const lGazeX = (leftIris.x  - lMidX) / lWidth;
  const lGazeY = (leftIris.y  - lMidY) / lWidth;
  const rGazeX = (rightIris.x - rMidX) / rWidth;
  const rGazeY = (rightIris.y - rMidY) / rWidth;

  return {
    x: Math.max(-1, Math.min(1, (lGazeX + rGazeX) / 2)),
    y: Math.max(-1, Math.min(1, (lGazeY + rGazeY) / 2)),
  };
}

/** true when iris is aimed close enough to the camera centre. */
function isLookingAtCamera(gaze: GazeVector, threshold = 0.20): boolean {
  return Math.abs(gaze.x) < threshold && Math.abs(gaze.y) < threshold;
}

/**
 * Eye Aspect Ratio for blink detection.
 * EAR = eye_height / eye_width.  Below ~0.2 = blink.
 */
function computeEAR(
  lm: NormalizedLandmark[],
  upper: number, lower: number,
  outer: number, inner: number
): number {
  const h = Math.abs(lm[upper].y - lm[lower].y);
  const w = Math.abs(lm[outer].x - lm[inner].x) || 0.001;
  return h / w;
}

/**
 * Head yaw from nose-tip symmetry within the face.
 * Returns [–1, +1]: negative = turned left, positive = turned right.
 */
function computeHeadTurn(lm: NormalizedLandmark[]): number {
  const nose  = lm[1];
  const left  = lm[234];
  const right = lm[454];
  const w     = (right.x - left.x) || 0.001;
  const mid   = (left.x + right.x) / 2;
  return Math.max(-1, Math.min(1, ((nose.x - mid) / w) * 4));
}

// ── Frame processing ──────────────────────────────────────────────────────────

const _blank: GazeFrame = {
  gaze: { x: 0, y: 0 },
  lookingAtCamera: false,
  headTurn: 0,
  faceDetected: false,
  leftEAR: -1,
  rightEAR: -1,
};

/**
 * Process one video frame. Exposed as async so the call-site interface is
 * uniform with other potential backends. MediaPipe Tasks Vision is internally
 * synchronous — the await resolves immediately after the GPU call.
 */
export async function processFrame(videoEl: HTMLVideoElement): Promise<GazeFrame> {
  if (!_landmarker || videoEl.readyState < 2) return { ..._blank };

  const result = _landmarker.detectForVideo(videoEl, performance.now());
  const lm = result.faceLandmarks?.[0];
  if (!lm || lm.length === 0) return { ..._blank };

  const gaze    = computeGazeVector(lm);
  const hasIris = lm.length >= 478;

  return {
    gaze,
    lookingAtCamera: isLookingAtCamera(gaze),
    headTurn:  computeHeadTurn(lm),
    faceDetected: true,
    leftEAR:  hasIris ? computeEAR(lm, 159, 145, 33,  133) : -1,
    rightEAR: hasIris ? computeEAR(lm, 386, 374, 263, 362) : -1,
  };
}
