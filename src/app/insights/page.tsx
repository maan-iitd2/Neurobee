import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import Link from "next/link";

export default function InsightsPage() {
  return (
    <>
      <TopBar />
      <main className="max-w-5xl mx-auto px-6 pt-12 pb-32 space-y-12">
        <section className="grid grid-cols-1 md:grid-cols-[1.2fr_0.8fr] gap-8 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-secondary-container/30 px-4 py-1.5 rounded-full">
              <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
              <span className="font-label text-xs uppercase tracking-widest font-medium text-primary">Engaging Early</span>
            </div>
            <h2 className="font-headline text-[3.5rem] leading-[1.1] font-extrabold tracking-tight text-on-surface">
              We&apos;re beginning to <span className="text-primary">notice a pattern...</span>
            </h2>
            <p className="text-lg leading-relaxed text-on-surface-variant max-w-lg">
              You&apos;re doing the <span className="font-bold text-primary">right thing</span> for Leo. By observing and engaging early, you are providing the best possible environment for development. Your attention is Leo&apos;s greatest asset.
            </p>
          </div>
          <div className="relative hidden md:block">
            <div className="absolute -inset-4 bg-primary-container/10 rounded-xl -rotate-3"></div>
            <img className="relative w-full aspect-square object-cover rounded-lg botanical-shadow" alt="Gentle overhead shot of a parent's hand holding a child's hand while playing with colorful sensory toys" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAA8Ns8JeA4RVHO-J6-eCa2QBI7QjY5RLUonJhzRvrwDnuvSmoDeUyKhWlqrBZZ25pEs3KlpaMPuLaUXEygLhKlcwfJWE-G4h7G44UufWIzq5YUDjuTnY23M0X2FmTODbzUsyoL43-II-5_X3WaAFkIt-gWMJtlNVsCvl7C9mf1jTuKG96pQD5yUERzeYGp9zOS8h8bWkCzpnp6gKauxDzp5FLWMUvzcZdcd6XwspTT506msZ9Lkq51J9MrtF6H4kPVmfxnWxub_34" />
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-surface-container-low p-10 rounded-lg space-y-6 flex flex-col justify-center relative">
            <div className="absolute top-6 right-8 text-[10px] font-label uppercase tracking-widest text-primary/60 font-semibold">
              Observed over the past 5 sessions
            </div>
            <div className="w-12 h-12 bg-surface-container-lowest rounded-full flex items-center justify-center botanical-shadow">
              <span className="material-symbols-outlined text-primary">visibility</span>
            </div>
            <div className="space-y-4">
              <h3 className="font-headline text-2xl font-bold tracking-tight">Early Observation</h3>
              <p className="text-lg leading-relaxed text-on-surface-variant">
                We noticed Leo may take a bit more time responding to social cues. This developmental pattern helps us tailor activities to support his unique way of connecting with the world.
              </p>
              <p className="text-[10px] font-label text-tertiary uppercase tracking-widest pt-2">
                Source: Derived from 12 interactions and 3 milestone check-ins.
              </p>
            </div>
          </div>
          <div className="bg-surface-container-lowest p-10 rounded-lg space-y-6 border border-outline-variant/15 flex flex-col justify-center botanical-shadow">
            <div className="w-12 h-12 bg-secondary-container rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-on-secondary-container">child_care</span>
            </div>
            <div className="space-y-4">
              <h3 className="font-headline text-2xl font-bold tracking-tight text-on-surface">Normalization</h3>
              <p className="text-lg leading-relaxed text-on-surface-variant">
                Many children show similar patterns during development. Every brain grows on its own timeline, and variations in social responsiveness are common in early childhood.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <span className="font-label text-xs uppercase tracking-widest font-medium text-tertiary">Action Plan</span>
              <h2 className="font-headline text-3xl font-bold tracking-tight">Guidance for Leo</h2>
            </div>
            <p className="text-on-surface-variant text-sm max-w-xs">Simple, evidence-based actions to integrate into your daily routine.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="group bg-surface-container-lowest p-8 rounded-lg botanical-shadow hover:scale-[1.02] transition-transform duration-300">
              <div className="mb-6 h-1 w-12 bg-primary rounded-full group-hover:w-full transition-all duration-500"></div>
              <h4 className="font-headline text-xl font-bold mb-3">Playful Focus</h4>
              <p className="text-on-surface-variant text-sm leading-relaxed mb-6">Encourage eye contact during play by bringing toys up to your eye level before handing them over.</p>
              <Link href="/reflection" className="flex items-center gap-2 text-primary font-medium text-sm hover:underline cursor-pointer">
                <span className="material-symbols-outlined text-base">play_circle</span>
                Learn Technique
              </Link>
            </div>
            <div className="group bg-surface-container-lowest p-8 rounded-lg botanical-shadow hover:scale-[1.02] transition-transform duration-300">
              <div className="mb-6 h-1 w-12 bg-primary-container rounded-full group-hover:w-full transition-all duration-500"></div>
              <h4 className="font-headline text-xl font-bold mb-3">Name Awareness</h4>
              <p className="text-on-surface-variant text-sm leading-relaxed mb-6">Use name-based interaction frequently. Wait for a small signal of recognition before continuing.</p>
              <div className="flex items-center gap-2 text-primary font-medium text-sm cursor-pointer hover:underline">
                <span className="material-symbols-outlined text-base">record_voice_over</span>
                View Examples
              </div>
            </div>
            <div className="group bg-surface-container-lowest p-8 rounded-lg botanical-shadow hover:scale-[1.02] transition-transform duration-300">
              <div className="mb-6 h-1 w-12 bg-secondary rounded-full group-hover:w-full transition-all duration-500"></div>
              <h4 className="font-headline text-xl font-bold mb-3">Joint Attention</h4>
              <p className="text-on-surface-variant text-sm leading-relaxed mb-6">Point to objects of interest and narrate what you see, encouraging Leo to follow your gaze.</p>
              <div className="flex items-center gap-2 text-primary font-medium text-sm cursor-pointer hover:underline">
                <span className="material-symbols-outlined text-base">lightbulb</span>
                Deep Dive
              </div>
            </div>
          </div>
        </section>

        <section className="bg-surface-container p-8 rounded-lg">
          <details className="group cursor-pointer">
            <summary className="flex items-center justify-between list-none">
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-tertiary">menu_book</span>
                <h4 className="font-headline text-lg font-bold">Learn More About Development</h4>
              </div>
              <span className="material-symbols-outlined group-open:rotate-180 transition-transform duration-300">expand_more</span>
            </summary>
            <div className="pt-6 space-y-4 text-on-surface-variant leading-relaxed">
              <p>Understanding developmental milestones helps parents provide targeted support. Research shows that early, high-frequency social engagement can significantly enhance communication skills.</p>
              <p>Our methodology is based on the Early Start Denver Model (ESDM) and neurodevelopmental research focused on social communication pathways.</p>
            </div>
          </details>
        </section>

        <div className="flex justify-center pt-4">
          <button className="inline-flex items-center gap-2 bg-on-surface text-surface px-8 py-4 rounded-full font-headline font-bold hover:opacity-90 transition-all botanical-shadow">
            <span className="material-symbols-outlined">file_download</span>
            Export Full Report
          </button>
        </div>

        <footer className="pt-8 border-t border-outline-variant/15 text-center">
          <p className="text-xs text-tertiary font-medium italic">
            This tool supports early understanding and is not a medical diagnosis.
          </p>
        </footer>
      </main>
      <BottomNav />
    </>
  );
}
