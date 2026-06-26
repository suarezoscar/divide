import { describe, it, expect } from "vitest";
import { formatCurrency, formatDate } from "./format";

describe("formatCurrency", () => {
  it("formats positive amounts", () => {
    expect(formatCurrency(42.5)).toBe("42,50\u00A0€");
  });

  it("formats zero", () => {
    expect(formatCurrency(0)).toBe("0,00\u00A0€");
  });

  it("formats negative amounts with minus sign", () => {
    expect(formatCurrency(-42.5)).toBe("−42,50\u00A0€");
  });

  it("formats signed positive with + prefix", () => {
    expect(formatCurrency(42.5, true)).toBe("+42,50\u00A0€");
  });

  it("formats signed negative with minus", () => {
    expect(formatCurrency(-42.5, true)).toBe("−42,50\u00A0€");
  });

  it("handles large numbers", () => {
    expect(formatCurrency(1234567.89)).toBe("1.234.567,89\u00A0€");
  });
});

describe("formatDate", () => {
  it("formats a Date object", () => {
    const result = formatDate(new Date("2026-03-10T20:30:00"));
    expect(result).toContain("10 mar");
    expect(result).toContain("2026");
    expect(result).toContain("20:30");
  });

  it("formats a Firestore-like object with toDate", () => {
    const obj = { toDate: () => new Date("2026-03-10T20:30:00") };
    const result = formatDate(obj);
    expect(result).toContain("10 mar");
    expect(result).toContain("20:30");
  });

  it("returns empty string for null", () => {
    // @ts-expect-error testing invalid input
    expect(formatDate(null)).toBe("");
  });

  it("returns empty string for undefined", () => {
    // @ts-expect-error testing invalid input
    expect(formatDate(undefined)).toBe("");
  });

  it("returns empty string for invalid date", () => {
    expect(formatDate(new Date("invalid"))).toBe("");
  });
});
