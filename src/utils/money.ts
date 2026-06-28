import {
  dinero,
  add,
  subtract,
  multiply,
  allocate,
  toDecimal,
  toSnapshot,
  equal,
  greaterThan,
  lessThan,
  isZero,
} from "dinero.js";
import { EUR } from "dinero.js/currencies";
import type { Dinero } from "dinero.js";

type D = Dinero<number>;

/** Create a Dinero object from a float amount (42.50 → 4250 in minor units). */
export function eur(amount: number): D {
  return dinero({ amount: Math.round(amount * 100), currency: EUR }) as D;
}

/** Convert a Dinero object back to a float for Firestore/display. */
export function toFloat(d: D): number {
  const snap = toSnapshot(d) as { amount: number; currency: { code: string; exponent: number; base: number } };
  return snap.amount / Math.pow(10, snap.currency.exponent);
}

/**
 * Format a Dinero object or float as a localized currency string.
 */
export function formatEur(amount: D | number, signed = false): string {
  const value = typeof amount === "number" ? Math.abs(amount) : Math.abs(toFloat(amount));
  const isNeg = typeof amount === "number" ? amount < 0 : toFloat(amount) < 0;
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

/** Allocate a Dinero amount evenly across N parts. */
export function allocateEven(d: D, parts: number): D[] {
  return allocate(d, Array(parts).fill(1)) as D[];
}

/**
 * Split a float amount evenly across `count` parts using cents-based
 * floor + remainder distribution (transparent, no dinero.js rounding).
 * Returns float amounts that always sum back to the original.
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

/** Add multiple Dinero amounts together. */
export function addEur(items: D[]): D {
  return items.reduce((acc, d) => add(acc, d) as D);
}

export { add, subtract, multiply, allocate, toDecimal, equal, greaterThan, lessThan, isZero };
export type { D as Dinero };
