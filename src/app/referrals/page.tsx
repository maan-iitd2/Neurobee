"use client";

import { useState } from "react";
import Link from "next/link";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { useApp } from "@/context/AppContext";
import { useProfile } from "@/context/ProfileContext";
import {
  INDIAN_STATES,
  getReferralsForState,
  TYPE_LABELS,
  TYPE_LABELS_HI,
  URGENCY_LABELS,
  URGENCY_LABELS_HI,
  ReferralResource,
  RiskLevel,
} from "@/lib/referrals";
import { useTranslation } from "@/lib/i18n";

const TYPE_COLORS: Record<string, string> = {
  government: "bg-primary-fixed text-primary",
  ngo: "bg-tertiary-container text-on-tertiary-container",
  private_network: "bg-secondary-container text-on-secondary-container",
  helpline: "bg-success/15 text-success",
};

const URGENCY_COLORS: Record<string, string> = {
  urgent: "text-error",
  priority: "text-warning",
  routine: "text-on-surface-variant",
};

function ReferralCard({ resource, isHindi }: { resource: ReferralResource; isHindi: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const t = useTranslation();

  const typeLabels = isHindi ? TYPE_LABELS_HI : TYPE_LABELS;
  const urgencyLabels = isHindi ? URGENCY_LABELS_HI : URGENCY_LABELS;
  const whatToSay = isHindi ? resource.whatToSay_hi : resource.whatToSay;
  const documentsToBring = isHindi ? resource.documentsToBring_hi : resource.documentsToBring;

  async function handleShare() {
    const text = `${resource.name}\n${isHindi ? "फोन" : "Phone"}: ${resource.phone.join(", ")}\n${resource.address ?? ""}`;
    if (navigator.share) {
      await navigator.share({ title: resource.name, text }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(text).catch(() => {});
    }
  }

  return (
    <div className="rounded-3xl bg-surface-container overflow-hidden">
      <div className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex flex-wrap gap-1.5 mb-2">
              <span className={`text-[10px] font-label font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${TYPE_COLORS[resource.type]}`}>
                {typeLabels[resource.type]}
              </span>
              {resource.urgency !== "routine" && (
                <span className={`text-[10px] font-label font-semibold uppercase tracking-wide ${URGENCY_COLORS[resource.urgency]}`}>
                  ● {urgencyLabels[resource.urgency]}
                </span>
              )}
            </div>
            <h3 className="font-display text-base font-semibold text-on-surface leading-tight">{resource.name}</h3>
            {resource.city && (
              <p className="font-body text-xs text-on-surface-variant mt-0.5">{resource.city}, {resource.state}</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {resource.phone.map((num) => (
            <a
              key={num}
              href={`tel:${num.replace(/[^0-9+]/g, "")}`}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-on-primary font-label text-sm font-semibold"
            >
              <span className="material-symbols-outlined text-base">call</span>
              {num}
            </a>
          ))}
        </div>

        {resource.address && (
          <p className="font-body text-xs text-on-surface-variant flex items-start gap-1.5">
            <span className="material-symbols-outlined text-base flex-shrink-0">location_on</span>
            {resource.address}
          </p>
        )}

        {resource.notes && (
          <p className="font-body text-xs text-on-surface-variant bg-surface-container-high rounded-xl p-3">
            {resource.notes}
          </p>
        )}

        <button
          onClick={() => setExpanded((e) => !e)}
          className="flex items-center gap-1 text-primary font-label text-xs font-semibold"
        >
          <span className="material-symbols-outlined text-base">
            {expanded ? "expand_less" : "expand_more"}
          </span>
          {expanded ? t("referrals.hide_details") : t("referrals.show_details")}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-outline-variant/20 p-5 space-y-4 bg-surface-container-low">
          <div className="space-y-2">
            <p className="font-label text-xs uppercase tracking-widest text-on-surface-variant">{t("referrals.what_to_say")}</p>
            <p className="font-body text-sm text-on-surface leading-relaxed bg-surface-container rounded-2xl p-4">
              &ldquo;{whatToSay}&rdquo;
            </p>
          </div>
          {documentsToBring.length > 0 && (
            <div className="space-y-2">
              <p className="font-label text-xs uppercase tracking-widest text-on-surface-variant">{t("referrals.documents_to_bring")}</p>
              <ul className="space-y-1.5">
                {documentsToBring.map((doc, i) => (
                  <li key={i} className="flex items-start gap-2 font-body text-sm text-on-surface">
                    <span className="material-symbols-outlined text-primary text-base flex-shrink-0 mt-0.5">check_circle</span>
                    {doc}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {resource.website && (
            <p className="font-body text-xs text-primary underline">
              <a href={resource.website} target="_blank" rel="noopener noreferrer">{resource.website}</a>
            </p>
          )}
          <button
            onClick={handleShare}
            className="flex items-center gap-2 text-on-surface-variant font-label text-xs"
          >
            <span className="material-symbols-outlined text-base">share</span>
            {t("referrals.share_doctor")}
          </button>
        </div>
      )}
    </div>
  );
}

export default function ReferralsPage() {
  const { selectedState, setSelectedState, insights, latestSession } = useApp();
  const { profile } = useProfile();
  const t = useTranslation();

  const isHindi = profile?.language === "hi";
  const [showStatePicker, setShowStatePicker] = useState(!selectedState);

  const riskLevel: RiskLevel = (latestSession?.fusedScore?.level ?? insights.riskScore.level) as RiskLevel;
  const referrals = selectedState ? getReferralsForState(selectedState, riskLevel) : [];

  const PATHWAY_META = {
    high: {
      labelKey: "referrals.pathway.high.label",
      descKey: "referrals.pathway.high.desc",
      color: "bg-error/10 border-error/20 text-error",
      icon: "priority_high",
    },
    medium: {
      labelKey: "referrals.pathway.medium.label",
      descKey: "referrals.pathway.medium.desc",
      color: "bg-warning/10 border-warning/20 text-warning",
      icon: "schedule",
    },
    low: {
      labelKey: "referrals.pathway.low.label",
      descKey: "referrals.pathway.low.desc",
      color: "bg-success/10 border-success/20 text-success",
      icon: "check_circle",
    },
  };

  const pathway = PATHWAY_META[riskLevel];

  if (showStatePicker) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <TopBar />
        <main className="flex-1 flex flex-col px-4 py-6 gap-4 max-w-lg mx-auto w-full">
          <div className="space-y-1">
            <h1 className="font-display text-2xl font-bold text-on-surface">{t("referrals.title")}</h1>
            <p className="font-body text-sm text-on-surface-variant">{t("referrals.select_state_desc")}</p>
          </div>
          <div className="space-y-1 pb-24">
            {INDIAN_STATES.map((state) => (
              <button
                key={state}
                onClick={() => { setSelectedState(state); setShowStatePicker(false); }}
                className="w-full text-left px-4 py-3.5 rounded-2xl bg-surface-container hover:bg-primary-fixed/30 transition-colors font-body text-sm text-on-surface flex items-center justify-between"
              >
                {state}
                <span className="material-symbols-outlined text-on-surface-variant text-base">chevron_right</span>
              </button>
            ))}
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopBar />
      <main className="flex-1 flex flex-col px-4 py-6 gap-4 max-w-lg mx-auto w-full pb-28">

        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-on-surface">{t("referrals.title")}</h1>
            <button
              onClick={() => setShowStatePicker(true)}
              className="font-body text-sm text-primary flex items-center gap-1 mt-1"
            >
              <span className="material-symbols-outlined text-base">location_on</span>
              {selectedState}
              <span className="material-symbols-outlined text-base">edit</span>
            </button>
          </div>
          <Link href="/insights" className="p-2 rounded-full bg-surface-container">
            <span className="material-symbols-outlined text-on-surface-variant text-xl">arrow_back</span>
          </Link>
        </div>

        {/* Pathway banner */}
        <div className={`rounded-3xl border p-4 flex items-start gap-3 ${pathway.color}`}>
          <span className="material-symbols-outlined text-xl flex-shrink-0 mt-0.5">{pathway.icon}</span>
          <div>
            <p className="font-label text-sm font-semibold">{t(pathway.labelKey)}</p>
            <p className="font-body text-xs mt-1 opacity-80">{t(pathway.descKey)}</p>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="rounded-2xl bg-surface-container p-4 flex items-start gap-2">
          <span className="material-symbols-outlined text-on-surface-variant text-base flex-shrink-0 mt-0.5">info</span>
          <p className="font-body text-xs text-on-surface-variant">{t("referrals.disclaimer")}</p>
        </div>

        <div className="space-y-3">
          {referrals.map((resource) => (
            <ReferralCard key={resource.id} resource={resource} isHindi={isHindi} />
          ))}
          {referrals.length === 0 && (
            <div className="text-center py-12 text-on-surface-variant font-body text-sm">
              {t("referrals.no_results")}
            </div>
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
