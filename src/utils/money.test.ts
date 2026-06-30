import { describe, it, expect } from "vitest";
import { splitEvenCents, formatEur } from "./money";

// ── Helpers ──

/** Sum an array of numbers to 2 decimals. */
function sum(xs: number[]): number {
  return Math.round(xs.reduce((a, b) => a + b, 0) * 100) / 100;
}

// ── splitEvenCents ──

describe("splitEvenCents", () => {
  // ── Basic splits ──

  it("2-way split of 10.00", () => {
    const result = splitEvenCents(10, 2);
    expect(result).toEqual([5, 5]);
    expect(sum(result)).toBe(10);
  });

  it("3-way split of 10.00 (floor + remainder to first)", () => {
    const result = splitEvenCents(10, 3);
    expect(result).toEqual([3.34, 3.33, 3.33]);
    expect(sum(result)).toBe(10);
  });

  it("3-way split of 10.01", () => {
    const result = splitEvenCents(10.01, 3);
    expect(result).toEqual([3.34, 3.34, 3.33]);
    expect(sum(result)).toBe(10.01);
  });

  it("5-way split of 0.04 (one cent each to first 4)", () => {
    const result = splitEvenCents(0.04, 5);
    expect(result).toEqual([0.01, 0.01, 0.01, 0.01, 0]);
    expect(sum(result)).toBe(0.04);
  });

  it("4-way split of 0.01 (one cent to first only)", () => {
    const result = splitEvenCents(0.01, 4);
    expect(result).toEqual([0.01, 0, 0, 0]);
    expect(sum(result)).toBe(0.01);
  });

  it("1-way split returns the full amount", () => {
    const result = splitEvenCents(42.5, 1);
    expect(result).toEqual([42.5]);
    expect(sum(result)).toBe(42.5);
  });

  it("count = 0 returns empty array", () => {
    expect(splitEvenCents(100, 0)).toEqual([]);
  });

  it("amount = 0 returns all zeros", () => {
    const result = splitEvenCents(0, 3);
    expect(result).toEqual([0, 0, 0]);
    expect(sum(result)).toBe(0);
  });

  it("100-way split of 1.00", () => {
    const result = splitEvenCents(1, 100);
    expect(result).toHaveLength(100);
    expect(result.every((v) => v === 0.01)).toBe(true);
    expect(sum(result)).toBe(1);
  });

  it("3-way split of 100.00", () => {
    const result = splitEvenCents(100, 3);
    expect(result).toEqual([33.34, 33.33, 33.33]);
    expect(sum(result)).toBe(100);
  });

  it("7-way split of 1234.56", () => {
    const result = splitEvenCents(1234.56, 7);
    expect(result).toHaveLength(7);
    expect(sum(result)).toBe(1234.56);
  });

  it("3-way split of 33.33", () => {
    const result = splitEvenCents(33.33, 3);
    expect(result).toHaveLength(3);
    expect(sum(result)).toBe(33.33);
    // Each split must be ≥ 0
    expect(Math.min(...result)).toBeGreaterThanOrEqual(0);
    // Max difference between any two splits is 0.01
    const maxDiff = Math.max(...result) - Math.min(...result);
    expect(maxDiff).toBeLessThanOrEqual(0.01);
  });

  // ── INVARIANTE UNIVERSAL ──
  // Para cualquier amount > 0 y count ≥ 1:
  //   sum(splitEvenCents(amount, count)) === amount
  //   result.length === count
  //   all values ≥ 0
  //   max difference ≤ 0.01

  it("INVARIANTE: sum siempre igual al amount original", () => {
    const testCases = [
      [0.01, 1],
      [0.01, 5],
      [0.99, 3],
      [1, 7],
      [10.1, 4],
      [99.99, 6],
      [100, 10],
      [123.45, 9],
      [500, 2],
      [1000, 11],
      [9999.99, 8],
      [0.03, 3],
      [0.05, 2],
      [0.1, 3],
    ] as const;
    for (const [amount, count] of testCases) {
      const result = splitEvenCents(amount, count);
      expect(result).toHaveLength(count);
      expect(sum(result)).toBe(amount);
      expect(Math.min(...result)).toBeGreaterThanOrEqual(0);
      const maxDiff = Math.max(...result) - Math.min(...result);
      // Use rounded diff to avoid floating-point artifacts
      expect(Math.round(maxDiff * 100) / 100).toBeLessThanOrEqual(0.01);
    }
  });

  it("INVARIANTE: splits nunca negativos y máx 1 céntimo de diferencia", () => {
    // Edge case: amounts just over cent boundaries
    for (let cents = 1; cents <= 100; cents++) {
      const amount = cents / 100;
      for (let count = 2; count <= 6; count++) {
        const result = splitEvenCents(amount, count);
        expect(result).toHaveLength(count);
        expect(sum(result)).toBe(amount);
        expect(Math.min(...result)).toBeGreaterThanOrEqual(0);
        const maxDiff = Math.max(...result) - Math.min(...result);
        expect(Math.round(maxDiff * 100) / 100).toBeLessThanOrEqual(0.01);
      }
    }
  });

  // ── Property-based random (manual) ──

  it("ALEATORIO: 50 escenarios random, todos los invariantes", () => {
    for (let trial = 0; trial < 50; trial++) {
      const amount = Math.round(Math.random() * 100000) / 100; // 0.01 – 1000.00
      const count = Math.floor(Math.random() * 20) + 1; // 1 – 20
      const result = splitEvenCents(amount, count);
      expect(result).toHaveLength(count);
      expect(sum(result)).toBe(amount);
      expect(Math.min(...result)).toBeGreaterThanOrEqual(0);
      const maxDiff = Math.max(...result) - Math.min(...result);
      expect(Math.round(maxDiff * 100) / 100).toBeLessThanOrEqual(0.01);
    }
  });
});

// ── formatEur ──

describe("formatEur", () => {
  it("formats positive amount", () => {
    expect(formatEur(42.5)).toBe("42,50\u00A0€");
  });

  it("formats zero", () => {
    expect(formatEur(0)).toBe("0,00\u00A0€");
  });

  it("formats negative amount with minus sign", () => {
    expect(formatEur(-42.5)).toBe("−42,50\u00A0€");
  });

  it("formats signed positive with + prefix", () => {
    expect(formatEur(42.5, true)).toBe("+42,50\u00A0€");
  });

  it("formats large number with thousand separators", () => {
    expect(formatEur(1234567.89)).toBe("1.234.567,89\u00A0€");
  });

  it("handles amounts with one decimal digit", () => {
    expect(formatEur(10.5)).toBe("10,50\u00A0€");
  });

  it("handles very small amounts", () => {
    expect(formatEur(0.01)).toBe("0,01\u00A0€");
  });
});
