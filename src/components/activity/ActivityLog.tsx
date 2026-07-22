import { useAuditLog } from "../../hooks/useAuditLog";
import { Card } from "../ui/Card";
import { Skeleton } from "../ui/Skeleton";
import { ACTIVITY_ICONS, formatActivityMessage } from "../../utils/activityFormat";
import styles from "./ActivityLog.module.css";

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
          <span className={styles.icon}>{ACTIVITY_ICONS[event.type] ?? "📌"}</span>
          <div className={styles.body}>
            <p className={styles.message}>{formatActivityMessage(event)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
