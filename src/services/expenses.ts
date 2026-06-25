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
  orderBy,
  Timestamp,
  type DocumentData,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Expense, Split } from "../types";

function docToExpense(id: string, data: DocumentData): Expense {
  return {
    id,
    groupId: data.groupId,
    description: data.description,
    amount: data.amount,
    paidBy: data.paidBy,
    date: data.date,
    splits: data.splits ?? [],
  };
}

export async function createExpense(
  groupId: string,
  description: string,
  amount: number,
  paidBy: string,
  splits: Split[]
): Promise<Expense> {
  const ref = await addDoc(collection(db, "expenses"), {
    groupId,
    description,
    amount,
    paidBy,
    splits,
    date: Timestamp.now(),
  });
  return {
    id: ref.id,
    groupId,
    description,
    amount,
    paidBy,
    splits,
    date: Timestamp.now(),
  };
}

export async function getGroupExpenses(groupId: string): Promise<Expense[]> {
  const q = query(
    collection(db, "expenses"),
    where("groupId", "==", groupId),
    orderBy("date", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToExpense(d.id, d.data()));
}

export async function getExpense(expenseId: string): Promise<Expense | null> {
  const snap = await getDoc(doc(db, "expenses", expenseId));
  if (!snap.exists()) return null;
  return docToExpense(snap.id, snap.data());
}

export async function updateExpense(
  expenseId: string,
  data: Partial<Pick<Expense, "description" | "amount" | "paidBy" | "splits">>
): Promise<void> {
  await updateDoc(doc(db, "expenses", expenseId), data as Record<string, unknown>);
}

export async function deleteExpense(expenseId: string): Promise<void> {
  await deleteDoc(doc(db, "expenses", expenseId));
}
