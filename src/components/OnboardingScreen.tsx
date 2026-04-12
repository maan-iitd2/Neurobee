"use client";

import { useState, FormEvent } from "react";
import { useProfile } from "@/context/ProfileContext";
import { useTranslation } from "@/lib/i18n";
import type { Language } from "@/lib/i18n";
import Image from "next/image";

const MONTHS_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MONTHS_HI = [
  "जनवरी", "फरवरी", "मार्च", "अप्रैल", "मई", "जून",
  "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर",
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 10 }, (_, i) => currentYear - i);

type Step = "language" | "welcome" | "dob";

export function OnboardingScreen() {
  const { saveProfile } = useProfile();
  const [step, setStep] = useState<Step>("language");
  const [lang, setLang] = useState<Language>("en");
  const [error, setError] = useState("");

  const [parentName, setParentName] = useState("");
  const [childName, setChildName] = useState("");
  const [dobMonthIndex, setDobMonthIndex] = useState("");
  const [dobYear, setDobYear] = useState("");

  const t = useTranslation(lang);

  const months = lang === "hi" ? MONTHS_HI : MONTHS_EN;

  function handleSelectLanguage(selected: Language) {
    setLang(selected);
    setStep("welcome");
  }

  function handleWelcomeNext(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!parentName.trim() || !childName.trim()) {
      setError(t("onboarding.error.names"));
      return;
    }
    setStep("dob");
  }

  function handleFinish(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!dobMonthIndex || !dobYear) {
      setError(t("onboarding.error.dob"));
      return;
    }
    const m = String(parseInt(dobMonthIndex, 10) + 1).padStart(2, "0");
    saveProfile({
      parentName: parentName.trim(),
      childName: childName.trim(),
      childDob: `${dobYear}-${m}`,
      language: lang,
    });
  }

  const stepIndex = step === "language" ? 0 : step === "welcome" ? 1 : 2;

  const inputClass =
    "w-full px-4 py-3.5 rounded-xl bg-surface-container-low border border-outline-variant/50 text-on-surface placeholder-tertiary/60 font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all duration-200";
  const labelClass = "block text-caption-caps text-tertiary mb-1.5";

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-surface">
      {/* Left brand panel — desktop only */}
      <div className="hidden md:flex md:w-[45%] bg-surface-container-low flex-col justify-between p-12 lg:p-16 relative overflow-hidden">
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-0 w-60 h-60 rounded-full bg-secondary-container/20 blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-2.5 mb-16">
            <div className="relative w-12 h-12">
              <Image 
                src="/Logo.png" 
                alt="NeuroBee Logo" 
                fill 
                className="object-contain"
                sizes="48px"
                priority
              />
            </div>
            <span className="text-h1 text-primary">
              NeuroBee
            </span>
          </div>
          <div className="max-w-sm space-y-6">
            <h2 className="text-h1 text-4xl">
              {lang === "hi" ? (
                <>विकास का हर छोटा कदम एक <span className="text-primary italic">मील का पत्थर</span> है।</>
              ) : (
                <>Every small step is a{" "}<span className="text-primary italic">milestone</span> in the garden of growth.</>
              )}
            </h2>
            <p className="text-on-surface-variant leading-relaxed text-sm opacity-80">
              {lang === "hi"
                ? "माता-पिता और देखभालकर्ताओं के लिए एक सौम्य स्थान — बच्चे की विकास यात्रा को समझने और उसका जश्न मनाने के लिए।"
                : "A gentle space for parents and caregivers to observe, understand, and celebrate their child's unique developmental journey — backed by India's leading health frameworks."}
            </p>
          </div>
        </div>

        {/* Frameworks badge */}
        <div className="relative z-10">
          <div className="bg-surface-container-lowest p-5 rounded-2xl botanical-shadow border border-outline-variant/15 space-y-2">
            <p className="text-caption-caps text-tertiary">
              {lang === "hi" ? "इन संस्थानों के अनुरूप" : "Aligned with"}
            </p>
            <ul className="space-y-1.5">
              {[
                "M-CHAT-R (Indian Academy of Pediatrics)",
                "RBSK — National Health Mission, Govt. of India",
                "NIMHANS Neurodevelopmental Guidelines",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-xs text-on-surface-variant">
                  <span
                    className="material-symbols-outlined text-primary text-sm"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    verified
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 min-h-screen">
        {/* Mobile logo */}
        <div className="md:hidden flex items-center gap-2 mb-10">
          <div className="relative w-8 h-8">
            <Image 
              src="/Logo.png" 
              alt="NeuroBee Logo" 
              fill 
              className="object-contain"
              sizes="32px"
              priority
            />
          </div>
          <span className="text-h2 text-primary">
            NeuroBee
          </span>
        </div>

        <div className="w-full max-w-md">
          {/* Step indicator — 3 steps */}
          <div className="flex items-center gap-2 mb-8">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-all duration-500 ${i <= stepIndex ? "bg-primary" : "bg-surface-container-high"}`}
              />
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 flex items-start gap-2 bg-error-container/40 border border-error/20 text-on-error-container rounded-xl px-4 py-3 text-body">
              <span className="material-symbols-outlined text-error text-lg shrink-0 mt-0.5">error</span>
              {error}
            </div>
          )}

          {step === "language" && (
            <>
              <div className="mb-10 text-center">
                <h1 className="text-h1 mb-2">
                  Choose Language
                </h1>
                <p className="text-h2 text-on-surface-variant">
                  भाषा चुनें
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleSelectLanguage("en")}
                  className="flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-outline-variant/50 bg-surface-container-low hover:border-primary hover:bg-primary/5 active:scale-[0.97] transition-all duration-200"
                >
                  <span className="text-4xl">🇬🇧</span>
                  <span className="text-h3 text-lg">English</span>
                </button>
                <button
                  onClick={() => handleSelectLanguage("hi")}
                  className="flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-outline-variant/50 bg-surface-container-low hover:border-primary hover:bg-primary/5 active:scale-[0.97] transition-all duration-200"
                >
                  <span className="text-4xl">🇮🇳</span>
                  <span className="text-h3 text-lg">हिंदी</span>
                </button>
              </div>
            </>
          )}

          {step === "welcome" && (
            <>
              <div className="mb-8">
                <h1 className="text-h1">
                  {t("onboarding.welcome.title")}
                </h1>
                <p className="text-body text-on-surface-variant mt-1.5">
                  {t("onboarding.welcome.subtitle")}
                </p>
              </div>

              <form onSubmit={handleWelcomeNext} className="space-y-5">
                <div>
                  <label className={labelClass}>{t("onboarding.your_name")}</label>
                  <input
                    type="text"
                    autoComplete="name"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    placeholder={t("onboarding.your_name_placeholder")}
                    className={inputClass}
                    autoFocus
                  />
                </div>
                <div>
                  <label className={labelClass}>{t("onboarding.child_name")}</label>
                  <input
                    type="text"
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                    placeholder={t("onboarding.child_name_placeholder")}
                    className={inputClass}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-primary-gradient text-on-primary text-label rounded-full shadow-lg shadow-primary/20 hover:opacity-95 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {t("onboarding.continue")}
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setStep("language"); setError(""); }}
                  className="w-full text-center text-body text-tertiary hover:text-on-surface transition-colors py-2"
                >
                  {t("onboarding.back")}
                </button>
              </form>
            </>
          )}

          {step === "dob" && (
            <>
              <div className="mb-8">
                <h1 className="text-h1">
                  {t("onboarding.dob.title_prefix")} {childName} {t("onboarding.dob.title_suffix")}
                </h1>
                <p className="text-body text-on-surface-variant mt-1.5">
                  {t("onboarding.dob.subtitle_prefix")} {childName}{t("onboarding.dob.subtitle_suffix")}
                </p>
              </div>

              <form onSubmit={handleFinish} className="space-y-5">
                <div>
                  <label className={labelClass}>{t("onboarding.birth_month_year")}</label>
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={dobMonthIndex}
                      onChange={(e) => setDobMonthIndex(e.target.value)}
                      className={`${inputClass} cursor-pointer`}
                    >
                      <option value="">{t("onboarding.placeholder.month")}</option>
                      {months.map((m, i) => (
                        <option key={i} value={String(i)}>{m}</option>
                      ))}
                    </select>
                    <select
                      value={dobYear}
                      onChange={(e) => setDobYear(e.target.value)}
                      className={`${inputClass} cursor-pointer`}
                    >
                      <option value="">{t("onboarding.placeholder.year")}</option>
                      {YEARS.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-primary-gradient text-on-primary text-label rounded-full shadow-lg shadow-primary/20 hover:opacity-95 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {t("onboarding.get_started")}
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setStep("welcome"); setError(""); }}
                  className="w-full text-center text-body text-tertiary hover:text-on-surface transition-colors py-2"
                >
                  {t("onboarding.back")}
                </button>
              </form>
            </>
          )}

          {/* Disclaimer */}
          <p className="mt-8 text-body-sm text-[11px] text-tertiary/60 text-center">
            {t("onboarding.disclaimer")}
          </p>
        </div>
      </div>
    </div>
  );
}
