import { describe, it, expect } from "vitest";
import { getCategory, CATEGORIES } from "./categories";

describe("CATEGORIES", () => {
  it("has at least 5 categories", () => {
    expect(CATEGORIES.length).toBeGreaterThanOrEqual(5);
  });

  it("all categories have unique ids", () => {
    const ids = CATEGORIES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("all categories have emoji and label", () => {
    for (const c of CATEGORIES) {
      expect(c.emoji).toBeTruthy();
      expect(c.label).toBeTruthy();
    }
  });
});

describe("getCategory", () => {
  it("returns category by id", () => {
    const cat = getCategory("food");
    expect(cat?.label).toBe("Comida");
    expect(cat?.emoji).toBe("🍕");
  });

  it("returns null for undefined", () => {
    expect(getCategory(undefined)).toBeNull();
  });

  it("returns null for unknown id", () => {
    expect(getCategory("nonexistent")).toBeNull();
  });
});
