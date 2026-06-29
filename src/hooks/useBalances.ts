import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../services/firebase";
import * as settlementsService from "../services/settlements";
import { computeBalances, minimizeDebts } from "../utils/balances";
import type { Settlement, MemberBalance, DebtEdge, Expense } from "../types";

function docToSettlement(id: string, data: Record<string, any>): Settlement {
  return {
    id,
    groupId: data.groupId,
    from: data.from,
    to: data.to,
    amount: data.amount,
    date: data.date,
  };
}

export function useBalances(groupId: string, expenses: Expense[], memberNames: Map<string, string>) {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loadingSettlements, setLoadingSettlements] = useState(true);

  // Real-time settlements via onSnapshot — consistent with expenses
  useEffect(() => {
    setLoadingSettlements(true);
    const q = query(collection(db, "settlements"), where("groupId", "==", groupId));
    const unsub = onSnapshot(q, (snap) => {
      const all = snap.docs.map((d) => docToSettlement(d.id, d.data()));
      setSettlements(all.toSorted((a, b) => b.date.toMillis() - a.date.toMillis()));
      setLoadingSettlements(false);
    });
    return () => unsub();
  }, [groupId]);

  const balances: MemberBalance[] = computeBalances(expenses, settlements, memberNames);
  const debts: DebtEdge[] = minimizeDebts(balances);

  const addSettlement = async (
    from: string,
    to: string,
    amount: number,
    actorUserId?: string,
    actorName?: string,
    fromName?: string,
    toName?: string
  ) => {
    // Firestore write; onSnapshot will update settlements automatically
    await settlementsService.createSettlement(groupId, from, to, amount, actorUserId, actorName, fromName, toName);
  };

  return { settlements, balances, debts, addSettlement, loadingSettlements };
}
