import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import Link from "next/link";

export default function MilestonesPage() {
  return (
    <>
      <TopBar />
      <main className="max-w-4xl mx-auto px-6 pt-12 pb-32">
        {/* Progress Header Section */}
        <div className="mb-12">
          <div className="flex justify-between items-end mb-4">
            <div>
              <span className="font-label text-xs uppercase tracking-widest text-tertiary font-medium mb-1 block">Observation 4 of 12</span>
              <h1 className="text-3xl font-extrabold text-on-background tracking-tight font-headline">Milestone Moments</h1>
            </div>
            <span className="text-primary font-bold text-lg">35%</span>
          </div>
          {/* NeuroBee Specific Progress Capsule */}
          <div className="h-3 w-full bg-surface-container-high rounded-full overflow-hidden">
            <div className="h-full bg-primary-gradient rounded-full" style={{ width: "35%" }}></div>
          </div>
        </div>

        {/* Question Canvas (Bento-style layout for visual relief) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Question Area */}
          <div className="lg:col-span-8 space-y-8">
            <section className="bg-surface-container-lowest p-8 lg:p-12 rounded-lg botanical-shadow relative overflow-hidden">
              {/* Subtle organic background shape */}
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-secondary-container/20 rounded-full blur-3xl"></div>
              <div className="relative z-10">
                <p className="text-on-surface-variant font-body mb-6 leading-relaxed">Based on your recent play sessions, we&apos;d like to understand Leo&apos;s unique path a bit better. These moments help us refine your experience.</p>
                <h2 className="text-2xl lg:text-3xl font-bold text-on-surface leading-snug mb-8 font-headline">
                  Does Leo look at you when you call his name?
                </h2>
                <div className="space-y-4">
                  {/* Option Card: Often */}
                  <button className="w-full flex items-center justify-between p-6 rounded-[1rem] bg-surface-container-low hover:bg-primary-fixed border border-transparent hover:border-primary/10 transition-all duration-300 group">
                    <span className="text-lg font-medium text-on-surface-variant group-hover:text-primary">Often</span>
                    <span className="material-symbols-outlined opacity-0 group-hover:opacity-100 text-primary transition-opacity" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  </button>
                  {/* Option Card: Sometimes */}
                  <button className="w-full flex items-center justify-between p-6 rounded-[1rem] bg-surface-container-low hover:bg-primary-fixed border border-transparent hover:border-primary/10 transition-all duration-300 group">
                    <span className="text-lg font-medium text-on-surface-variant group-hover:text-primary">Sometimes</span>
                    <span className="material-symbols-outlined opacity-0 group-hover:opacity-100 text-primary transition-opacity" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  </button>
                  {/* Option Card: Rarely */}
                  <button className="w-full flex items-center justify-between p-6 rounded-[1rem] bg-surface-container-low hover:bg-primary-fixed border border-transparent hover:border-primary/10 transition-all duration-300 group">
                    <span className="text-lg font-medium text-on-surface-variant group-hover:text-primary">Rarely</span>
                    <span className="material-symbols-outlined opacity-0 group-hover:opacity-100 text-primary transition-opacity" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  </button>
                </div>
              </div>
            </section>

            {/* Reassurance Disclaimer */}
            <div className="flex gap-4 p-6 bg-tertiary-fixed/30 rounded-lg items-start border border-outline-variant/10">
              <span className="material-symbols-outlined text-tertiary shrink-0">info</span>
              <p className="text-sm text-on-tertiary-fixed-variant leading-relaxed font-body">
                This helps us tailor your play sessions and is not a diagnosis. We focus on capturing the beauty of everyday moments to support Leo&apos;s unique path.
              </p>
            </div>
          </div>

          {/* Supporting Context Side */}
          <div className="lg:col-span-4 space-y-6">
            {/* Visual Cue Card */}
            <div className="bg-surface-container-low rounded-lg p-1 overflow-hidden">
              <div className="aspect-square rounded-[1rem] overflow-hidden mb-4">
                <img alt="Social interaction illustration" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCpA_RKDCVkTz81dugFscpCFj9_hkyz7e7MCaRxHP5o1_XcIaqhcQZEwU5BWWH87ca-Q0L9PZf0hOhpT58N4IkCdea0-V7jKhZIfrdOBraBpG5ZPPpEW7bXakcK73-YoD5H3J_V6jVAW6Wl-CsQBFS_tZ4JoRZcVWLd57oJw0YTlrvr8Vk5kE0_QWG7_1w6l1pus-J6t2yYl_3vAOBIIeMhe6YUF9rBuj_cMwv_G3q1aC8zBmIxULTqhfveDSOVUz_3te_xZV3L80Q" />
              </div>
              <div className="p-4">
                <h3 className="text-sm font-bold text-on-surface-variant mb-2 font-headline">Why this matters</h3>
                <p className="text-xs text-tertiary leading-relaxed">
                  Responding to their name is a key social-emotional milestone that shows Leo is starting to understand shared attention.
                </p>
              </div>
            </div>

            {/* Navigation Controls */}
            <div className="flex flex-col gap-3">
              <Link href="/insights" className="w-full text-center py-4 bg-primary text-on-primary rounded-full font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20">
                Continue / Refine Insights
              </Link>
              <button className="w-full py-4 text-primary font-semibold hover:bg-surface-container-high rounded-full transition-all">
                Skip for now
              </button>
            </div>
          </div>
        </div>
      </main>
      <BottomNav />
    </>
  );
}
