"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { useProfile } from "@/context/ProfileContext";
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
import { useTranslation } from "@/lib/i18n";

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

// ── UI helpers ────────────────────────────────────────────────────────────────

const RISK_COLORS: Record<RiskLevel, { bg: string; text: string; border: string; dot: string }> = {
  low:    { bg: "bg-primary/10",              text: "text-primary",   border: "border-primary/20",    dot: "bg-primary" },
  medium: { bg: "bg-secondary-container/40",  text: "text-secondary", border: "border-secondary/20",  dot: "bg-amber-500" },
  high:   { bg: "bg-surface-container",       text: "text-tertiary",  border: "border-outline-variant", dot: "bg-red-500" },
};

const RISK_LABEL_KEYS: Record<RiskLevel, string> = {
  low: "screen.risk.typical", medium: "screen.risk.emerging", high: "screen.risk.elevated",
};

// ── Main component ────────────────────────────────────────────────────────────

type Screen = "intro" | "permission" | "task" | "results";

interface TaskScores {
  "eye-contact": number;
  "name-response": number;
  "gaze-follow": number;
}

export default function ScreenPage() {
  const { profile } = useProfile();
  const { saveVideoScreeningResults } = useApp();
  const t = useTranslation();
  const childName = profile?.childName ?? "your child";

  const TASKS: Task[] = [
    {
      id: "eye-contact",
      title: t("screen.task.eye_contact.title"),
      domain: t("screen.task.eye_contact.domain"),
      icon: "visibility",
      instruction: t("screen.task.eye_contact.instruction"),
      detail: t("screen.task.eye_contact.detail"),
    },
    {
      id: "name-response",
      title: t("screen.task.name_response.title"),
      domain: t("screen.task.name_response.domain"),
      icon: "record_voice_over",
      instruction: t("screen.task.name_response.instruction"),
      detail: t("screen.task.name_response.detail"),
    },
    {
      id: "gaze-follow",
      title: t("screen.task.gaze_follow.title"),
      domain: t("screen.task.gaze_follow.domain"),
      icon: "track_changes",
      instruction: t("screen.task.gaze_follow.instruction"),
      detail: t("screen.task.gaze_follow.detail"),
    },
  ];

  function scoreLabel(score: number): { label: string; color: string } {
    if (score >= 70) return { label: t("screen.score.strong"), color: "text-primary" };
    if (score >= 40) return { label: t("screen.score.emerging"), color: "text-secondary" };
    return { label: t("screen.score.needs_attention"), color: "text-tertiary" };
  }

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

  // Re-attach stream to video element when task screen mounts.
  // startCamera() acquires the stream during "permission" screen, but the
  // <video> element only exists in the "task" screen block. Without this,
  // the video feed is invisible because srcObject was set while videoRef was null.
  useEffect(() => {
    if (screen === "task" && videoRef.current && streamRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.play().catch(() => {});
      }
    }
  }, [screen]);

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
      setModelError("Could not load face detection model. Open browser DevTools → Console for details.");
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
                <span className="text-caption-caps text-primary">
                  {t("screen.intro.tag")}
                </span>
              </div>
              <h1 className="text-h1">
                {t("screen.intro.title1")}<br />
                <span className="text-primary">{t("screen.intro.title2")}</span>
              </h1>
              <p className="text-body text-on-surface-variant">
                {t("screen.intro.desc")}
              </p>
            </div>

            <div className="flex items-start gap-3 bg-primary/5 border border-primary/15 rounded-xl px-5 py-4">
              <span className="material-symbols-outlined text-primary shrink-0 mt-0.5">shield</span>
              <div>
                <p className="text-label text-on-surface">{t("screen.intro.privacy_title")}</p>
                <p className="text-body-sm text-on-surface-variant mt-0.5">
                  {t("screen.intro.privacy_desc")}
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
                    <p className="text-label text-on-surface">{task.title}</p>
                    <p className="text-caption-caps normal-case text-tertiary">{task.domain}</p>
                  </div>
                  <span className="text-caption-caps text-tertiary border border-outline-variant/30 rounded-full px-2 py-0.5">
                    {i + 1} {t("screen.task.of")} 3
                  </span>
                </div>
              ))}
            </div>

            <div className="bg-surface-container p-4 rounded-xl space-y-2">
              <p className="text-caption-caps text-tertiary">{t("screen.intro.features_label")}</p>
              <div className="flex flex-wrap gap-2">
                {["Gaze entropy", "Social gaze %", "Saccade freq.", "Fixation duration", "Blink rate", "Name latency", "Gaze following"].map((f) => (
                  <span key={f} className="text-caption-caps px-2.5 py-1 rounded-full bg-primary/10 text-primary">{f}</span>
                ))}
              </div>
            </div>

            <p className="text-body-sm text-tertiary text-center">{t("screen.intro.time")}</p>

            <button
              onClick={handleBegin}
              className="w-full bg-primary text-on-primary py-4 rounded-full text-label hover:opacity-90 transition-all botanical-shadow flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">play_circle</span>
              {t("screen.intro.begin")}
            </button>
          </div>
        )}

        {/* ── PERMISSION / LOADING ── */}
        {screen === "permission" && (
          <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-5">
            {modelError ? (
              <>
                <span className="material-symbols-outlined text-tertiary text-5xl">videocam_off</span>
                <p className="text-h3 text-on-surface">{t("screen.permission.unavailable")}</p>
                <p className="text-body text-on-surface-variant max-w-xs">{modelError}</p>
                <button onClick={() => setScreen("intro")} className="mt-2 px-6 py-3 rounded-full border border-outline-variant/30 text-label text-on-surface hover:bg-surface-container transition-all">{t("screen.permission.back")}</button>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
                <p className="text-h3 text-on-surface">
                  {modelLoading ? t("screen.permission.loading") : t("screen.permission.starting")}
                </p>
                <p className="text-body text-on-surface-variant">{t("screen.permission.local")}</p>
              </>
            )}
          </div>
        )}

        {/* ── TASK ── */}
        {screen === "task" && (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-caption-caps text-tertiary">
                  {t("screen.task.label")} {taskIndex + 1} {t("screen.task.of")} {TASKS.length}
                </span>
                <span className={`text-caption-caps px-2.5 py-1 rounded-full ${faceDetected ? "bg-primary/10 text-primary" : "bg-surface-container text-tertiary"}`}>
                  {faceDetected ? t("screen.task.face_detected") : t("screen.task.no_face")}
                </span>
              </div>
              <h2 className="text-h2 text-on-surface">{currentTask.title}</h2>
              <p className="text-caption-caps text-tertiary">{currentTask.domain}</p>
            </div>

            <div className="space-y-1.5">
              <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-primary-gradient transition-all duration-200" style={{ width: `${progressPct}%` }} />
              </div>
              <div className="flex justify-between text-caption-caps text-tertiary">
                <span>{Math.ceil((TASK_DURATION_MS - elapsed) / 1000)}{t("screen.task.remaining_suffix")}</span>
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
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-primary/90 text-on-primary px-4 py-2 rounded-full text-label backdrop-blur-sm">
                  {t("screen.task.name_called_prefix")} {nameCallIndex} / 3
                </div>
              )}

              {currentTask.id === "eye-contact" && faceDetected && (
                <div className="absolute bottom-4 left-4 bg-surface/80 backdrop-blur-sm rounded-xl px-3 py-1.5 text-label text-on-surface">
                  {t("screen.task.social_gaze_prefix")} {lookingPct}%
                </div>
              )}
            </div>

            <div className="bg-surface-container-low rounded-2xl p-5 space-y-2 border border-outline-variant/15">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>{currentTask.icon}</span>
                <p className="text-label text-on-surface">{currentTask.instruction}</p>
              </div>
              <p className="text-body-sm text-on-surface-variant pl-7">{currentTask.detail}</p>
            </div>
          </div>
        )}

        {/* ── RESULTS ── */}
        {screen === "results" && (
          <div className="space-y-8">
            {/* Header */}
            <div className="space-y-2">
              <span className="text-caption-caps text-tertiary">{t("screen.results.tag")}</span>
              <h1 className="text-h1">{t("screen.results.title")}</h1>
              {compositeScore !== null && (
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
                  compositeScore >= 70 ? "bg-primary/10 border border-primary/20" :
                  compositeScore >= 40 ? "bg-secondary-container/40 border border-secondary/20" :
                  "bg-surface-container border border-outline-variant"
                }`}>
                  <span className={`text-h2 ${scoreLabel(compositeScore).color}`}>{compositeScore}%</span>
                  <span className={`text-label ${scoreLabel(compositeScore).color}`}>{scoreLabel(compositeScore).label}</span>
                  <span className="text-caption-caps normal-case text-tertiary">{t("screen.results.composite")}</span>
                </div>
              )}
            </div>

            {/* Per-task scores */}
            <section className="space-y-3">
              <p className="text-caption-caps text-tertiary">{t("screen.results.task_scores")}</p>
              {TASKS.map((task) => {
                const score = scores[task.id] ?? 0;
                const { label, color } = scoreLabel(score);
                return (
                  <div key={task.id} className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/15 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>{task.icon}</span>
                        <div>
                          <p className="text-label text-on-surface">{task.title}</p>
                          <p className="text-caption-caps text-tertiary">{task.domain}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-h2 ${color}`}>{score}%</p>
                        <p className={`text-caption-caps ${color}`}>{label}</p>
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
                    <p className="text-caption-caps text-tertiary">Neurological Patterns</p>
                    <h2 className="text-h3 text-on-surface">Domain Analysis</h2>
                  </div>
                  <span className={`text-caption-caps px-2.5 py-1 rounded-full border ${
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
                          <p className={`text-caption-caps ${c.text}`}>{t(RISK_LABEL_KEYS[level])}</p>
                          <p className="text-label text-on-surface">{label}</p>
                          <p className="text-caption-caps normal-case text-tertiary">{mchat}</p>
                        </div>
                        <div className={`w-2.5 h-2.5 rounded-full ${c.dot} shrink-0`} />
                      </div>
                    );
                  })}
                </div>

                {/* Overall */}
                <div className={`p-5 rounded-2xl border space-y-1 ${RISK_COLORS[neuroRisk.overall].bg} ${RISK_COLORS[neuroRisk.overall].border}`}>
                  <p className="text-caption-caps text-tertiary">Overall neuro pattern</p>
                  <div className="flex items-center gap-3">
                    <span className={`text-h2 ${RISK_COLORS[neuroRisk.overall].text}`}>
                      {t(RISK_LABEL_KEYS[neuroRisk.overall])}
                    </span>
                    <span className="text-body-sm text-on-surface-variant">across all domains</span>
                  </div>
                </div>

                {/* Feature flags */}
                {neuroRisk.featureFlags.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-caption-caps text-tertiary">Observed Signals</p>
                    {neuroRisk.featureFlags.map((flag, i) => {
                      const c = RISK_COLORS[flag.severity];
                      return (
                        <div key={i} className={`p-4 rounded-xl border space-y-1.5 ${c.bg} ${c.border}`}>
                          <div className="flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${c.dot} shrink-0`} />
                            <p className={`text-label mt-0.5 ${c.text}`}>{flag.label}</p>
                            <span className="text-caption-caps normal-case text-tertiary ml-auto">{flag.domain}</span>
                          </div>
                          <p className="text-body-sm text-on-surface-variant pl-3.5">{flag.detail}</p>
                        </div>
                      );
                    })}
                    {neuroRisk.featureFlags.length === 0 && (
                      <div className="p-4 rounded-xl border border-primary/15 bg-primary/5">
                        <p className="text-label text-primary">No elevated signals detected</p>
                        <p className="text-body-sm text-on-surface-variant mt-1">All 7 gaze features were within typical ranges.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Raw features (collapsible) */}
                {neuroFeatures && (
                  <details className="group bg-surface-container rounded-xl cursor-pointer">
                    <summary className="flex items-center justify-between p-4 list-none">
                      <span className="text-label text-on-surface">Raw feature values</span>
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
                          <p className="text-caption-caps text-tertiary">{name}</p>
                          <p className="text-label text-on-surface">{val}<span className="text-body-sm text-tertiary ml-0.5">{unit}</span></p>
                        </div>
                      ))}
                    </div>
                  </details>
                )}

                <p className="text-body-sm text-[11px] italic text-tertiary/70 text-center px-2">
                  These are observational indicators derived from gaze patterns, not diagnostic criteria.
                  Always discuss findings with a qualified paediatrician or developmental specialist.
                </p>
              </section>
            )}

            {/* M-CHAT-R mapping */}
            <div className="bg-surface-container p-5 rounded-2xl space-y-3">
              <p className="text-caption-caps text-tertiary">M-CHAT-R domain mapping</p>
              <div className="space-y-2 text-body-sm text-on-surface-variant">
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
                  className="w-full bg-primary text-on-primary py-4 rounded-full text-label hover:opacity-90 transition-all botanical-shadow flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">save</span>
                  {t("screen.results.add_to_assessment")}
                </button>
              ) : (
                <div className="flex items-center justify-center gap-2 py-4 text-primary text-label">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  {t("screen.results.saved")}
                </div>
              )}
              <Link
                href="/insights"
                className="w-full border border-outline-variant/30 text-on-surface py-4 rounded-full text-label hover:bg-surface-container transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">insights</span>
                {t("screen.results.view_insights")}
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
                {t("screen.results.run_again")}
              </button>
            </div>
          </div>
        )}
      </main>
      <BottomNav />
    </>
  );
}
