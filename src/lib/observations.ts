/**
 * Structured Parent Observation Module for NeuroBee.
 *
 * Replaces video AI (Canvas Dx model) with a guided parent-administered
 * behavioural checklist — one scenario per M-CHAT-R domain.
 * Based on methodology from:
 *   - Wall et al. (2012) PLoS ONE — minimum feature sets for ASD detection
 *   - Haber et al. (2018) PLoS Medicine — non-expert coding of home video
 *   - Multi-modular AI approach (2020) Scientific Reports
 *
 * All functions are pure — no storage calls here.
 */

import { Domain } from "./questions";

// ── Types ────────────────────────────────────────────────────────────────────

export interface ObservationItem {
  id: string;           // e.g. "s1_i1"
  text: string;         // What the parent observes and ticks
  weight: number;       // 1 or 2 (critical items score double)
  isCritical: boolean;
  reversed: boolean;    // true = checking this item means NEGATIVE (score 0 when true)
}

export interface ObservationScenario {
  id: string;           // "s1" … "s6"
  domain: Domain;
  title: string;
  instruction: string;  // Exact parent script
  duration: string;
  setupNote: string;
  items: ObservationItem[];
}

export interface ObservationResult {
  score: number;        // 0–100 positive observation score (higher = better)
  domainBreakdown: Partial<Record<Domain, number>>; // 0–100 per domain
  itemsObserved: number;
  itemsTotal: number;
}

// ── Scenarios ────────────────────────────────────────────────────────────────

export const OBSERVATION_SCENARIOS: ObservationScenario[] = [
  {
    id: "s1",
    domain: "social_communication",
    title: "Name Response",
    instruction:
      "Stand approximately 2 metres behind your child while they are playing. Call their name in a normal conversational tone — not loudly, not in a sing-song voice. Do this 3 times with a 10-second gap between each call. Do not tap them or make any other sound.",
    duration: "3–5 minutes",
    setupNote: "Your child should be occupied with a toy and should not be able to see your face.",
    items: [
      {
        id: "s1_i1",
        text: "On at least one of the three calls, my child turned their head toward me",
        weight: 2,
        isCritical: true,
        reversed: false,
      },
      {
        id: "s1_i2",
        text: "When they looked, they made eye contact with me",
        weight: 1,
        isCritical: false,
        reversed: false,
      },
      {
        id: "s1_i3",
        text: "My child showed a positive facial expression (smile, recognition) when they saw me",
        weight: 1,
        isCritical: false,
        reversed: false,
      },
      {
        id: "s1_i4",
        text: "My child moved toward me or reached out after turning",
        weight: 1,
        isCritical: false,
        reversed: false,
      },
      {
        id: "s1_i5",
        text: "My child showed no response whatsoever to any of the three calls",
        weight: 2,
        isCritical: true,
        reversed: true, // checking this = negative signal
      },
    ],
  },
  {
    id: "s2",
    domain: "joint_attention",
    title: "Pointing Follow",
    instruction:
      "Sit beside your child. Point to an object across the room (a window, a favourite toy on a shelf) and say 'Look!' or 'See that?' clearly. Do NOT walk toward the object — only point with your finger. Try this 2–3 times pointing to different things.",
    duration: "3–5 minutes",
    setupNote: "Choose interesting objects at least 2 metres away. Stay seated beside your child.",
    items: [
      {
        id: "s2_i1",
        text: "My child looked in the direction I was pointing (not just at my hand or finger)",
        weight: 2,
        isCritical: true,
        reversed: false,
      },
      {
        id: "s2_i2",
        text: "My child's gaze reached approximately where I was pointing",
        weight: 1,
        isCritical: false,
        reversed: false,
      },
      {
        id: "s2_i3",
        text: "My child looked back at me after looking at the object (gaze alternation)",
        weight: 2,
        isCritical: true,
        reversed: false,
      },
      {
        id: "s2_i4",
        text: "My child pointed at something themselves to show me",
        weight: 1,
        isCritical: false,
        reversed: false,
      },
      {
        id: "s2_i5",
        text: "My child made a sound or gesture toward the same object I pointed to",
        weight: 1,
        isCritical: false,
        reversed: false,
      },
      {
        id: "s2_i6",
        text: "My child checked my face to see my reaction",
        weight: 1,
        isCritical: false,
        reversed: false,
      },
    ],
  },
  {
    id: "s3",
    domain: "imitation_play",
    title: "Imitation Game",
    instruction:
      "Sit face to face with your child. Perform these 4 simple actions one at a time, pausing 5 seconds after each to watch if your child copies: (1) clap your hands twice, (2) wave hello, (3) make a 'brr' sound while shaking your head, (4) tap the table three times slowly.",
    duration: "4–5 minutes",
    setupNote: "No props needed. Child should be calm, facing you, not distracted by a toy.",
    items: [
      {
        id: "s3_i1",
        text: "My child copied at least one action within 5 seconds of me doing it",
        weight: 2,
        isCritical: true,
        reversed: false,
      },
      {
        id: "s3_i2",
        text: "My child copied 2 or more of the 4 actions",
        weight: 1,
        isCritical: false,
        reversed: false,
      },
      {
        id: "s3_i3",
        text: "My child attempted to copy even if not perfectly accurate",
        weight: 1,
        isCritical: false,
        reversed: false,
      },
      {
        id: "s3_i4",
        text: "My child watched my face and hands attentively while I performed the actions",
        weight: 1,
        isCritical: false,
        reversed: false,
      },
      {
        id: "s3_i5",
        text: "My child did a new action for me to copy back (turned it into a game)",
        weight: 1,
        isCritical: false,
        reversed: false,
      },
    ],
  },
  {
    id: "s4",
    domain: "language",
    title: "Simple Instructions",
    instruction:
      "Without pointing or gesturing — words only — give your child these 3 instructions one at a time, waiting 15 seconds between each: (1) 'Bring me your shoe', (2) 'Put the ball on the table', (3) 'Sit down.' Watch whether they respond to the spoken words alone.",
    duration: "5 minutes",
    setupNote: "A shoe and a ball should be visible in the room before you start.",
    items: [
      {
        id: "s4_i1",
        text: "My child responded to at least one instruction by attempting the action",
        weight: 2,
        isCritical: true,
        reversed: false,
      },
      {
        id: "s4_i2",
        text: "My child completed 2 or more instructions correctly",
        weight: 1,
        isCritical: false,
        reversed: false,
      },
      {
        id: "s4_i3",
        text: "My child looked at the object I named when I said it",
        weight: 1,
        isCritical: false,
        reversed: false,
      },
      {
        id: "s4_i4",
        text: "My child used a word, phrase, or gesture to communicate something to me during this time",
        weight: 1,
        isCritical: false,
        reversed: false,
      },
      {
        id: "s4_i5",
        text: "My child initiated conversation or made a directed sound at me",
        weight: 1,
        isCritical: false,
        reversed: false,
      },
      {
        id: "s4_i6",
        text: "My child pointed or reached to ask for something they wanted",
        weight: 1,
        isCritical: false,
        reversed: false,
      },
    ],
  },
  {
    id: "s5",
    domain: "motor",
    title: "Movement Observation",
    instruction:
      "Encourage your child to do these activities one at a time: (1) walk across the room and back, (2) pick up a small coin-sized object from the floor, (3) kick a ball, (4) scribble with a crayon on paper.",
    duration: "5–7 minutes",
    setupNote: "Have a ball, a small safe object (like a bottle cap), and crayons + paper ready.",
    items: [
      {
        id: "s5_i1",
        text: "My child walked steadily without frequent stumbling or falling",
        weight: 1,
        isCritical: false,
        reversed: false,
      },
      {
        id: "s5_i2",
        text: "My child picked up the small object using a pincer grip (thumb + one finger)",
        weight: 1,
        isCritical: false,
        reversed: false,
      },
      {
        id: "s5_i3",
        text: "My child kicked the ball with some coordination",
        weight: 1,
        isCritical: false,
        reversed: false,
      },
      {
        id: "s5_i4",
        text: "My child held the crayon and made intentional marks on the paper",
        weight: 1,
        isCritical: false,
        reversed: false,
      },
      {
        id: "s5_i5",
        text: "My child showed interest in what they had drawn or created",
        weight: 1,
        isCritical: false,
        reversed: false,
      },
    ],
  },
  {
    id: "s6",
    domain: "sensory_behavioral",
    title: "Sensory & Flexibility",
    instruction:
      "Over the next 20–30 minutes of normal play, observe your child in these 3 situations: (1) when you clap your hands sharply once from behind them (unexpected sound), (2) when you stop a preferred activity before they are ready, (3) when you introduce a new toy they have never seen.",
    duration: "20–30 minutes (passive observation)",
    setupNote:
      "The new toy should genuinely be one they have not seen before. You do not need to do all three at once.",
    items: [
      {
        id: "s6_i1",
        text: "After the sudden sound, my child reacted briefly but settled within about 30 seconds",
        weight: 1,
        isCritical: false,
        reversed: false,
      },
      {
        id: "s6_i2",
        text: "My child's reaction to the sound was proportionate — not extreme distress, not completely absent",
        weight: 1,
        isCritical: false,
        reversed: false,
      },
      {
        id: "s6_i3",
        text: "When I stopped the preferred activity, my child protested but shifted focus within 2 minutes",
        weight: 1,
        isCritical: false,
        reversed: false,
      },
      {
        id: "s6_i4",
        text: "My child approached the new toy with curiosity rather than extreme distress or complete indifference",
        weight: 1,
        isCritical: false,
        reversed: false,
      },
      {
        id: "s6_i5",
        text: "My child's play during this time varied — they didn't repeat the exact same action continuously for more than 3 minutes",
        weight: 1,
        isCritical: false,
        reversed: false,
      },
      {
        id: "s6_i6",
        text: "My child was able to calm down after any upset without needing prolonged adult intervention",
        weight: 1,
        isCritical: false,
        reversed: false,
      },
    ],
  },
];

// ── Scoring ──────────────────────────────────────────────────────────────────

export function computeObservationScore(
  answers: Record<string, boolean>
): ObservationResult {
  let totalEarned = 0;
  let totalPossible = 0;
  let itemsObserved = 0;
  const domainEarned: Partial<Record<Domain, number>> = {};
  const domainPossible: Partial<Record<Domain, number>> = {};

  for (const scenario of OBSERVATION_SCENARIOS) {
    const d = scenario.domain;
    if (!domainEarned[d]) { domainEarned[d] = 0; domainPossible[d] = 0; }

    for (const item of scenario.items) {
      const checked = answers[item.id] ?? false;
      totalPossible += item.weight;
      domainPossible[d]! += item.weight;

      let earned: number;
      if (item.reversed) {
        // Reversed: checking it is a NEGATIVE signal — earns 0
        earned = checked ? 0 : item.weight;
      } else {
        earned = checked ? item.weight : 0;
      }

      totalEarned += earned;
      domainEarned[d]! += earned;
      if (checked && !item.reversed) itemsObserved++;
    }
  }

  const score = totalPossible > 0
    ? Math.round((totalEarned / totalPossible) * 100)
    : 0;

  const domainBreakdown: Partial<Record<Domain, number>> = {};
  for (const [domain, earned] of Object.entries(domainEarned) as [Domain, number][]) {
    const possible = domainPossible[domain] ?? 0;
    domainBreakdown[domain] = possible > 0 ? Math.round((earned / possible) * 100) : 0;
  }

  const itemsTotal = OBSERVATION_SCENARIOS.reduce(
    (sum, s) => sum + s.items.filter((i) => !i.reversed).length,
    0
  );

  return { score, domainBreakdown, itemsObserved, itemsTotal };
}
