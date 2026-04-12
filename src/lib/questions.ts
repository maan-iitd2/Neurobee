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

// ── Hindi questions ───────────────────────────────────────────────────────────

export const QUESTIONS_HI: Question[] = [
  {
    id: "q1",
    text: "जब आप {name} का नाम पुकारते हैं, तो क्या वे आपकी ओर मुड़कर देखते हैं?",
    category: "नाम पर प्रतिक्रिया",
    domain: "social_communication",
    isCritical: true,
    section: "सामाजिक संवाद",
    whyItMatters: "नाम पर लगातार प्रतिक्रिया देना सबसे पहले आने वाले सामाजिक मील-पत्थरों में से एक है। यह दर्शाता है कि {name} यह समझने लगे हैं कि उनकी एक सामाजिक पहचान है और दूसरे उनसे संवाद कर रहे हैं।",
  },
  {
    id: "q2",
    text: "जब आप {name} पर मुस्कुराते हैं, तो क्या वे भी मुस्कुराते हैं?",
    category: "सामाजिक मुस्कान",
    domain: "social_communication",
    isCritical: false,
    section: "सामाजिक संवाद",
    whyItMatters: "सामाजिक मुस्कान यह दर्शाती है कि {name} आपकी भावनाओं से अवगत हैं और सकारात्मक भावनाएँ साझा करने में रुचि रखते हैं — यह भावनात्मक जुड़ाव का सबसे शुरुआती संकेत है।",
  },
  {
    id: "q3",
    text: "जब आप बात करते या खेलते हैं, तो क्या {name} आँखें मिलाकर देखते हैं?",
    category: "नज़र मिलाना",
    domain: "social_communication",
    isCritical: false,
    section: "सामाजिक संवाद",
    whyItMatters: "आँखें मिलाने से {name} आपकी भावनाएँ पढ़ते हैं, भाषा सीखते हैं और विश्वास बनाते हैं। यह संवाद और सामाजिक विकास का एक प्रमुख आधार है।",
  },
  {
    id: "q4",
    text: "क्या {name} अपनी रुचि की किसी चीज़ को साझा करने के लिए आपका ध्यान खींचने की कोशिश करते हैं?",
    category: "ध्यान साझा करना",
    domain: "social_communication",
    isCritical: false,
    section: "सामाजिक संवाद",
    whyItMatters: "कुछ साझा करने के लिए आपका ध्यान खींचना यह दर्शाता है कि {name} समझते हैं कि अनुभव साझा करने से वे और अधिक आनंददायक होते हैं — एक बुनियादी सामाजिक प्रेरणा।",
  },
  {
    id: "q5",
    text: "जब आप कमरे में किसी चीज़ की ओर इशारा करते हैं, तो क्या {name} उस दिशा में देखते हैं?",
    category: "दृष्टि का अनुसरण",
    domain: "joint_attention",
    isCritical: true,
    section: "संयुक्त ध्यान",
    whyItMatters: "इशारे का अनुसरण करना एक महत्वपूर्ण संयुक्त ध्यान कौशल है। यह दर्शाता है कि {name} समझते हैं कि आप उनका ध्यान किसी चीज़ की ओर निर्देशित कर रहे हैं — भाषा और साझा सीखने का प्रमुख आधार।",
  },
  {
    id: "q6",
    text: "क्या {name} एक उँगली से किसी रोचक चीज़ की ओर इशारा करते हैं?",
    category: "घोषणात्मक इशारा",
    domain: "joint_attention",
    isCritical: true,
    section: "संयुक्त ध्यान",
    whyItMatters: "साझा करने के लिए इशारा करना संवाद विकास के सबसे मजबूत शुरुआती संकेतकों में से एक है। यह दर्शाता है कि {name} अपनी दुनिया आपके साथ साझा करना चाहते हैं।",
  },
  {
    id: "q7",
    text: "क्या {name} आपको दिखाने के लिए वस्तुएँ उठाकर लाते हैं?",
    category: "दिखाना और साझा करना",
    domain: "joint_attention",
    isCritical: true,
    section: "संयुक्त ध्यान",
    whyItMatters: "वस्तुएँ दिखाने के लिए उठाना दर्शाता है कि {name} जानबूझकर अनुभव साझा कर रहे हैं, जो भाषा विकास को सीधे सहायता देता है।",
  },
  {
    id: "q8",
    text: "क्या {name} किसी नई चीज़ के प्रति आपकी प्रतिक्रिया समझने के लिए आपके चेहरे की ओर देखते हैं?",
    category: "सामाजिक संदर्भ",
    domain: "joint_attention",
    isCritical: false,
    section: "संयुक्त ध्यान",
    whyItMatters: "सामाजिक संदर्भ दर्शाता है कि {name} दुनिया के प्रति अपनी प्रतिक्रिया तय करने के लिए आपकी भावनात्मक प्रतिक्रियाओं का उपयोग करते हैं — भावनात्मक सीखने का एक महत्वपूर्ण कदम।",
  },
  {
    id: "q9",
    text: "क्या {name} आपके द्वारा किए गए सरल कार्यों या आवाज़ों की नकल करते हैं?",
    category: "अनुकरण",
    domain: "imitation_play",
    isCritical: true,
    section: "अनुकरण और खेल",
    whyItMatters: "अनुकरण शुरुआती विकास में सबसे शक्तिशाली सीखने के तरीकों में से एक है। {name} का आपकी नकल करना नए कौशल, भाषा और सामाजिक व्यवहार ग्रहण करने की तत्परता दर्शाता है।",
  },
  {
    id: "q10",
    text: "क्या {name} काल्पनिक या नाटक-खेल में भाग लेते हैं?",
    category: "प्रतीकात्मक खेल",
    domain: "imitation_play",
    isCritical: false,
    section: "अनुकरण और खेल",
    whyItMatters: "काल्पनिक खेल दर्शाता है कि {name} विचारों को मानसिक रूप से प्रस्तुत कर सकते हैं — एक महत्वपूर्ण संज्ञानात्मक विकास जो भाषा, रचनात्मकता और भावनात्मक समझ को सहायता देता है।",
  },
  {
    id: "q11",
    text: "क्या {name} अन्य बच्चों में रुचि दिखाते हैं और उनके साथ बातचीत करते हैं?",
    category: "साथियों में रुचि",
    domain: "imitation_play",
    isCritical: true,
    section: "अनुकरण और खेल",
    whyItMatters: "साथियों में रुचि {name} की बढ़ती सामाजिक प्रेरणा को दर्शाती है, जो मित्रता बनाने और सहयोगात्मक सीखने के लिए आवश्यक है।",
  },
  {
    id: "q12",
    text: "क्या {name} खिलौनों का उपयोग विभिन्न तरीकों से करते हैं, न कि केवल एक ही क्रिया दोहराते हैं?",
    category: "कार्यात्मक खेल",
    domain: "imitation_play",
    isCritical: false,
    section: "अनुकरण और खेल",
    whyItMatters: "विविध, उद्देश्यपूर्ण खेल दर्शाता है कि {name} जिज्ञासा और लचीलेपन के साथ दुनिया की खोज कर रहे हैं — स्वस्थ संज्ञानात्मक विकास के संकेत।",
  },
  {
    id: "q13",
    text: "क्या {name} अपनी ज़रूरतें और विचार व्यक्त करने के लिए शब्दों, वाक्यांशों या इशारों का उपयोग करते हैं?",
    category: "अभिव्यंजक भाषा",
    domain: "language",
    isCritical: false,
    section: "भाषा और संवाद",
    whyItMatters: "किसी भी जानबूझकर संवाद के रूप का उपयोग — शब्द, संकेत, या इशारे — दर्शाता है कि {name} समझते हैं कि वे खुद को व्यक्त करके आसपास के वातावरण को प्रभावित कर सकते हैं।",
  },
  {
    id: "q14",
    text: "क्या {name} सरल निर्देशों को समझते और उनका पालन करते हैं (जैसे 'गेंद लाओ', 'बैठ जाओ')?",
    category: "ग्रहणशील भाषा",
    domain: "language",
    isCritical: false,
    section: "भाषा और संवाद",
    whyItMatters: "निर्देशों का पालन करना {name} की बोली हुई भाषा को समझने की क्षमता दर्शाता है — स्कूल और सामाजिक परिवेश में सीखने की एक महत्वपूर्ण नींव।",
  },
  {
    id: "q15",
    text: "क्या {name} परिचित लोगों के साथ बातचीत या संपर्क शुरू करते हैं?",
    category: "संवाद की पहल",
    domain: "language",
    isCritical: false,
    section: "भाषा और संवाद",
    whyItMatters: "संवाद शुरू करना दर्शाता है कि {name} आत्मविश्वास और सामाजिक प्रेरणा विकसित कर रहे हैं — वे समझते हैं कि बातचीत दूसरों से जुड़ने का एक तरीका है।",
  },
  {
    id: "q16",
    text: "क्या {name} उचित समन्वय के साथ चलते, दौड़ते और चढ़ते हैं?",
    category: "स्थूल मोटर",
    domain: "motor",
    isCritical: false,
    section: "शारीरिक विकास",
    whyItMatters: "स्थूल मोटर कौशल {name} के तंत्रिका संबंधी विकास और शरीर की जागरूकता को दर्शाते हैं। समन्वय में कठिनाइयाँ कभी-कभी विकासात्मक अंतर का संकेत दे सकती हैं।",
  },
  {
    id: "q17",
    text: "क्या {name} अपने हाथों का कुशलतापूर्वक उपयोग करते हैं — जैसे चित्र बनाना, ब्लॉक लगाना, या छोटी वस्तुएँ उठाना?",
    category: "सूक्ष्म मोटर",
    domain: "motor",
    isCritical: false,
    section: "शारीरिक विकास",
    whyItMatters: "{name} के सूक्ष्म मोटर कौशल मस्तिष्क-हस्त समन्वय को दर्शाते हैं और लेखन, स्व-देखभाल और संज्ञानात्मक सीखने के लिए तत्परता का समर्थन करते हैं।",
  },
  {
    id: "q18",
    text: "क्या {name} रोज़मर्रा की आवाज़ों पर उचित प्रतिक्रिया देते हैं — न बहुत परेशान होते हैं, न बिल्कुल अनजान?",
    category: "संवेदी प्रसंस्करण",
    domain: "sensory_behavioral",
    isCritical: false,
    section: "संवेदी और व्यवहार",
    whyItMatters: "उचित संवेदी प्रतिक्रियाएँ दर्शाती हैं कि {name} का तंत्रिका तंत्र वातावरण को संतुलित तरीके से संसाधित कर रहा है। किसी भी दिशा में अत्यधिक प्रतिक्रिया संवेदी प्रसंस्करण भिन्नताओं का संकेत दे सकती है।",
  },
  {
    id: "q19",
    text: "जब दिनचर्या बदलती है या कुछ अप्रत्याशित होता है, तो क्या {name} उचित तरीके से अनुकूलन करते हैं?",
    category: "व्यवहारगत लचीलापन",
    domain: "sensory_behavioral",
    isCritical: false,
    section: "संवेदी और व्यवहार",
    whyItMatters: "परिवर्तन के प्रति लचीला अनुकूलन दर्शाता है कि {name} का तंत्रिका तंत्र नई जानकारी को सहन और समायोजित कर सकता है — भावनात्मक नियमन और सीखने का एक महत्वपूर्ण पहलू।",
  },
  {
    id: "q20",
    text: "क्या {name} का खेल और दैनिक व्यवहार विविध और स्वाभाविक लगता है, न कि कठोर रूप से दोहराव वाला?",
    category: "व्यवहारगत विविधता",
    domain: "sensory_behavioral",
    isCritical: false,
    section: "संवेदी और व्यवहार",
    whyItMatters: "विविध, स्वाभाविक व्यवहार दर्शाता है कि {name} दुनिया को लचीलेपन से तलाश रहे हैं। जब कठोर दोहराव वाले व्यवहार लगातार बने रहें, तो वे बाल रोग विशेषज्ञ के साथ चर्चा के योग्य हो सकते हैं।",
  },
];

// Keep QUESTIONS_EN as alias for backward compat (used by API routes)
export { QUESTIONS as QUESTIONS_EN };

// ── Domain metadata ──────────────────────────────────────────────────────────

export const DOMAIN_LABELS: Record<Domain, string> = {
  social_communication: "Social Communication",
  joint_attention: "Joint Attention",
  imitation_play: "Imitation & Play",
  language: "Language",
  motor: "Motor Development",
  sensory_behavioral: "Sensory & Behaviour",
};

export const DOMAIN_LABELS_HI: Record<Domain, string> = {
  social_communication: "सामाजिक संवाद",
  joint_attention: "संयुक्त ध्यान",
  imitation_play: "अनुकरण और खेल",
  language: "भाषा विकास",
  motor: "शारीरिक विकास",
  sensory_behavioral: "संवेदी और व्यवहार",
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

