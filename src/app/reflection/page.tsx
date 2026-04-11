"use client";

import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function ReflectionPage() {
  const { state, sessionCount } = useApp();
  const { user } = useAuth();
  const childName = user?.childName ?? "your child";

  return (
    <>
      <TopBar />
      <main className="flex flex-col items-center px-6 py-10 max-w-4xl mx-auto w-full page-bottom-padding">
        {/* Hero */}
        <div className="w-full text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary-gradient mb-7 shadow-lg shadow-primary/15">
            <span
              className="material-symbols-outlined text-white text-4xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              favorite
            </span>
          </div>
          <h1 className="text-[3rem] leading-[1.1] font-extrabold text-primary tracking-tight mb-3 font-headline">
            Great bonding time!
          </h1>
          <div className="inline-flex items-center px-4 py-2 bg-surface-container-high rounded-full gap-2">
            <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
            <span className="text-xs font-label uppercase tracking-widest font-bold text-on-surface-variant">
              Session {sessionCount > 0 ? sessionCount : 1} complete
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-7 w-full">
          {/* Moment Card */}
          <div className="md:col-span-7">
            <div className="bg-surface-container-lowest p-7 rounded-2xl botanical-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 transition-transform duration-500 group-hover:scale-110 pointer-events-none" />
              <span className="text-[0.7rem] font-label uppercase tracking-widest font-bold text-primary mb-3 block">
                Key Moment
              </span>
              <h2 className="text-xl font-bold text-on-surface mb-4 leading-snug font-headline">
                Nice moment — {childName} responded to your smile during Mirror Play.
              </h2>
              <div className="w-full h-56 rounded-2xl overflow-hidden my-5">
                <img
                  className="w-full h-full object-cover"
                  alt="Parent and child playing together"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCBKhr_3ey75wdeJB_lV1ERM4OwWCKR31qI2Mzn-eHn5SOmc-EvMvVn-JybO64XCBJZFPpMjkzX510V0tq26j9PMFtneZiUvmWzSoqI4cJmdJL-Xv82FuanR1rl7vIePJMdWglL0AyP7t6-O7I_fUbRHHVZtUUVd5q3Ao6gcIP7-iuk6rG5ofZA4nQUV_ZGqWcxKde7q6CK4xxzKJMJkpc2lS4qzNmLyNS5PrhGQqx_PQVdfk0pNPGERSRIlD0DYppFRqnsqap2VzQ"
                />
              </div>
            </div>
          </div>

          {/* Observations & CTA */}
          <div className="md:col-span-5 flex flex-col gap-6">
            <div className="bg-surface-container-low p-6 rounded-2xl border-l-4 border-primary-container">
              <div className="flex items-start gap-3">
                <span
                  className="material-symbols-outlined text-primary mt-0.5"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  insights
                </span>
                <div>
                  <span className="text-[0.7rem] font-label uppercase tracking-widest font-bold text-on-surface-variant mb-1.5 block">
                    Micro Observation
                  </span>
                  <p className="text-base leading-relaxed text-on-surface-variant">
                    We noticed increased engagement during the interaction moments.{" "}
                    {childName} is responding beautifully to your presence.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-6 rounded-2xl botanical-shadow space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-secondary-container flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-on-secondary-container">child_care</span>
                </div>
                <div>
                  <h3 className="font-bold text-on-surface font-headline text-sm">Skill focus</h3>
                  <p className="text-xs text-on-surface-variant">Social-Emotional Growth</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-label uppercase tracking-widest text-on-surface-variant">
                  <span>Consistency</span>
                  <span>Level {Math.min(4, sessionCount + 1)}</span>
                </div>
                <div className="h-2.5 w-full bg-surface-container-high rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-gradient rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(95, 30 + sessionCount * 15)}%` }}
                  />
                </div>
              </div>
            </div>

            <div>
              <Link
                href="/"
                className="group relative flex items-center justify-center w-full bg-primary text-white py-4 px-8 rounded-full font-headline font-bold text-base hover:opacity-90 transition-all duration-300 shadow-lg shadow-primary/20 overflow-hidden"
              >
                <span className="relative z-10">Continue to Home</span>
                <span className="material-symbols-outlined ml-2 relative z-10 group-hover:translate-x-1 transition-transform text-[20px]">
                  arrow_forward
                </span>
                <div className="absolute inset-0 bg-primary-gradient opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
              <p className="text-center text-on-surface-variant text-xs mt-3 italic">
                Taking a moment to reflect helps {childName} learn better.
              </p>
            </div>

            <Link
              href="/insights"
              className="flex items-center justify-center gap-2 text-primary font-semibold text-sm hover:underline"
            >
              <span className="material-symbols-outlined text-[18px]">insights</span>
              View Full Insights
            </Link>
          </div>
        </div>
      </main>
      <BottomNav />
    </>
  );
}
