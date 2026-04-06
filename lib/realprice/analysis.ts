import type { PopularCategory, ProductAnalysis, ProductCategory, ProductSnapshot } from "@/lib/realprice/types";
import { average, clamp, merchantFromQuery, seededRandom, titleCase, titleFromUrlOrQuery } from "@/lib/realprice/utils";

interface ProductProfile {
  keywords: string[];
  name: string;
  category: ProductCategory;
  fairPrice: number;
}

const productProfiles: ProductProfile[] = [
  {
    keywords: ["sony", "wh-1000xm5", "xm5"],
    name: "Sony WH-1000XM5 Wireless Headphones",
    category: "Electronics",
    fairPrice: 319
  },
  {
    keywords: ["airpods", "pro"],
    name: "Apple AirPods Pro 2",
    category: "Electronics",
    fairPrice: 219
  },
  {
    keywords: ["macbook", "air", "m3"],
    name: "Apple MacBook Air M3 13-inch",
    category: "Electronics",
    fairPrice: 1049
  },
  {
    keywords: ["ps5", "playstation"],
    name: "Sony PlayStation 5 Slim",
    category: "Gaming",
    fairPrice: 449
  },
  {
    keywords: ["switch", "oled"],
    name: "Nintendo Switch OLED",
    category: "Gaming",
    fairPrice: 329
  },
  {
    keywords: ["steam", "deck"],
    name: "Steam Deck OLED 512GB",
    category: "Gaming",
    fairPrice: 549
  },
  {
    keywords: ["nike", "dunk", "panda"],
    name: "Nike Dunk Low Panda",
    category: "Shoes",
    fairPrice: 118
  },
  {
    keywords: ["adidas", "samba"],
    name: "Adidas Samba OG",
    category: "Shoes",
    fairPrice: 100
  },
  {
    keywords: ["pokemon", "151"],
    name: "Pokemon 151 Booster Bundle",
    category: "Collectibles",
    fairPrice: 49
  },
  {
    keywords: ["lego", "star wars"],
    name: "LEGO Star Wars Boarding the Tantive IV",
    category: "Collectibles",
    fairPrice: 48
  },
  {
    keywords: ["dyson", "v15"],
    name: "Dyson V15 Detect",
    category: "Home",
    fairPrice: 629
  }
];

const categoryDefaults: Record<ProductCategory, { fairRange: [number, number]; merchant: string[] }> = {
  Electronics: {
    fairRange: [69, 1299],
    merchant: ["Amazon", "Best Buy", "Walmart", "Target"]
  },
  Shoes: {
    fairRange: [75, 240],
    merchant: ["Nike", "Adidas", "StockX", "GOAT"]
  },
  Collectibles: {
    fairRange: [18, 350],
    merchant: ["eBay", "TCGplayer", "Target", "Walmart"]
  },
  Gaming: {
    fairRange: [39, 699],
    merchant: ["GameStop", "Best Buy", "Amazon", "Walmart"]
  },
  Home: {
    fairRange: [49, 899],
    merchant: ["Costco", "Target", "Amazon", "Home Depot"]
  }
};

const categoryKeywords: Array<{ category: ProductCategory; keywords: string[] }> = [
  { category: "Gaming", keywords: ["ps5", "xbox", "switch", "steam deck", "controller", "gaming", "nintendo"] },
  { category: "Shoes", keywords: ["shoe", "sneaker", "nike", "adidas", "yeezy", "jordan", "samba", "dunk"] },
  { category: "Collectibles", keywords: ["pokemon", "lego", "graded", "funko", "booster", "collectible"] },
  { category: "Home", keywords: ["vacuum", "dyson", "coffee", "appliance", "blender", "air fryer"] },
  { category: "Electronics", keywords: ["iphone", "airpods", "headphones", "camera", "monitor", "macbook", "tablet"] }
];

const priceTimelineLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"];

export const starterExamples = [
  "Sony WH-1000XM5 headphones",
  "https://www.bestbuy.com/site/sony-wh1000xm5",
  "Pokemon 151 booster bundle",
  "Nintendo Switch OLED"
] as const;

export const popularCategories: PopularCategory[] = [
  {
    name: "Electronics",
    description: "Headphones, laptops, tablets, and flagship accessories.",
    exampleQuery: "Apple AirPods Pro 2"
  },
  {
    name: "Shoes",
    description: "Sneakers and limited-release pairs that swing hard on price.",
    exampleQuery: "Nike Dunk Low Panda"
  },
  {
    name: "Collectibles",
    description: "Trading cards, LEGO sets, and collector inventory.",
    exampleQuery: "Pokemon 151 Booster Bundle"
  },
  {
    name: "Gaming",
    description: "Consoles, handhelds, and gaming accessories.",
    exampleQuery: "Steam Deck OLED 512GB"
  }
];

function detectCategory(rawQuery: string) {
  const normalized = rawQuery.toLowerCase();
  const direct = categoryKeywords.find((item) => item.keywords.some((keyword) => normalized.includes(keyword)));
  return direct?.category ?? "Electronics";
}

function deriveFallbackFairPrice(query: string, category: ProductCategory) {
  const [min, max] = categoryDefaults[category].fairRange;
  const ratio = seededRandom(query, "fallback-price");
  return Math.round(min + (max - min) * ratio);
}

function resolveProfile(query: string) {
  const normalized = query.toLowerCase();
  const profile = productProfiles.find((entry) => entry.keywords.every((keyword) => normalized.includes(keyword)));

  if (profile) {
    return profile;
  }

  const category = detectCategory(query);
  return {
    name: titleFromUrlOrQuery(query) || "Tracked Product",
    category,
    fairPrice: deriveFallbackFairPrice(query, category)
  };
}

function deriveMerchant(query: string, category: ProductCategory) {
  const explicit = merchantFromQuery(query);

  if (explicit !== "Market Average") {
    return explicit;
  }

  const merchants = categoryDefaults[category].merchant;
  return merchants[Math.floor(seededRandom(query, "merchant") * merchants.length)] ?? merchants[0];
}

function generateCurrentPrice(seed: string, fairPrice: number) {
  const state = seededRandom(seed, "deal-band");

  if (state < 0.28) {
    return fairPrice * (0.8 + seededRandom(seed, "great") * 0.11);
  }

  if (state < 0.76) {
    return fairPrice * (0.95 + seededRandom(seed, "fair") * 0.12);
  }

  return fairPrice * (1.1 + seededRandom(seed, "high") * 0.22);
}

function buildHistory(seed: string, fairPrice: number, currentPrice: number) {
  const history = priceTimelineLabels.map((label, index) => {
    const wave = Math.sin((index / priceTimelineLabels.length) * Math.PI * 1.25) * 0.05;
    const noise = (seededRandom(seed, `history-${index}`) * 2 - 1) * 0.07;
    const ratio = clamp(1 + wave + noise, 0.78, 1.28);
    return {
      label,
      price: Math.round(fairPrice * ratio)
    };
  });

  const dipIndex = Math.floor(seededRandom(seed, "dip-index") * (history.length - 2)) + 1;
  history[dipIndex] = {
    ...history[dipIndex],
    price: Math.round(fairPrice * (0.78 + seededRandom(seed, "dip-price") * 0.1))
  };

  history[history.length - 1] = {
    label: history[history.length - 1]?.label ?? "Now",
    price: Math.round(currentPrice)
  };

  return history;
}

function deriveVerdict(currentPrice: number, fairPrice: number, averageRecentPrice: number) {
  const dealRatio = currentPrice / fairPrice;
  const recentRatio = currentPrice / averageRecentPrice;

  if (dealRatio <= 0.91 || recentRatio <= 0.9) {
    return {
      verdict: "Great Deal" as const,
      recommendation: "Buy Now" as const
    };
  }

  if (dealRatio <= 1.08 || recentRatio <= 1.05) {
    return {
      verdict: "Fair Price" as const,
      recommendation: "Watch" as const
    };
  }

  return {
    verdict: "Overpriced" as const,
    recommendation: "Wait" as const
  };
}

function buildSummary(currentPrice: number, averageRecentPrice: number, fairPrice: number, verdict: ProductAnalysis["verdict"]) {
  const versusAverage = Math.round(((averageRecentPrice - currentPrice) / averageRecentPrice) * 100);
  const versusFair = Math.round(((fairPrice - currentPrice) / fairPrice) * 100);

  if (verdict === "Great Deal") {
    return `Current price is ${Math.abs(versusAverage)}% under the recent average and comfortably below our fair-value line.`;
  }

  if (verdict === "Fair Price") {
    return `Current price is within normal market range and close to the expected fair price.`;
  }

  return `Current price is running ${Math.abs(versusFair)}% above our fair-value estimate and lacks a compelling markdown.`;
}

function buildFakeSaleDetector(seed: string, fairPrice: number, averageRecentPrice: number, currentPrice: number) {
  const claimedDiscountPercent = Math.round(18 + seededRandom(seed, "claimed-discount") * 42);
  const listPrice = Math.round(currentPrice / (1 - claimedDiscountPercent / 100));
  const marketDiscountPercent = Math.max(0, Math.round(((averageRecentPrice - currentPrice) / averageRecentPrice) * 100));
  const spread = claimedDiscountPercent - marketDiscountPercent;
  const flagged = spread >= 18 || listPrice > fairPrice * 1.35;
  const confidence: "Low" | "Medium" | "High" = spread >= 28 ? "High" : spread >= 18 ? "Medium" : "Low";

  const reasons = flagged
    ? [
        `Claimed markdown is ${claimedDiscountPercent}%, but the market-based discount looks closer to ${marketDiscountPercent}%.`,
        `Reference price sits well above the modeled fair price for this product.`,
        "This looks more like anchor pricing than a true market-leading deal."
      ]
    : [
        `Claimed markdown of ${claimedDiscountPercent}% is mostly consistent with recent market movement.`,
        "The reference price is elevated, but not enough to trigger a fake-sale warning."
      ];

  return {
    listPrice,
    detector: {
      flagged,
      confidence,
      claimedDiscountPercent,
      marketDiscountPercent,
      reasons
    }
  };
}

export function analyzeProduct(query: string) {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    throw new Error("Paste a product name or product URL to analyze.");
  }

  const profile = resolveProfile(trimmedQuery);
  const merchant = deriveMerchant(trimmedQuery, profile.category);
  const currentPrice = Math.max(8, Math.round(generateCurrentPrice(trimmedQuery, profile.fairPrice)));
  const history = buildHistory(trimmedQuery, profile.fairPrice, currentPrice);
  const averageRecentPrice = Math.round(average(history.map((point) => point.price)));
  const lowestRecentPrice = Math.min(...history.map((point) => point.price));
  const fairPrice = Math.round(profile.fairPrice * 0.55 + averageRecentPrice * 0.45);
  const { verdict, recommendation } = deriveVerdict(currentPrice, fairPrice, averageRecentPrice);
  const fakeSale = buildFakeSaleDetector(trimmedQuery, fairPrice, averageRecentPrice, currentPrice);
  const dealScore = clamp(
    Math.round(100 - (currentPrice / fairPrice) * 45 + (averageRecentPrice / currentPrice) * 12 - (fakeSale.detector.flagged ? 8 : 0)),
    42,
    96
  );

  return {
    query: trimmedQuery,
    productName: profile.name,
    merchant,
    category: profile.category,
    currentPrice,
    fairPrice,
    averageRecentPrice,
    lowestRecentPrice,
    listPrice: fakeSale.listPrice,
    dealScore,
    verdict,
    recommendation,
    shortSummary: buildSummary(currentPrice, averageRecentPrice, fairPrice, verdict),
    history,
    fakeSale: fakeSale.detector,
    alertTargetPrice:
      verdict === "Overpriced" ? Math.round(fairPrice * 0.92) : verdict === "Fair Price" ? Math.round(fairPrice * 0.96) : Math.round(currentPrice * 0.96),
    checkedAt: new Date().toISOString()
  } satisfies ProductAnalysis;
}

export function getTrendingDeals() {
  return [
    analyzeProduct("Sony WH-1000XM5 headphones"),
    analyzeProduct("Nintendo Switch OLED"),
    analyzeProduct("Pokemon 151 Booster Bundle"),
    analyzeProduct("Dyson V15 Detect")
  ];
}

export function getRecentChecks() {
  return [
    analyzeProduct("Apple AirPods Pro 2"),
    analyzeProduct("Nike Dunk Low Panda"),
    analyzeProduct("Steam Deck OLED 512GB")
  ];
}

export function getTrendingSnapshots() {
  return getTrendingDeals().map((item) => ({
    name: item.productName,
    query: item.query,
    category: item.category,
    currentPrice: item.currentPrice,
    fairPrice: item.fairPrice,
    verdict: item.verdict
  })) satisfies ProductSnapshot[];
}

export function normalizeQueryForInput(query: string) {
  return titleCase(query.replace(/\s+/g, " ").trim());
}
