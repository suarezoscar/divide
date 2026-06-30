import { describe, it, expect } from "vitest";
import { detectCategory } from "./categoryDetection";

describe("detectCategory", () => {
  // ── Exact / classic matches ──────────────────────────────────────
  it("detects 'cena' as food", () => {
    expect(detectCategory("cena")).toBe("food");
  });

  it("detects 'uber al aeropuerto' as transport", () => {
    expect(detectCategory("uber al aeropuerto")).toBe("transport");
  });

  it("detects 'escape room' as leisure", () => {
    expect(detectCategory("escape room")).toBe("leisure");
  });

  it("detects 'alquiler' as housing", () => {
    expect(detectCategory("alquiler")).toBe("housing");
  });

  it("detects 'mercadona' as shopping", () => {
    expect(detectCategory("mercadona")).toBe("shopping");
  });

  it("detects 'zara' as shopping", () => {
    expect(detectCategory("zara")).toBe("shopping");
  });

  it("detects 'discoteca' as nightlife", () => {
    expect(detectCategory("discoteca")).toBe("nightlife");
  });

  // ── Fuzzy: plurals & typos ──────────────────────────────────────
  it("detects 'karts' as leisure (plural fuzzy)", () => {
    expect(detectCategory("fui a los karts")).toBe("leisure");
  });

  it("detects 'cachopo' as food (new word)", () => {
    expect(detectCategory("cachopo")).toBe("food");
  });

  it("detects 'cachopos' as food (plural fuzzy)", () => {
    expect(detectCategory("cenamos cachopos")).toBe("food");
  });

  it("detects 'paddle surf' as leisure", () => {
    expect(detectCategory("paddle surf")).toBe("leisure");
  });

  it("detects 'moto de agua' as leisure", () => {
    expect(detectCategory("moto de agua")).toBe("leisure");
  });

  it("detects 'paddle tenis' as leisure", () => {
    expect(detectCategory("paddle tenis")).toBe("leisure");
  });

  it("detects 'jet ski' as leisure", () => {
    expect(detectCategory("jet ski alquiler")).toBe("leisure");
  });

  // ── Multi-word exact match ──────────────────────────────────────
  it("still detects multi-word 'escape room' exactly", () => {
    expect(detectCategory("escape room enigma")).toBe("leisure");
  });

  it("still detects 'el corte ingles' as shopping (supermarket)", () => {
    expect(detectCategory("el corte ingles")).toBe("shopping");
  });

  it("still detects '100 montaditos' as food", () => {
    expect(detectCategory("100 montaditos")).toBe("food");
  });

  // ── Edge cases ──────────────────────────────────────────────────
  it("returns null for empty string", () => {
    expect(detectCategory("")).toBeNull();
  });

  it("returns null for whitespace only", () => {
    expect(detectCategory("   ")).toBeNull();
  });

  it("returns null for null-ish input", () => {
    expect(detectCategory(null as unknown as string)).toBeNull();
  });

  it("returns null for gibberish", () => {
    expect(detectCategory("zxqwyvbnm")).toBeNull();
  });

  it("ignores stop words but detects content", () => {
    // "en" and "la" are stop words, "playa" should still match leisure
    expect(detectCategory("en la playa")).toBe("leisure");
  });

  // ── Galician detection ───────────────────────────────────────────
  it("detects 'polbo' as food (gl)", () => {
    expect(detectCategory("polbo")).toBe("food");
  });

  it("detects 'aluguer' as housing (gl)", () => {
    expect(detectCategory("aluguer")).toBe("housing");
  });

  it("detects 'praia' as leisure (gl)", () => {
    expect(detectCategory("praia")).toBe("leisure");
  });

  it("detects 'cervexa' as nightlife (gl)", () => {
    expect(detectCategory("cervexa")).toBe("nightlife");
  });

  it("detects 'tenda' as shopping (gl)", () => {
    expect(detectCategory("tenda")).toBe("shopping");
  });

  // ── English detection ────────────────────────────────────────────
  it("detects 'dinner' as food (en)", () => {
    expect(detectCategory("dinner")).toBe("food");
  });

  it("detects 'underground' as transport (en)", () => {
    expect(detectCategory("underground")).toBe("transport");
  });

  it("detects 'rent' as housing (en)", () => {
    expect(detectCategory("rent")).toBe("housing");
  });

  it("detects 'movie' as leisure (en)", () => {
    expect(detectCategory("movie")).toBe("leisure");
  });

  it("detects 'store' as shopping (en)", () => {
    expect(detectCategory("store")).toBe("shopping");
  });

  // ── Spanish supermarket detection ─────────────────────────────────
  it("detects 'gadis' as shopping", () => {
    expect(detectCategory("gadis")).toBe("shopping");
  });

  it("detects 'coviran' as shopping", () => {
    expect(detectCategory("coviran")).toBe("shopping");
  });

  it("detects 'bonpreu' as shopping", () => {
    expect(detectCategory("bonpreu")).toBe("shopping");
  });

  it("detects 'condis' as shopping", () => {
    expect(detectCategory("condis")).toBe("shopping");
  });

  it("detects 'caprabo' as shopping", () => {
    expect(detectCategory("caprabo")).toBe("shopping");
  });

  it("detects 'beer' as nightlife (en)", () => {
    expect(detectCategory("beer")).toBe("nightlife");
  });
});
