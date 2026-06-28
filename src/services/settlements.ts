import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  Timestamp,
  type DocumentData,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Settlement } from "../types";

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
  amount: number
): Promise<Settlement> {
  if (from === to) throw new Error("No puedes saldar una deuda contigo mismo");
  if (amount <= 0) throw new Error("El importe debe ser positivo");

  const ref = await addDoc(collection(db, "settlements"), {
    groupId,
    from,
    to,
    amount,
    date: Timestamp.now(),
  });
  return {
    id: ref.id,
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
  // Sort in client to avoid needing a composite index
  return settlements.toSorted((a, b) => b.date.toMillis() - a.date.toMillis());
}
