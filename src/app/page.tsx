"use client";

import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function Home() {
  const { state, insights, dayCount, sessionCount, trend, nextCheckInDate, latestSession } = useApp();
  const { user } = useAuth();

  const childName = user?.childName ?? "your child";
  const parentName = user?.parentName ?? "";

  return (
    <>
      <TopBar />
      <main className="px-6 pt-6 max-w-xl mx-auto space-y-8 page-bottom-padding">
        {/* Reassurance Banner */}
        <section className="bg-primary/10 px-4 py-3 rounded-xl border border-primary/20">
          <p className="text-on-secondary-container font-medium text-sm text-center">
            You&apos;re helping {childName} grow every day. ✨
          </p>
        </section>

        {/* Welcome Header */}
        <section className="space-y-1">
          <div className="flex items-center justify-between">
            <p className="font-label text-xs uppercase tracking-[0.05em] text-tertiary">
              {getGreeting()}{parentName ? `, ${parentName}` : ""}
            </p>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-primary/10 text-on-secondary-container text-[10px] font-bold uppercase tracking-wider border border-primary/20">
              Day {dayCount} of Journey
            </span>
          </div>
          <h2 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface">
            Time to play.
          </h2>
          {/* Trend + next check-in */}
          {(trend || nextCheckInDate) && (
            <div className="flex items-center gap-2 flex-wrap mt-2">
              {trend && (
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  trend === "improving" ? "bg-success/15 text-success"
                  : trend === "worsening" ? "bg-error/15 text-error"
                  : "bg-surface-container text-on-surface-variant"
                }`}>
                  <span className="material-symbols-outlined text-xs">
                    {trend === "improving" ? "trending_down" : trend === "worsening" ? "trending_up" : "trending_flat"}
                  </span>
                  {trend === "improving" ? "Improving" : trend === "worsening" ? "Needs attention" : "Stable"}
                </span>
              )}
              {nextCheckInDate && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-fixed text-primary text-[10px] font-bold uppercase tracking-wider">
                  <span className="material-symbols-outlined text-xs">event</span>
                  Next check-in {nextCheckInDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </span>
              )}
            </div>
          )}
        </section>

        {/* Insight Preview Card */}
        <Link href="/insights" className="block group">
          <div className="bg-tertiary-fixed p-5 rounded-xl flex items-center gap-4 transition-transform active:scale-[0.98] hover:brightness-95">
            <div className="bg-white/50 w-12 h-12 rounded-full flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-on-tertiary-fixed">auto_awesome</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-on-tertiary-fixed-variant mb-1">
                {sessionCount > 0
                  ? `Based on ${sessionCount} observation${sessionCount > 1 ? "s" : ""}…`
                  : "Start your first observation…"}
              </p>
              <p className="text-sm font-semibold text-on-tertiary-fixed leading-snug">
                {insights.answeredCount > 0
                  ? `${childName} is showing beautiful development patterns.`
                  : `Complete a milestone check-in to see ${childName}'s insights.`}
              </p>
              <p className="text-[11px] font-bold uppercase tracking-wider text-on-tertiary-fixed/60 mt-1">
                Tap to see full insight →
              </p>
            </div>
          </div>
        </Link>

        {/* Primary Play Session CTA */}
        <section className="bg-surface-container-lowest rounded-xl overflow-hidden border border-outline-variant botanical-shadow">
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-bold uppercase tracking-widest">
                Recommended
              </span>
              <span className="text-[10px] font-medium text-tertiary">~5 minutes</span>
            </div>
            <h3 className="font-headline text-xl font-bold tracking-tight text-primary">
              Interactive Sensory Storytelling
            </h3>
            <p className="text-on-surface-variant leading-relaxed text-sm">
              Focus on joint attention and emotional expression through guided movement.
            </p>
            <Link
              href="/reflection"
              className="w-full bg-primary text-white px-8 py-4 rounded-full font-bold flex items-center justify-center gap-2 active:scale-95 transition-all duration-200 hover:opacity-90"
            >
              Start Today&apos;s Play Session
              <span className="material-symbols-outlined text-[18px]">play_circle</span>
            </Link>
          </div>
          <div className="h-44 overflow-hidden">
            <img
              alt="Child playing with sensory toys"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuC0tG3sP6cTEwDWKrUH7AThCh2pjHROQqpXFKSJJXKElZsHtPYAviwDu6SCWWggrRL0vn_PlGu4xOSI5bLuF0j5QYZav0g_NvES-5bsgAvTYMhow-yjW2kTidEHjji-FUQdk90qlzdBEotTzPHFDYBF1tKYTtGxcAHv_ABcr5m3p56WWBC7VR9KPy6KyWOAu_cBnxK3VwyMyJJxXFRxGfkuwP3pjnNvpVWKdtczBAityHt4O8KCVqqLUSTzgP3vKB7YVQsqMUn9gg0"
            />
          </div>
        </section>

        {/* Growth Overview */}
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-headline text-xl font-bold tracking-tight text-on-surface">
              Growth Overview
            </h2>
            <Link href="/insights" className="text-sm font-semibold text-primary">
              View Insights
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {[
              { icon: "diversity_3", label: "Social Communication", sub: "Building connection patterns" },
              { icon: "visibility", label: "Joint Attention", sub: "Building shared focus" },
              { icon: "fitness_center", label: "Motor Development", sub: "Exploring physical movement", badge: "ACTIVE" },
            ].map(({ icon, label, sub, badge }) => (
              <div key={label} className="bg-surface-container-low p-4 rounded-xl flex items-center gap-4">
                <div className="bg-white w-10 h-10 rounded-lg flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary">{icon}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] uppercase tracking-widest text-tertiary font-bold">{label}</p>
                    {badge && (
                      <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[8px] font-bold">
                        {badge}
                      </span>
                    )}
                  </div>
                  <p className="font-headline text-base font-bold text-on-surface">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Camera Screening card */}
        <Link href="/screen">
          <section className="bg-primary/8 border border-primary/20 p-5 rounded-xl flex gap-4 items-center botanical-shadow hover:bg-primary/12 transition-all cursor-pointer">
            <div className="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                videocam
              </span>
            </div>
            <div className="space-y-1 min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-widest text-primary font-bold">New · Vision Screening</p>
              <h3 className="font-headline text-base font-bold text-on-surface">Camera-Based Screen</h3>
              <p className="text-xs text-on-surface-variant">Auto-detect eye contact, name response &amp; gaze following.</p>
            </div>
            <span className="material-symbols-outlined text-primary shrink-0">arrow_forward</span>
          </section>
        </Link>

        {/* Quick Activity */}
        <section className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant flex gap-4 items-center botanical-shadow">
          <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0">
            <img
              alt="Mirror play activity"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAwT0RSi5WShCz0gOWVUDEyXb1dqYqRCDO01Rsm8w5uyosrzUawKKBe_EJPFO1vSfZ3gykFvJTpdKkl_8n_RkwDD18z9GtIwHdbytpUTbPxGVvYwd8cU1eJvQ_rw5IXdSUvf6SDt9oOR1KCHYFw9w0UvAfXoPIN0EzP6Qe-IZF49gqTNwdNjA-b-vsuLJePwa5r2vQoXw5MG43i0Ah2u8TbGHfqczh5NIt_Hw9qTMvyw2tfUOEdWsVUN_GTeqeks0IqynpAEbW9FLs"
            />
          </div>
          <div className="space-y-1 min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-primary font-bold">Quick Activity</p>
            <h3 className="font-headline text-base font-bold text-on-surface">Mirror Play Session</h3>
            <p className="text-xs text-on-surface-variant">A 5-minute exercise for facial mimicry.</p>
          </div>
        </section>

        {/* Milestone CTA */}
        <section className="pb-4">
          <Link
            href="/milestones"
            className="w-full flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/10 group active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-xl">psychology</span>
              <div className="text-left">
                <p className="font-headline text-sm font-bold text-on-surface">
                  {sessionCount > 0 ? "Start New Observation" : "Begin Milestone Check-In"}
                </p>
                <p className="text-[11px] text-on-surface-variant">
                  {sessionCount > 0
                    ? `${sessionCount} session${sessionCount > 1 ? "s" : ""} completed`
                    : `Answer 20 questions about ${childName}'s development`}
                </p>
              </div>
            </div>
            <span className="material-symbols-outlined text-tertiary/40 group-hover:text-primary transition-colors">
              arrow_forward
            </span>
          </Link>
        </section>
      </main>
      <BottomNav />
    </>
  );
}
