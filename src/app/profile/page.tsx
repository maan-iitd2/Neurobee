import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { SignOutButton } from "@clerk/nextjs";

export default function ProfilePage() {
  return (
    <>
      <TopBar />
      <main className="max-w-xl mx-auto px-6 pt-8 space-y-10 pb-32">
        {/* Hero Section */}
        <section className="space-y-2">
          <p className="font-label text-primary font-medium tracking-[0.05em] uppercase text-[0.75rem]">Account Management</p>
          <h1 className="font-headline font-extrabold text-3xl tracking-tight text-on-background">Your Workspace</h1>
          <p className="text-body text-tertiary leading-relaxed max-w-sm">Manage your family&apos;s journey and app preferences with ease.</p>
        </section>

        {/* Child Profile Bento Grid */}
        <section className="space-y-6">
          <h2 className="font-headline font-bold text-xl tracking-tight flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">child_care</span>
            Child Profile
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Main Edit Card */}
            <div className="col-span-1 md:col-span-2 bg-surface-container-lowest botanical-shadow p-6 rounded-lg flex items-center justify-between group cursor-pointer hover:bg-surface-container-low transition-colors duration-300 border border-outline-variant/10">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-surface-container-high ring-4 ring-secondary-container/30">
                    <img alt="Leo's Profile" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAR7BJ6Yy4cOAvmAMO2Gov30HJ8O0n9c9X4FV5TEl104vf-E2o4lTE3AaUckiwodu122leHKFwIVfkaREbSq7zZiyzatqkeXbTEnTgkUMqE9UeYxmuANfyOji9ZjG1hlLqMpDJt1kuWNo29YZ9WvlS-tEV6vRh7kGFRuyyIoSllKZWhWdlfHUbS-o8OBKsIjso0nXsLTX6cflEWYG28Y_21XT9jS5PE18dSgD9Ona37aI5ypzGL87YhAOgG_7BDr-3gsdEcG8n0qsE" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-primary text-white p-1 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                    <span className="material-symbols-outlined text-[14px]">edit</span>
                  </div>
                </div>
                <div>
                  <h3 className="font-headline font-bold text-lg">Leo Anderson</h3>
                  <p className="text-body text-tertiary text-sm">4 years, 2 months</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-outline-variant group-hover:text-primary transition-colors">chevron_right</span>
            </div>

            {/* Milestone Summary Card */}
            <div className="bg-surface-container-low p-5 rounded-lg space-y-3">
              <span className="material-symbols-outlined text-primary">auto_awesome</span>
              <h4 className="font-headline font-bold text-sm">Active Journey</h4>
              <p className="text-body text-tertiary text-xs leading-relaxed">Speech &amp; Social Interaction focus. 12 milestones tracked this month.</p>
            </div>

            {/* Profile Visibility */}
            <div className="bg-surface-container-low p-5 rounded-lg space-y-3">
              <span className="material-symbols-outlined text-primary">shield_with_heart</span>
              <h4 className="font-headline font-bold text-sm">Data Privacy</h4>
              <p className="text-body text-tertiary text-xs leading-relaxed">Profile is private. Only shared caregivers can view progress.</p>
            </div>
          </div>
        </section>

        {/* Parent & App Settings List */}
        <section className="space-y-4">
          <h2 className="font-headline font-bold text-xl tracking-tight">System &amp; Account</h2>
          <div className="bg-surface-container-lowest botanical-shadow rounded-lg overflow-hidden border border-outline-variant/10">
            {/* Parent Account */}
            <div className="px-6 py-5 flex items-center justify-between hover:bg-surface-container-low transition-colors duration-300 border-b border-surface-container-high/20 cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-secondary-container">person</span>
                </div>
                <div>
                  <p className="font-headline font-semibold text-sm">Parent Account</p>
                  <p className="text-body text-tertiary text-xs">sarah.anderson@example.com</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-outline-variant">chevron_right</span>
            </div>

            {/* Notifications */}
            <div className="px-6 py-5 flex items-center justify-between hover:bg-surface-container-low transition-colors duration-300 border-b border-surface-container-high/20 cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-secondary-container">notifications_active</span>
                </div>
                <div>
                  <p className="font-headline font-semibold text-sm">App Notifications</p>
                  <p className="text-body text-tertiary text-xs">Manage daily reminders &amp; tips</p>
                </div>
              </div>
              <div className="w-10 h-5 bg-primary/20 rounded-full relative flex items-center px-1">
                <div className="w-3.5 h-3.5 bg-primary rounded-full ml-auto"></div>
              </div>
            </div>

            {/* Dark Mode */}
            <div className="px-6 py-5 flex items-center justify-between hover:bg-surface-container-low transition-colors duration-300 cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-secondary-container">dark_mode</span>
                </div>
                <div>
                  <p className="font-headline font-semibold text-sm">Appearance</p>
                  <p className="text-body text-tertiary text-xs">Light Mode (System Default)</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-outline-variant">chevron_right</span>
            </div>
          </div>
        </section>

        {/* Reporting Section - Premium Card */}
        <section className="space-y-4">
          <h2 className="font-headline font-bold text-xl tracking-tight">Reports &amp; Export</h2>
          <div className="bg-primary-gradient p-6 rounded-lg text-white botanical-shadow relative overflow-hidden group">
            <div className="relative z-10 space-y-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
                <span className="material-symbols-outlined text-white">description</span>
              </div>
              <div className="space-y-1">
                <h3 className="font-headline font-extrabold text-xl">Developmental Report</h3>
                <p className="text-primary-fixed text-sm opacity-90 leading-relaxed">Generate a clinical-ready PDF of Leo&apos;s progress for your pediatrician or therapist.</p>
              </div>
              <button className="bg-white text-primary px-6 py-3 rounded-full font-headline font-bold text-sm w-full hover:bg-surface-container-lowest transition-all duration-300 flex items-center justify-center gap-2">
                Export Full Report
                <span className="material-symbols-outlined text-sm">download</span>
              </button>
            </div>
            {/* Abstract Background Ornament */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-secondary-container/10 rounded-full blur-3xl"></div>
          </div>
        </section>

        {/* Logout/Danger Zone */}
        <section className="py-6 flex flex-col items-center">
          <SignOutButton>
            <button className="text-error font-headline font-bold text-sm tracking-tight flex items-center gap-2 px-6 py-2 rounded-full hover:bg-error-container/20 transition-colors">
              <span className="material-symbols-outlined text-sm">logout</span>
              Sign Out
            </button>
          </SignOutButton>
          <p className="mt-4 text-[10px] text-tertiary/50 uppercase tracking-widest font-label">NeuroBee v2.4.1 (Stable Build)</p>
        </section>
      </main>
      <BottomNav />
    </>
  );
}
