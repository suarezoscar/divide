import { useAuditLog, type ActivityEvent } from "../../hooks/useAuditLog";
import { Card } from "../ui/Card";
import { Skeleton } from "../ui/Skeleton";
import { formatCurrency } from "../../utils/format";
import styles from "./ActivityLog.module.css";

const ICONS: Record<string, string> = {
  expense_created: "🖊️",
  expense_updated: "✏️",
  expense_deleted: "🗑️",
  settlement_created: "💰",
  member_added: "➕",
  member_removed: "➖",
  member_left: "🚪",
  member_claimed: "🔗",
  group_created: "🎉",
  group_updated: "⚙️",
  group_deleted: "💥",
};

function formatTimeAgo(timestamp: { toMillis: () => number }): string {
  const now = Date.now();
  const ms = now - timestamp.toMillis();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days}d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `hace ${weeks} sem`;
  const months = Math.floor(days / 30);
  return `hace ${months} mes${months > 1 ? "es" : ""}`;
}

function formatMessage(event: ActivityEvent): string {
  const { type, actorName, details } = event;
  const name = actorName;
  switch (type) {
    case "expense_created":
      return `${name} añadió "${details?.expenseDescription ?? ""}" (${formatCurrency((details?.amount as number) ?? 0)})`;
    case "expense_updated":
      return `${name} editó "${details?.expenseDescription ?? ""}"`;
    case "expense_deleted":
      return `${name} eliminó "${details?.expenseDescription ?? ""}" (${formatCurrency((details?.amount as number) ?? 0)})`;
    case "settlement_created":
      return `${name} saldó ${formatCurrency((details?.amount as number) ?? 0)} con ${details?.toName ?? "alguien"}`;
    case "member_added":
      return `${name} añadió a "${details?.memberName ?? ""}" al grupo`;
    case "member_removed":
      return `${name} eliminó a "${details?.memberName ?? ""}" del grupo`;
    case "member_left":
      return `${name} salió del grupo`;
    case "member_claimed":
      return details?.memberName
        ? `${name} se identificó como "${details.memberName}" en el grupo`
        : `${name} se identificó en el grupo`;
    case "group_created":
      return `${name} creó el grupo`;
    case "group_updated":
      return `${name} actualizó el grupo`;
    case "group_deleted":
      return `${name} eliminó el grupo`;
    default:
      return `${name} realizó una acción`;
  }
}

export function ActivityLog({ groupId }: { groupId: string }) {
  const { events, loading } = useAuditLog(groupId);

  if (loading) {
    return (
      <div className={styles.list}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className={styles.skeleton}>
            <Skeleton width="100%" height="16px" />
          </div>
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <Card className={styles.empty}>
        <p style={{ marginBottom: 6 }}>Aún no hay actividad</p>
        <p style={{ fontSize: 13, color: "#6B7280" }}>
          Los cambios en el grupo aparecerán aquí.
        </p>
      </Card>
    );
  }

  return (
    <div className={styles.list}>
      {events.map((event) => (
        <div key={event.id} className={styles.event}>
          <span className={styles.icon}>{ICONS[event.type] ?? "📌"}</span>
          <div className={styles.body}>
            <p className={styles.message}>{formatMessage(event)}</p>
            <span className={styles.time}>{formatTimeAgo(event.timestamp)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
