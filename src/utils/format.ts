export function formatCurrency(amount: number, signed = false): string {
  const abs = Math.abs(amount);
  const formatted = new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(abs);
  if (amount < 0) return `−${formatted}`;
  if (signed && amount > 0) return `+${formatted}`;
  return formatted;
}

export function formatDate(date: { toDate?: () => Date } | Date): string {
  const d = "toDate" in date && typeof date.toDate === "function" ? date.toDate() : date;
  if (!(d instanceof Date) || isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}
