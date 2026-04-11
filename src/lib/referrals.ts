/**
 * India Developmental Referral Network for NeuroBee.
 *
 * Curated list of accessible referral resources for parents of children
 * showing developmental concerns. Covers government (RBSK/NHM), NGO, and
 * private clinical network pathways across 7 major states + national resources.
 *
 * Data verified as of 2024–2025. Always confirm contact details before sharing
 * in a production release.
 */

export type ReferralType = "government" | "ngo" | "private_network" | "helpline";
export type RiskLevel = "low" | "medium" | "high";
export type Urgency = "routine" | "priority" | "urgent";

export interface ReferralResource {
  id: string;
  name: string;
  type: ReferralType;
  state: string;          // Indian state name or "National"
  city?: string;
  phone: string[];
  address?: string;
  website?: string;
  whatToSay: string;      // Parent script for when they call
  documentsToBring: string[];
  riskLevels: RiskLevel[]; // Which risk levels this resource is surfaced for
  urgency: Urgency;
  notes?: string;
}

export const REFERRAL_RESOURCES: ReferralResource[] = [
  // ── National ──────────────────────────────────────────────────────────────
  {
    id: "national_rbsk",
    name: "RBSK (Rashtriya Bal Swasthya Karyakram) Helpline",
    type: "government",
    state: "National",
    phone: ["104"],
    website: "https://rbsk.gov.in",
    whatToSay:
      "I am calling about my child who is [age] years old. I have completed a developmental screening and have concerns about their development. I would like to know the nearest RBSK camp or District Early Intervention Centre (DEIC) in my area.",
    documentsToBring: [
      "Child's Aadhaar card or birth certificate",
      "Immunisation record / health card",
      "Any previous medical or developmental reports",
    ],
    riskLevels: ["low", "medium", "high"],
    urgency: "routine",
    notes: "Free government service. Mobile health teams visit schools and anganwadis. Ask for DEIC referral.",
  },
  {
    id: "national_nimhans",
    name: "NIMHANS Child & Adolescent Psychiatry",
    type: "government",
    state: "National",
    city: "Bangalore",
    phone: ["080-46110007", "080-46110008"],
    website: "https://nimhans.ac.in",
    address: "Hosur Road, Lakkasandra, Bangalore – 560029",
    whatToSay:
      "I would like to book an appointment in the Child and Adolescent Psychiatry outpatient department. My child is [age] years old and I have concerns about their developmental milestones. I have completed an M-CHAT-R screening.",
    documentsToBring: [
      "Referral letter from a paediatrician (preferred but not always required)",
      "Child's birth certificate",
      "Any previous developmental or psychological assessments",
      "School reports (if applicable)",
    ],
    riskLevels: ["medium", "high"],
    urgency: "priority",
    notes: "National apex centre. Long wait times expected — call early. Also has telemedicine appointments.",
  },
  {
    id: "national_afa",
    name: "Action for Autism (AFA) — National Helpline",
    type: "ngo",
    state: "National",
    phone: ["011-40540991", "011-40540992"],
    website: "https://autism-india.org",
    address: "Community Centre, Pocket 7&8, Jasola Vihar, New Delhi – 110025",
    whatToSay:
      "I am a parent and I have concerns about my child's development. I have completed a developmental screening and my child may have autism. I need guidance on assessment, early intervention, and support resources in my city.",
    documentsToBring: [],
    riskLevels: ["medium", "high"],
    urgency: "priority",
    notes: "Provides parent guidance, training, and referral navigation. Satellite programs in multiple cities.",
  },
  {
    id: "national_vandrevala",
    name: "Vandrevala Foundation Mental Health Helpline",
    type: "helpline",
    state: "National",
    phone: ["1860-2662-345"],
    website: "https://vandrevalafoundation.com",
    whatToSay:
      "I am a parent experiencing stress related to my child's developmental concerns and need support.",
    documentsToBring: [],
    riskLevels: ["low", "medium", "high"],
    urgency: "routine",
    notes: "For parental mental health support. Free, 24/7, available in multiple Indian languages.",
  },

  // ── Maharashtra ───────────────────────────────────────────────────────────
  {
    id: "mh_ummeed",
    name: "Ummeed Child Development Centre",
    type: "ngo",
    state: "Maharashtra",
    city: "Mumbai",
    phone: ["022-26435557"],
    website: "https://ummeed.org",
    address: "34 Linking Road, Bandra West, Mumbai – 400050",
    whatToSay:
      "I would like to book a developmental assessment for my child who is [age] years old. I have completed an M-CHAT-R screening showing [low/medium/high] concern. I am looking for a comprehensive assessment and guidance on next steps.",
    documentsToBring: [
      "Child's birth certificate",
      "Immunisation records",
      "Any previous assessments or reports",
      "School reports (if applicable)",
    ],
    riskLevels: ["medium", "high"],
    urgency: "priority",
    notes: "Specialist centre for developmental disabilities. Offers OT, speech therapy, psychology, and parent training.",
  },
  {
    id: "mh_kem",
    name: "KEM Hospital — Paediatric Neurology",
    type: "government",
    state: "Maharashtra",
    city: "Mumbai",
    phone: ["022-24107000"],
    address: "Acharya Donde Marg, Parel, Mumbai – 400012",
    whatToSay:
      "I would like an appointment in the Paediatric Neurology or Developmental Paediatrics outpatient department. My child is [age] and I have developmental concerns. I have a screening report.",
    documentsToBring: [
      "Referral letter from a paediatrician",
      "Child's health card / Aadhaar",
      "Previous reports",
    ],
    riskLevels: ["medium", "high"],
    urgency: "priority",
    notes: "Government hospital. Subsidised rates. Expect long wait times — arrive early.",
  },
  {
    id: "mh_rbsk",
    name: "Maharashtra RBSK / DEIC",
    type: "government",
    state: "Maharashtra",
    phone: ["104"],
    whatToSay:
      "I need to find the nearest District Early Intervention Centre (DEIC) in my district in Maharashtra for my child's developmental assessment.",
    documentsToBring: [
      "Child's Aadhaar or birth certificate",
      "Ration card or address proof",
    ],
    riskLevels: ["low", "medium", "high"],
    urgency: "routine",
  },

  // ── Delhi / NCT ───────────────────────────────────────────────────────────
  {
    id: "dl_afa",
    name: "Action for Autism — Delhi Centre",
    type: "ngo",
    state: "Delhi",
    city: "New Delhi",
    phone: ["011-40540991"],
    website: "https://autism-india.org",
    address: "Community Centre, Pocket 7&8, Jasola Vihar, New Delhi – 110025",
    whatToSay:
      "I am a parent of a [age]-year-old with developmental concerns. I completed an M-CHAT-R screening. I need guidance on assessment and early intervention options in Delhi.",
    documentsToBring: [],
    riskLevels: ["medium", "high"],
    urgency: "priority",
    notes: "India's premier autism advocacy NGO. Offers parent workshops, training, and assessment referrals.",
  },
  {
    id: "dl_aiims",
    name: "AIIMS — Division of Paediatric Neurology",
    type: "government",
    state: "Delhi",
    city: "New Delhi",
    phone: ["011-26588500"],
    website: "https://aiims.edu",
    address: "Sri Aurobindo Marg, Ansari Nagar, New Delhi – 110029",
    whatToSay:
      "I would like to register for an appointment in Paediatric Neurology or Developmental Paediatrics. My child is [age] with developmental delay concerns. I have a parent screening report.",
    documentsToBring: [
      "Referral letter from a paediatrician",
      "Child's Aadhaar card",
      "All previous medical records",
    ],
    riskLevels: ["high"],
    urgency: "urgent",
    notes: "Apex institution. Very high demand — contact for OPD registration process. Some slots via online portal.",
  },
  {
    id: "dl_rbsk",
    name: "Delhi RBSK / DEIC",
    type: "government",
    state: "Delhi",
    phone: ["011-23322152"],
    whatToSay:
      "I need to find the District Early Intervention Centre (DEIC) serving my area in Delhi for a free developmental assessment for my child.",
    documentsToBring: [
      "Child's Aadhaar or birth certificate",
      "Address proof",
    ],
    riskLevels: ["low", "medium", "high"],
    urgency: "routine",
    notes: "Directorate of Health Services, Delhi. Free government service.",
  },

  // ── Karnataka ─────────────────────────────────────────────────────────────
  {
    id: "ka_nimhans",
    name: "NIMHANS — Child & Adolescent Psychiatry OPD",
    type: "government",
    state: "Karnataka",
    city: "Bangalore",
    phone: ["080-46110007"],
    website: "https://nimhans.ac.in",
    address: "Hosur Road, Lakkasandra, Bangalore – 560029",
    whatToSay:
      "I want to register for the Child and Adolescent Psychiatry outpatient clinic. My child is [age] years old and I have completed an M-CHAT-R developmental screening showing [level] concern.",
    documentsToBring: [
      "Referral letter from a paediatrician (strongly recommended)",
      "Child's Aadhaar and birth certificate",
      "All previous assessments",
      "School report card (if school-age)",
    ],
    riskLevels: ["medium", "high"],
    urgency: "priority",
    notes: "National apex centre for mental health. Monday–Friday OPD. Telemedicine available.",
  },
  {
    id: "ka_spastics",
    name: "Spastics Society of Karnataka (NIMH)",
    type: "ngo",
    state: "Karnataka",
    city: "Bangalore",
    phone: ["080-26613177"],
    address: "No.31, 4th T Block, Jayanagar, Bangalore – 560041",
    whatToSay:
      "I am a parent with concerns about my [age]-year-old child's development. I need information about assessment services and therapy for developmental disabilities.",
    documentsToBring: [
      "Child's birth certificate",
      "Any previous reports",
    ],
    riskLevels: ["medium", "high"],
    urgency: "priority",
  },
  {
    id: "ka_rbsk",
    name: "Karnataka RBSK / DEIC",
    type: "government",
    state: "Karnataka",
    phone: ["104"],
    whatToSay:
      "I need the nearest District Early Intervention Centre (DEIC) in Karnataka for a free developmental screening and early intervention for my child.",
    documentsToBring: ["Child's Aadhaar or birth certificate"],
    riskLevels: ["low", "medium", "high"],
    urgency: "routine",
  },

  // ── Tamil Nadu ────────────────────────────────────────────────────────────
  {
    id: "tn_vidyasagar",
    name: "Vidya Sagar (formerly Spastics Society of India)",
    type: "ngo",
    state: "Tamil Nadu",
    city: "Chennai",
    phone: ["044-42044700"],
    website: "https://vidyasagar.net",
    address: "New No.1, Ranjith Road, Kotturpuram, Chennai – 600085",
    whatToSay:
      "I am a parent of a [age]-year-old child and I have completed a developmental screening with concerning results. I am looking for a developmental assessment and early intervention services.",
    documentsToBring: [
      "Child's birth certificate",
      "Immunisation records",
      "Any previous reports or assessments",
    ],
    riskLevels: ["medium", "high"],
    urgency: "priority",
    notes: "One of India's leading disability organisations. Offers comprehensive assessment, therapy, and parent training.",
  },
  {
    id: "tn_ich",
    name: "Institute of Child Health — Developmental Paediatrics",
    type: "government",
    state: "Tamil Nadu",
    city: "Chennai",
    phone: ["044-28193327"],
    address: "188 Poonamallee High Road, Nungambakkam, Chennai – 600086",
    whatToSay:
      "I want an appointment in Developmental Paediatrics. My child is [age] with concerns identified in a screening. I have a parent-reported M-CHAT-R assessment.",
    documentsToBring: [
      "Referral letter from paediatrician",
      "Child's health records and Aadhaar",
    ],
    riskLevels: ["medium", "high"],
    urgency: "priority",
  },
  {
    id: "tn_rbsk",
    name: "Tamil Nadu RBSK Helpline",
    type: "government",
    state: "Tamil Nadu",
    phone: ["104"],
    whatToSay:
      "I need the nearest RBSK camp or District Early Intervention Centre (DEIC) in Tamil Nadu for my [age]-year-old child's developmental assessment.",
    documentsToBring: ["Child's Aadhaar or birth certificate"],
    riskLevels: ["low", "medium", "high"],
    urgency: "routine",
  },

  // ── West Bengal ───────────────────────────────────────────────────────────
  {
    id: "wb_ich",
    name: "Institute of Child Health — Kolkata",
    type: "government",
    state: "West Bengal",
    city: "Kolkata",
    phone: ["033-22853704"],
    address: "11 Dr Biresh Guha Street, Kolkata – 700017",
    whatToSay:
      "I want an appointment in the Developmental Paediatrics or Child Neurology department. My child is [age] with developmental concerns from a parent screening.",
    documentsToBring: [
      "Referral letter from paediatrician",
      "Child's health records",
    ],
    riskLevels: ["medium", "high"],
    urgency: "priority",
  },
  {
    id: "wb_sskm",
    name: "SSKM Hospital — Developmental Paediatrics",
    type: "government",
    state: "West Bengal",
    city: "Kolkata",
    phone: ["033-22041289"],
    address: "244 AJC Bose Road, Kolkata – 700020",
    whatToSay:
      "I would like to register for Developmental Paediatrics OPD for my [age]-year-old child who has shown developmental concerns on screening.",
    documentsToBring: [
      "Referral letter",
      "Aadhaar card",
      "Previous medical records",
    ],
    riskLevels: ["high"],
    urgency: "urgent",
  },
  {
    id: "wb_rbsk",
    name: "West Bengal RBSK / DEIC",
    type: "government",
    state: "West Bengal",
    phone: ["033-22875060"],
    whatToSay:
      "I need to reach the District Early Intervention Centre (DEIC) nearest to me in West Bengal for a free developmental assessment.",
    documentsToBring: ["Child's Aadhaar or birth certificate", "Ration card"],
    riskLevels: ["low", "medium", "high"],
    urgency: "routine",
    notes: "WBHS (West Bengal Health Services).",
  },

  // ── Telangana ─────────────────────────────────────────────────────────────
  {
    id: "tg_gandhi",
    name: "Gandhi Hospital — Paediatric Department",
    type: "government",
    state: "Telangana",
    city: "Hyderabad",
    phone: ["040-23456005"],
    address: "Musheerabad, Hyderabad – 500003",
    whatToSay:
      "I need to see a developmental paediatrician. My child is [age] with concerns identified on a developmental screening. I have a parent-completed M-CHAT-R report.",
    documentsToBring: [
      "Aadhaar card",
      "Child's health records",
      "Referral if available",
    ],
    riskLevels: ["medium", "high"],
    urgency: "priority",
  },
  {
    id: "tg_niloufer",
    name: "Niloufer Hospital — Child Development Unit",
    type: "government",
    state: "Telangana",
    city: "Hyderabad",
    phone: ["040-24601770"],
    address: "Red Hills, Lakdi-ka-pul, Hyderabad – 500004",
    whatToSay:
      "I would like to visit the Child Development Unit for my [age]-year-old child who has developmental concerns.",
    documentsToBring: [
      "Child's Aadhaar",
      "Health records",
    ],
    riskLevels: ["medium", "high"],
    urgency: "priority",
    notes: "Specialist children's hospital. Child Development Unit handles neurodevelopmental assessments.",
  },
  {
    id: "tg_rbsk",
    name: "Telangana RBSK / NHM",
    type: "government",
    state: "Telangana",
    phone: ["040-23201066"],
    whatToSay:
      "I need information about RBSK screening camps and the District Early Intervention Centre (DEIC) for my child in Telangana.",
    documentsToBring: ["Child's Aadhaar or birth certificate"],
    riskLevels: ["low", "medium", "high"],
    urgency: "routine",
    notes: "NHM Telangana office.",
  },

  // ── Gujarat ───────────────────────────────────────────────────────────────
  {
    id: "gj_civil",
    name: "Civil Hospital Ahmedabad — Paediatric Neurology",
    type: "government",
    state: "Gujarat",
    city: "Ahmedabad",
    phone: ["079-22681657"],
    address: "Asarwa, Ahmedabad – 380016",
    whatToSay:
      "I want to register for Paediatric Neurology or Developmental Paediatrics OPD. My child is [age] years old and I have completed a developmental screening with concerns.",
    documentsToBring: [
      "Aadhaar card",
      "Child's health card",
      "Any previous reports",
      "Referral letter if available",
    ],
    riskLevels: ["medium", "high"],
    urgency: "priority",
  },
  {
    id: "gj_rbsk",
    name: "Gujarat RBSK / Commissionerate of Health",
    type: "government",
    state: "Gujarat",
    phone: ["079-23242246"],
    whatToSay:
      "I need to find the nearest RBSK camp or District Early Intervention Centre (DEIC) for my child in Gujarat.",
    documentsToBring: ["Child's Aadhaar or birth certificate"],
    riskLevels: ["low", "medium", "high"],
    urgency: "routine",
    notes: "Commissionerate of Health, Medical Services & Medical Education, Gandhinagar.",
  },
];

// ── Helper functions ──────────────────────────────────────────────────────────

export const INDIAN_STATES = [
  "National",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
] as const;

export type IndianState = typeof INDIAN_STATES[number];

export function getReferralsForState(
  state: string,
  riskLevel: RiskLevel
): ReferralResource[] {
  const national = REFERRAL_RESOURCES.filter(
    (r) => r.state === "National" && r.riskLevels.includes(riskLevel)
  );
  const stateSpecific = state !== "National"
    ? REFERRAL_RESOURCES.filter(
        (r) => r.state === state && r.riskLevels.includes(riskLevel)
      )
    : [];

  // Sort: urgent first, then priority, then routine
  const sortOrder: Record<Urgency, number> = { urgent: 0, priority: 1, routine: 2 };
  const combined = [...stateSpecific, ...national].sort(
    (a, b) => sortOrder[a.urgency] - sortOrder[b.urgency]
  );

  return combined;
}

export const TYPE_LABELS: Record<ReferralType, string> = {
  government: "Government",
  ngo: "NGO",
  private_network: "Private Network",
  helpline: "Helpline",
};

export const URGENCY_LABELS: Record<Urgency, string> = {
  urgent: "Urgent",
  priority: "Priority",
  routine: "Routine",
};
