import { formatEur } from "./money";

export function formatCurrency(amount: number, signed = false): string {
  return formatEur(amount, signed);
}

export function formatDate(date: { toDate?: () => Date } | Date): string {
  if (!date) return "";
  const d = "toDate" in date && typeof (date as any).toDate === "function" ? (date as any).toDate() : date;
  if (!(d instanceof Date) || isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}
