/**
 * NeuroBee Developmental Screening Questionnaire
 *
 * This questionnaire is aligned with:
 * 1. M-CHAT-R/F (Modified Checklist for Autism in Toddlers, Revised with Follow-Up)
 *    — Recommended by the Indian Academy of Pediatrics (IAP)
 * 2. RBSK (Rashtriya Bal Swasthya Karyakram) developmental milestone screening
 *    — National Health Mission (NHM), Ministry of Health & Family Welfare, Govt. of India
 * 3. NIMHANS clinical guidance on early neurodevelopmental observation
 *    — National Institute of Mental Health & Neurosciences (NIMHANS), Bangalore
 *
 * For use as a parent observation tool ONLY. Not a clinical diagnosis.
 * All responses should be discussed with a qualified paediatric professional.
 */

export type Domain =
  | "social_communication"
  | "joint_attention"
  | "imitation_play"
  | "language"
  | "motor"
  | "sensory_behavioral";

export interface Question {
  id: string;
  text: string;          // {name} is replaced with child's name
  category: string;
  domain: Domain;
  whyItMatters: string;  // {name} is replaced with child's name
  isCritical: boolean;   // M-CHAT-R critical items — higher weight in risk scoring
  section: string;       // Section heading shown in UI
}

export const QUESTIONS: Question[] = [
  // ── Section 1: Social Communication (M-CHAT-R aligned, IAP endorsed) ──────
  {
    id: "q1",
    text: "When you call {name}'s name, do they turn and look at you?",
    category: "Response to Name",
    domain: "social_communication",
    isCritical: true,
    section: "Social Communication",
    whyItMatters:
      "Consistently responding to their name is one of the earliest social milestones. It shows {name} is beginning to understand that they have a social identity and that others are communicating with them.",
  },
  {
    id: "q2",
    text: "When you smile at {name}, do they smile back?",
    category: "Social Smile",
    domain: "social_communication",
    isCritical: false,
    section: "Social Communication",
    whyItMatters:
      "The social smile indicates {name} is aware of your emotions and is motivated to share positive feelings — one of the earliest and most meaningful signs of emotional connection.",
  },
  {
    id: "q3",
    text: "Does {name} make eye contact when you talk or play together?",
    category: "Eye Contact",
    domain: "social_communication",
    isCritical: false,
    section: "Social Communication",
    whyItMatters:
      "Eye contact is how {name} reads your emotions, learns language, and builds trust. It is a key building block of communication and social development.",
  },
  {
    id: "q4",
    text: "Does {name} try to get your attention to share something they find interesting?",
    category: "Attention Sharing",
    domain: "social_communication",
    isCritical: false,
    section: "Social Communication",
    whyItMatters:
      "Seeking your attention to share something shows {name} understands that experiences are more enjoyable when shared — a foundational social motivation.",
  },

  // ── Section 2: Joint Attention (M-CHAT-R Critical Items) ──────────────────
  {
    id: "q5",
    text: "When you point at something across the room, does {name} look at what you are pointing to?",
    category: "Gaze Following",
    domain: "joint_attention",
    isCritical: true,
    section: "Joint Attention",
    whyItMatters:
      "Following a point is a crucial joint attention skill. It shows {name} understands that you are directing their attention to something — a key precursor to language and shared learning.",
  },
  {
    id: "q6",
    text: "Does {name} point with one finger to show you something interesting?",
    category: "Declarative Pointing",
    domain: "joint_attention",
    isCritical: true,
    section: "Joint Attention",
    whyItMatters:
      "Pointing to share (declarative pointing) is one of the strongest early indicators of communication development. It shows {name} wants to share their world with you.",
  },
  {
    id: "q7",
    text: "Does {name} bring or hold up objects to show you?",
    category: "Showing & Sharing",
    domain: "joint_attention",
    isCritical: true,
    section: "Joint Attention",
    whyItMatters:
      "Holding up objects to show you means {name} is engaging in proto-declarative communication — sharing experience intentionally, which directly supports language development.",
  },
  {
    id: "q8",
    text: "Does {name} look at your face to understand your reaction to something new?",
    category: "Social Referencing",
    domain: "joint_attention",
    isCritical: false,
    section: "Joint Attention",
    whyItMatters:
      "Social referencing shows {name} uses your emotional reactions as a guide for how to respond to the world — an important step in emotional learning and safety perception.",
  },

  // ── Section 3: Imitation & Play ───────────────────────────────────────────
  {
    id: "q9",
    text: "Does {name} copy or imitate simple actions or sounds you make?",
    category: "Imitation",
    domain: "imitation_play",
    isCritical: true,
    section: "Imitation & Play",
    whyItMatters:
      "Imitation is one of the most powerful learning mechanisms in early development. {name} copying you signals readiness to absorb new skills, language, and social behaviours.",
  },
  {
    id: "q10",
    text: "Does {name} engage in pretend or make-believe play?",
    category: "Symbolic Play",
    domain: "imitation_play",
    isCritical: false,
    section: "Imitation & Play",
    whyItMatters:
      "Pretend play reveals {name} can represent ideas mentally — a significant cognitive leap that supports language, creativity, and emotional understanding.",
  },
  {
    id: "q11",
    text: "Does {name} show interest in other children and interact with them?",
    category: "Peer Interest",
    domain: "imitation_play",
    isCritical: true,
    section: "Imitation & Play",
    whyItMatters:
      "Interest in peers reflects {name}'s growing motivation for social connection, which is essential for developing friendships and cooperative learning.",
  },
  {
    id: "q12",
    text: "Does {name} use toys in a purposeful, varied way rather than only repeating the same action?",
    category: "Functional Play",
    domain: "imitation_play",
    isCritical: false,
    section: "Imitation & Play",
    whyItMatters:
      "Varied, purposeful play indicates {name} is exploring the world with curiosity and flexibility — markers of healthy cognitive development.",
  },

  // ── Section 4: Language & Communication (RBSK, NHM Guidelines) ───────────
  {
    id: "q13",
    text: "Does {name} use words, phrases, or gestures to express their needs and thoughts?",
    category: "Expressive Language",
    domain: "language",
    isCritical: false,
    section: "Language & Communication",
    whyItMatters:
      "Using any intentional form of communication — words, signs, or gestures — shows {name} understands that they can express themselves to influence the world around them.",
  },
  {
    id: "q14",
    text: "Does {name} understand and follow simple instructions (e.g., 'bring the ball', 'sit down')?",
    category: "Receptive Language",
    domain: "language",
    isCritical: false,
    section: "Language & Communication",
    whyItMatters:
      "Following instructions demonstrates {name}'s ability to process and understand spoken language — a critical foundation for learning in school and social settings.",
  },
  {
    id: "q15",
    text: "Does {name} initiate conversations or interactions with familiar people?",
    category: "Communication Initiative",
    domain: "language",
    isCritical: false,
    section: "Language & Communication",
    whyItMatters:
      "Initiating communication shows {name} is developing confidence and social motivation — they understand that conversations are a way to connect with others.",
  },

  // ── Section 5: Motor Development (RBSK Milestones) ───────────────────────
  {
    id: "q16",
    text: "Does {name} walk, run, and climb with reasonable coordination?",
    category: "Gross Motor",
    domain: "motor",
    isCritical: false,
    section: "Motor Development",
    whyItMatters:
      "Gross motor skills reflect {name}'s neurological development and body awareness. Coordination difficulties can sometimes indicate underlying developmental differences worth monitoring.",
  },
  {
    id: "q17",
    text: "Does {name} use their hands skillfully for tasks like drawing, stacking, or picking up small objects?",
    category: "Fine Motor",
    domain: "motor",
    isCritical: false,
    section: "Motor Development",
    whyItMatters:
      "Fine motor skills in {name} indicate brain-hand coordination and support readiness for writing, self-care, and cognitive learning tasks.",
  },

  // ── Section 6: Sensory & Behavioural (NIMHANS Guidance) ──────────────────
  {
    id: "q18",
    text: "Does {name} respond appropriately to everyday sounds — not overly distressed or completely unaware?",
    category: "Sensory Processing",
    domain: "sensory_behavioral",
    isCritical: false,
    section: "Sensory & Behaviour",
    whyItMatters:
      "Appropriate sensory responses show {name}'s nervous system is processing the environment in a balanced way. Extreme reactions in either direction can indicate sensory processing differences.",
  },
  {
    id: "q19",
    text: "Does {name} adapt reasonably when routines change or something unexpected happens?",
    category: "Behavioural Flexibility",
    domain: "sensory_behavioral",
    isCritical: false,
    section: "Sensory & Behaviour",
    whyItMatters:
      "Flexible adaptation to change shows {name}'s nervous system can tolerate and adjust to new information — an important aspect of emotional regulation and learning.",
  },
  {
    id: "q20",
    text: "Does {name}'s play and daily behaviour feel varied and spontaneous, rather than rigidly repetitive?",
    category: "Behavioural Variety",
    domain: "sensory_behavioral",
    isCritical: false,
    section: "Sensory & Behaviour",
    whyItMatters:
      "Varied, spontaneous behaviour indicates {name} is exploring the world flexibly. Rigid repetitive patterns, when persistent, can be an early indicator worth discussing with a paediatrician.",
  },
];

// ── Domain metadata ──────────────────────────────────────────────────────────

export const DOMAIN_LABELS: Record<Domain, string> = {
  social_communication: "Social Communication",
  joint_attention: "Joint Attention",
  imitation_play: "Imitation & Play",
  language: "Language",
  motor: "Motor Development",
  sensory_behavioral: "Sensory & Behaviour",
};

export const DOMAIN_ICONS: Record<Domain, string> = {
  social_communication: "diversity_3",
  joint_attention: "visibility",
  imitation_play: "child_care",
  language: "record_voice_over",
  motor: "fitness_center",
  sensory_behavioral: "psychology",
};

// ── Risk scoring ─────────────────────────────────────────────────────────────

export type RiskLevel = "low" | "medium" | "high";

export interface RiskScore {
  total: number;           // 0–40
  criticalFailures: number; // critical items answered "Rarely"
  level: RiskLevel;
  percentage: number;      // 0–100 (proportion of max risk)
}

export function computeRiskScore(answers: Record<string, string>): RiskScore {
  let total = 0;
  let criticalFailures = 0;
  let answeredCount = 0;

  for (const q of QUESTIONS) {
    const ans = answers[q.id];
    if (!ans) continue;
    answeredCount++;
    const points = ans === "Often" ? 0 : ans === "Sometimes" ? 1 : 2;
    total += points;
    if (q.isCritical && points === 2) criticalFailures++;
  }

  // Scale to number of answered questions to avoid penalising skipped items
  const maxPossible = answeredCount * 2;
  const percentage = maxPossible > 0 ? Math.round((total / maxPossible) * 100) : 0;

  let level: RiskLevel;
  if (total <= 8 && criticalFailures <= 1) {
    level = "low";
  } else if (total >= 17 || criticalFailures >= 3) {
    level = "high";
  } else {
    level = "medium";
  }

  return { total, criticalFailures, level, percentage };
}

// ── Sections (unique, ordered) ───────────────────────────────────────────────
export const SECTIONS = [...new Set(QUESTIONS.map((q) => q.section))];
