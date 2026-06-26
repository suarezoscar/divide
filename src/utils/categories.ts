export const CATEGORIES = [
  { id: "food", emoji: "🍕", label: "Comida" },
  { id: "transport", emoji: "🚌", label: "Transporte" },
  { id: "housing", emoji: "🏠", label: "Alojamiento" },
  { id: "leisure", emoji: "🍻", label: "Ocio" },
  { id: "shopping", emoji: "🛒", label: "Compras" },
  { id: "other", emoji: "📦", label: "Otro" },
] as const;

export function getCategory(id: string | undefined) {
  if (!id) return null;
  return CATEGORIES.find((c) => c.id === id) ?? null;
}
