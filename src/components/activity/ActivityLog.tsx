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
};

function formatDateTime(timestamp: { toDate: () => Date }): string {
  const d = timestamp.toDate();
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const mins = String(d.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${mins}`;
}

function formatMessage(event: ActivityEvent): string {
  const { type, actorName, amount, toName } = event;
  const fmtAmount = formatCurrency(amount);

  switch (type) {
    case "expense_created":
      return `${actorName} ha añadido un gasto de ${fmtAmount} (${formatDateTime(event.timestamp)})`;
    case "expense_updated":
      return `${actorName} ha editado un gasto de ${fmtAmount} (${formatDateTime(event.timestamp)})`;
    case "expense_deleted":
      return `${actorName} ha eliminado un gasto de ${fmtAmount} (${formatDateTime(event.timestamp)})`;
    case "settlement_created":
      return `${actorName} ha saldado su deuda de ${fmtAmount} con ${toName ?? "alguien"} (${formatDateTime(event.timestamp)})`;
    default:
      return `${actorName} realizó una acción (${formatDateTime(event.timestamp)})`;
  }
}

export function ActivityLog({ groupId }: { groupId: string }) {
  const { events, loading, error } = useAuditLog(groupId);

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

  if (error) {
    return (
      <Card className={styles.empty}>
        <p style={{ marginBottom: 6, color: "#DC2626" }}>Error al cargar el historial</p>
        <p style={{ fontSize: 13, color: "#6B7280" }}>
          Es posible que falte un índice en Firestore. Revisa la consola para más detalles.
        </p>
      </Card>
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
          </div>
        </div>
      ))}
    </div>
  );
}
