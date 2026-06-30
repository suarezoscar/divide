import type { Expense, Settlement, MemberBalance, DebtEdge } from "../types";

/** Convert a float EUR amount to integer cents. */
function toCents(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Compute per-member balances from expenses and settlements.
 * Internal arithmetic is done in integer cents to avoid floating-point drift.
 * Positive balance = member is owed money.
 * Negative balance = member owes money.
 */
export function computeBalances(
  expenses: Expense[],
  settlements: Settlement[],
  memberNames: Map<string, string>
): MemberBalance[] {
  // Internal maps store values in integer cents.
  const paidCents = new Map<string, number>();
  const owedCents = new Map<string, number>();

  const init = (id: string) => {
    if (!paidCents.has(id)) {
      paidCents.set(id, 0);
      owedCents.set(id, 0);
    }
  };

  // Process expenses
  for (const exp of expenses) {
    if (exp.payers && exp.payers.length > 0) {
      for (const p of exp.payers) {
        init(p.memberId);
        paidCents.set(p.memberId, paidCents.get(p.memberId)! + toCents(p.amount));
      }
    } else {
      init(exp.paidBy);
      paidCents.set(exp.paidBy, paidCents.get(exp.paidBy)! + toCents(exp.amount));
    }

    for (const split of exp.splits) {
      init(split.memberId);
      owedCents.set(split.memberId, owedCents.get(split.memberId)! + toCents(split.amount));
    }
  }

  // Process settlements
  for (const s of settlements) {
    init(s.from);
    init(s.to);
    paidCents.set(s.from, paidCents.get(s.from)! + toCents(s.amount));
    owedCents.set(s.to, owedCents.get(s.to)! + toCents(s.amount));
  }

  // Calculate net balance — convert back to float at the boundary
  const result: MemberBalance[] = [];
  for (const [id] of paidCents) {
    const paid = paidCents.get(id)!;
    const owed = owedCents.get(id)!;
    result.push({
      memberId: id,
      memberName: memberNames.get(id) ?? id,
      paid: paid / 100,
      owed: owed / 100,
      balance: (paid - owed) / 100,
    });
  }

  return result;
}

/**
 * Debt minimization algorithm.
 * All arithmetic in integer cents.
 * Returns the minimum set of transactions to settle all debts (≤ N-1 edges).
 */
export function minimizeDebts(balances: MemberBalance[]): DebtEdge[] {
  // netCents stores non-zero balances in integer cents.
  const netCents = new Map<string, number>();
  const nameMap = new Map<string, string>();

  for (const b of balances) {
    const c = toCents(b.balance);
    if (c !== 0) {
      netCents.set(b.memberId, c);
      nameMap.set(b.memberId, b.memberName);
    }
  }

  const debts: DebtEdge[] = [];

  while (netCents.size > 0) {
    let maxCreditor: [string, number] | null = null;
    let maxDebtor: [string, number] | null = null;

    for (const [id, bal] of netCents) {
      if (bal > 0 && (maxCreditor === null || bal > maxCreditor[1])) {
        maxCreditor = [id, bal];
      }
      if (bal < 0 && (maxDebtor === null || bal < maxDebtor[1])) {
        maxDebtor = [id, bal];
      }
    }

    if (!maxCreditor || !maxDebtor) break;

    // Amount to transfer (in cents): min(creditor amount, |debtor amount|)
    const debtorAbs = Math.abs(maxDebtor[1]);
    const transferCents = Math.min(maxCreditor[1], debtorAbs);
    const amount = transferCents / 100;

    if (amount <= 0) break;

    debts.push({
      from: maxDebtor[0],
      fromName: nameMap.get(maxDebtor[0]) ?? maxDebtor[0],
      to: maxCreditor[0],
      toName: nameMap.get(maxCreditor[0]) ?? maxCreditor[0],
      amount,
    });

    // Update balances in cents
    const newCreditorBal = maxCreditor[1] - transferCents;
    const newDebtorBal = maxDebtor[1] + transferCents;

    if (newCreditorBal === 0) {
      netCents.delete(maxCreditor[0]);
    } else {
      netCents.set(maxCreditor[0], newCreditorBal);
    }

    if (newDebtorBal === 0) {
      netCents.delete(maxDebtor[0]);
    } else {
      netCents.set(maxDebtor[0], newDebtorBal);
    }
  }

  return debts;
}
