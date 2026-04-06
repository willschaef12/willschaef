import type { Metadata } from "next";

import { RealPriceApp } from "@/components/analyze/realprice-app";
import { analyzeProduct, getRecentChecks, getTrendingDeals, popularCategories, starterExamples } from "@/lib/realprice/analysis";

export const metadata: Metadata = {
  title: "Analyze",
  description: "Paste a product name or URL to see RealPrice verdicts, fair value estimates, history, and fake-sale signals."
};

export default function AnalyzePage() {
  return (
    <RealPriceApp
      initialAnalysis={analyzeProduct("Sony WH-1000XM5 headphones")}
      recentChecks={getRecentChecks()}
      trendingDeals={getTrendingDeals()}
      categories={popularCategories}
      starterExamples={starterExamples}
    />
  );
}
