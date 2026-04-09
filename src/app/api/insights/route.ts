import { NextResponse } from "next/server";
import { QUESTIONS, computeRiskScore } from "@/lib/questions";

// Ollama URL — override via OLLAMA_URL env var for production tunnelling
const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://localhost:11434/api/chat";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "mistral";

const SYSTEM_PROMPT = `You are NeuroBee's compassionate developmental guidance assistant. You help parents in India understand their child's early developmental progress through gentle, evidence-based insights.

The screening is aligned with M-CHAT-R (Modified Checklist for Autism in Toddlers, Revised) as endorsed by the Indian Academy of Pediatrics (IAP), RBSK (Rashtriya Bal Swasthya Karyakram, National Health Mission, Govt. of India), and NIMHANS clinical guidelines.

CRITICAL RULES:
- NEVER diagnose. Say "may benefit from", "worth discussing with", "showing patterns of"
- Always be warm and strengths-focused. Lead with what is going well
- Ground observations in the specific answers provided — do not be generic
- Reference Indian healthcare resources (pediatrician, RBSK camps, NIMHANS) where appropriate
- Keep language simple — parents may not have medical backgrounds
- Do not exceed 120 words per field

You MUST respond with ONLY valid JSON in exactly this format (no markdown, no explanation outside):
{
  "reassurance": "A warm, specific 2-3 sentence message about what is going well based on the actual responses",
  "observation": "A gentle 2-3 sentence observation grounded in the specific answers given",
  "normalization": "A 1-2 sentence normalizing message about developmental variation",
  "guidance": ["First specific actionable tip", "Second specific actionable tip", "Third specific actionable tip"]
}`;

type RiskLevel = "low" | "medium" | "high";

interface RequestBody {
  child: { name: string; age: number };
  answers: Record<string, string>;
}

function buildFallbackInsights(
  childName: string,
  riskLevel: RiskLevel,
  strengths: string[],
  developing: string[]
) {
  const name = childName;

  const reassurance: Record<RiskLevel, string> = {
    low: `${name} is showing wonderful developmental responses across the areas observed. The patterns you've described reflect a child who is engaged, curious, and connected to the world around them. You're doing a beautiful job.`,
    medium: `${name} is showing real strengths in several areas — and every child develops at their own wonderful pace. The areas you've noticed are simply opportunities to provide some extra playful attention and care.`,
    high: `You're doing something powerful just by paying close attention to ${name}'s development. Early awareness is the most important first step, and you are already advocating beautifully for your child.`,
  };

  const observation: Record<RiskLevel, string> = {
    low: strengths.length > 0
      ? `${name} is showing clear strengths in ${strengths.slice(0, 2).join(" and ")}, which are excellent signs for overall development. Keep weaving these moments of connection into your daily routine.`
      : `${name}'s responses indicate healthy, age-appropriate development across the areas observed. Continue the wonderful engagement you're already providing.`,
    medium: developing.length > 0
      ? `${name} is showing some emerging areas in ${developing.slice(0, 2).join(" and ")} that may benefit from a little extra nurturing attention. These are gentle observations — not causes for alarm.`
      : `${name}'s responses show a mixed picture that is worth monitoring with support from your paediatrician at the next visit.`,
    high: `Some responses in the screening suggest ${name} could benefit from a professional developmental assessment. Early support and intervention lead to the very best outcomes, so reaching out to a specialist is a positive and proactive step.`,
  };

  const normalization =
    "Developmental timelines vary widely between children. This screening is an observation tool only — not a medical diagnosis. Your paediatrician can provide complete guidance tailored to your child.";

  const guidance: Record<RiskLevel, string[]> = {
    low: [
      "Keep up your wonderful daily routines — consistent rhythm supports all areas of development.",
      "Read together daily and narrate what you see around the house to enrich language and connection.",
      "Share these positive observations with your paediatrician at the next well-child visit.",
    ],
    medium: [
      "Try 10 minutes of face-to-face floor play daily — follow your child's lead and narrate what they do.",
      "Ask your paediatrician about a developmental follow-up at your next RBSK camp or well-child visit.",
      "Reduce background screen time during meals and play to create more space for interaction.",
    ],
    high: [
      "Request a comprehensive developmental assessment at your nearest RBSK health camp or government health centre.",
      "Consider reaching out to a developmental paediatrician or NIMHANS (Bangalore) for a specialist evaluation.",
      "Early intervention — speech therapy, occupational therapy — is most effective when started early. Ask your doctor for a referral today.",
    ],
  };

  return {
    reassurance: reassurance[riskLevel],
    observation: observation[riskLevel],
    normalization,
    guidance: guidance[riskLevel],
  };
}

export async function POST(request: Request) {
  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { child, answers } = body;
  if (!child?.name || answers == null) {
    return NextResponse.json({ error: "Missing required fields: child and answers" }, { status: 400 });
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

  // Build the questionnaire summary for Ollama
  const answerLines = QUESTIONS.map((q) => {
    const ans = answers[q.id] ?? "Not answered";
    const flag = q.isCritical ? " [M-CHAT-R critical]" : "";
    return `- ${q.category}${flag}: ${ans}`;
  }).join("\n");

  const userPrompt = `Child: ${child.name}, age ${child.age} year${child.age !== 1 ? "s" : ""}.
Screening risk level: ${riskScore.level} (total score: ${riskScore.total}/40, critical item failures: ${riskScore.criticalFailures}).
Strength areas: ${strengths.join(", ") || "none clearly observed"}.
Areas needing support: ${developing.join(", ") || "none clearly observed"}.

Questionnaire responses:
${answerLines}

Please generate personalised, compassionate insights for this parent.`;

  // Attempt Ollama call
  try {
    const ollamaRes = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        stream: false,
        options: { temperature: 0.65, num_predict: 700 },
      }),
      signal: AbortSignal.timeout(20_000), // 20 second timeout
    });

    if (ollamaRes.ok) {
      const data = await ollamaRes.json();
      const content: string = data?.message?.content ?? "";

      // Extract JSON from the response (Mistral sometimes wraps it in markdown)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.reassurance && parsed.guidance) {
            return NextResponse.json({
              ...parsed,
              riskScore,
              source: "ollama",
            });
          }
        } catch {
          // JSON parse failed — fall through to rule-based
        }
      }
    }
  } catch {
    // Ollama not running or timed out — silently fall back
  }

  // Rule-based fallback
  const fallback = buildFallbackInsights(child.name, riskScore.level, strengths, developing);
  return NextResponse.json({
    ...fallback,
    riskScore,
    source: "rule-based",
  });
}
