import { useState, useEffect, useRef } from "react";
import { Timestamp, onSnapshot } from "firebase/firestore";
import { collection, query, where } from "firebase/firestore";
import { db } from "../services/firebase";
import * as expensesService from "../services/expenses";
import type { Expense, Split, Payer } from "../types";

// Deep compare two expenses for relevant fields
function hasChanged(a: Expense, b: Expense): boolean {
  return (
    a.description !== b.description ||
    a.amount !== b.amount ||
    a.paidBy !== b.paidBy ||
    a.category !== b.category ||
    JSON.stringify(a.splits) !== JSON.stringify(b.splits) ||
    JSON.stringify(a.payers) !== JSON.stringify(b.payers)
  );
}

export function useExpenses(groupId: string) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [changes, setChanges] = useState<{ added: Expense[]; modified: Expense[]; removed: string[] } | null>(null);
  const seenIds = useRef<Set<string>>(new Set());
  const previousSnapshot = useRef<Map<string, Expense>>(new Map());
  const firstLoad = useRef(true);

  useEffect(() => {
    setLoading(true);
    seenIds.current = new Set();
    previousSnapshot.current = new Map();
    firstLoad.current = true;

    const q = query(collection(db, "expenses"), where("groupId", "==", groupId));
    const unsub = onSnapshot(q, (snap) => {
      const all = snap.docs.map((d) => expensesService.docToExpense(d.id, d.data()));

      if (firstLoad.current) {
        firstLoad.current = false;
        for (const e of all) {
          seenIds.current.add(e.id);
          previousSnapshot.current.set(e.id, e);
        }
        setExpenses(all.toSorted((a, b) => b.date.toMillis() - a.date.toMillis()));
        setLoading(false);
        setChanges(null);
        return;
      }

      // Detect changes
      const currentIds = new Set(all.map((e) => e.id));
      const added = all.filter((e) => !seenIds.current.has(e.id));
      const removed = [...seenIds.current].filter((id) => !currentIds.has(id));
      const modified = all.filter((e) => {
        if (!seenIds.current.has(e.id)) return false;
        if (added.includes(e)) return false;
        const prev = previousSnapshot.current.get(e.id);
        return prev ? hasChanged(prev, e) : true;
      });

      // Update seen set and snapshot
      seenIds.current = currentIds;
      previousSnapshot.current = new Map(all.map((e) => [e.id, e]));

      setExpenses(all.toSorted((a, b) => b.date.toMillis() - a.date.toMillis()));
      if (added.length > 0 || modified.length > 0 || removed.length > 0) {
        setChanges({ added, modified, removed });
      }
    });

    return () => unsub();
  }, [groupId]);

  // Mutations: Firestore is the single source of truth; onSnapshot handles all state updates.
  const add = async (
    description: string,
    amount: number,
    paidBy: string,
    splits: Split[],
    date?: Date,
    category?: string,
    payers?: Payer[]
  ) => {
    return await expensesService.createExpense(groupId, description, amount, paidBy, splits, date, category, payers);
  };

  const remove = async (expenseId: string) => {
    await expensesService.deleteExpense(expenseId);
  };

  const update = async (
    expenseId: string,
    description: string,
    amount: number,
    paidBy: string,
    splits: Split[],
    date?: Date,
    category?: string,
    payers?: Payer[]
  ) => {
    await expensesService.updateExpense(expenseId, {
      description, amount, paidBy, splits, category, payers,
      date: date ? Timestamp.fromDate(date) : undefined,
    } as any);
  };

  const clearChanges = () => setChanges(null);

  return { expenses, loading, add, update, remove, changes, clearChanges };
}
