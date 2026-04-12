import { NextResponse } from "next/server";
import { QUESTIONS, computeRiskScore } from "@/lib/questions";
import type { NeuroRisk } from "@/lib/screening-classifier";

// LM Studio runs an OpenAI-compatible server on port 1234 by default.
// Override via LMSTUDIO_URL / LMSTUDIO_MODEL env vars for non-default setups.
const LMSTUDIO_BASE = process.env.LMSTUDIO_URL ?? "http://localhost:1234";
const LMSTUDIO_MODEL = process.env.LMSTUDIO_MODEL ?? "google/gemma-4-e4b";

const SYSTEM_PROMPT = `You are NeuroBee's compassionate developmental guidance assistant. You help parents in India understand their child's early developmental progress through gentle, evidence-based insights.

The screening is aligned with M-CHAT-R (Modified Checklist for Autism in Toddlers, Revised) as endorsed by the Indian Academy of Pediatrics (IAP), RBSK (Rashtriya Bal Swasthya Karyakram, National Health Mission, Govt. of India), and NIMHANS clinical guidelines.

CRITICAL RULES:
- NEVER diagnose. Say "may benefit from", "worth discussing with", "showing patterns of"
- Always be warm and strengths-focused. Lead with what is going well
- Ground observations in the specific answers provided — do not be generic
- Reference Indian healthcare resources (pediatrician, RBSK camps, NIMHANS) where appropriate
- Keep language simple — parents may not have medical backgrounds
- Do not exceed 120 words per field

When video frames are provided, briefly describe one concrete behavioural observation you can see — e.g. gaze direction, engagement, posture. Keep this under 40 words. If frames are too dark, blurry, or unclear, say so honestly.

You MUST respond with ONLY valid JSON in exactly this format (no markdown, no explanation outside):
{
  "reassurance": "A warm, specific 2-3 sentence message about what is going well based on the actual responses",
  "observation": "A gentle 2-3 sentence observation grounded in the specific answers given",
  "normalization": "A 1-2 sentence normalizing message about developmental variation",
  "guidance": ["First specific actionable tip", "Second specific actionable tip", "Third specific actionable tip"],
  "visualObservation": "One concrete observation from the video frames, or null if no frames provided"
}`;

interface RequestBody {
  child: { name: string; age: number };
  answers: Record<string, string>;
  neuroRisk?: NeuroRisk;
  keyFrames?: string[]; // base64 JPEG strings, one per screening task
  language?: "en" | "hi";
}

export async function POST(request: Request) {
  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { child, answers, neuroRisk, keyFrames, language } = body;
  if (!child?.name || answers == null) {
    return NextResponse.json(
      { error: "Missing required fields: child and answers" },
      { status: 400 }
    );
  }

  const riskScore = computeRiskScore(answers);

  // Build per-domain strength/developing lists
  const strengthSections = new Set<string>();
  const developingSections = new Set<string>();
  for (const q of QUESTIONS) {
    const ans = answers[q.id];
    if (ans === "Often") strengthSections.add(q.section);
    else if (ans === "Rarely") developingSections.add(q.section);
  }
  const strengths = [...strengthSections];
  const developing = [...developingSections];

  // Build the questionnaire summary
  const answerLines = QUESTIONS.map((q) => {
    const ans = answers[q.id] ?? "Not answered";
    const flag = q.isCritical ? " [M-CHAT-R critical]" : "";
    return `- ${q.category}${flag}: ${ans}`;
  }).join("\n");

  // Append neuroRisk context if available
  let neuroContext = "";
  if (neuroRisk) {
    neuroContext = `\n\nVideo gaze screening results:
- Social Communication risk: ${neuroRisk.socialCommunication}
- Joint Attention risk: ${neuroRisk.jointAttention}
- Attention Regulation risk: ${neuroRisk.attentionRegulation}
- Overall gaze risk: ${neuroRisk.overall}
- Confidence: ${neuroRisk.confidence}
${neuroRisk.featureFlags.length > 0 ? `- Observed patterns: ${neuroRisk.featureFlags.join("; ")}` : ""}`;
  }

  const userPrompt = `Child: ${child.name}, age ${child.age} year${child.age !== 1 ? "s" : ""}.
Screening risk level: ${riskScore.level} (total score: ${riskScore.total}/40, critical item failures: ${riskScore.criticalFailures}).
Strength areas: ${strengths.join(", ") || "none clearly observed"}.
Areas needing support: ${developing.join(", ") || "none clearly observed"}.

Questionnaire responses:
${answerLines}${neuroContext}

Please generate personalised, compassionate insights for this parent.`;

  // Build the message content — multimodal when keyFrames are provided
  const hasFrames = Array.isArray(keyFrames) && keyFrames.length > 0;

  type TextPart = { type: "text"; text: string };
  type ImagePart = { type: "image_url"; image_url: { url: string } };
  type ContentPart = TextPart | ImagePart;

  const userContent: ContentPart[] = [{ type: "text", text: userPrompt }];

  if (hasFrames) {
    userContent.push({ type: "text", text: "\n\nVideo frames captured during the screening session (one per task):" });
    for (const frame of keyFrames) {
      userContent.push({
        type: "image_url",
        image_url: { url: `data:image/jpeg;base64,${frame}` },
      });
    }
  }

  const langInstruction = language === "hi"
    ? "LANGUAGE INSTRUCTION: You MUST respond ONLY in Hindi (Devanagari script). All text fields in your JSON response must be written in Hindi. Do not use English words except for proper nouns (M-CHAT-R, RBSK, NIMHANS, AIIMS, IAP)."
    : "LANGUAGE INSTRUCTION: Respond in English.";
  const systemPromptWithLang = `${langInstruction}\n\n${SYSTEM_PROMPT}`;

  try {
    const lmRes = await fetch(`${LMSTUDIO_BASE}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: LMSTUDIO_MODEL,
        messages: [
          { role: "system", content: systemPromptWithLang },
          { role: "user", content: hasFrames ? userContent : userPrompt },
        ],
        temperature: 0.65,
        max_tokens: 2500,   // Gemma 4 uses ~600-900 reasoning tokens before output
        stream: false,
      }),
      signal: AbortSignal.timeout(60_000),   // Gemma 4 thinking adds ~10-20s latency
    });

    if (!lmRes.ok) {
      console.error(`[NeuroBee] LM Studio returned HTTP ${lmRes.status}`);
      return NextResponse.json(
        { error: "lmstudio_error", detail: `LM Studio returned ${lmRes.status}` },
        { status: 503 }
      );
    }

    const data = await lmRes.json();
    const content: string = data?.choices?.[0]?.message?.content ?? "";

    // Extract JSON — model may wrap in markdown fences
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("[NeuroBee] LM Studio response contained no JSON object:", content.slice(0, 200));
      return NextResponse.json(
        { error: "lmstudio_parse_error", detail: "No JSON object in response" },
        { status: 503 }
      );
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error("[NeuroBee] Failed to parse LM Studio JSON:", e);
      return NextResponse.json(
        { error: "lmstudio_parse_error", detail: "Could not parse response JSON" },
        { status: 503 }
      );
    }

    if (!parsed.reassurance || !parsed.guidance) {
      console.error("[NeuroBee] LM Studio JSON missing required fields:", Object.keys(parsed));
      return NextResponse.json(
        { error: "lmstudio_parse_error", detail: "Response missing required fields" },
        { status: 503 }
      );
    }

    return NextResponse.json({
      ...parsed,
      riskScore,
      source: "lmstudio-gemma4",
      hasVisualAnalysis: hasFrames && typeof parsed.visualObservation === "string" && parsed.visualObservation !== "null",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[NeuroBee] LM Studio connection failed:", message);
    return NextResponse.json(
      { error: "lmstudio_offline", detail: message },
      { status: 503 }
    );
  }
}
