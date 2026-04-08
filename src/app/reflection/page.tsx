import { TopBar } from "@/components/TopBar";
import Link from "next/link";

export default function ReflectionPage() {
  return (
    <>
      <TopBar />
      <main className="flex-grow flex flex-col items-center justify-center px-6 py-12 max-w-4xl mx-auto w-full">
        {/* Hero Celebration Section */}
        <div className="w-full text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary-gradient mb-8 shadow-lg shadow-primary/10">
            <span className="material-symbols-outlined text-white text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
          </div>
          <h1 className="text-[3.5rem] leading-[1.1] font-extrabold text-primary tracking-tight mb-4 font-headline">Great bonding time!</h1>
          <div className="inline-flex items-center px-4 py-2 bg-surface-container-high rounded-full">
            <span className="material-symbols-outlined text-primary text-sm mr-2">check_circle</span>
            <span className="text-xs font-label uppercase tracking-widest font-bold text-on-surface-variant">Session 12 complete</span>
          </div>
        </div>

        {/* Reflection Content: Asymmetric Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 w-full">
          {/* Moment Card */}
          <div className="md:col-span-7">
            <div className="bg-surface-container-lowest p-8 rounded-lg shadow-[0_12px_40px_rgba(23,29,27,0.04)] relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 transition-transform duration-500 group-hover:scale-110"></div>
              <span className="text-[0.75rem] font-label uppercase tracking-widest font-bold text-primary mb-4 block">Key Moment</span>
              <h2 className="text-2xl font-bold text-on-surface mb-4 leading-snug font-headline">Nice moment — Leo responded to your smile during Mirror Play.</h2>
              <div className="w-full h-64 rounded-[1rem] overflow-hidden my-6">
                <img className="w-full h-full object-cover" alt="Soft-focus photo of a parent and baby playing together in front of a mirror, bright airy room with green plants" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCBKhr_3ey75wdeJB_lV1ERM4OwWCKR31qI2Mzn-eHn5SOmc-EvMvVn-JybO64XCBJZFPpMjkzX510V0tq26j9PMFtneZiUvmWzSoqI4cJmdJL-Xv82FuanR1rl7vIePJMdWglL0AyP7t6-O7I_fUbRHHVZtUUVd5q3Ao6gcIP7-iuk6rG5ofZA4nQUV_ZGqWcxKde7q6CK4xxzKJMJkpc2lS4qzNmLyNS5PrhGQqx_PQVdfk0pNPGERSRIlD0DYppFRqnsqap2VzQ" />
              </div>
            </div>
          </div>

          {/* Observations & CTA Column */}
          <div className="md:col-span-5 flex flex-col gap-8">
            {/* Observation Card */}
            <div className="bg-surface-container-low p-8 rounded-lg border-l-4 border-primary-container">
              <div className="flex items-start gap-4">
                <div className="mt-1">
                  <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>insights</span>
                </div>
                <div>
                  <span className="text-[0.75rem] font-label uppercase tracking-widest font-bold text-on-surface-variant mb-2 block">Micro Observation</span>
                  <p className="text-lg font-body leading-relaxed text-on-surface-variant">
                    We noticed increased engagement during the interaction moments.
                  </p>
                </div>
              </div>
            </div>

            {/* Secondary Detail Card */}
            <div className="bg-surface-container-lowest p-8 rounded-lg shadow-[0_12px_40px_rgba(23,29,27,0.04)]">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-secondary-container">child_care</span>
                </div>
                <div>
                  <h3 className="font-bold text-on-surface font-headline">Skill focus</h3>
                  <p className="text-sm text-on-surface-variant">Social-Emotional Growth</p>
                </div>
              </div>

              {/* Progress Capsule */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-label uppercase tracking-widest text-on-surface-variant">
                  <span>Consistency</span>
                  <span>Level 4</span>
                </div>
                <div className="h-3 w-full bg-surface-container-high rounded-full overflow-hidden">
                  <div className="h-full w-[72%] bg-primary-gradient rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Primary CTA */}
            <div className="mt-auto">
              <Link className="group relative flex items-center justify-center w-full bg-primary text-white py-5 px-8 rounded-full font-headline font-bold text-lg hover:opacity-90 transition-all duration-300 shadow-lg shadow-primary/20 overflow-hidden" href="/">
                <span className="relative z-10">Continue to Home</span>
                <span className="material-symbols-outlined ml-2 relative z-10 group-hover:translate-x-1 transition-transform">arrow_forward</span>
                <div className="absolute inset-0 bg-primary-gradient opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </Link>
              <p className="text-center text-on-surface-variant text-sm mt-4 font-body italic">Taking a moment to reflect helps Leo learn better.</p>
            </div>
          </div>
        </div>
      </main>
      <div className="h-12 w-full"></div> {/* Spacer for aesthetics, no bottom nav intentionally based on screen 6 design */}
    </>
  );
}