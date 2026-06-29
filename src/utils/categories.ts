export const CATEGORIES = [
  { id: "food", emoji: "🍕", label: "Comida" },
  { id: "transport", emoji: "🚌", label: "Transporte" },
  { id: "housing", emoji: "🏠", label: "Alojamiento" },
  { id: "leisure", emoji: "🏃", label: "Actividad" },
  { id: "shopping", emoji: "🛒", label: "Compras" },
  { id: "nightlife", emoji: "🍻", label: "Copas" },
  { id: "other", emoji: "📦", label: "Otro" },
] as const;

export function getCategory(id: string | undefined) {
  if (!id) return null;
  return CATEGORIES.find((c) => c.id === id) ?? null;
}

const CATEGORY_COLORS: Record<string, string> = {
  food: "#059669",
  transport: "#D97706",
  housing: "#7C3AED",
  leisure: "#0891B2",
  shopping: "#DB2777",
  nightlife: "#DC2626",
  other: "#6B7280",
};

export function getCategoryColor(id: string): string {
  return CATEGORY_COLORS[id] ?? CATEGORY_COLORS.other;
}
