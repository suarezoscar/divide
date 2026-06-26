import { useState, useEffect, useRef } from "react";
import { Timestamp, onSnapshot } from "firebase/firestore";
import { collection, query, where } from "firebase/firestore";
import { db } from "../services/firebase";
import * as expensesService from "../services/expenses";
import type { Expense, Split, Payer } from "../types";

export function useExpenses(groupId: string) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [changes, setChanges] = useState<{ added: Expense[]; modified: Expense[]; removed: string[] } | null>(null);
  const seenIds = useRef<Set<string>>(new Set());
  const firstLoad = useRef(true);

  useEffect(() => {
    setLoading(true);
    seenIds.current = new Set();
    firstLoad.current = true;

    const q = query(collection(db, "expenses"), where("groupId", "==", groupId));
    const unsub = onSnapshot(q, (snap) => {
      const all = snap.docs.map((d) => expensesService.docToExpense(d.id, d.data()));

      // First load — just set expenses
      if (firstLoad.current) {
        firstLoad.current = false;
        for (const e of all) seenIds.current.add(e.id);
        setExpenses(all.toSorted((a, b) => b.date.toMillis() - a.date.toMillis()));
        setLoading(false);
        setChanges(null);
        return;
      }

      // Detect changes
      const currentIds = new Set(all.map((e) => e.id));
      const added = all.filter((e) => !seenIds.current.has(e.id));
      const removed = [...seenIds.current].filter((id) => !currentIds.has(id));
      const modified = all.filter((e) => seenIds.current.has(e.id) && !added.includes(e));

      // Update seen set
      seenIds.current = currentIds;

      setExpenses(all.toSorted((a, b) => b.date.toMillis() - a.date.toMillis()));
      if (added.length > 0 || modified.length > 0 || removed.length > 0) {
        setChanges({ added, modified, removed });
      }
    });

    return () => unsub();
  }, [groupId]);

  const add = async (
    description: string,
    amount: number,
    paidBy: string,
    splits: Split[],
    date?: Date,
    category?: string,
    payers?: Payer[]
  ) => {
    const e = await expensesService.createExpense(groupId, description, amount, paidBy, splits, date, category, payers);
    setExpenses((prev) => [e, ...prev]);
    return e;
  };

  const remove = async (expenseId: string) => {
    await expensesService.deleteExpense(expenseId);
    setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
  };

  const update = async (
    expenseId: string,
    description: string,
    amount: number,
    paidBy: string,
    splits: Split[],
    date?: Date,
    category?: string
  ) => {
    await expensesService.updateExpense(expenseId, { description, amount, paidBy, splits, category, date: date ? Timestamp.fromDate(date) : undefined } as any);
    setExpenses((prev) =>
      prev.map((e) =>
        e.id === expenseId ? { ...e, description, amount, paidBy, splits, category } : e
      )
    );
  };

  const clearChanges = () => setChanges(null);

  return { expenses, loading, add, update, remove, changes, clearChanges };
}
