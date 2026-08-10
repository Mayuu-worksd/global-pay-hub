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

/** Indicative reference rates used for conversion previews until a live FX provider is wired in. */
export const REFERENCE_RATES: Record<string, number> = {
  USD: 1.0,
  EUR: 1.08,    // 1 EUR = 1.08 USD
  GBP: 1.27,    // 1 GBP = 1.27 USD
  BTC: 60000.0, // 1 BTC = 60,000 USD
  ETH: 3000.0,  // 1 ETH = 3,000 USD
  USDT: 1.0,    // 1 USDT = 1.0 USD
};

export function toUsd(amount: number, currency: string) {
  const upper = currency.toUpperCase();
  const rate = REFERENCE_RATES[upper] || 1;
  return amount * rate;
}

export function convert(amount: number, from: string, to: string) {
  const fromUpper = from.toUpperCase();
  const toUpper = to.toUpperCase();
  const fromRate = REFERENCE_RATES[fromUpper] || 1;
  const toRate = REFERENCE_RATES[toUpper] || 1;
  const usdVal = amount * fromRate;
  return usdVal / toRate;
}

export function rateBetween(from: string, to: string) {
  return convert(1, from, to);
}
