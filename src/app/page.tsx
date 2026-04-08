import { auth } from "@clerk/nextjs/server";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { SignInButton, SignUpButton } from "@clerk/nextjs";

export default async function Home() {
  let userId: string | null = null;
  try {
     const authData = await auth();
     userId = authData.userId;
  } catch(e) {
     console.error("Clerk auth failed, mocking no user");
  }

  // Also manually bypass for demonstration if no valid key is provided
  const isMockEnv = !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === "pk_test_placeholder";

  if (!userId && !isMockEnv) {
    // Unauthenticated: Render Screen 1 (Landing Page)
    return (
      <div className="min-h-screen flex flex-col md:flex-row">
        {/* Left Side: Narrative/Brand Column */}
        <div className="hidden md:flex md:w-1/2 bg-surface-container-low p-12 lg:p-20 flex-col justify-between relative overflow-hidden">
          {/* Decorative organic shapes */}
          <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-primary-fixed/20 blur-3xl"></div>
          <div className="absolute bottom-20 right-0 w-60 h-60 rounded-full bg-secondary-container/30 blur-3xl"></div>
          <div className="z-10">
            <div className="flex items-center gap-2 mb-16">
              <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>hive</span>
              <span className="font-headline font-bold text-2xl tracking-tighter text-primary">NeuroBee</span>
            </div>
            <div className="max-w-md">
              <h2 className="font-headline text-5xl font-bold text-on-surface leading-tight tracking-tight mb-8">
                Every small step is a <span className="text-primary italic">milestone</span> in the garden of growth.
              </h2>
              <p className="text-lg text-on-surface-variant leading-relaxed opacity-80">
                Join a community where developmental progress is nurtured with professional care and a gentle touch. Your journey with NeuroBee is built on support, clarity, and celebrated moments.
              </p>
            </div>
          </div>
          <div className="z-10 mt-auto">
            <div className="bg-surface-container-lowest p-8 rounded-lg botanical-shadow border border-outline-variant/15 flex gap-6 items-center">
              <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                <img alt="User testimonial" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCj3Mk4Z0h0HEG6_8ackiGvlX1o6NGR_Jf2oFkegKTa29L7SS0ddDH8GRwlg1rSQ50yfi5327CTUkrqNNugH5cgKRzIKyKEJaRXW4yrnJXYtIvI0L07cBPficHNbLwx4Go7DifXci58ezRUP3apdX468XJCkwFMp2eDTTun55j8rhqucpDnPcCqytWWhjltyA1kX3tjQVifC3Zy4XEXDzDXeAd0o34FX6zxNLksNJ0_KPAnA8JBBcSxZku6d-gZxNk_NV-YMfhSZ9A" />
              </div>
              <div>
                <p className="italic text-on-surface-variant mb-2">&quot;The calm approach of NeuroBee made tracking my child&apos;s growth feel like a peaceful ritual rather than a chore.&quot;</p>
                <p className="font-headline font-semibold text-primary text-sm tracking-wide">SARAH J., CAREGIVER</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Interaction Column */}
        <div className="flex-1 flex flex-col bg-surface-container-lowest items-center justify-center p-6 md:p-12 lg:p-24 min-h-screen">
          {/* Mobile Logo */}
          <div className="md:hidden flex items-center gap-2 mb-12">
            <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>hive</span>
            <span className="font-headline font-bold text-xl tracking-tighter text-primary">NeuroBee</span>
          </div>

          <div className="w-full max-w-md space-y-10">
            <div className="space-y-3">
              <h1 className="font-headline text-4xl font-bold tracking-tight text-on-surface">Start your journey</h1>
              <p className="text-on-surface-variant leading-relaxed">A gentle space for supportive growth and daily insights.</p>
            </div>

            <div className="pt-4 space-y-4">
              <SignUpButton mode="modal">
                <button className="w-full py-4 px-8 bg-primary-gradient text-on-primary font-bold rounded-full shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all duration-300">
                  Create Account
                </button>
              </SignUpButton>
              <div className="flex flex-col items-center gap-4 pt-4">
                <p className="text-on-surface-variant text-sm">Already have an account?</p>
                <SignInButton mode="modal">
                  <button className="text-primary font-bold hover:opacity-80 transition-opacity">
                    Sign In
                  </button>
                </SignInButton>
              </div>
            </div>

            <div className="pt-8 flex justify-center gap-8 border-t border-outline-variant/10">
              <a className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors" href="#">Privacy Policy</a>
              <a className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors" href="#">Help Center</a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated: Render Screen 7 (Dashboard)
  return (
    <>
      <TopBar />
      <main className="px-6 pt-6 max-w-xl mx-auto space-y-8 pb-32">
        {/* Emotional Reassurance Header */}
        <section className="bg-primary/10 p-4 rounded-lg border border-primary/20">
          <p className="text-on-secondary-container font-medium text-sm text-center">
            You&apos;re helping Sarah grow every day.
          </p>
        </section>

        {/* Welcome Section */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="font-label text-xs uppercase tracking-[0.05em] text-tertiary">Morning, Sarah</p>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary/10 text-on-secondary-container text-[10px] font-bold uppercase tracking-wider border border-primary/20">Day 12 of Journey</span>
          </div>
          <h2 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface">Time to play.</h2>
        </section>

        {/* Insight Card Preview */}
        <section className="cursor-pointer group">
          <div className="bg-tertiary-fixed p-5 rounded-lg flex items-center gap-4 transition-transform active:scale-95">
            <div className="bg-white/50 w-12 h-12 rounded-full flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-on-tertiary-fixed">auto_awesome</span>
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-on-tertiary-fixed-variant mb-1">Based on your play session this morning...</p>
              <p className="text-sm font-semibold text-on-tertiary-fixed leading-snug">
                Sarah is showing healthy curiosity and engagement.
              </p>
              <p className="text-[11px] font-bold uppercase tracking-wider text-on-tertiary-fixed/60 mt-1">Tap to see full insight</p>
            </div>
            <span className="material-symbols-outlined text-on-tertiary-fixed/40">chevron_right</span>
          </div>
        </section>

        {/* Primary CTA Card */}
        <section className="relative group">
          <div className="bg-surface-container-lowest rounded-lg overflow-hidden flex flex-col shadow-sm border border-outline-variant botanical-shadow">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-bold uppercase tracking-widest">Recommended</span>
                <span className="text-[10px] font-medium text-tertiary">~5 minutes</span>
              </div>
              <h3 className="font-headline text-xl font-bold tracking-tight text-primary">Interactive Sensory Storytelling</h3>
              <p className="text-on-surface-variant leading-relaxed text-sm">Focus on joint attention and emotional expression through guided movement.</p>
              <button className="w-full bg-primary text-white px-8 py-4 rounded-full font-bold flex items-center justify-center gap-2 active:scale-95 transition-all duration-200">
                Start Today&apos;s Play Session
                <span className="material-symbols-outlined text-[18px]">play_circle</span>
              </button>
            </div>
            <div className="h-48 overflow-hidden">
              <img alt="Child playing" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC0tG3sP6cTEwDWKrUH7AThCh2pjHROQqpXFKSJJXKElZsHtPYAviwDu6SCWWggrRL0vn_PlGu4xOSI5bLuF0j5QYZav0g_NvES-5bsgAvTYMhow-yjW2kTidEHjji-FUQdk90qlzdBEotTzPHFDYBF1tKYTtGxcAHv_ABcr5m3p56WWBC7VR9KPy6KyWOAu_cBnxK3VwyMyJJxXFRxGfkuwP3pjnNvpVWKdtczBAityHt4O8KCVqqLUSTzgP3vKB7YVQsqMUn9gg0" />
            </div>
          </div>
        </section>

        {/* Narrative Growth Overview */}
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-headline text-xl font-bold tracking-tight text-on-surface">Growth Overview</h2>
            <button className="text-sm font-semibold text-primary">View History</button>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {/* Social Interaction */}
            <div className="bg-surface-container-low p-4 rounded-lg flex items-center gap-4">
              <div className="bg-white w-10 h-10 rounded-lg flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary">diversity_3</span>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-tertiary font-bold">Social Interaction</p>
                <p className="font-headline text-base font-bold text-on-surface">Building connection patterns</p>
              </div>
            </div>
            {/* Attention */}
            <div className="bg-surface-container-low p-4 rounded-lg flex items-center gap-4">
              <div className="bg-white w-10 h-10 rounded-lg flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary">visibility</span>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-tertiary font-bold">Attention</p>
                <p className="font-headline text-base font-bold text-on-surface">Building focus habits</p>
              </div>
            </div>
            {/* Motor Skills */}
            <div className="bg-surface-container-low p-4 rounded-lg flex items-center gap-4">
              <div className="bg-white w-10 h-10 rounded-lg flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary">fitness_center</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-[10px] uppercase tracking-widest text-tertiary font-bold">Motor Skills</p>
                  <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[8px] font-bold">ACTIVE</span>
                </div>
                <p className="font-headline text-base font-bold text-on-surface">Exploring physical movement</p>
              </div>
            </div>
          </div>
        </section>

        {/* Secondary Action */}
        <section className="bg-surface-container-lowest p-6 rounded-lg border border-outline-variant flex gap-5 items-center botanical-shadow">
          <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0">
            <img alt="Blocks" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAwT0RSi5WShCz0gOWVUDEyXb1dqYqRCDO01Rsm8w5uyosrzUawKKBe_EJPFO1vSfZ3gykFvJTpdKkl_8n_RkwDD18z9GtIwHdbytpUTbPxGVvYwd8cU1eJvQ_rw5IXdSUvf6SDt9oOR1KCHYFw9w0UvAfXoPIN0EzP6Qe-IZF49gqTNwdNjA-b-vsuLJePwa5r2vQoXw5MG43i0Ah2u8TbGHfqczh5NIt_Hw9qTMvyw2tfUOEdWsVUN_GTeqeks0IqynpAEbW9FLs" />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-widest text-primary font-bold">Quick Activity</p>
            <h3 className="font-headline text-base font-bold text-on-surface">Mirror Play Session</h3>
            <p className="text-xs text-on-surface-variant">A 5-minute exercise for facial mimicry.</p>
          </div>
        </section>

        {/* Refine Understanding CTA */}
        <section className="py-4">
          <button className="w-full flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/10 group active:scale-[0.98] transition-all">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-xl">psychology</span>
              <div className="text-left">
                <p className="font-headline text-sm font-bold text-on-surface">Refine Understanding</p>
                <p className="text-[11px] text-on-surface-variant">Update Sarah&apos;s profile for better play matches</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-tertiary/40 group-hover:text-primary transition-colors">arrow_forward</span>
          </button>
        </section>
      </main>
      <BottomNav />
    </>
  );
}
