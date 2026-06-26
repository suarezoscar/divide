import type { Expense, Settlement, MemberBalance, DebtEdge } from "../types";

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
  const balances = new Map<string, MemberBalance>();

  const init = (id: string) => {
    if (!balances.has(id)) {
      balances.set(id, {
        memberId: id,
        memberName: memberNames.get(id) ?? id,
        paid: 0,
        owed: 0,
        balance: 0,
      });
    }
    return balances.get(id)!;
  };

  // Process expenses
  for (const exp of expenses) {
    // Use payers if available, fallback to old paidBy
    if (exp.payers && exp.payers.length > 0) {
      for (const p of exp.payers) {
        init(p.memberId).paid += p.amount;
      }
    } else {
      init(exp.paidBy).paid += exp.amount;
    }

    // Each split adds to what members owe
    for (const split of exp.splits) {
      init(split.memberId).owed += split.amount;
    }
  }

  // Process settlements (a settlement reduces what "from" owes to "to")
  for (const s of settlements) {
    // "from" paid "to" — this reduces from's debt and to's credit
    init(s.from).paid += s.amount;
    init(s.to).owed += s.amount;
  }

  // Calculate net balance
  for (const b of balances.values()) {
    b.balance = b.paid - b.owed;
  }

  return Array.from(balances.values());
}

/**
 * Debt minimization algorithm.
 * Returns the minimum set of transactions to settle all debts.
 */
export function minimizeDebts(balances: MemberBalance[]): DebtEdge[] {
  const netBalances = new Map<string, number>();
  const nameMap = new Map<string, string>();

  for (const b of balances) {
    // Round to avoid floating point issues
    const rounded = Math.round(b.balance * 100) / 100;
    if (rounded !== 0) {
      netBalances.set(b.memberId, rounded);
      nameMap.set(b.memberId, b.memberName);
    }
  }

  const debts: DebtEdge[] = [];

  while (netBalances.size > 0) {
    // Find max creditor and max debtor
    let maxCreditor: [string, number] | null = null;
    let maxDebtor: [string, number] | null = null;

    for (const [id, bal] of netBalances) {
      if (bal > 0 && (maxCreditor === null || bal > maxCreditor[1])) {
        maxCreditor = [id, bal];
      }
      if (bal < 0 && (maxDebtor === null || bal < maxDebtor[1])) {
        maxDebtor = [id, bal];
      }
    }

    if (!maxCreditor || !maxDebtor) break;

    const amount = Math.min(maxCreditor[1], Math.abs(maxDebtor[1]));
    const rounded = Math.round(amount * 100) / 100;

    if (rounded <= 0) break;

    debts.push({
      from: maxDebtor[0],
      fromName: nameMap.get(maxDebtor[0]) ?? maxDebtor[0],
      to: maxCreditor[0],
      toName: nameMap.get(maxCreditor[0]) ?? maxCreditor[0],
      amount: rounded,
    });

    // Update balances
    const newCreditorBal = maxCreditor[1] - rounded;
    const newDebtorBal = maxDebtor[1] + rounded;

    if (Math.abs(newCreditorBal) < 0.01) {
      netBalances.delete(maxCreditor[0]);
    } else {
      netBalances.set(maxCreditor[0], newCreditorBal);
    }

    if (Math.abs(newDebtorBal) < 0.01) {
      netBalances.delete(maxDebtor[0]);
    } else {
      netBalances.set(maxDebtor[0], newDebtorBal);
    }
  }

  return debts;
}
