import { useState, useEffect, useCallback } from "react";
import * as settlementsService from "../services/settlements";
import { computeBalances, minimizeDebts } from "../utils/balances";
import type { Settlement, MemberBalance, DebtEdge } from "../types";
import type { Expense } from "../types";

export function useBalances(groupId: string, expenses: Expense[], memberNames: Map<string, string>) {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loadingSettlements, setLoadingSettlements] = useState(true);

  const fetchSettlements = useCallback(async () => {
    setLoadingSettlements(true);
    const result = await settlementsService.getGroupSettlements(groupId);
    setSettlements(result);
    setLoadingSettlements(false);
  }, [groupId]);

  useEffect(() => {
    fetchSettlements();
  }, [fetchSettlements]);

  const balances: MemberBalance[] = computeBalances(expenses, settlements, memberNames);
  const debts: DebtEdge[] = minimizeDebts(balances);

  const addSettlement = async (from: string, to: string, amount: number) => {
    const s = await settlementsService.createSettlement(groupId, from, to, amount);
    setSettlements((prev) => [s, ...prev]);
    return s;
  };

  return { settlements, balances, debts, addSettlement, loadingSettlements };
}
