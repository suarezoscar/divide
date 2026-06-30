/**
 * Money utilities — pure cents-based arithmetic.
 * No external dependencies. All amounts stored as floats (EUR) at the
 * Firestore/API boundary; internal computation uses integer cents.
 */

/**
 * Split a float amount evenly across `count` parts using cents-based
 * floor + remainder distribution — always sums back to the original.
 */
export function splitEvenCents(amount: number, count: number): number[] {
  if (count === 0) return [];
  const cents = Math.round(amount * 100);
  const share = Math.floor(cents / count);
  const remainder = cents - share * count;
  const result: number[] = [];
  for (let i = 0; i < count; i++) {
    result.push((share + (i < remainder ? 1 : 0)) / 100);
  }
  return result;
}

/**
 * Format a float amount as a localized EUR string.
 */
export function formatEur(amount: number, signed = false): string {
  const value = Math.abs(amount);
  const isNeg = amount < 0;
  const formatted = new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
  if (isNeg) return `−${formatted}`;
  if (signed && value > 0) return `+${formatted}`;
  return formatted;
}
