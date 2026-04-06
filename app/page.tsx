import { RealPriceFaq } from "@/components/marketing/realprice-faq";
import { RealPriceFeatures } from "@/components/marketing/realprice-features";
import { RealPriceHero } from "@/components/marketing/realprice-hero";
import { RealPricePricing } from "@/components/marketing/realprice-pricing";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";

export default function Page() {
  return (
    <main className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="aurora-float absolute left-[10%] top-20 h-72 w-72 rounded-full bg-[radial-gradient(circle,_rgba(77,226,168,0.22),_transparent_68%)] blur-3xl" />
        <div className="aurora-float absolute right-[8%] top-[26rem] h-80 w-80 rounded-full bg-[radial-gradient(circle,_rgba(125,211,252,0.18),_transparent_68%)] blur-3xl [animation-delay:1.5s]" />
      </div>

      <SiteHeader />

      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-24 px-5 pb-16 pt-8 sm:px-6 lg:px-8">
        <RealPriceHero />
        <RealPriceFeatures />
        <RealPricePricing />
        <RealPriceFaq />
        <SiteFooter />
      </div>
    </main>
  );
}
