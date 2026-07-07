import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  Timestamp,
  writeBatch,
  type DocumentData,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Expense, Split } from "../types";
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

export function docToExpense(id: string, data: DocumentData): Expense {
  return {
    id,
    groupId: data.groupId,
    description: data.description,
    amount: data.amount,
    paidBy: data.paidBy ?? data.payers?.[0]?.memberId ?? "",
    payers: data.payers ?? (data.paidBy ? [{ memberId: data.paidBy, amount: data.amount }] : undefined),
    date: data.date,
    splits: data.splits ?? [],
    category: data.category,
    createdBy: data.createdBy,
  };
}

export async function createExpense(
  groupId: string,
  description: string,
  amount: number,
  paidBy: string,
  splits: Split[],
  date?: Date,
  category?: string,
  userId?: string,
  actorName?: string
): Promise<Expense> {
  const expenseRef = doc(collection(db, "expenses"));
  const batch = writeBatch(db);

  batch.set(expenseRef, {
    groupId, description, amount, paidBy, splits,
    category: category ?? null,
    createdBy: userId ?? null,
    date: date ? Timestamp.fromDate(date) : Timestamp.now(),
  });

  batch.set(auditRef(), makeAuditEntry(
    groupId, "expense_created", actorName ?? userId ?? "Alguien", amount, description
  ));

  await batch.commit();

  return {
    id: expenseRef.id, groupId, description, amount, paidBy, splits,
    category, createdBy: userId,
    date: date ? Timestamp.fromDate(date) : Timestamp.now(),
  };
}

export async function getGroupExpenses(groupId: string): Promise<Expense[]> {
  const q = query(
    collection(db, "expenses"),
    where("groupId", "==", groupId)
  );
  const snap = await getDocs(q);
  const expenses = snap.docs.map((d) => docToExpense(d.id, d.data()));
  return expenses.toSorted((a, b) => b.date.toMillis() - a.date.toMillis());
}

export async function getExpense(expenseId: string): Promise<Expense | null> {
  const snap = await getDoc(doc(db, "expenses", expenseId));
  if (!snap.exists()) return null;
  return docToExpense(snap.id, snap.data());
}

export async function updateExpense(
  expenseId: string,
  data: Partial<Pick<Expense, "description" | "amount" | "paidBy" | "splits" | "category" | "payers" | "date">>,
  actorUserId?: string,
  actorName?: string
): Promise<void> {
  const batch = writeBatch(db);

  // Leer el doc actual para obtener datos viejos
  const snap = await getDoc(doc(db, "expenses", expenseId));
  const oldAmount = snap.exists() ? (snap.data().amount as number) : 0;
  const oldDescription = snap.exists() ? (snap.data().description as string) : "";

  batch.update(doc(db, "expenses", expenseId), data as Record<string, unknown>);

  const newAmount = (data.amount ?? oldAmount) as number;
  const newDescription = (data.description ?? oldDescription) as string;

  batch.set(auditRef(), makeAuditEntry(
    snap.exists() ? (snap.data().groupId as string) : "",
    "expense_updated",
    actorName ?? actorUserId ?? "Alguien",
    newAmount,
    newDescription,
  ));

  await batch.commit();
}

export async function deleteExpense(
  expenseId: string,
  actorUserId?: string,
  actorName?: string
): Promise<void> {
  const batch = writeBatch(db);

  // Leer datos antes de borrar
  const snap = await getDoc(doc(db, "expenses", expenseId));
  const amount = snap.exists() ? (snap.data().amount as number) : 0;
  const description = snap.exists() ? (snap.data().description as string) : "";
  const groupId = snap.exists() ? (snap.data().groupId as string) : "";

  // Borrar settlements vinculados
  const settlementSnap = await getDocs(
    query(collection(db, "settlements"), where("expenseId", "==", expenseId))
  );
  settlementSnap.docs.forEach((d) => {
    batch.delete(doc(db, "settlements", d.id));
  });

  batch.delete(doc(db, "expenses", expenseId));

  batch.set(auditRef(), makeAuditEntry(
    groupId,
    "expense_deleted",
    actorName ?? actorUserId ?? "Alguien",
    amount,
    description,
  ));

  await batch.commit();
}
