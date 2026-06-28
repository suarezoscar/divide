import type { Expense, Settlement, MemberBalance, DebtEdge } from "../types";
import { eur, toFloat, add, subtract, greaterThan, lessThan, isZero } from "./money";
import type { Dinero } from "./money";

const zeroEur = eur(0);

/**
 * Compute per-member balances from expenses and settlements.
 * Positive balance = member is owed money.
 * Negative balance = member owes money.
 */
export function computeBalances(
  expenses: Expense[],
  settlements: Settlement[],
  memberNames: Map<string, string>
): MemberBalance[] {
  const paidMap = new Map<string, Dinero>();
  const owedMap = new Map<string, Dinero>();

  const init = (id: string) => {
    if (!paidMap.has(id)) {
      paidMap.set(id, zeroEur);
      owedMap.set(id, zeroEur);
    }
  };

  // Process expenses
  for (const exp of expenses) {
    if (exp.payers && exp.payers.length > 0) {
      for (const p of exp.payers) {
        init(p.memberId);
        paidMap.set(p.memberId, add(paidMap.get(p.memberId)!, eur(p.amount)) as Dinero);
      }
    } else {
      init(exp.paidBy);
      paidMap.set(exp.paidBy, add(paidMap.get(exp.paidBy)!, eur(exp.amount)) as Dinero);
    }

    for (const split of exp.splits) {
      init(split.memberId);
      owedMap.set(split.memberId, add(owedMap.get(split.memberId)!, eur(split.amount)) as Dinero);
    }
  }

  // Process settlements
  for (const s of settlements) {
    init(s.from);
    init(s.to);
    paidMap.set(s.from, add(paidMap.get(s.from)!, eur(s.amount)) as Dinero);
    owedMap.set(s.to, add(owedMap.get(s.to)!, eur(s.amount)) as Dinero);
  }

  // Calculate net balance
  const result: MemberBalance[] = [];
  for (const [id] of paidMap) {
    const paid = toFloat(paidMap.get(id)!);
    const owed = toFloat(owedMap.get(id)!);
    result.push({
      memberId: id,
      memberName: memberNames.get(id) ?? id,
      paid,
      owed,
      balance: Math.round((paid - owed) * 100) / 100,
    });
  }

  return result;
}

/**
 * Debt minimization algorithm.
 * Returns the minimum set of transactions to settle all debts.
 */
export function minimizeDebts(balances: MemberBalance[]): DebtEdge[] {
  const netBalances = new Map<string, Dinero>();
  const nameMap = new Map<string, string>();

  for (const b of balances) {
    const d = eur(b.balance);
    if (!isZero(d)) {
      netBalances.set(b.memberId, d);
      nameMap.set(b.memberId, b.memberName);
    }
  }

  const debts: DebtEdge[] = [];

  while (netBalances.size > 0) {
    let maxCreditor: [string, Dinero] | null = null;
    let maxDebtor: [string, Dinero] | null = null;

    for (const [id, bal] of netBalances) {
      if (greaterThan(bal, eur(0)) && (maxCreditor === null || greaterThan(bal, maxCreditor[1]))) {
        maxCreditor = [id, bal];
      }
      if (lessThan(bal, eur(0)) && (maxDebtor === null || lessThan(bal, maxDebtor[1]))) {
        maxDebtor = [id, bal];
      }
    }

    if (!maxCreditor || !maxDebtor) break;

    // Amount to transfer: min(creditor amount, |debtor amount|)
    const debtorAbs = eur(Math.abs(toFloat(maxDebtor[1])));
    const transfer = lessThan(maxCreditor[1], debtorAbs) ? maxCreditor[1] : debtorAbs;
    const amount = toFloat(transfer);

    if (amount <= 0) break;

    debts.push({
      from: maxDebtor[0],
      fromName: nameMap.get(maxDebtor[0]) ?? maxDebtor[0],
      to: maxCreditor[0],
      toName: nameMap.get(maxCreditor[0]) ?? maxCreditor[0],
      amount,
    });

    // Update balances
    const newCreditorBal = subtract(maxCreditor[1], transfer);
    const newDebtorBal = add(maxDebtor[1], transfer);

    if (isZero(newCreditorBal)) {
      netBalances.delete(maxCreditor[0]);
    } else {
      netBalances.set(maxCreditor[0], newCreditorBal);
    }

    if (isZero(newDebtorBal)) {
      netBalances.delete(maxDebtor[0]);
    } else {
      netBalances.set(maxDebtor[0], newDebtorBal);
    }
  }

  return debts;
}
