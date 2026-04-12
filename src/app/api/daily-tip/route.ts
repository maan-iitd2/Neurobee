import { NextResponse } from "next/server";

const LMSTUDIO_BASE = process.env.LMSTUDIO_URL ?? "http://localhost:1234";
const LMSTUDIO_MODEL = process.env.LMSTUDIO_MODEL ?? "google/gemma-4-e4b";

const SYSTEM_PROMPT = `You are NeuroBee's warm developmental companion for Indian parents. Generate a short, actionable daily activity tip for a parent to do with their child.

RULES:
- The activity must be doable at home with no special equipment
- Keep it under 80 words total
- Be warm and encouraging
- Tailor to the child's age and any developmental areas mentioned
- Reference Indian cultural context where natural (e.g. "during chai time", "while cooking roti")
- Focus on genuine connection, not performance

You MUST respond with ONLY valid JSON in this exact format:
{
  "title": "Short activity name (3-5 words)",
  "description": "Clear, warm description of what to do and why it helps",
  "icon": "one of: play_circle, record_voice_over, visibility, child_care, lightbulb, favorite, music_note, palette",
  "domain": "one of: Social Communication, Joint Attention, Language, Motor, Sensory, Emotional"
}`;

interface RequestBody {
  childName: string;
  childAgeMonths: number;
  riskLevel?: string;
  strengths?: string[];
  developing?: string[];
  language?: "en" | "hi";
}

export async function POST(request: Request) {
  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { childName, childAgeMonths, riskLevel, strengths, developing, language } = body;
  if (!childName || childAgeMonths == null) {
    return NextResponse.json({ error: "Missing childName or childAgeMonths" }, { status: 400 });
  }

  const ageYears = Math.floor(childAgeMonths / 12);
  const ageMonthsRemainder = childAgeMonths % 12;
  const ageStr = ageYears > 0
    ? `${ageYears} year${ageYears > 1 ? "s" : ""}${ageMonthsRemainder > 0 ? ` ${ageMonthsRemainder} months` : ""}`
    : `${childAgeMonths} months`;

  const context = [
    `Child: ${childName}, age ${ageStr}.`,
    riskLevel ? `Screening risk: ${riskLevel}.` : "",
    strengths?.length ? `Strengths: ${strengths.join(", ")}.` : "",
    developing?.length ? `Areas to nurture: ${developing.join(", ")}.` : "",
    `Today is ${new Date().toLocaleDateString("en-IN", { weekday: "long" })}.`,
    "Generate a fresh, unique daily activity tip for this parent.",
  ].filter(Boolean).join("\n");

  const langInstruction = language === "hi"
    ? "LANGUAGE INSTRUCTION: You MUST respond ONLY in Hindi (Devanagari script). The title, description, and all text in your JSON must be in Hindi. Do not use English except for the icon and domain field values."
    : "LANGUAGE INSTRUCTION: Respond in English.";
  const systemWithLang = `${langInstruction}\n\n${SYSTEM_PROMPT}`;

  try {
    const res = await fetch(`${LMSTUDIO_BASE}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: LMSTUDIO_MODEL,
        messages: [
          { role: "system", content: systemWithLang },
          { role: "user", content: context },
        ],
        temperature: 0.8,
        max_tokens: 1000,
        stream: false,
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "lmstudio_error" }, { status: 503 });
    }

    const data = await res.json();
    const content: string = data?.choices?.[0]?.message?.content ?? "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return NextResponse.json({ error: "parse_error" }, { status: 503 });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed.title || !parsed.description) {
      return NextResponse.json({ error: "missing_fields" }, { status: 503 });
    }

    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({ error: "lmstudio_offline" }, { status: 503 });
  }
}
