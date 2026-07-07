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

  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, "auditLog"),
      where("groupId", "==", groupId),
      orderBy("timestamp", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const all = snap.docs.map((d) => docToEvent(d.id, d.data()));
      setEvents(all);
      setLoading(false);
    }, () => {
      setLoading(false);
    });
    return () => unsub();
  }, [groupId]);

  return { events, loading };
}
