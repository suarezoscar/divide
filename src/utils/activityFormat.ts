import { formatCurrency } from "./format";
import type { ActivityEvent } from "../hooks/useAuditLog";

export const ACTIVITY_ICONS: Record<string, string> = {
  expense_created: "🖊️",
  expense_updated: "✏️",
  expense_deleted: "🗑️",
  settlement_created: "💰",
};

export function formatActivityDateTime(timestamp: { toDate: () => Date }): string {
  const d = timestamp.toDate();
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const mins = String(d.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${mins}`;
}

export function formatActivityMessage(event: ActivityEvent): string {
  const { type, actorName, amount, toName } = event;
  const fmtAmount = formatCurrency(amount);

  switch (type) {
    case "expense_created":
      return `${actorName} ha añadido un gasto de ${fmtAmount} (${formatActivityDateTime(event.timestamp)})`;
    case "expense_updated":
      return `${actorName} ha editado un gasto de ${fmtAmount} (${formatActivityDateTime(event.timestamp)})`;
    case "expense_deleted":
      return `${actorName} ha eliminado un gasto de ${fmtAmount} (${formatActivityDateTime(event.timestamp)})`;
    case "settlement_created":
      return `${actorName} ha saldado su deuda de ${fmtAmount} con ${toName ?? "alguien"} (${formatActivityDateTime(event.timestamp)})`;
    default:
      return `${actorName} realizó una acción (${formatActivityDateTime(event.timestamp)})`;
  }
}
