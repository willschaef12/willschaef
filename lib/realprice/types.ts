export type ProductCategory = "Electronics" | "Shoes" | "Collectibles" | "Gaming" | "Home";
export type DealVerdict = "Great Deal" | "Fair Price" | "Overpriced";
export type DealRecommendation = "Buy Now" | "Watch" | "Wait";
export type AlertStatus = "ready" | "saved";

export interface PriceHistoryPoint {
  label: string;
  price: number;
}

export interface FakeSaleDetectorResult {
  flagged: boolean;
  confidence: "Low" | "Medium" | "High";
  claimedDiscountPercent: number;
  marketDiscountPercent: number;
  reasons: string[];
}

export interface ProductAnalysis {
  query: string;
  productName: string;
  merchant: string;
  category: ProductCategory;
  currentPrice: number;
  fairPrice: number;
  averageRecentPrice: number;
  lowestRecentPrice: number;
  listPrice: number;
  dealScore: number;
  verdict: DealVerdict;
  recommendation: DealRecommendation;
  shortSummary: string;
  history: PriceHistoryPoint[];
  fakeSale: FakeSaleDetectorResult;
  alertTargetPrice: number;
  checkedAt: string;
}

export interface ProductSnapshot {
  name: string;
  query: string;
  category: ProductCategory;
  currentPrice: number;
  fairPrice: number;
  verdict: DealVerdict;
}

export interface PopularCategory {
  name: ProductCategory;
  description: string;
  exampleQuery: string;
}
