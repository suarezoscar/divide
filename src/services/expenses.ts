import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
  type DocumentData,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Expense, Split } from "../types";

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
  userId?: string
): Promise<Expense> {
  const ref = await addDoc(collection(db, "expenses"), {
    groupId, description, amount, paidBy, splits,
    category: category ?? null,
    createdBy: userId ?? null,
    date: date ? Timestamp.fromDate(date) : Timestamp.now(),
  });
  return {
    id: ref.id, groupId, description, amount, paidBy, splits,
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
  // Sort in client to avoid needing a composite index
  return expenses.toSorted((a, b) => b.date.toMillis() - a.date.toMillis());
}

export async function getExpense(expenseId: string): Promise<Expense | null> {
  const snap = await getDoc(doc(db, "expenses", expenseId));
  if (!snap.exists()) return null;
  return docToExpense(snap.id, snap.data());
}

export async function updateExpense(
  expenseId: string,
  data: Partial<Pick<Expense, "description" | "amount" | "paidBy" | "splits" | "category" | "payers" | "date">>
): Promise<void> {
  await updateDoc(doc(db, "expenses", expenseId), data as Record<string, unknown>);
}

export async function deleteExpense(expenseId: string): Promise<void> {
  // Also delete related settlements if they reference this expense
  const settlementSnap = await getDocs(
    query(collection(db, "settlements"), where("expenseId", "==", expenseId))
  );
  await Promise.all(settlementSnap.docs.map((d) => deleteDoc(doc(db, "settlements", d.id))));
  await deleteDoc(doc(db, "expenses", expenseId));
}
