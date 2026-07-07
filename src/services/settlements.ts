import {
  collection,
  addDoc,
  getDocs,
  doc,
  query,
  where,
  Timestamp,
  writeBatch,
  type DocumentData,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Settlement } from "../types";
import type { EventType } from "./auditLog";

function auditRef() {
  return doc(collection(db, "auditLog"));
}

function makeAuditEntry(
  groupId: string,
  type: EventType,
  actorName: string,
  amount: number,
  description?: string,
  toName?: string,
) {
  return {
    groupId,
    type,
    timestamp: Timestamp.now(),
    actorName,
    amount,
    description: description ?? null,
    toName: toName ?? null,
  };
}

function docToSettlement(id: string, data: DocumentData): Settlement {
  return {
    id,
    groupId: data.groupId,
    from: data.from,
    to: data.to,
    amount: data.amount,
    date: data.date,
    expenseId: data.expenseId,
  };
}

export async function createSettlement(
  groupId: string,
  from: string,
  to: string,
  amount: number,
  actorUserId?: string,
  actorName?: string,
  fromName?: string,
  toName?: string
): Promise<Settlement> {
  if (from === to) throw new Error("No puedes saldar una deuda contigo mismo");
  if (amount <= 0) throw new Error("El importe debe ser positivo");

  const settlementRef = doc(collection(db, "settlements"));
  const batch = writeBatch(db);

  batch.set(settlementRef, {
    groupId,
    from,
    to,
    amount,
    date: Timestamp.now(),
  });

  batch.set(auditRef(), makeAuditEntry(
    groupId,
    "settlement_created",
    actorName ?? actorUserId ?? "Alguien",
    amount,
    undefined,
    toName,
  ));

  await batch.commit();

  return {
    id: settlementRef.id,
    groupId,
    from,
    to,
    amount,
    date: Timestamp.now(),
  };
}

export async function getGroupSettlements(groupId: string): Promise<Settlement[]> {
  const q = query(
    collection(db, "settlements"),
    where("groupId", "==", groupId)
  );
  const snap = await getDocs(q);
  const settlements = snap.docs.map((d) => docToSettlement(d.id, d.data()));
  return settlements.toSorted((a, b) => b.date.toMillis() - a.date.toMillis());
}
