const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function formatCurrency(cents: number): string {
  return currency.format(Math.round(cents / 100));
}

/** Hand-rolled because Intl compact notation differs between Node and browser ICU builds, breaking hydration. */
export function formatCompactCurrency(cents: number): string {
  const dollars = cents / 100;
  if (Math.abs(dollars) < 1_000) return `$${Math.round(dollars)}`;
  const thousands = dollars / 1_000;
  return `$${Number.isInteger(thousands) ? thousands : thousands.toFixed(1)}k`;
}

export function formatPercent(rate: number, digits = 1): string {
  return `${(rate * 100).toFixed(digits)}%`;
}

function sign(value: number): string {
  return value > 0 ? "+" : value < 0 ? "−" : "";
}

export function formatSignedPercent(rate: number): string {
  return `${sign(rate)}${Math.abs(rate * 100).toFixed(1)}%`;
}

/** Difference between two rates, in percentage points. */
export function formatPoints(diff: number): string {
  return `${sign(diff)}${Math.abs(diff * 100).toFixed(1)} pts`;
}

export function formatSignedNumber(value: number): string {
  return `${sign(value)}${Math.abs(value)}`;
}

export function formatSignedCurrency(cents: number): string {
  return `${sign(cents)}${currency.format(Math.abs(Math.round(cents / 100)))}`;
}
