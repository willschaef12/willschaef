export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function hashSeed(input: string) {
  let hash = 2166136261;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

export function seededRandom(seed: string, salt: number | string) {
  let state = (hashSeed(`${seed}:${salt}`) || 1) >>> 0;

  state ^= state << 13;
  state ^= state >>> 17;
  state ^= state << 5;

  return ((state >>> 0) % 10_000) / 10_000;
}

export function titleCase(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 100 ? 0 : 2
  }).format(value);
}

export function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

export function formatCompactDate(isoString: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric"
  }).format(new Date(isoString));
}

export function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
}

export function titleFromUrlOrQuery(query: string) {
  try {
    const url = new URL(query);
    const slug = url.pathname
      .split("/")
      .filter(Boolean)
      .pop()
      ?.replace(/\.[a-z0-9]+$/i, "")
      .replace(/[_-]+/g, " ")
      .replace(/\b(dp|gp|sku|item|p)\b/gi, " ")
      .replace(/\b[a-z0-9]{7,}\b/gi, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (slug) {
      return titleCase(slug);
    }
  } catch {
    return titleCase(
      query
        .trim()
        .replace(/\s+/g, " ")
        .replace(/[|]+/g, " ")
    );
  }

  return titleCase(query.trim().replace(/\s+/g, " "));
}

export function merchantFromQuery(query: string) {
  try {
    const url = new URL(query);
    const host = url.hostname.replace(/^www\./, "");
    const merchant = host.split(".")[0] ?? host;
    return titleCase(merchant);
  } catch {
    return "Market Average";
  }
}
