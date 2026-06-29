import {
  FOOD_KEYWORDS,
  TRANSPORT_KEYWORDS,
  HOUSING_KEYWORDS,
  LEISURE_KEYWORDS,
  SHOPPING_KEYWORDS,
  NIGHTLIFE_KEYWORDS,
} from "./categoryKeywords";

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  nightlife: NIGHTLIFE_KEYWORDS,
  food: FOOD_KEYWORDS,
  transport: TRANSPORT_KEYWORDS,
  housing: HOUSING_KEYWORDS,
  leisure: LEISURE_KEYWORDS,
  shopping: SHOPPING_KEYWORDS,
};

/** Normalize: lowercase, remove accents, split into words. */
function normalize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[\s,.;:!?]+/)
    .filter(Boolean);
}

/** Detect category from description text. Returns category ID or null if no match. */
export function detectCategory(text: string): string | null {
  const normalized = normalize(text);
  if (normalized.length === 0) return null;

  const lowerText = text.toLowerCase();

  // Fase 1: multi-word keywords primero (más específicos, ej: "escape room")
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const kw of keywords) {
      if (kw.includes(" ") && lowerText.includes(kw)) {
        return category;
      }
    }
  }

  // Fase 2: single-word fallback
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const word of normalized) {
      if (keywords.some((kw) => word === kw || word.includes(kw) || kw.includes(word))) {
        return category;
      }
    }
  }
  return null;
}
