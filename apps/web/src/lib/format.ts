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
export const REFERENCE_RATES: Record<string, number> = {};

export function toUsd(amount: number, currency: string) {
  return 0; // NOT READY
}

export function convert(amount: number, from: string, to: string) {
  return 0; // NOT READY
}

export function rateBetween(from: string, to: string) {
  return 0; // NOT READY
}
