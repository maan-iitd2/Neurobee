/**
 * PDF Report Generator for NeuroBee.
 *
 * Generates a 5-section clinical handoff report for parents to share with
 * their paediatrician. Uses jsPDF + jspdf-autotable, dynamically imported
 * to avoid SSR issues (no window access on server).
 *
 * Disclaimer text is included on every section per IAP/RBSK/NIMHANS guidance
 * that parent-report screening tools must not be interpreted as clinical diagnosis.
 */

import { AppState, InsightSummary } from "@/context/AppContext";
import { QUESTIONS } from "@/lib/questions";
import { getReferralsForState } from "@/lib/referrals";
import { getLatestSession } from "@/lib/sessions";

interface AuthUser {
  parentName: string;
  childName: string;
  childDob: string;
  email: string;
}

const PRIMARY = [15, 107, 80] as [number, number, number];   // #0f6b50
const AMBER   = [180, 120, 0] as [number, number, number];
const GRAY    = [100, 100, 100] as [number, number, number];
const LIGHT   = [245, 251, 248] as [number, number, number];
const RED     = [180, 40, 40] as [number, number, number];

function riskColor(level: string): [number, number, number] {
  if (level === "low") return [15, 107, 80];
  if (level === "medium") return [140, 100, 0];
  return [180, 40, 40];
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric", month: "long", year: "numeric",
    });
  } catch { return dateStr; }
}

export async function generatePdfReport(
  user: AuthUser | null,
  state: AppState,
  insights: InsightSummary
): Promise<void> {
  // Dynamic imports — avoids SSR crash (jsPDF uses window)
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentW = W - margin * 2;

  const childName  = user?.childName ?? "Child";
  const parentName = user?.parentName ?? "Parent";
  const today      = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const latestSession = getLatestSession(state.sessions);
  const riskLevel  = latestSession?.fusedScore?.level ?? insights.riskScore.level;
  const fusedScore = latestSession?.fusedScore;

  // ── Helper: add header band ────────────────────────────────────────────────
  function addHeader(pageLabel: string) {
    doc.setFillColor(...PRIMARY);
    doc.rect(0, 0, W, 14, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("NeuroBee · Developmental Screening Report", margin, 9);
    doc.setFont("helvetica", "normal");
    doc.text(pageLabel, W - margin, 9, { align: "right" });
    doc.setTextColor(0, 0, 0);
  }

  function addDisclaimer(y: number): number {
    doc.setFillColor(...LIGHT);
    doc.roundedRect(margin, y, contentW, 12, 2, 2, "F");
    doc.setFontSize(7);
    doc.setTextColor(...GRAY);
    doc.setFont("helvetica", "italic");
    doc.text(
      "⚕ This report is generated from a parent-report screening tool. It is NOT a clinical diagnosis. Please share with a qualified developmental paediatrician.",
      margin + 3, y + 4.5,
      { maxWidth: contentW - 6 }
    );
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    return y + 16;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PAGE 1: Cover
  // ─────────────────────────────────────────────────────────────────────────
  addHeader("Cover");

  let y = 28;

  // Branding
  doc.setFontSize(26);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...PRIMARY);
  doc.text("NeuroBee", margin, y);
  y += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GRAY);
  doc.text("Accessible Developmental Screening · India", margin, y);
  y += 14;

  // Child info table
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["Field", "Details"]],
    body: [
      ["Child Name", childName],
      ["Date of Birth", user?.childDob ? formatDate(user.childDob) : "—"],
      ["Parent / Guardian", parentName],
      ["Assessment Date", today],
      ["Overall Risk Level", riskLevel.toUpperCase()],
      ["Sessions Completed", String(state.sessions.length)],
    ],
    headStyles: { fillColor: PRIMARY, textColor: [255, 255, 255], fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    alternateRowStyles: { fillColor: LIGHT },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 55 } },
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  // Risk summary box
  doc.setFillColor(...(riskColor(riskLevel).map((c) => Math.min(255, c + 180)) as [number, number, number]));
  doc.roundedRect(margin, y, contentW, 22, 3, 3, "F");
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...riskColor(riskLevel));
  doc.text(`Risk Level: ${riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1).toLowerCase()} Concern`, margin + 5, y + 8);
  if (fusedScore) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Fused Score: ${fusedScore.fusedPercentage}%  ·  M-CHAT-R: ${fusedScore.mchatPercentage}%  ·  Observation: ${fusedScore.observationScore}%`,
      margin + 5, y + 15
    );
  }
  doc.setTextColor(0, 0, 0);
  y += 30;

  y = addDisclaimer(y);

  // Clinical note
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text(
    "Aligned with: M-CHAT-R/F (IAP) · RBSK (NHM, Govt. of India) · NIMHANS neurodevelopmental guidelines\nMethodology reference: Wall et al. 2012 (PLoS ONE) · npj Digital Medicine 2022 · Scientific Reports 2025",
    margin, y, { maxWidth: contentW }
  );

  // ─────────────────────────────────────────────────────────────────────────
  // PAGE 2: M-CHAT-R Questionnaire Results
  // ─────────────────────────────────────────────────────────────────────────
  doc.addPage();
  addHeader("M-CHAT-R Questionnaire Results");
  y = 22;

  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("M-CHAT-R Questionnaire Responses", margin, y);
  y += 8;

  const answers = state.answers;
  const qRows = QUESTIONS.map((q) => {
    const ans = answers[q.id] ?? "Not answered";
    const critical = q.isCritical ? "★ " : "";
    return [
      `${critical}${q.id.toUpperCase()}`,
      q.category,
      q.section,
      ans,
    ];
  });

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["ID", "Category", "Domain", "Response"]],
    body: qRows,
    headStyles: { fillColor: PRIMARY, textColor: [255, 255, 255], fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: LIGHT },
    columnStyles: {
      0: { cellWidth: 16 },
      1: { cellWidth: 42 },
      2: { cellWidth: 40 },
      3: { cellWidth: 30 },
    },
    didParseCell: (data) => {
      if (data.column.index === 3 && data.cell.text[0] === "Rarely") {
        data.cell.styles.textColor = RED;
        data.cell.styles.fontStyle = "bold";
      }
    },
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  doc.setFontSize(7.5);
  doc.setTextColor(...GRAY);
  doc.text("★ = M-CHAT-R Critical Item   ·   Rarely responses highlighted in red", margin, y);

  // ─────────────────────────────────────────────────────────────────────────
  // PAGE 3: Domain Score Profile
  // ─────────────────────────────────────────────────────────────────────────
  doc.addPage();
  addHeader("Domain Score Profile");
  y = 22;

  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("Developmental Domain Analysis", margin, y);
  y += 8;

  const domainRows = insights.domainScores.map((d) => {
    const pct = Math.round((d.score / 2) * 100);
    const interp =
      d.level === "strong"
        ? "Strength — continue current activities"
        : d.level === "developing"
        ? "Developing — focused play activities recommended"
        : "Emerging — professional assessment advised";
    return [d.label, `${pct}%`, d.level.charAt(0).toUpperCase() + d.level.slice(1), interp];
  });

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["Domain", "Score", "Level", "Interpretation"]],
    body: domainRows,
    headStyles: { fillColor: PRIMARY, textColor: [255, 255, 255], fontSize: 9 },
    bodyStyles: { fontSize: 8.5 },
    alternateRowStyles: { fillColor: LIGHT },
    columnStyles: {
      0: { cellWidth: 48 },
      1: { cellWidth: 18, halign: "center" },
      2: { cellWidth: 26 },
      3: { cellWidth: 68 },
    },
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  // Observation module results
  if (latestSession?.observationAnswers) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Structured Observation Module Results", margin, y);
    y += 6;

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GRAY);
    doc.text(
      `Observation Score: ${fusedScore?.observationScore ?? "—"}%  ·  6 scenarios completed across all developmental domains`,
      margin, y, { maxWidth: contentW }
    );
    y += 10;
    doc.setTextColor(0, 0, 0);
  }

  y = addDisclaimer(y);

  // ─────────────────────────────────────────────────────────────────────────
  // PAGE 4: Fused Assessment (only if observation done)
  // ─────────────────────────────────────────────────────────────────────────
  if (fusedScore) {
    doc.addPage();
    addHeader("Multi-Modal Fused Assessment");
    y = 22;

    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Multi-Modal Fused Risk Assessment", margin, y);
    y += 6;

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GRAY);
    doc.text(
      "Based on Canvas Dx multi-modal methodology (Wall Lab, Stanford · FDA De Novo 2021 · npj Digital Medicine 2022).\nWeighting: M-CHAT-R Questionnaire 60% + Structured Parent Observation 40%.",
      margin, y, { maxWidth: contentW }
    );
    y += 14;
    doc.setTextColor(0, 0, 0);

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["Component", "Score", "Weight", "Contribution"]],
      body: [
        ["M-CHAT-R Questionnaire (Parent Report)", `${fusedScore.mchatPercentage}% risk`, "60%", `${Math.round(fusedScore.mchatPercentage * 0.6)}pts`],
        ["Structured Observation Module", `${fusedScore.observationScore}% positive → ${100 - fusedScore.observationScore}% risk`, "40%", `${Math.round((100 - fusedScore.observationScore) * 0.4)}pts`],
        ["Fused Risk Score", `${fusedScore.fusedPercentage}%`, "—", fusedScore.level.toUpperCase() + " CONCERN"],
      ],
      headStyles: { fillColor: PRIMARY, textColor: [255, 255, 255], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: LIGHT },
    });

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
    y = addDisclaimer(y);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PAGE 5: Guidance + Referrals + Clinician Note
  // ─────────────────────────────────────────────────────────────────────────
  doc.addPage();
  addHeader("Guidance & Referrals");
  y = 22;

  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("Recommendations", margin, y);
  y += 8;

  const guidanceMap: Record<string, string[]> = {
    low: [
      "Continue daily play routines — 20+ minutes of unstructured play per day",
      "Read together every day — narrate what you see to build language",
      "Share this report at your child's next well-child visit with your paediatrician",
    ],
    medium: [
      "Spend 10 minutes daily in floor play at your child's level — follow their lead",
      "Request a developmental follow-up at your next paediatric appointment",
      "Reduce screen time and increase face-to-face interaction",
      "Complete the Structured Observation module if not done — improves accuracy",
    ],
    high: [
      "Request an RBSK assessment at your nearest District Early Intervention Centre (DEIC)",
      "Contact a developmental paediatrician or NIMHANS for formal evaluation",
      "Ask your paediatrician for an early intervention referral — earlier is better",
      "Share this report with your school or anganwadi if your child is enrolled",
    ],
  };

  const tips = guidanceMap[riskLevel] ?? guidanceMap.medium;
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["#", "Recommended Action"]],
    body: tips.map((t, i) => [String(i + 1), t]),
    headStyles: { fillColor: PRIMARY, textColor: [255, 255, 255], fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    alternateRowStyles: { fillColor: LIGHT },
    columnStyles: { 0: { cellWidth: 12, halign: "center" } },
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  // Referral resources for selected state
  if (state.selectedState) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`Referral Resources — ${state.selectedState}`, margin, y);
    y += 6;

    const refs = getReferralsForState(state.selectedState, riskLevel as "low" | "medium" | "high").slice(0, 5);
    if (refs.length > 0) {
      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [["Name", "Type", "Phone"]],
        body: refs.map((r) => [r.name, r.type.replace("_", " "), r.phone.join(", ")]),
        headStyles: { fillColor: PRIMARY, textColor: [255, 255, 255], fontSize: 8.5 },
        bodyStyles: { fontSize: 8.5 },
        alternateRowStyles: { fillColor: LIGHT },
        columnStyles: { 0: { cellWidth: 80 }, 1: { cellWidth: 35 } },
      });
      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
    }
  }

  // Clinician footer note
  doc.setFillColor(240, 240, 240);
  doc.roundedRect(margin, y, contentW, 28, 3, 3, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(60, 60, 60);
  doc.text("For Professional Use — Clinician Note", margin + 5, y + 6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text(
    "This report was generated by NeuroBee, a parent-report screening tool aligned with M-CHAT-R/F (IAP), RBSK (NHM), and NIMHANS developmental guidelines. It is not a clinical diagnosis and should not replace a formal developmental assessment using validated instruments (ADOS-2, ADI-R, Bayley Scales, etc.). Please re-administer validated tools in a clinical setting before forming a diagnostic impression.",
    margin + 5, y + 13,
    { maxWidth: contentW - 10 }
  );

  // ── Save ──────────────────────────────────────────────────────────────────
  const safeName = childName.replace(/\s+/g, "-");
  const safeDate = new Date().toISOString().split("T")[0];
  doc.save(`neurobee-report-${safeName}-${safeDate}.pdf`);
}
