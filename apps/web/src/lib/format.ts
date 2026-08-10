const FIAT = new Set(["USD", "EUR", "GBP"]);

export const CURRENCY_SYMBOL: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  BTC: "₿",
  ETH: "Ξ",
  USDT: "₮",
};

export function isFiat(code: string) {
  return FIAT.has(code.toUpperCase());
}

export function formatAmount(amount: number, currency: string) {
  const code = currency.toUpperCase();
  if (isFiat(code)) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
      maximumFractionDigits: 2,
    }).format(amount);
  }
  const decimals = code === "USDT" ? 2 : 6;
  return `${amount.toFixed(decimals)} ${code}`;
}

export function formatFiat(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Fallback static rates — used when live fetch fails. */
export const REFERENCE_RATES: Record<string, number> = {
  USD: 1.0,
  EUR: 1.08,
  GBP: 1.27,
  BTC: 60000.0,
  ETH: 3000.0,
  USDT: 1.0,
};

export function toUsd(amount: number, currency: string, liveRates?: Record<string, number>) {
  const upper = currency.toUpperCase();
  const rates = liveRates ?? REFERENCE_RATES;
  const rate = rates[upper] ?? REFERENCE_RATES[upper] ?? 1;
  return amount * rate;
}

export function convert(amount: number, from: string, to: string, liveRates?: Record<string, number>) {
  const fromUpper = from.toUpperCase();
  const toUpper = to.toUpperCase();
  const rates = liveRates ?? REFERENCE_RATES;
  const fromRate = rates[fromUpper] ?? REFERENCE_RATES[fromUpper] ?? 1;
  const toRate = rates[toUpper] ?? REFERENCE_RATES[toUpper] ?? 1;
  return (amount * fromRate) / toRate;
}

export function rateBetween(from: string, to: string, liveRates?: Record<string, number>) {
  return convert(1, from, to, liveRates);
}
