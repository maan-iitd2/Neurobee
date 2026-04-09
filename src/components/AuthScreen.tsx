"use client";

import { useState, FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";

type Mode = "login" | "signup";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 10 }, (_, i) => currentYear - i);

function buildDob(month: string, year: string): string {
  if (!month || !year) return "";
  const m = String(MONTHS.indexOf(month) + 1).padStart(2, "0");
  return `${year}-${m}-01`;
}

export function AuthScreen() {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);

  // Login fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPw, setLoginPw] = useState("");

  // Signup fields
  const [parentName, setParentName] = useState("");
  const [childName, setChildName] = useState("");
  const [dobMonth, setDobMonth] = useState("");
  const [dobYear, setDobYear] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPw, setSignupPw] = useState("");

  const switchMode = (m: Mode) => {
    setMode(m);
    setError("");
  };

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!loginEmail || !loginPw) { setError("Please fill in all fields."); return; }
    setLoading(true);
    const res = await login(loginEmail, loginPw);
    setLoading(false);
    if (!res.success) setError(res.error ?? "Login failed.");
  }

  async function handleSignup(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!parentName || !childName || !dobMonth || !dobYear || !signupEmail || !signupPw) {
      setError("Please fill in all fields.");
      return;
    }
    if (signupPw.length < 6) { setError("Password must be at least 6 characters."); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(signupEmail)) { setError("Please enter a valid email address."); return; }
    setLoading(true);
    const res = await signup({
      parentName,
      email: signupEmail,
      password: signupPw,
      childName,
      childDob: buildDob(dobMonth, dobYear),
    });
    setLoading(false);
    if (!res.success) setError(res.error ?? "Sign up failed.");
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
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface">
              {mode === "login" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="text-on-surface-variant text-sm mt-1.5">
              {mode === "login"
                ? "Sign in to continue your journey."
                : "Start tracking your child's developmental journey."}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 flex items-start gap-2 bg-error-container/40 border border-error/20 text-on-error-container rounded-xl px-4 py-3 text-sm">
              <span className="material-symbols-outlined text-error text-lg shrink-0 mt-0.5">error</span>
              {error}
            </div>
          )}

          {mode === "login" ? (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className={labelClass}>Email</label>
                <input
                  type="email"
                  autoComplete="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Password</label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    autoComplete="current-password"
                    value={loginPw}
                    onChange={(e) => setLoginPw(e.target.value)}
                    placeholder="Your password"
                    className={`${inputClass} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-tertiary hover:text-on-surface transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPw ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-primary-gradient text-on-primary font-headline font-bold rounded-full shadow-lg shadow-primary/20 hover:opacity-95 active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                    Signing in…
                  </>
                ) : (
                  "Sign In"
                )}
              </button>

              <p className="text-center text-sm text-on-surface-variant pt-2">
                New here?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("signup")}
                  className="text-primary font-bold hover:underline"
                >
                  Create an account
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Your Name</label>
                  <input
                    type="text"
                    autoComplete="name"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    placeholder="Parent / Caregiver"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Child&apos;s Name</label>
                  <input
                    type="text"
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                    placeholder="e.g. Leo"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Child&apos;s Date of Birth</label>
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

              <div>
                <label className={labelClass}>Email</label>
                <input
                  type="email"
                  autoComplete="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Password</label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    autoComplete="new-password"
                    value={signupPw}
                    onChange={(e) => setSignupPw(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className={`${inputClass} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-tertiary hover:text-on-surface transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPw ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-primary-gradient text-on-primary font-headline font-bold rounded-full shadow-lg shadow-primary/20 hover:opacity-95 active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1"
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                    Creating account…
                  </>
                ) : (
                  "Create Account"
                )}
              </button>

              <p className="text-center text-sm text-on-surface-variant pt-1">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className="text-primary font-bold hover:underline"
                >
                  Sign in
                </button>
              </p>
            </form>
          )}

          {/* Disclaimer */}
          <p className="mt-8 text-[10px] text-tertiary/60 text-center leading-relaxed">
            All data is stored locally on your device. NeuroBee is a parent observation tool — not a clinical diagnosis.
          </p>
        </div>
      </div>
    </div>
  );
}
