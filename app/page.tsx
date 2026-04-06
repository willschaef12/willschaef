import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { EditForgeFaq } from "@/components/marketing/editforge-faq";
import { EditForgeFeatures } from "@/components/marketing/editforge-features";
import { EditForgeHero } from "@/components/marketing/editforge-hero";
import { EditForgePricing } from "@/components/marketing/editforge-pricing";

export default function Page() {
  return (
    <main className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="float-slow absolute left-[8%] top-24 h-56 w-56 rounded-full bg-[radial-gradient(circle,_rgba(255,107,44,0.26),_transparent_68%)] blur-2xl" />
        <div className="float-slow absolute right-[10%] top-[28rem] h-72 w-72 rounded-full bg-[radial-gradient(circle,_rgba(54,210,255,0.18),_transparent_68%)] blur-3xl [animation-delay:1.4s]" />
      </div>

      <SiteHeader />

      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-24 px-5 pb-16 pt-8 sm:px-6 lg:px-8">
        <EditForgeHero />
        <EditForgeFeatures />
        <EditForgePricing />
        <EditForgeFaq />
        <SiteFooter />
      </div>
    </main>
  );
}
