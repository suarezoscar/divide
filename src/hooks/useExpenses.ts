import { useState, useEffect, useCallback } from "react";
import { Timestamp } from "firebase/firestore";
import * as expensesService from "../services/expenses";
import type { Expense, Split, Payer } from "../types";

export function useExpenses(groupId: string) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const result = await expensesService.getGroupExpenses(groupId);
    setExpenses(result);
    setLoading(false);
  }, [groupId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

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

  return { expenses, loading, add, update, remove, refetch: fetch };
}
