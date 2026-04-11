"use client";

import { useState, FormEvent } from "react";
import { useProfile } from "@/context/ProfileContext";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 10 }, (_, i) => currentYear - i);

type Step = "welcome" | "dob";

export function OnboardingScreen() {
  const { saveProfile } = useProfile();
  const [step, setStep] = useState<Step>("welcome");
  const [error, setError] = useState("");

  const [parentName, setParentName] = useState("");
  const [childName, setChildName] = useState("");
  const [dobMonth, setDobMonth] = useState("");
  const [dobYear, setDobYear] = useState("");

  function handleWelcomeNext(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!parentName.trim() || !childName.trim()) {
      setError("Please fill in both names.");
      return;
    }
    setStep("dob");
  }

  function handleFinish(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!dobMonth || !dobYear) {
      setError("Please select your child's birth month and year.");
      return;
    }
    const m = String(MONTHS.indexOf(dobMonth) + 1).padStart(2, "0");
    saveProfile({
      parentName: parentName.trim(),
      childName: childName.trim(),
      childDob: `${dobYear}-${m}`,
    });
  }

  const inputClass =
    "w-full px-4 py-3.5 rounded-xl bg-surface-container-low border border-outline-variant/50 text-on-surface placeholder-tertiary/60 font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all duration-200";
  const labelClass = "block text-xs font-label uppercase tracking-widest text-tertiary mb-1.5";

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-surface">
      {/* Left brand panel — desktop only */}
      <div className="hidden md:flex md:w-[45%] bg-surface-container-low flex-col justify-between p-12 lg:p-16 relative overflow-hidden">
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-0 w-60 h-60 rounded-full bg-secondary-container/20 blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-2.5 mb-16">
            <span
              className="material-symbols-outlined text-primary text-3xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              hive
            </span>
            <span className="font-headline font-bold text-2xl tracking-tighter text-primary">
              NeuroBee
            </span>
          </div>
          <div className="max-w-sm space-y-6">
            <h2 className="font-headline text-4xl font-extrabold text-on-surface leading-tight tracking-tight">
              Every small step is a{" "}
              <span className="text-primary italic">milestone</span> in the garden of growth.
            </h2>
            <p className="text-on-surface-variant leading-relaxed text-sm opacity-80">
              A gentle space for parents and caregivers to observe, understand, and celebrate their
              child&apos;s unique developmental journey — backed by India&apos;s leading health
              frameworks.
            </p>
          </div>
        </div>

        {/* Frameworks badge */}
        <div className="relative z-10">
          <div className="bg-surface-container-lowest p-5 rounded-2xl botanical-shadow border border-outline-variant/15 space-y-2">
            <p className="text-[10px] font-label uppercase tracking-widest text-tertiary font-semibold">
              Aligned with
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
          <span
            className="material-symbols-outlined text-primary text-2xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            hive
          </span>
          <span className="font-headline font-bold text-xl tracking-tighter text-primary">
            NeuroBee
          </span>
        </div>

        <div className="w-full max-w-md">
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-8">
            <div className={`h-1 flex-1 rounded-full transition-all duration-500 ${step === "welcome" ? "bg-primary" : "bg-primary"}`} />
            <div className={`h-1 flex-1 rounded-full transition-all duration-500 ${step === "dob" ? "bg-primary" : "bg-surface-container-high"}`} />
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 flex items-start gap-2 bg-error-container/40 border border-error/20 text-on-error-container rounded-xl px-4 py-3 text-sm">
              <span className="material-symbols-outlined text-error text-lg shrink-0 mt-0.5">error</span>
              {error}
            </div>
          )}

          {step === "welcome" ? (
            <>
              {/* Header */}
              <div className="mb-8">
                <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface">
                  Welcome to NeuroBee
                </h1>
                <p className="text-on-surface-variant text-sm mt-1.5">
                  Tell us a little about you and your child to get started.
                </p>
              </div>

              <form onSubmit={handleWelcomeNext} className="space-y-5">
                <div>
                  <label className={labelClass}>Your Name</label>
                  <input
                    type="text"
                    autoComplete="name"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    placeholder="Parent or caregiver"
                    className={inputClass}
                    autoFocus
                  />
                </div>
                <div>
                  <label className={labelClass}>Child&apos;s Name</label>
                  <input
                    type="text"
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                    placeholder="e.g. Arya"
                    className={inputClass}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-primary-gradient text-on-primary font-headline font-bold rounded-full shadow-lg shadow-primary/20 hover:opacity-95 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
                >
                  Continue
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              </form>
            </>
          ) : (
            <>
              {/* Header */}
              <div className="mb-8">
                <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface">
                  When was {childName} born?
                </h1>
                <p className="text-on-surface-variant text-sm mt-1.5">
                  This helps us tailor milestones to {childName}&apos;s age.
                </p>
              </div>

              <form onSubmit={handleFinish} className="space-y-5">
                <div>
                  <label className={labelClass}>Birth Month &amp; Year</label>
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={dobMonth}
                      onChange={(e) => setDobMonth(e.target.value)}
                      className={`${inputClass} cursor-pointer`}
                    >
                      <option value="">Month</option>
                      {MONTHS.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                    <select
                      value={dobYear}
                      onChange={(e) => setDobYear(e.target.value)}
                      className={`${inputClass} cursor-pointer`}
                    >
                      <option value="">Year</option>
                      {YEARS.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-primary-gradient text-on-primary font-headline font-bold rounded-full shadow-lg shadow-primary/20 hover:opacity-95 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
                >
                  Get Started
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setStep("welcome"); setError(""); }}
                  className="w-full text-center text-sm text-tertiary hover:text-on-surface transition-colors py-2"
                >
                  ← Back
                </button>
              </form>
            </>
          )}

          {/* Disclaimer */}
          <p className="mt-8 text-[11px] text-tertiary/60 text-center leading-relaxed">
            All data is stored locally on your device. NeuroBee is a parent observation tool — not a clinical diagnosis.
          </p>
        </div>
      </div>
    </div>
  );
}
