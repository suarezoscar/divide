import { useState, useEffect, useCallback } from "react";
import * as expensesService from "../services/expenses";
import type { Expense, Split } from "../types";

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
    splits: Split[]
  ) => {
    const e = await expensesService.createExpense(groupId, description, amount, paidBy, splits);
    setExpenses((prev) => [e, ...prev]);
    return e;
  };

  const remove = async (expenseId: string) => {
    await expensesService.deleteExpense(expenseId);
    setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
  };

  return { expenses, loading, add, remove, refetch: fetch };
}
