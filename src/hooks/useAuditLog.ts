import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, orderBy, Timestamp } from "firebase/firestore";
import { db } from "../services/firebase";
import type { EventType, EventDetails } from "../services/auditLog";

export interface ActivityEvent {
  id: string;
  groupId: string;
  type: EventType;
  actorUserId: string;
  actorName: string;
  timestamp: Timestamp;
  details?: EventDetails | null;
}

function docToEvent(id: string, data: Record<string, unknown>): ActivityEvent {
  const d = data as Record<string, any>;
  return {
    id,
    groupId: d.groupId,
    type: d.type,
    actorUserId: d.actorUserId,
    actorName: d.actorName,
    timestamp: d.timestamp,
    details: d.details ?? null,
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
