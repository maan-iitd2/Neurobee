"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import {
  initFaceLandmarker,
  disposeFaceLandmarker,
  processFrame,
  type GazeFrame,
} from "@/lib/gaze";
import { extractFeatures, type NeuroFeatures } from "@/lib/screening-features";
import { classifyNeuroRisk, type NeuroRisk, type RiskLevel } from "@/lib/screening-classifier";
import Link from "next/link";

// ── Task config ───────────────────────────────────────────────────────────────

const TASK_DURATION_MS = 60_000;

type TaskId = "eye-contact" | "name-response" | "gaze-follow";

interface Task {
  id: TaskId;
  title: string;
  domain: string;
  icon: string;
  instruction: string;
  detail: string;
}

const TASKS: Task[] = [
  {
    id: "eye-contact",
    title: "Eye Contact Check",
    domain: "Social Communication",
    icon: "visibility",
    instruction: "Hold the phone at your child's eye level",
    detail: "A gentle chime plays every few seconds. Watch whether your child looks at the screen. Keep the session calm and natural.",
  },
  {
    id: "name-response",
    title: "Name Response",
    domain: "Social Communication · Critical",
    icon: "record_voice_over",
    instruction: "The app will call your child's name three times",
    detail: "Hold the phone about 1 metre behind your child. We'll measure whether they turn toward the sound within 4 seconds.",
  },
  {
    id: "gaze-follow",
    title: "Gaze Following",
    domain: "Joint Attention",
    icon: "track_changes",
    instruction: "Show your child the moving dot",
    detail: "Hold the phone at eye level. A dot moves left and right. We observe whether your child's gaze follows it.",
  },
];

// ── UI helpers ────────────────────────────────────────────────────────────────

const RISK_COLORS: Record<RiskLevel, { bg: string; text: string; border: string; dot: string }> = {
  low:    { bg: "bg-primary/10",              text: "text-primary",   border: "border-primary/20",    dot: "bg-primary" },
  medium: { bg: "bg-secondary-container/40",  text: "text-secondary", border: "border-secondary/20",  dot: "bg-amber-500" },
  high:   { bg: "bg-surface-container",       text: "text-tertiary",  border: "border-outline-variant", dot: "bg-red-500" },
};

const RISK_LABELS: Record<RiskLevel, string> = {
  low: "Typical", medium: "Emerging", high: "Elevated",
};

function scoreLabel(score: number): { label: string; color: string } {
  if (score >= 70) return { label: "Strong", color: "text-primary" };
  if (score >= 40) return { label: "Emerging", color: "text-secondary" };
  return { label: "Needs attention", color: "text-tertiary" };
}

// ── Main component ────────────────────────────────────────────────────────────

type Screen = "intro" | "permission" | "task" | "results";

interface TaskScores {
  "eye-contact": number;
  "name-response": number;
  "gaze-follow": number;
}

export default function ScreenPage() {
  const { user } = useAuth();
  const { saveVideoScreeningResults } = useApp();
  const childName = user?.childName ?? "your child";

  const [screen, setScreen] = useState<Screen>("intro");
  const [taskIndex, setTaskIndex] = useState(0);
  const [scores, setScores] = useState<Partial<TaskScores>>({});
  const [elapsed, setElapsed] = useState(0);
  const [faceDetected, setFaceDetected] = useState(false);
  const [lookingPct, setLookingPct] = useState(0);
  const [dotX, setDotX] = useState(50);
  const [nameCallIndex, setNameCallIndex] = useState(0);
  const [saved, setSaved] = useState(false);
  const [modelLoading, setModelLoading] = useState(false);
  const [modelError, setModelError] = useState("");
  const [neuroFeatures, setNeuroFeatures] = useState<NeuroFeatures | null>(null);
  const [neuroRisk, setNeuroRisk] = useState<NeuroRisk | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const landmarkerRef = useRef<boolean>(false);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const keyFramesRef = useRef<string[]>([]);  // one base64 JPEG per task

  // Live refs — avoid stale closures in RAF loop
  const currentTaskIdRef = useRef<TaskId>(TASKS[0].id);
  const dotXRef = useRef(50);

  // Accumulators: counters
  const lookFrames = useRef(0);
  const totalFrames = useRef(0);
  const nameResponseRef = useRef(0);
  const gazeFollowRef = useRef({ hits: 0, total: 0 });

  // Frame sequence collectors (for feature extraction)
  const eyeContactFramesRef = useRef<GazeFrame[]>([]);
  const nameResponseFramesRef = useRef<GazeFrame[]>([]);
  const gazeFollowFramesRef = useRef<GazeFrame[]>([]);
  const dotXSequenceRef = useRef<number[]>([]);
  const nameCallTimestampsRef = useRef<number[]>([]);   // ms elapsed when name was called
  const taskElapsedRef = useRef(0);
  const fpsEstimateRef = useRef(25);    // estimated, updated per task
  const taskFrameCountRef = useRef(0);
  const taskStartTimeRef = useRef(0);

  const currentTask = TASKS[taskIndex];

  // Keep live refs in sync with state
  useEffect(() => { currentTaskIdRef.current = currentTask?.id ?? "eye-contact"; }, [currentTask]);
  useEffect(() => { dotXRef.current = dotX; }, [dotX]);

  // ── Camera ────────────────────────────────────────────────────────────────

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (e) {
      setModelError("Camera permission denied. Please allow camera access and reload.");
      console.error("[NeuroBee/screen] Camera error:", e);
    }
  }, []);

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    disposeFaceLandmarker();
    landmarkerRef.current = false;
  }, []);

  // ── Dot animation ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (screen !== "task" || currentTask.id !== "gaze-follow") return;
    let t = 0;
    const interval = setInterval(() => {
      t += 0.04;
      setDotX(50 + 40 * Math.sin(t));
    }, 50);
    return () => clearInterval(interval);
  }, [screen, currentTask?.id]);

  // ── Name calling ──────────────────────────────────────────────────────────

  const callName = useCallback(
    (callNumber: number, elapsedMs: number) => {
      if (typeof window === "undefined" || !window.speechSynthesis) return;
      const utterance = new SpeechSynthesisUtterance(childName);
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      window.speechSynthesis.speak(utterance);
      setNameCallIndex(callNumber + 1);
      // Record for latency computation
      nameCallTimestampsRef.current.push(elapsedMs);
    },
    [childName]
  );

  // ── Frame capture ─────────────────────────────────────────────────────────

  const captureKeyFrame = useCallback((): string | null => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return null;
    const canvas = canvasRef.current ?? document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 240;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, 320, 240);
    // Strip the data-URL prefix — send only the base64 payload
    return canvas.toDataURL("image/jpeg", 0.7).split(",")[1] ?? null;
  }, []);

  // ── Task timer ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (screen !== "task") return;

    const startTime = Date.now();
    taskStartTimeRef.current = startTime;

    // Reset per-task accumulators
    lookFrames.current = 0;
    totalFrames.current = 0;
    nameResponseRef.current = 0;
    gazeFollowRef.current = { hits: 0, total: 0 };
    taskFrameCountRef.current = 0;

    // Reset frame collectors for this task
    if (currentTask.id === "eye-contact") {
      eyeContactFramesRef.current = [];
      // Reset name/gazeFollow collectors too on first task
      nameResponseFramesRef.current = [];
      gazeFollowFramesRef.current = [];
      dotXSequenceRef.current = [];
      nameCallTimestampsRef.current = [];
      keyFramesRef.current = [];
    } else if (currentTask.id === "name-response") {
      nameResponseFramesRef.current = [];
      nameCallTimestampsRef.current = [];
    } else {
      gazeFollowFramesRef.current = [];
      dotXSequenceRef.current = [];
    }

    let nameCallsMade = 0;
    const nameCallTimes = [8000, 22000, 40000];

    const timer = setInterval(() => {
      const el = Date.now() - startTime;
      setElapsed(el);
      taskElapsedRef.current = el;

      if (currentTask.id === "name-response") {
        for (let i = nameCallsMade; i < nameCallTimes.length; i++) {
          if (el >= nameCallTimes[i]) {
            callName(nameCallsMade, nameCallTimes[i]);
            nameCallsMade++;
          }
        }
      }

      if (el >= TASK_DURATION_MS) {
        clearInterval(timer);

        // Capture a key frame for multimodal AI analysis
        const frame = captureKeyFrame();
        if (frame) keyFramesRef.current.push(frame);

        // Update FPS estimate
        const durationSec = TASK_DURATION_MS / 1000;
        fpsEstimateRef.current = Math.max(10, taskFrameCountRef.current / durationSec);

        // Compute task score
        let taskScore = 0;
        if (currentTask.id === "eye-contact") {
          taskScore = totalFrames.current > 0
            ? Math.round((lookFrames.current / totalFrames.current) * 100)
            : 0;
        } else if (currentTask.id === "name-response") {
          taskScore = Math.round((nameResponseRef.current / 3) * 100);
        } else {
          taskScore = gazeFollowRef.current.total > 0
            ? Math.round((gazeFollowRef.current.hits / gazeFollowRef.current.total) * 100)
            : 0;
        }

        setScores((prev) => {
          const next = { ...prev, [currentTask.id]: taskScore };

          // After last task: run feature extraction + classifier
          if (taskIndex === TASKS.length - 1) {
            const features = extractFeatures(
              eyeContactFramesRef.current,
              nameResponseFramesRef.current,
              nameCallTimestampsRef.current,
              gazeFollowFramesRef.current,
              dotXSequenceRef.current,
              fpsEstimateRef.current
            );
            const risk = classifyNeuroRisk(features, features.totalFramesAnalysed);
            setNeuroFeatures(features);
            setNeuroRisk(risk);
          }

          return next;
        });

        if (taskIndex < TASKS.length - 1) {
          setTaskIndex((i) => i + 1);
          setElapsed(0);
        } else {
          stopCamera();
          setScreen("results");
        }
      }
    }, 200);

    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, taskIndex]);

  // ── RAF frame loop ────────────────────────────────────────────────────────

  const startDetection = useCallback(async () => {
    setModelLoading(true);
    setModelError("");
    try {
      await initFaceLandmarker();
      landmarkerRef.current = true;
    } catch (e) {
      setModelError("Could not load face detection model. Check your connection.");
      console.error("[NeuroBee/screen] Model load error:", e);
      setModelLoading(false);
      return;
    }
    setModelLoading(false);

    const loop = async () => {
      const video = videoRef.current;
      if (!video || !landmarkerRef.current || video.readyState < 2) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      const frame: GazeFrame = await processFrame(video);
      setFaceDetected(frame.faceDetected);

      const taskId = currentTaskIdRef.current;
      taskFrameCountRef.current++;

      if (frame.faceDetected) {
        totalFrames.current++;

        // Store frame in appropriate sequence
        if (taskId === "eye-contact") {
          eyeContactFramesRef.current.push(frame);
        } else if (taskId === "name-response") {
          nameResponseFramesRef.current.push(frame);
        } else {
          gazeFollowFramesRef.current.push(frame);
          dotXSequenceRef.current.push(dotXRef.current);
        }

        if (frame.lookingAtCamera) lookFrames.current++;

        if (taskId === "name-response" && frame.lookingAtCamera) {
          nameResponseRef.current = Math.min(3, nameResponseRef.current + 0.025);
        }

        if (taskId === "gaze-follow") {
          gazeFollowRef.current.total++;
          const dotNorm = (dotXRef.current - 50) / 50;
          if (dotNorm * -frame.gaze.x > 0.1) gazeFollowRef.current.hits++;
        }

        if (totalFrames.current > 0) {
          setLookingPct(Math.round((lookFrames.current / totalFrames.current) * 100));
        }
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
  }, []);

  // ── Begin / cleanup ───────────────────────────────────────────────────────

  const handleBegin = useCallback(async () => {
    setScreen("permission");
    await startCamera();
    await startDetection();
    setScreen("task");
  }, [startCamera, startDetection]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  // ── Save results ──────────────────────────────────────────────────────────

  const handleSave = useCallback(() => {
    const eyeContact = scores["eye-contact"] ?? 0;
    const nameResp = scores["name-response"] ?? 0;
    const gazeFollow = scores["gaze-follow"] ?? 0;
    const composite = Math.round(eyeContact * 0.4 + nameResp * 0.35 + gazeFollow * 0.25);
    const frames = keyFramesRef.current.length > 0 ? keyFramesRef.current : undefined;
    saveVideoScreeningResults({
      eyeContactScore: eyeContact,
      nameResponseScore: nameResp,
      gazeFollowScore: gazeFollow,
      compositeScore: composite,
      completedAt: new Date().toISOString(),
      features: neuroFeatures ?? undefined,
      neuroRisk: neuroRisk ?? undefined,
      keyFrames: frames,
    });
    setSaved(true);
  }, [scores, neuroFeatures, neuroRisk, saveVideoScreeningResults]);

  const compositeScore =
    scores["eye-contact"] != null && scores["name-response"] != null && scores["gaze-follow"] != null
      ? Math.round((scores["eye-contact"]!) * 0.4 + (scores["name-response"]!) * 0.35 + (scores["gaze-follow"]!) * 0.25)
      : null;

  const progressPct = Math.min(100, (elapsed / TASK_DURATION_MS) * 100);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <TopBar />
      <main className="max-w-xl mx-auto px-6 pt-8 page-bottom-padding space-y-8">

        {/* ── INTRO ── */}
        {screen === "intro" && (
          <div className="space-y-8">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                  videocam
                </span>
                <span className="text-[10px] font-label uppercase tracking-widest font-semibold text-primary">
                  Vision Screening · Beta
                </span>
              </div>
              <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface">
                Camera-Based<br />
                <span className="text-primary">Behavioral Screen</span>
              </h1>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                NeuroBee uses your phone&apos;s front camera to automatically observe eye contact,
                name response, and gaze following — then extracts 7 clinically-validated
                neurological attention features from the raw gaze data.
              </p>
            </div>

            <div className="flex items-start gap-3 bg-primary/5 border border-primary/15 rounded-xl px-5 py-4">
              <span className="material-symbols-outlined text-primary shrink-0 mt-0.5">shield</span>
              <div>
                <p className="text-xs font-semibold text-on-surface">100% on-device · no recording</p>
                <p className="text-xs text-on-surface-variant leading-relaxed mt-0.5">
                  MediaPipe runs entirely on this device. Video is never stored or transmitted. The landmarker model is served locally from this app.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {TASKS.map((task, i) => (
                <div key={task.id} className="flex items-center gap-4 bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/15">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary text-lg">{task.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-on-surface">{task.title}</p>
                    <p className="text-[11px] text-tertiary uppercase tracking-widest font-label">{task.domain}</p>
                  </div>
                  <span className="text-[10px] font-label uppercase tracking-widest text-tertiary border border-outline-variant/30 rounded-full px-2 py-0.5">
                    {i + 1} of 3
                  </span>
                </div>
              ))}
            </div>

            <div className="bg-surface-container p-4 rounded-xl space-y-2">
              <p className="text-[10px] font-label uppercase tracking-widest text-tertiary">Features extracted</p>
              <div className="flex flex-wrap gap-2">
                {["Gaze entropy", "Social gaze %", "Saccade freq.", "Fixation duration", "Blink rate", "Name latency", "Gaze following"].map((f) => (
                  <span key={f} className="text-[10px] px-2.5 py-1 rounded-full bg-primary/10 text-primary font-label font-semibold">{f}</span>
                ))}
              </div>
            </div>

            <p className="text-xs text-tertiary text-center">Total time: ~3 minutes · Requires front camera</p>

            <button
              onClick={handleBegin}
              className="w-full bg-primary text-on-primary py-4 rounded-full font-headline font-bold text-base hover:opacity-90 transition-all botanical-shadow flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">play_circle</span>
              Begin Screening
            </button>
          </div>
        )}

        {/* ── PERMISSION / LOADING ── */}
        {screen === "permission" && (
          <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-5">
            {modelError ? (
              <>
                <span className="material-symbols-outlined text-tertiary text-5xl">videocam_off</span>
                <p className="font-headline text-xl font-bold text-on-surface">Camera unavailable</p>
                <p className="text-sm text-on-surface-variant max-w-xs">{modelError}</p>
                <button onClick={() => setScreen("intro")} className="mt-2 px-6 py-3 rounded-full border border-outline-variant/30 text-sm font-semibold text-on-surface hover:bg-surface-container transition-all">Back</button>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
                <p className="font-headline text-xl font-bold text-on-surface">
                  {modelLoading ? "Loading face detection model…" : "Starting camera…"}
                </p>
                <p className="text-sm text-on-surface-variant">Model served locally — no internet needed</p>
              </>
            )}
          </div>
        )}

        {/* ── TASK ── */}
        {screen === "task" && (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-label uppercase tracking-widest text-tertiary">
                  Task {taskIndex + 1} of {TASKS.length}
                </span>
                <span className={`text-[10px] font-label uppercase tracking-widest font-semibold px-2.5 py-1 rounded-full ${faceDetected ? "bg-primary/10 text-primary" : "bg-surface-container text-tertiary"}`}>
                  {faceDetected ? "Face detected" : "No face"}
                </span>
              </div>
              <h2 className="font-headline text-2xl font-extrabold text-on-surface">{currentTask.title}</h2>
              <p className="text-[10px] font-label uppercase tracking-widest text-tertiary">{currentTask.domain}</p>
            </div>

            <div className="space-y-1.5">
              <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-primary-gradient transition-all duration-200" style={{ width: `${progressPct}%` }} />
              </div>
              <div className="flex justify-between text-[10px] text-tertiary font-label uppercase tracking-widest">
                <span>{Math.ceil((TASK_DURATION_MS - elapsed) / 1000)}s remaining</span>
                <span>{faceDetected ? `${eyeContactFramesRef.current.length + nameResponseFramesRef.current.length + gazeFollowFramesRef.current.length} frames` : "—"}</span>
              </div>
            </div>

            <div className="relative rounded-2xl overflow-hidden bg-surface-container-lowest border border-outline-variant/15 aspect-[4/3]">
              <video ref={videoRef} className="w-full h-full object-cover scale-x-[-1]" muted playsInline autoPlay />
              <canvas ref={canvasRef} className="hidden" />

              {currentTask.id === "gaze-follow" && (
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-primary shadow-lg shadow-primary/40 flex items-center justify-center transition-all duration-50 pointer-events-none"
                  style={{ left: `calc(${dotX}% - 24px)` }}
                >
                  <span className="material-symbols-outlined text-on-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>circle</span>
                </div>
              )}

              {currentTask.id === "name-response" && nameCallIndex > 0 && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-primary/90 text-on-primary px-4 py-2 rounded-full text-xs font-bold backdrop-blur-sm">
                  Name called: {nameCallIndex} / 3
                </div>
              )}

              {currentTask.id === "eye-contact" && faceDetected && (
                <div className="absolute bottom-4 left-4 bg-surface/80 backdrop-blur-sm rounded-xl px-3 py-1.5 text-xs font-semibold text-on-surface">
                  Social gaze: {lookingPct}%
                </div>
              )}
            </div>

            <div className="bg-surface-container-low rounded-2xl p-5 space-y-2 border border-outline-variant/15">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>{currentTask.icon}</span>
                <p className="font-semibold text-sm text-on-surface">{currentTask.instruction}</p>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed pl-7">{currentTask.detail}</p>
            </div>
          </div>
        )}

        {/* ── RESULTS ── */}
        {screen === "results" && (
          <div className="space-y-8">
            {/* Header */}
            <div className="space-y-2">
              <span className="text-[10px] font-label uppercase tracking-widest text-tertiary">Screening complete</span>
              <h1 className="font-headline text-3xl font-extrabold text-on-surface">Vision Results</h1>
              {compositeScore !== null && (
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
                  compositeScore >= 70 ? "bg-primary/10 border border-primary/20" :
                  compositeScore >= 40 ? "bg-secondary-container/40 border border-secondary/20" :
                  "bg-surface-container border border-outline-variant"
                }`}>
                  <span className={`font-headline text-2xl font-extrabold ${scoreLabel(compositeScore).color}`}>{compositeScore}%</span>
                  <span className={`text-sm font-semibold ${scoreLabel(compositeScore).color}`}>{scoreLabel(compositeScore).label}</span>
                  <span className="text-xs text-tertiary">composite</span>
                </div>
              )}
            </div>

            {/* Per-task scores */}
            <section className="space-y-3">
              <p className="text-[10px] font-label uppercase tracking-widest text-tertiary">Task scores</p>
              {TASKS.map((task) => {
                const score = scores[task.id] ?? 0;
                const { label, color } = scoreLabel(score);
                return (
                  <div key={task.id} className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/15 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>{task.icon}</span>
                        <div>
                          <p className="text-sm font-bold text-on-surface">{task.title}</p>
                          <p className="text-[10px] text-tertiary font-label uppercase tracking-widest">{task.domain}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`font-headline text-xl font-extrabold ${color}`}>{score}%</p>
                        <p className={`text-[10px] font-label uppercase tracking-widest ${color}`}>{label}</p>
                      </div>
                    </div>
                    <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-primary-gradient transition-all duration-700" style={{ width: `${score}%` }} />
                    </div>
                  </div>
                );
              })}
            </section>

            {/* Neurological Patterns — classifier output */}
            {neuroRisk && (
              <section className="space-y-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-label uppercase tracking-widest text-tertiary">Neurological Patterns</p>
                    <h2 className="font-headline text-xl font-bold text-on-surface">Domain Analysis</h2>
                  </div>
                  <span className={`text-[10px] font-label uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                    neuroRisk.confidence === "high" ? "bg-primary/10 text-primary border-primary/20" :
                    neuroRisk.confidence === "moderate" ? "bg-secondary-container/40 text-secondary border-secondary/20" :
                    "bg-surface-container text-tertiary border-outline-variant/30"
                  }`}>
                    {neuroRisk.confidence} confidence · {neuroFeatures?.totalFramesAnalysed ?? 0} frames
                  </span>
                </div>

                {/* Domain risk cards */}
                <div className="grid grid-cols-1 gap-3">
                  {([
                    { key: "socialCommunication", label: "Social Communication", icon: "people", mchat: "M-CHAT-R items 1–8" },
                    { key: "jointAttention",       label: "Joint Attention",       icon: "track_changes", mchat: "M-CHAT-R items 9–12" },
                    { key: "attentionRegulation",  label: "Attention Regulation",  icon: "psychology",    mchat: "Attention & Sensory domains" },
                  ] as const).map(({ key, label, icon, mchat }) => {
                    const level = neuroRisk[key] as RiskLevel;
                    const c = RISK_COLORS[level];
                    return (
                      <div key={key} className={`flex items-center gap-4 p-5 rounded-2xl border ${c.bg} ${c.border}`}>
                        <div className={`w-10 h-10 rounded-full ${c.bg} border ${c.border} flex items-center justify-center shrink-0`}>
                          <span className={`material-symbols-outlined text-lg ${c.text}`} style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-bold uppercase tracking-widest ${c.text}`}>{RISK_LABELS[level]}</p>
                          <p className="text-sm font-bold text-on-surface">{label}</p>
                          <p className="text-[10px] text-tertiary font-label">{mchat}</p>
                        </div>
                        <div className={`w-2.5 h-2.5 rounded-full ${c.dot} shrink-0`} />
                      </div>
                    );
                  })}
                </div>

                {/* Overall */}
                <div className={`p-5 rounded-2xl border space-y-1 ${RISK_COLORS[neuroRisk.overall].bg} ${RISK_COLORS[neuroRisk.overall].border}`}>
                  <p className="text-[10px] font-label uppercase tracking-widest text-tertiary">Overall neuro pattern</p>
                  <div className="flex items-center gap-3">
                    <span className={`font-headline text-2xl font-extrabold ${RISK_COLORS[neuroRisk.overall].text}`}>
                      {RISK_LABELS[neuroRisk.overall]}
                    </span>
                    <span className="text-xs text-on-surface-variant">across all domains</span>
                  </div>
                </div>

                {/* Feature flags */}
                {neuroRisk.featureFlags.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-[10px] font-label uppercase tracking-widest text-tertiary">Observed Signals</p>
                    {neuroRisk.featureFlags.map((flag, i) => {
                      const c = RISK_COLORS[flag.severity];
                      return (
                        <div key={i} className={`p-4 rounded-xl border space-y-1.5 ${c.bg} ${c.border}`}>
                          <div className="flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${c.dot} shrink-0`} />
                            <p className={`text-xs font-bold ${c.text}`}>{flag.label}</p>
                            <span className="text-[10px] text-tertiary font-label ml-auto">{flag.domain}</span>
                          </div>
                          <p className="text-xs text-on-surface-variant leading-relaxed pl-3.5">{flag.detail}</p>
                        </div>
                      );
                    })}
                    {neuroRisk.featureFlags.length === 0 && (
                      <div className="p-4 rounded-xl border border-primary/15 bg-primary/5">
                        <p className="text-sm text-primary font-semibold">No elevated signals detected</p>
                        <p className="text-xs text-on-surface-variant mt-1">All 7 gaze features were within typical ranges.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Raw features (collapsible) */}
                {neuroFeatures && (
                  <details className="group bg-surface-container rounded-xl cursor-pointer">
                    <summary className="flex items-center justify-between p-4 list-none">
                      <span className="text-xs font-semibold text-on-surface">Raw feature values</span>
                      <span className="material-symbols-outlined text-tertiary group-open:rotate-180 transition-transform text-sm">expand_more</span>
                    </summary>
                    <div className="px-4 pb-4 grid grid-cols-2 gap-2">
                      {([
                        ["Gaze entropy", neuroFeatures.gazeEntropy.toFixed(2), "bits"],
                        ["Social gaze", `${neuroFeatures.socialGazePct}%`, ""],
                        ["Saccades", `${neuroFeatures.saccadesPerMin}`, "/min"],
                        ["Fixation", neuroFeatures.meanFixationFrames.toFixed(1), "frames"],
                        ["Blink rate", `${neuroFeatures.blinkRate}`, "/min"],
                        ["Head movement", neuroFeatures.headMovementAmplitude.toFixed(3), ""],
                        ["Name latency", neuroFeatures.nameResponseLatencyMs === -1 ? "—" : `${neuroFeatures.nameResponseLatencyMs}ms`, ""],
                        ["Gaze follow", `${neuroFeatures.gazeFollowPct}%`, ""],
                      ] as [string, string, string][]).map(([name, val, unit]) => (
                        <div key={name} className="bg-surface-container-lowest rounded-lg p-3">
                          <p className="text-[10px] text-tertiary font-label uppercase tracking-widest">{name}</p>
                          <p className="text-sm font-bold text-on-surface">{val}<span className="text-xs font-normal text-tertiary ml-0.5">{unit}</span></p>
                        </div>
                      ))}
                    </div>
                  </details>
                )}

                <p className="text-[11px] italic text-tertiary/70 text-center leading-relaxed px-2">
                  These are observational indicators derived from gaze patterns, not diagnostic criteria.
                  Always discuss findings with a qualified paediatrician or developmental specialist.
                </p>
              </section>
            )}

            {/* M-CHAT-R mapping */}
            <div className="bg-surface-container p-5 rounded-2xl space-y-3">
              <p className="text-[10px] font-label uppercase tracking-widest text-tertiary">M-CHAT-R domain mapping</p>
              <div className="space-y-2 text-xs text-on-surface-variant">
                <p>· <strong className="text-on-surface">Eye Contact + Name Response</strong> → Social Communication (critical domain)</p>
                <p>· <strong className="text-on-surface">Gaze Following + Fixation</strong> → Joint Attention</p>
                <p>· <strong className="text-on-surface">Entropy + Saccades</strong> → Attention Regulation / Sensory & Behaviour</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              {!saved ? (
                <button
                  onClick={handleSave}
                  className="w-full bg-primary text-on-primary py-4 rounded-full font-headline font-bold text-base hover:opacity-90 transition-all botanical-shadow flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">save</span>
                  Add to Assessment
                </button>
              ) : (
                <div className="flex items-center justify-center gap-2 py-4 text-primary font-semibold">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  Saved to your session
                </div>
              )}
              <Link
                href="/insights"
                className="w-full border border-outline-variant/30 text-on-surface py-4 rounded-full font-headline font-bold text-base hover:bg-surface-container transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">insights</span>
                View Full Insights
              </Link>
              <button
                onClick={() => {
                  setScreen("intro");
                  setTaskIndex(0);
                  setScores({});
                  setElapsed(0);
                  setSaved(false);
                  setNameCallIndex(0);
                  setNeuroFeatures(null);
                  setNeuroRisk(null);
                }}
                className="text-center text-sm text-tertiary hover:text-on-surface transition-colors py-2"
              >
                Run screening again
              </button>
            </div>
          </div>
        )}
      </main>
      <BottomNav />
    </>
  );
}
