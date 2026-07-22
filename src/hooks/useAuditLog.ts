import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, orderBy, Timestamp } from "firebase/firestore";
import { db } from "../services/firebase";
import type { EventType } from "../services/auditLog";

export interface ActivityEvent {
  id: string;
  groupId: string;
  type: EventType;
  actorName: string;
  timestamp: Timestamp;
  amount: number;
  description?: string;
  toName?: string;
}

function docToEvent(id: string, data: Record<string, unknown>): ActivityEvent {
  const d = data as Record<string, any>;
  return {
    id,
    groupId: d.groupId,
    type: d.type,
    actorName: d.actorName,
    timestamp: d.timestamp,
    amount: d.amount ?? 0,
    description: d.description ?? undefined,
    toName: d.toName ?? undefined,
  };
}

export function useAuditLog(groupId: string) {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const q = query(
      collection(db, "auditLog"),
      where("groupId", "==", groupId),
      orderBy("timestamp", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const all = snap.docs.map((d) => docToEvent(d.id, d.data()));
      setEvents(all);
      setLoading(false);
    }, (err) => {
      console.error("Error al cargar el historial (¿falta el índice compuesto?):", err);
      setError(err instanceof Error ? err.message : String(err));
      setLoading(false);
    });
    return () => unsub();
  }, [groupId]);

  return { events, loading, error };
}
